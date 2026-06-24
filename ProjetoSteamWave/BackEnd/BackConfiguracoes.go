package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"golang.org/x/crypto/bcrypt"
)

// HandleUpdatePassword é chamado quando o usuário quer trocar a senha na tela de configurações
// O fluxo é: front manda email + senha atual + senha nova
// a gente valida a senha atual e, se bater, substitui pelo hash da nova
func HandleUpdatePassword(w http.ResponseWriter, r *http.Request) {
	//CORS, igual no BackCadastro e no BackLogin
	//Sem isso o navegador bloqueia a requisição do front
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	//Preflight do CORS
	//O navegador manda OPTIONS antes do POST pra saber se pode mandar
	//Se eu não responder 200 aqui, o front recebe erro de CORS
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	w.Header().Add("Content-Type", "application/json")

	//Só aceitamos POST, qualquer outro método é bloqueado
	if r.Method != "POST" {
		json.NewEncoder(w).Encode(Error{
			Message: "Metodo bloqueado",
			Status:  405,
		})
		return
	}

	var req UpdatePasswordRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		w.WriteHeader(400)
		json.NewEncoder(w).Encode(Error{
			Message: "Erro ao ler",
			Status:  400,
		})
		return
	}
	req.Email = strings.TrimSpace(req.Email)
	fmt.Printf("UpdatePassword Requisição recebida de: %s\n", req.Email)

	//Se qualquer um dos 3 campos ta vazio, já não posso continuar
	if req.Email == "" || req.CurrentPassword == "" || req.NewPassword == "" {
		fmt.Printf("UpdatePassword Campos obrigatórios vazios para: %s\n", req.Email)
		w.WriteHeader(400)
		json.NewEncoder(w).Encode(Error{
			Message: "Todos os campos são obrigatórios",
			Status:  400,
		})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	//Busco o usuário no MongoDB pelo email
	var user Users
	err = collection.FindOne(ctx, bson.M{
		"email": req.Email,
	}).Decode(&user)

	if err != nil {
		fmt.Printf("UpdatePassword Usuário não encontrado: %s\n", req.Email)
		w.WriteHeader(404)
		json.NewEncoder(w).Encode(Error{
			Message: "Usuário não encontrado",
			Status:  404,
		})
		return
	}
	fmt.Printf("UpdatePassword Usuário encontrado: %s — verificando senha atual\n", req.Email)

	//bcrypt.CompareHashAndPassword compara a senha que o usuário mandou
	//com o hash que ta salvo no banco
	//Se a senha atual não bater, não posso continuar (é uma camada de segurança)
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.CurrentPassword))
	if err != nil {
		fmt.Printf("UpdatePassword Senha atual incorreta para: %s\n", req.Email)
		w.WriteHeader(401)
		json.NewEncoder(w).Encode(Error{
			Message: "Senha atual incorreta",
			Status:  401,
		})
		return
	}
	fmt.Printf("UpdatePassword Senha atual verificada com sucesso para: %s\n", req.Email)

	//Agora gero o hash da NOVA senha com bcrypt
	//DefaultCost é o custo padrão (10), é um bom equilíbrio entre segurança e velocidade
	hash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		fmt.Printf("UpdatePassword Erro ao gerar hash: %v\n", err)
		w.WriteHeader(500)
		json.NewEncoder(w).Encode(Error{
			Message: "Erro ao processar senha",
			Status:  500,
		})
		return
	}
	fmt.Printf("UpdatePassword Nova senha hasheada com sucesso para: %s\n", req.Email)

	_, err = collection.UpdateOne(ctx,
		bson.M{"email": req.Email}, //O M é um Map, como um array associativo do PHP
		bson.M{"$set": bson.M{"password": string(hash)}},
		//Esse $set parece um comando do PHP, mas é um comando o MongoDB
		//Ele diz para o Mongo: "Atualize APENAS esse campo", igual o set de UPDATE do SQL
	)

	if err != nil {
		fmt.Printf("UpdatePassword Erro ao atualizar MongoDB: %v\n", err)
		w.WriteHeader(500)
		json.NewEncoder(w).Encode(Error{
			Message: "Erro interno ao atualizar senha",
			Status:  500,
		})
		return
	}

	fmt.Printf("UpdatePassword Senha atualizada com sucesso para: %s\n", req.Email)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Senha alterada com sucesso",
	})
}

// HandleUpdateTheme é chamado quando o usuário muda o tema na tela de configurações
// O front manda email + nome do tema escolhido e a gente salva no MongoDB
// Assim no próximo login o BackLogin já devolve o tema correto pro front
func HandleUpdateTheme(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	w.Header().Add("Content-Type", "application/json")

	//Só aceito POST aqui também
	if r.Method != "POST" {
		json.NewEncoder(w).Encode(Error{
			Message: "Metodo bloqueado",
			Status:  405,
		})
		return
	}

	//Aqui uso uma struct anônima em vez de declarar no Struct.go
	//Fiz assim porque essa struct só é usada nessa func
	var request struct {
		Email string `json:"email"`
		Theme string `json:"theme"`
	}

	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		fmt.Printf("UpdateTheme Erro ao ler body: %v\n", err)
		w.WriteHeader(400)
		json.NewEncoder(w).Encode(Error{
			Message: "Erro ao ler",
			Status:  400,
		})
		return
	}
	fmt.Printf("UpdateTheme Requisição recebida de: %s\n", request.Email)

	//Validação dos campos, nenhum pode tá vazio
	if request.Email == "" || request.Theme == "" {
		fmt.Printf("UpdateTheme Campos obrigatórios vazios para: %s\n", request.Email)
		w.WriteHeader(400)
		json.NewEncoder(w).Encode(Error{
			Message: "Email e tema são obrigatórios",
			Status:  400,
		})
		return
	}
	fmt.Printf("UpdateTheme Atualizando tema para %s |Tema: %s\n", request.Email, request.Theme)

	//testa a conexão com BD
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	//O MongoDB cria o campo automaticamente se ele não existir
	result, err := collection.UpdateOne(
		ctx,
		bson.M{"email": request.Email}, //O M é um Map
		bson.M{"$set": bson.M{"theme": request.Theme}},
		//Esse $set parece um comando do PHP, mas é um comando o MongoDB
		//Ele diz para o Mongo: "Atualize APENAS esse campo", igual o set de UPDATE do SQL
	)

	if err != nil {
		fmt.Printf("UpdateTheme Erro ao atualizar MongoDB: %v\n", err)
		w.WriteHeader(500)
		json.NewEncoder(w).Encode(Error{
			Message: "Erro interno ao atualizar tema",
			Status:  500,
		})
		return
	}

	//MatchedCount diz quantos documentos foram encontrados com o filtro
	//Se for 0, nenhum usuário com aquele email existe no banco
	if result.MatchedCount == 0 {
		fmt.Printf("UpdateTheme Usuário não encontrado: %s\n", request.Email)
		w.WriteHeader(404)
		json.NewEncoder(w).Encode(Error{
			Message: "Usuário não encontrado",
			Status:  404,
		})
		return
	}
	fmt.Printf("UpdateTheme Tema atualizado para %s|Tema: %s\n", request.Email, request.Theme)

	w.WriteHeader(200)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Tema atualizado com sucesso",
	})
}
