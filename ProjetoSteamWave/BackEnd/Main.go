package main

import (
	"context"
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
	http.HandleFunc("/UpdatePassword", HandleUpdatePassword) //Esta nas configurações
	http.HandleFunc("/UpdateTheme", HandleUpdateTheme)
	http.HandleFunc("/Me", HandleMe)
	http.HandleFunc("/UpdateProfile", HandleUpdateProfile) //No BackPerfil.go
	http.ListenAndServe(":8080", nil)

}
