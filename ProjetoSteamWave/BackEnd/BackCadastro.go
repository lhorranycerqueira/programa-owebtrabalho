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
	//Aqui ta o CORS, sem ele o navegador vai bloquear tudo que o front tentar mandar para aqui
	//Access-Control-Allow-Origin: "*" permite que QUALQUER domínio faça requisições
	//Em produção, o ideal seria colocar apenas o domínio do frontend por segurança
	w.Header().Set("Access-Control-Allow-Origin", "*")

	//Access-Control-Allow-Methods: define quais métodos HTTP são permitidos
	//POST é o método do cadastro, OPTIONS é o "preflight request"
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")

	//Access-Control-Allow-Headers: define quais headers o cliente pode enviar
	//"Content-Type" é necessário porque o frontend envia "Content-Type: application/json"
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	//O navegador manda uma requisição, o navegador meio que pergunta se pode mandar uma requisição
	//"posso mandar um POST com esse Content-Type?"
	//Se o servidor responder com status 200, o navegador envia a requisição real
	//Se não, o navegador BLOQUEIA e o frontend recebe um erro de CORS
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Define que a resposta desta função será no formato JSON
	// Isso é importante para o frontend saber como interpretar a resposta
	w.Header().Add("Content-Type", "application/json")

	//Se a requisição não for POST pelo usuario nos já bloqueamos
	if r.Method != "POST" {
		//Mandamos um JSON com a mensagem de erro
		json.NewEncoder(w).Encode(Error{
			Message: "Metodo bloqueado",
			Status:  405,
		})
		return
	}
	//Declarei uma variável que vai recebr a struct do Users(Ela que pega o gmail e senha do usuario)
	var user Users

	//Isso vai ler a requisição que o front mandou para nos e colocar no user
	err := json.NewDecoder(r.Body).Decode(&user)
	fmt.Printf("Cadastro Erro ao ler body: %v\n", err) //Para eu saber onde é o erro

	if err != nil {
		w.WriteHeader(400) //Solicitação Incorreta
		json.NewEncoder(w).Encode(Error{
			Message: "Erro ao ler",
			Status:  400,
		})
		return
	}
	//strings.TrimSpace remove espaços do início e fim da string
	//Não que eu tenha cometido esse erro
	user.Email = strings.TrimSpace(user.Email)

	//Aqui entra a parte de segurança para o nosso BD
	//Criamos um hash com um salt, que criptografa a senha do usuário antes de salvar
	//Nunca devemos salvar a senha do usuário em texto puro
	//Por isso, usamos o Hash mais o Salt para garantir a segurança dos dados
	hash, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		fmt.Printf("Cadastro Erro ao gerar hash: %v\n", err)
		w.WriteHeader(500) //Problema interno no servidor
		json.NewEncoder(w).Encode(Error{
			Message: "Erro interno ao processar senha",
			Status:  500,
		})
		return
	}
	// Substitui a senha em texto plano pelo hash gerado.
	// Agora a struct "user" contém o hash, não a senha original.
	user.Password = string(hash)
	user.Theme = "neon-classic"
	fmt.Printf("Cadastro Senha com Hash para: %s\n", user.Email)

	//context.WithTimeout cria um contexto que será cancelado automaticamente
	//após 5 segundos. Isso é uma proteção para evitar que a operação fique presa indefinidamente caso o MongoDB esteja fora do ar.
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = collection.InsertOne(ctx, user)
	if err != nil {
		//Não usar o log.Fatal, na documentação da microsoft tava usando ele
		//So uso ele caso seja um erro critico e seja obrigado a fechar a conexão
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
