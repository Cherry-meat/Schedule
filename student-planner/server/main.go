package main

import (
    "log"
    "net/http"
    "os"
    
    "github.com/gorilla/handlers"
    "github.com/gorilla/mux"
)

func main() {
    db, err := InitDB()
    if err != nil {
        log.Fatal("Ошибка инициализации БД:", err)
    }
    defer db.Close()
    
    r := mux.NewRouter()
    
    r.Use(func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
            w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
            w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-ID")
            w.Header().Set("Access-Control-Allow-Credentials", "true")
            
            if r.Method == "OPTIONS" {
                w.WriteHeader(http.StatusOK)
                return
            }
            
            next.ServeHTTP(w, r)
        })
    })

    r.HandleFunc("/api/register", Register).Methods("POST", "OPTIONS")
    r.HandleFunc("/api/login", Login).Methods("POST", "OPTIONS")

    r.HandleFunc("/api/events", GetEvents).Methods("GET", "OPTIONS")
    r.HandleFunc("/api/events", CreateEvent).Methods("POST", "OPTIONS")
    r.HandleFunc("/api/events/{id}", UpdateEvent).Methods("PUT", "OPTIONS")
    r.HandleFunc("/api/events/{id}", DeleteEvent).Methods("DELETE", "OPTIONS")

    r.HandleFunc("/api/tasks", GetTasks).Methods("GET", "OPTIONS")
    r.HandleFunc("/api/tasks", CreateTask).Methods("POST", "OPTIONS")
    r.HandleFunc("/api/tasks/{id}", UpdateTask).Methods("PUT", "OPTIONS")
    r.HandleFunc("/api/tasks/{id}/toggle", ToggleTaskCompletion).Methods("PUT", "OPTIONS")
    r.HandleFunc("/api/tasks/{id}", DeleteTask).Methods("DELETE", "OPTIONS")
 
    r.HandleFunc("/api/schedule", GetSchedule).Methods("GET", "OPTIONS")
    r.HandleFunc("/api/schedule/week", GetWeekSchedule).Methods("GET", "OPTIONS")

    r.HandleFunc("/api/stats", GetStats).Methods("GET", "OPTIONS")

    r.HandleFunc("/api/check-auth", CheckAuth).Methods("GET", "OPTIONS")
 
    r.HandleFunc("/api/test", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        w.Write([]byte(`{"message": "Server is working!"}`))
    }).Methods("GET", "OPTIONS")

    r.HandleFunc("/api/demo", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        w.Write([]byte(`{
            "message": "Демо режим", 
            "instructions": "Зарегистрируйтесь или войдите в систему",
            "test_account": {
                "email": "test@example.com",
                "password": "test123"
            }
        }`))
    }).Methods("GET", "OPTIONS")

    r.HandleFunc("/api/status", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        w.Write([]byte(`{"status": "ok", "version": "1.0.0"}`))
    }).Methods("GET", "OPTIONS")
    
    port := "8080"
    log.Printf("Сервер запущен на http://localhost:%s", port)
    log.Printf("API доступен по адресу http://localhost:%s/api", port)
    log.Printf("Тест: http://localhost:%s/api/test", port)
    log.Printf("Демо: http://localhost:%s/api/demo", port)
    
    loggedRouter := handlers.LoggingHandler(os.Stdout, r)
    log.Fatal(http.ListenAndServe(":"+port, loggedRouter))
}