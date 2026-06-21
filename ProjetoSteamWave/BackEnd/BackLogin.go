package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"strings"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"golang.org/x/crypto/bcrypt"
)

// gerarTokenJWT cria um token JWT assinado para o usuário, eba para minha infelicidade
func gerarTokenJWT(email string) (string, error) {
	claims := jwt.MapClaims{
		"email": email,
		"exp":   time.Now().Add(1 * time.Hour).Unix(),
		"iat":   time.Now().Unix(),
	}

	//Aqui colocamos a nossa assinatura da JWT
	secretKey := os.Getenv("JWT_SECRET")
	if secretKey == "" {
		return "", fmt.Errorf("JWT_SECRET não definido no .env")
	}
	//Criamos um nov token com as claims e o método de assinatura é HS256
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	//Assinamos o token com a chave secreta e retornamos a string final
	tokenString, err := token.SignedString([]byte(secretKey))
	if err != nil {
		return "", err // Se houver erro ao assinar, retornamos o erro
	}

	//Se nada der errado vai retorna nosso Token pra o front
	return tokenString, nil
}

func HandleLogin(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	w.Header().Add("Content-Type", "application/json")

	if r.Method != "POST" {
		json.NewEncoder(w).Encode(Error{
			Message: "Metodo bloqueado",
			Status:  405,
		})
		return
	}

	var login LoginRequest
	err := json.NewDecoder(r.Body).Decode(&login)
	if err != nil {
		w.WriteHeader(400)
		json.NewEncoder(w).Encode(Error{
			Message: "Erro ao ler",
			Status:  400,
		})
		return
	}
	//Remove o espaço que o usuario pode colocar no cadastro e vir colocar no login
	//Aprendi da pior forma
	login.Email = strings.TrimSpace(login.Email)

	//Criamos a conecção com o MongoDB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var user Users
	err = collection.FindOne(ctx, bson.M{
		"email": login.Email,
	}).Decode(&user)

	if err != nil {
		w.WriteHeader(401)
		json.NewEncoder(w).Encode(Error{
			Message: "Não autorizado, email não cadastrado",
			Status:  401,
		})
		return
	}
	fmt.Printf("Login Comparando senha para: %s\n", login.Email)

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(login.Password))
	if err != nil {
		fmt.Printf("Login Senha incorreta para: %s\n", login.Email)
		w.WriteHeader(401)
		json.NewEncoder(w).Encode(Error{
			Message: "Não autorizado, senha incorreta",
			Status:  401,
		})
		return
	}

	fmt.Printf("Login feito para: %s\n", login.Email)

	//Após validar email e senha, geramos um token JWT para o usuário.
	tokenString, err := gerarTokenJWT(user.Email)
	if err != nil {
		fmt.Printf("Login Erro ao gerar token JWT %s | %v\n", user.Email, err)
		w.WriteHeader(500)
		json.NewEncoder(w).Encode(Error{
			Message: "Erro ao gerar token",
			Status:  500,
		})
		return
	}

	//Retornamos o token JWT junto com a mensagem de sucesso
	//O frontend vai salvar esse token no localStorage para usar em requisições futuras
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Login realizado com sucesso",
		"token":   tokenString,
		"email":   user.Email,
	})
}
