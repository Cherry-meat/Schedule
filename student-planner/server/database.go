package main

import (
    "database/sql"
    "fmt"
    "log"
    
    _ "github.com/lib/pq"
)

var db *sql.DB

func InitDB() (*sql.DB, error) {
    host := "localhost"
    port := "5432"
    user := "postgres"
    password := "admin"
    dbname := "student_planner"
    
    connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
        host, port, user, password, dbname)
    
    var err error
    db, err = sql.Open("postgres", connStr)
    if err != nil {
        return nil, err
    }
    
    if err = db.Ping(); err != nil {
        return nil, err
    }
    
    if err = createTables(); err != nil {
        return nil, err
    }
    
    log.Println("База данных подключена")
    return db, nil
}

func createTables() error {
    usersTable := `
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`
    
    eventsTable := `
    CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_type VARCHAR(50) NOT NULL,
        subject VARCHAR(100),
        location VARCHAR(255),
        event_date DATE NOT NULL,
        start_time TIME NOT NULL,
        duration_hours DECIMAL(3,1) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`
    
    tasksTable := `
    CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        priority VARCHAR(20) DEFAULT 'medium',
        is_completed BOOLEAN DEFAULT FALSE,
        due_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`
    
    tables := []string{usersTable, eventsTable, tasksTable}
    
    for _, table := range tables {
        if _, err := db.Exec(table); err != nil {
            return fmt.Errorf("ошибка создания таблицы: %v", err)
        }
    }
    
    log.Println("Таблицы созданы/проверены")
    return nil
}