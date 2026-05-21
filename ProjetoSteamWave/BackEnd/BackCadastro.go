package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	_ "github.com/go-sql-driver/mysql"

	"github.com/joho/godotenv"
)

// Go é meio estranho, mas isso serve para eu conseguir usar essa varivael em qualquer func
// Se não fosse por causa da documentação do Go eu não ia saber que preciso colocar aqui
var db *sql.DB

func main() {
	godotenv.Load()

	var err error
	db, err = sql.Open("mysql", "root:@tcp(127.0.0.1:3306)/steamwave")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	err = db.Ping()
	if err != nil {
		log.Fatal("Não conectou no bd:", err)
	}

	//Isso é para eu saber se deu certo a conecção
	fmt.Println("Conectou")

	port := os.Getenv("PORT")

	http.HandleFunc("/Login", HandleLogin)
	http.HandleFunc("/Users", HandleCadastro)
	http.ListenAndServe(":"+port, nil)

}

func HandleCadastro(w http.ResponseWriter, r *http.Request) {
	// Sem isso, o navegador bloqueia a requisição vinda do seu HTML
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// 2. Define quais métodos HTTP são permitidos
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")

	// 3. Permite que o cabeçalho 'Content-Type' seja enviado pelo JavaScript
	// Como enviamos JSON no JS, o navegador precisa dessa autorização
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	// Antes de fazer o POST real, o navegador envia um pedido 'OPTIONS' para
	// verificar se o servidor aceita o CORS. Precisamos responder 200 OK e parar aqui.
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	//Vai vir com o tipo Json, não tipo texto(text/plan)
	w.Header().Add("Content-Type", "application/json")

	if r.Method != "POST" {
		//Se o método não for POST, envia uma mensagem de erro com
		//json.NewEncoder(w).Encode(...)
		json.NewEncoder(w).Encode(Error{
			Message: "Metodo bloqueado",
			Status:  405,
		})

		return
	}

	//O user vai guarda os dados do Users(struct)
	var user Users
	err := json.NewDecoder(r.Body).Decode(&user)
	// Pega a requisição do site
	// Tenta ler os dados em formato JSON, e coloca dentro do user
	// O & significa "coloque os dados aqui dentro"

	if err != nil {
		w.WriteHeader(400)
		json.NewEncoder(w).Encode(Error{
			Message: "Erro ao ler",
			Status:  400,
		})
		return
	}

	query := ("INSERT INTO steamwave.Cadastro (email, senha) VALUES (?, ?)")
	res, err := db.Exec(query, user.Email, user.Password)

	if err != nil {
		log.Printf("Deu erro %v", err) //Aprendi da pior forma que aqui não pode se usar o log.Fatal(No exemplo tava usando um)
		w.WriteHeader(500)
		json.NewEncoder(w).Encode(Error{
			Message: "Erro interno" + err.Error(),
			Status:  500,
		})
		return
	}
	rowCount, err := res.RowsAffected()
	fmt.Printf("User criado: %s\n", user.Email)
	fmt.Printf("Se de ruim aparece aqui %d", rowCount)

	fmt.Printf("Usuário criado %s\n", user.Email)

	w.WriteHeader(201) //201 (criado)
	//O NewEncoder é para enviar um resposta, não ler
	//(Antes tava o NewDecoder().Decode())
	json.NewEncoder(w).Encode(Error{
		Message: "Usuário Criado",
		Status:  201,
	})

}
