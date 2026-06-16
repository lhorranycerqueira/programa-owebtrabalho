package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"strings"

	"go.mongodb.org/mongo-driver/bson"
	"golang.org/x/crypto/bcrypt"
)

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
	fmt.Printf("[Login] Comparando senha para: %s\n", login.Email)

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(login.Password))
	if err != nil {
		fmt.Printf("[Login] Senha incorreta para: %s\n", login.Email)
		w.WriteHeader(401)
		json.NewEncoder(w).Encode(Error{
			Message: "Não autorizado, senha incorreta",
			Status:  401,
		})
		return
	}

	fmt.Printf("[Login] Login bem-sucedido para: %s\n", login.Email)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Login realizado com sucesso",
		"email":   user.Email,
	})
}
