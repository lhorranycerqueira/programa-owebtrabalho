package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

func HandleCadastro(w http.ResponseWriter, r *http.Request) {
	//Metodo padrão para o CORS, sem isso o navegador não aceita nada da API
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

	fmt.Printf("[Cadastro] Método recebido: %s\n", r.Method)

	var user Users
	err := json.NewDecoder(r.Body).Decode(&user)
	fmt.Printf("[Cadastro] Erro ao ler body: %v\n", err)
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
	user.Email = strings.TrimSpace(user.Email)

	hash, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		fmt.Printf("[Cadastro] Erro ao gerar hash: %v\n", err)
		w.WriteHeader(500)
		json.NewEncoder(w).Encode(Error{
			Message: "Erro interno ao processar senha",
			Status:  500,
		})
		return
	}
	user.Password = string(hash)
	fmt.Printf("[Cadastro] Senha hasheada para: %s\n", user.Email)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = collection.InsertOne(ctx, user)

	if err != nil {
		log.Printf("Erro ao inserir no MongoDB %v", err)
		w.WriteHeader(500)
		json.NewEncoder(w).Encode(Error{
			Message: "Erro interno" + err.Error(),
			Status:  500,
		})
		return
	}

	w.WriteHeader(201)
	json.NewEncoder(w).Encode(Error{
		Message: "Usuário Criado",
		Status:  201,
	})
}
