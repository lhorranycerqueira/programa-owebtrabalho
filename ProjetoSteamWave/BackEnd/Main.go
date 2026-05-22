package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Go é meio estranho, mas isso serve para eu conseguir usar essa variavel em qualquer func
// Se não fosse por causa da documentação do Go eu não ia saber que preciso colocar aqui
var collection *mongo.Collection

func main() {
	godotenv.Load()

	uri := os.Getenv("MONGO_URI")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatal("Erro ao conectar no MongoDB:", err)
	}

	collection = client.Database("steamwave").Collection("Cadastro")

	//Isso é para eu saber se deu certo a conecção
	fmt.Println("Conectou")

	http.HandleFunc("/Login", HandleLogin)
	http.HandleFunc("/Users", HandleCadastro)
	http.ListenAndServe(":8080", nil)

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

	fmt.Printf("Saber se o erro é aqui: %s\n", r.Method)

	//O user vai guarda os dados do Users(struct)
	var user Users
	err := json.NewDecoder(r.Body).Decode(&user)
	// Pega a requisição do site
	// Tenta ler os dados em formato JSON, e coloca dentro do user
	// O & significa "coloque os dados aqui dentro"
	fmt.Printf("Saber se o erro é aqui: %s\n", err)
	if err != nil {
		w.WriteHeader(400)
		json.NewEncoder(w).Encode(Error{
			Message: "Erro ao ler",
			Status:  400,
		})
		return
	}

	// O MongoDB usa 'context' para operações
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	// O MongoDB salva objetos(BSON)
	_, err = collection.InsertOne(ctx, user)

	if err != nil {
		log.Printf("Erro ao inseri no MongoDB %v", err) //Aprendi da pior forma que aqui não pode se usar o log.Fatal(No exemplo tava usando um)
		w.WriteHeader(500)
		json.NewEncoder(w).Encode(Error{
			Message: "Erro interno" + err.Error(),
			Status:  500,
		})
		return
	}

	w.WriteHeader(201) //201 (criado)
	//O NewEncoder é para enviar um resposta, não ler
	//(Antes tava o NewDecoder().Decode())
	json.NewEncoder(w).Encode(Error{
		Message: "Usuário Criado",
		Status:  201,
	})

}
