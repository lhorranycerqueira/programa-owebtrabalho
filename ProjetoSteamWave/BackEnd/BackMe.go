package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
)

// HandleMe é quem responde "quem é o usuário logado?"
// O frontend chama esse endpoint quando o usuário abre o site já com o token salvo
// Assim conseguimos buscar os dados atualizados do banco sem pedir login de novo
func HandleMe(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r)
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	w.Header().Add("Content-Type", "application/json")

	if r.Method != "GET" {
		json.NewEncoder(w).Encode(Error{
			Message: "Metodo bloqueado",
			Status:  405,
		})
		return
	}

	//Pego o header "Authorization" da requisição
	//O frontend manda assim: "Authorization: Bearer <token>"
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		//Se não mandou o header, já bloqueio com 401 (Não autorizado)
		w.WriteHeader(401)
		json.NewEncoder(w).Encode(Error{
			Message: "Token não fornecido",
			Status:  401,
		})
		return
	}

	//Removo o prefixo "Bearer " pra sobrar só o token
	//Ex: "Bearer chaveSuperrrrrrrrrrrGrande" vira "chaveSuperrrrrrrrrrrGrande"
	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	if tokenString == authHeader {
		//Se o TrimPrefix não mudou nada, é porque não tinha "Bearer " no começo
		//Ou seja, o frontend mandou o header no formato errado
		w.WriteHeader(401)
		json.NewEncoder(w).Encode(Error{
			Message: "Formato de token inválido",
			Status:  401,
		})
		return
	}

	//jwt.Parse faz tudo de uma vez, ela decodifica o token, valida a assinatura e vê a expiração
	//A função que passo como parâmetro serve pra devolver a chave que o Parse vai usar pra validar
	//jwtSecret é a variável global definida no Main.go, lida uma única vez na inicialização
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		//Aqui eu garanto que o algoritmo de assinatura é HMAC(HS256), e só aceitara HMAC
		//Isso evita ataques de hackers
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("método de assinatura inesperado: %v", token.Header["alg"])
			//Aqui verificamos se o token tem o algoritmo HMAC; no Header do token está o ["alg"].
			//Se o alg for alterado para qualquer outro algoritmo ou for none, ele já será inválido
		}
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		w.WriteHeader(401)
		json.NewEncoder(w).Encode(Error{
			Message: "Token inválido ou expirado",
			Status:  401,
		})
		return
	}

	//Depois de validar, vejo oq tem nas claims
	//O MapClaims é um map[string]interface{} que o jwt entende
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		w.WriteHeader(401)
		json.NewEncoder(w).Encode(Error{
			Message: "Claims inválidas",
			Status:  401,
		})
		return
	}

	//Pego o email que foi salvo dentro do token na hora do login
	email, ok := claims["email"].(string)
	if !ok || email == "" {
		w.WriteHeader(401)
		json.NewEncoder(w).Encode(Error{
			Message: "Email não encontrado no token",
			Status:  401,
		})
		return
	}

	//Context com timeout de 5 segundos, igual nos outros handlers
	//Serve pra operação não ficar presa caso o MongoDB esteja fora
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	//Busco o usuário no MongoDB pelo email que tirei do token
	var user Users
	err = collection.FindOne(ctx, bson.M{"email": email}).Decode(&user)
	//Esse bson.M seria como o WHERE no SQL, e o FindOne ele pega apenas UMA informação
	//retorna um ponteiro que ainda precisa ser lido. Por isso o Decode(&user)
	if err != nil {
		w.WriteHeader(404)
		json.NewEncoder(w).Encode(Error{
			Message: "Usuário não encontrado",
			Status:  404,
		})
		return
	}

	fmt.Printf("Me Dados retornados para: %s\n", user.Email)

	//Retorno só email e theme
	//A senha tem hash bcrypt e mesmo assim não faz sentido mandar pro front
	w.WriteHeader(200)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"email":     user.Email,
		"theme":     user.Theme,
		"nickname":  user.Nickname,
		"birthdate": user.BirthDate,
	})
}
