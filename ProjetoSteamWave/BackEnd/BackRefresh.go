package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/golang-jwt/jwt/v5"
)

func HandleRefresh(w http.ResponseWriter, r *http.Request) {
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

	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		w.WriteHeader(401)
		json.NewEncoder(w).Encode(Error{
			Message: "Refresh token não encontrado",
			Status:  401,
		})
		return
	}

	token, err := jwt.Parse(cookie.Value, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("método de assinatura inesperado: %v", t.Header["alg"])
		}
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		w.WriteHeader(401)
		json.NewEncoder(w).Encode(Error{
			Message: "Refresh token inválido ou expirado",
			Status:  401,
		})
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		w.WriteHeader(401)
		json.NewEncoder(w).Encode(Error{
			Message: "Claims inválidas",
			Status:  401,
		})
		return
	}

	if claims["type"] != "refresh" {
		w.WriteHeader(401)
		json.NewEncoder(w).Encode(Error{
			Message: "Token não é um refresh token",
			Status:  401,
		})
		return
	}

	email, ok := claims["email"].(string)
	if !ok || email == "" {
		w.WriteHeader(401)
		json.NewEncoder(w).Encode(Error{
			Message: "Email não encontrado no token",
			Status:  401,
		})
		return
	}

	newAccessToken, err := gerarAccessToken(email)
	if err != nil {
		fmt.Printf("Refresh Erro ao gerar access token para: %s | %v\n", email, err)
		w.WriteHeader(500)
		json.NewEncoder(w).Encode(Error{
			Message: "Erro ao gerar token",
			Status:  500,
		})
		return
	}

	fmt.Printf("Refresh Token renovado para: %s\n", email)
	json.NewEncoder(w).Encode(map[string]string{
		"accessToken": newAccessToken,
	})
}

func HandleLogout(w http.ResponseWriter, r *http.Request) {
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

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    "",
		HttpOnly: true,
		Path:     "/",
		MaxAge:   -1,
	})

	json.NewEncoder(w).Encode(map[string]string{
		"message": "Logout realizado",
	})
}
