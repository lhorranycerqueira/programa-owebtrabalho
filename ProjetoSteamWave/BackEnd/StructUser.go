package main

type Users struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type Error struct {
	Message string `json:"message"`
	Status  int    `json:"status"`
}
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}
