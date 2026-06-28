package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"strings"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"golang.org/x/crypto/bcrypt"
)

func gerarAccessToken(email string) (string, error) {
	claims := jwt.MapClaims{
		"sub":   email,
		"email": email,
		"exp":   time.Now().Add(15 * time.Minute).Unix(),
		"iat":   time.Now().Unix(),
		"type":  "access",
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func gerarRefreshToken(email string) (string, error) {
	claims := jwt.MapClaims{
		"sub":   email,
		"email": email,
		"exp":   time.Now().Add(7 * 24 * time.Hour).Unix(),
		"iat":   time.Now().Unix(),
		"type":  "refresh",
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func HandleLogin(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r)
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

	if !validarCaptcha(login.CaptchaID, login.CaptchaAnswer) {
		w.WriteHeader(400)
		json.NewEncoder(w).Encode(Error{
			Message: "Captcha incorreto ou expirado",
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
	fmt.Printf("Login Comparando senha para: %s\n", login.Email)

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(login.Password))
	if err != nil {
		fmt.Printf("Login Senha incorreta para: %s\n", login.Email)
		w.WriteHeader(401)
		json.NewEncoder(w).Encode(Error{
			Message: "Não autorizado, senha incorreta",
			Status:  401,
		})
		return
	}

	fmt.Printf("Login feito para: %s\n", login.Email)

	accessToken, err := gerarAccessToken(user.Email)
	if err != nil {
		fmt.Printf("Login Erro ao gerar access token %s | %v\n", user.Email, err)
		w.WriteHeader(500)
		json.NewEncoder(w).Encode(Error{
			Message: "Erro ao gerar token",
			Status:  500,
		})
		return
	}

	refreshToken, err := gerarRefreshToken(user.Email)
	if err != nil {
		fmt.Printf("Login Erro ao gerar refresh token %s | %v\n", user.Email, err)
		w.WriteHeader(500)
		json.NewEncoder(w).Encode(Error{
			Message: "Erro ao gerar token",
			Status:  500,
		})
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Path:     "/",
		MaxAge:   7 * 24 * 60 * 60,
	})

	json.NewEncoder(w).Encode(map[string]string{
		"accessToken": accessToken,
		"email":       user.Email,
	})
}
