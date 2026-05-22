package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/bson"
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
	fmt.Printf("Comparando senha[%s] com a senha do bd[%s]\n", login.Password, user.Password)

	if login.Password != user.Password {
		w.WriteHeader(401)
		json.NewEncoder(w).Encode(Error{
			Message: "Não autorizado, senha incorreta",
			Status:  401,
		})
		return
	}
	fmt.Printf("ver senha [%s] e do bd[%s]\n", login.Password, user.Password)

	fmt.Println("Deu tudo certo")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Login realizado com sucesso",
	})
}
