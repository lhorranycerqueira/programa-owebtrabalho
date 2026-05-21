package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	_ "github.com/go-sql-driver/mysql"
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

	//Definimos a variável que vai receber a senha que está no banco
	var dbSenha string
	query := "SELECT senha FROM Cadastro WHERE email = ?"
	err = db.QueryRow(query, login.Email).Scan(&dbSenha)

	if err != nil {
		w.WriteHeader(401)
		json.NewEncoder(w).Encode(Error{
			Message: "Não autorizado, email não cadastrado",
			Status:  401,
		})
		return
	}

	if login.Password != dbSenha {
		w.WriteHeader(401)
		json.NewEncoder(w).Encode(Error{
			Message: "Não autorizado, senha incorreta",
			Status:  401,
		})
		return
	}
	fmt.Println("Deu tudo certo")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Login realizado com sucesso",
	})

}
