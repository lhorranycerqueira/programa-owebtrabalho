package main

import "time"

type Users struct {
	Email     string `json:"email" bson:"email"`
	Password  string `json:"password" bson:"password"`
	Theme     string `json:"theme" bson:"theme"`
	Nickname  string `json:"nickname" bson:"nickname,omitempty"`
	BirthDate time.Time `json:"birthdate" bson:"birthdate,omitempty"`
}

type Error struct {
	Message string `json:"message"`
	Status  int    `json:"status"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// Das configurações para atualizar a senha do usuário
type UpdatePasswordRequest struct {
	Email           string `json:"email"`
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
}
