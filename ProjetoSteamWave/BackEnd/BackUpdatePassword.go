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

// ===== Aqui é o backend de mudar a senha nas config =====
func HandleUpdatePassword(w http.ResponseWriter, r *http.Request) {
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
	fmt.Printf("[UpdatePassword] Email recebido: %s\n", req.Email)

	if req.Email == "" || req.CurrentPassword == "" || req.NewPassword == "" {
		w.WriteHeader(400)
		json.NewEncoder(w).Encode(Error{
			Message: "Todos os campos são obrigatórios",
			Status:  400,
		})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var user Users
	err = collection.FindOne(ctx, bson.M{
		"email": req.Email,
	}).Decode(&user)

	if err != nil {
		w.WriteHeader(404)
		json.NewEncoder(w).Encode(Error{
			Message: "Usuário não encontrado",
			Status:  404,
		})
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.CurrentPassword))
	if err != nil {
		fmt.Printf("[UpdatePassword] Senha atual incorreta para: %s\n", req.Email)
		w.WriteHeader(401)
		json.NewEncoder(w).Encode(Error{
			Message: "Senha atual incorreta",
			Status:  401,
		})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		fmt.Printf("[UpdatePassword] Erro ao gerar hash: %v\n", err)
		w.WriteHeader(500)
		json.NewEncoder(w).Encode(Error{
			Message: "Erro interno ao processar senha",
			Status:  500,
		})
		return
	}

	_, err = collection.UpdateOne(ctx,
		bson.M{"email": req.Email},
		bson.M{"$set": bson.M{"password": string(hash)}},
	)

	if err != nil {
		fmt.Printf("[UpdatePassword] Erro ao atualizar MongoDB: %v\n", err)
		w.WriteHeader(500)
		json.NewEncoder(w).Encode(Error{
			Message: "Erro interno ao atualizar senha",
			Status:  500,
		})
		return
	}

	fmt.Printf("[UpdatePassword] Senha atualizada com sucesso para: %s\n", req.Email)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Senha alterada com sucesso",
	})
}
