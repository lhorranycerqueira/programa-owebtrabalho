package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/dchest/captcha"
)

func HandleCaptchaNew(w http.ResponseWriter, r *http.Request) {
	setCORS(w, r)
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}
	w.Header().Add("Content-Type", "application/json")

	if r.Method != "GET" {
		json.NewEncoder(w).Encode(Error{
			Message: "Metodo bloqueado",
			Status:  405,
		})
		return
	}

	id := captcha.New()
	fmt.Printf("Captcha Gerado ID: %s\n", id)

	json.NewEncoder(w).Encode(map[string]string{
		"captchaId":  id,
		"captchaUrl": fmt.Sprintf("http://localhost:8080/Captcha/%s.png", id),
	})
}

func validarCaptcha(id string, resposta string) bool {
	if id == "" || resposta == "" {
		return false
	}
	return captcha.VerifyString(id, resposta)
}
