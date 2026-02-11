package main

import (
    "database/sql"
    "encoding/json"
    "net/http"
    "strconv"
    "time"
    
    "github.com/gorilla/mux"
    "golang.org/x/crypto/bcrypt"
)

type User struct {
    ID        int       `json:"id"`
    Email     string    `json:"email"`
    Password  string    `json:"-"`
    Name      string    `json:"name"`
    CreatedAt time.Time `json:"created_at"`
}

type Event struct {
    ID           int       `json:"id"`
    UserID       int       `json:"user_id"`
    Title        string    `json:"title"`
    Description  string    `json:"description"`
    EventType    string    `json:"event_type"`
    Subject      string    `json:"subject"`
    Location     string    `json:"location"`
    EventDate    string    `json:"event_date"`
    StartTime    string    `json:"start_time"`
    DurationHours float64   `json:"duration_hours"`
    CreatedAt    time.Time `json:"created_at"`
}

type Task struct {
    ID          int       `json:"id"`
    UserID      int       `json:"user_id"`
    Title       string    `json:"title"`
    Description string    `json:"description"`
    Priority    string    `json:"priority"`
    IsCompleted bool      `json:"is_completed"`
    DueDate     string    `json:"due_date"`
    CreatedAt   time.Time `json:"created_at"`
}

func getUserIdFromRequest(r *http.Request) int {
    userIdStr := r.Header.Get("X-User-ID")
    if userIdStr != "" {
        if userId, err := strconv.Atoi(userIdStr); err == nil && userId > 0 {
            return userId
        }
    }

    userIdStr = r.URL.Query().Get("user_id")
    if userIdStr != "" {
        if userId, err := strconv.Atoi(userIdStr); err == nil && userId > 0 {
            return userId
        }
    }

    return 0
}

func Register(w http.ResponseWriter, r *http.Request) {
    var req struct {
        Email    string `json:"email"`
        Password string `json:"password"`
        Name     string `json:"name"`
    }
    
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, `{"error": "Неверный формат данных"}`, http.StatusBadRequest)
        return
    }

    var existingUser User
    err := db.QueryRow("SELECT id FROM users WHERE email = $1", req.Email).Scan(&existingUser.ID)
    if err != sql.ErrNoRows {
        http.Error(w, `{"error": "Пользователь с таким email уже существует"}`, http.StatusConflict)
        return
    }

    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
    if err != nil {
        http.Error(w, `{"error": "Ошибка при создании пользователя"}`, http.StatusInternalServerError)
        return
    }

    var userID int
    err = db.QueryRow(
        "INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id",
        req.Email, string(hashedPassword), req.Name,
    ).Scan(&userID)
    
    if err != nil {
        http.Error(w, `{"error": "Ошибка при создании пользователя"}`, http.StatusInternalServerError)
        return
    }
    
    user := User{
        ID:    userID,
        Email: req.Email,
        Name:  req.Name,
        CreatedAt: time.Now(),
    }
    
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(user)
}

func Login(w http.ResponseWriter, r *http.Request) {
    var req struct {
        Email    string `json:"email"`
        Password string `json:"password"`
    }
    
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, `{"error": "Неверный формат данных"}`, http.StatusBadRequest)
        return
    }
    
    var user User
    err := db.QueryRow(
        "SELECT id, email, password, name, created_at FROM users WHERE email = $1",
        req.Email,
    ).Scan(&user.ID, &user.Email, &user.Password, &user.Name, &user.CreatedAt)
    
    if err == sql.ErrNoRows {
        http.Error(w, `{"error": "Неверный email или пароль"}`, http.StatusUnauthorized)
        return
    } else if err != nil {
        http.Error(w, `{"error": "Ошибка базы данных"}`, http.StatusInternalServerError)
        return
    }

    if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
        http.Error(w, `{"error": "Неверный email или пароль"}`, http.StatusUnauthorized)
        return
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(user)
}

func GetEvents(w http.ResponseWriter, r *http.Request) {
    userID := getUserIdFromRequest(r)
    if userID == 0 {
        http.Error(w, `{"error": "Неавторизованный доступ"}`, http.StatusUnauthorized)
        return
    }
    
    rows, err := db.Query(
        `SELECT id, user_id, title, description, event_type, subject, location, 
                event_date, start_time, duration_hours, created_at 
         FROM events 
         WHERE user_id = $1 
         ORDER BY event_date, start_time`,
        userID,
    )
    
    if err != nil {
        http.Error(w, `{"error": "Ошибка получения событий"}`, http.StatusInternalServerError)
        return
    }
    defer rows.Close()
    
    events := []Event{}
    for rows.Next() {
        var event Event
        err := rows.Scan(
            &event.ID, &event.UserID, &event.Title, &event.Description,
            &event.EventType, &event.Subject, &event.Location, &event.EventDate,
            &event.StartTime, &event.DurationHours, &event.CreatedAt,
        )
        if err != nil {
            continue
        }
        events = append(events, event)
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(events)
}

func CreateEvent(w http.ResponseWriter, r *http.Request) {
    userID := getUserIdFromRequest(r)
    if userID == 0 {
        http.Error(w, `{"error": "Неавторизованный доступ"}`, http.StatusUnauthorized)
        return
    }
    
    var req struct {
        Title        string  `json:"title"`
        Description  string  `json:"description"`
        EventType    string  `json:"event_type"`
        Subject      string  `json:"subject"`
        Location     string  `json:"location"`
        EventDate    string  `json:"event_date"`
        StartTime    string  `json:"start_time"`
        DurationHours float64 `json:"duration_hours"`
    }
    
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, `{"error": "Неверный формат данных"}`, http.StatusBadRequest)
        return
    }
    
    var eventID int
    err := db.QueryRow(
        `INSERT INTO events (user_id, title, description, event_type, subject, 
                            location, event_date, start_time, duration_hours) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
         RETURNING id`,
        userID, req.Title, req.Description, req.EventType, req.Subject,
        req.Location, req.EventDate, req.StartTime, req.DurationHours,
    ).Scan(&eventID)
    
    if err != nil {
        http.Error(w, `{"error": "Ошибка создания события"}`, http.StatusInternalServerError)
        return
    }

    var event Event
    err = db.QueryRow(
        `SELECT id, user_id, title, description, event_type, subject, location, 
                event_date, start_time, duration_hours, created_at 
         FROM events WHERE id = $1`,
        eventID,
    ).Scan(
        &event.ID, &event.UserID, &event.Title, &event.Description,
        &event.EventType, &event.Subject, &event.Location, &event.EventDate,
        &event.StartTime, &event.DurationHours, &event.CreatedAt,
    )
    
    if err != nil {
        http.Error(w, `{"error": "Событие создано, но не получено"}`, http.StatusInternalServerError)
        return
    }
    
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(event)
}

func UpdateEvent(w http.ResponseWriter, r *http.Request) {
    userID := getUserIdFromRequest(r)
    if userID == 0 {
        http.Error(w, `{"error": "Неавторизованный доступ"}`, http.StatusUnauthorized)
        return
    }
    
    vars := mux.Vars(r)
    eventID, _ := strconv.Atoi(vars["id"])
    
    var req struct {
        Title        string  `json:"title"`
        Description  string  `json:"description"`
        EventType    string  `json:"event_type"`
        Subject      string  `json:"subject"`
        Location     string  `json:"location"`
        EventDate    string  `json:"event_date"`
        StartTime    string  `json:"start_time"`
        DurationHours float64 `json:"duration_hours"`
    }
    
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, `{"error": "Неверный формат данных"}`, http.StatusBadRequest)
        return
    }
    
    result, err := db.Exec(
        `UPDATE events 
         SET title = $1, description = $2, event_type = $3, subject = $4, 
             location = $5, event_date = $6, start_time = $7, duration_hours = $8 
         WHERE id = $9 AND user_id = $10`,
        req.Title, req.Description, req.EventType, req.Subject,
        req.Location, req.EventDate, req.StartTime, req.DurationHours,
        eventID, userID,
    )
    
    if err != nil {
        http.Error(w, `{"error": "Ошибка обновления события"}`, http.StatusInternalServerError)
        return
    }
    
    rowsAffected, _ := result.RowsAffected()
    if rowsAffected == 0 {
        http.Error(w, `{"error": "Событие не найдено или нет прав доступа"}`, http.StatusNotFound)
        return
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{"message": "Событие обновлено"})
}

func DeleteEvent(w http.ResponseWriter, r *http.Request) {
    userID := getUserIdFromRequest(r)
    if userID == 0 {
        http.Error(w, `{"error": "Неавторизованный доступ"}`, http.StatusUnauthorized)
        return
    }
    
    vars := mux.Vars(r)
    eventID, _ := strconv.Atoi(vars["id"])
    
    result, err := db.Exec("DELETE FROM events WHERE id = $1 AND user_id = $2", eventID, userID)
    
    if err != nil {
        http.Error(w, `{"error": "Ошибка удаления события"}`, http.StatusInternalServerError)
        return
    }
    
    rowsAffected, _ := result.RowsAffected()
    if rowsAffected == 0 {
        http.Error(w, `{"error": "Событие не найдено или нет прав доступа"}`, http.StatusNotFound)
        return
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{"message": "Событие удалено"})
}

func GetTasks(w http.ResponseWriter, r *http.Request) {
    userID := getUserIdFromRequest(r)
    if userID == 0 {
        http.Error(w, `{"error": "Неавторизованный доступ"}`, http.StatusUnauthorized)
        return
    }
    
    rows, err := db.Query(
        `SELECT id, user_id, title, description, priority, is_completed, due_date, created_at 
         FROM tasks 
         WHERE user_id = $1 
         ORDER BY due_date, priority`,
        userID,
    )
    
    if err != nil {
        http.Error(w, `{"error": "Ошибка получения задач"}`, http.StatusInternalServerError)
        return
    }
    defer rows.Close()
    
    tasks := []Task{}
    for rows.Next() {
        var task Task
        err := rows.Scan(
            &task.ID, &task.UserID, &task.Title, &task.Description,
            &task.Priority, &task.IsCompleted, &task.DueDate, &task.CreatedAt,
        )
        if err != nil {
            continue
        }
        tasks = append(tasks, task)
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(tasks)
}

func CreateTask(w http.ResponseWriter, r *http.Request) {
    userID := getUserIdFromRequest(r)
    if userID == 0 {
        http.Error(w, `{"error": "Неавторизованный доступ"}`, http.StatusUnauthorized)
        return
    }
    
    var req struct {
        Title       string `json:"title"`
        Description string `json:"description"`
        Priority    string `json:"priority"`
        DueDate     string `json:"due_date"`
    }
    
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, `{"error": "Неверный формат данных"}`, http.StatusBadRequest)
        return
    }
    
    var taskID int
    err := db.QueryRow(
        `INSERT INTO tasks (user_id, title, description, priority, due_date) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id`,
        userID, req.Title, req.Description, req.Priority, req.DueDate,
    ).Scan(&taskID)
    
    if err != nil {
        http.Error(w, `{"error": "Ошибка создания задачи"}`, http.StatusInternalServerError)
        return
    }
    
    var task Task
    err = db.QueryRow(
        `SELECT id, user_id, title, description, priority, is_completed, due_date, created_at 
         FROM tasks WHERE id = $1`,
        taskID,
    ).Scan(
        &task.ID, &task.UserID, &task.Title, &task.Description,
        &task.Priority, &task.IsCompleted, &task.DueDate, &task.CreatedAt,
    )
    
    if err != nil {
        http.Error(w, `{"error": "Задача создана, но не получена"}`, http.StatusInternalServerError)
        return
    }
    
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(task)
}

func UpdateTask(w http.ResponseWriter, r *http.Request) {
    userID := getUserIdFromRequest(r)
    if userID == 0 {
        http.Error(w, `{"error": "Неавторизованный доступ"}`, http.StatusUnauthorized)
        return
    }
    
    vars := mux.Vars(r)
    taskID, _ := strconv.Atoi(vars["id"])
    
    var req struct {
        Title       string `json:"title"`
        Description string `json:"description"`
        Priority    string `json:"priority"`
        IsCompleted bool   `json:"is_completed"`
        DueDate     string `json:"due_date"`
    }
    
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, `{"error": "Неверный формат данных"}`, http.StatusBadRequest)
        return
    }
    
    result, err := db.Exec(
        `UPDATE tasks 
         SET title = $1, description = $2, priority = $3, is_completed = $4, due_date = $5 
         WHERE id = $6 AND user_id = $7`,
        req.Title, req.Description, req.Priority, req.IsCompleted, req.DueDate,
        taskID, userID,
    )
    
    if err != nil {
        http.Error(w, `{"error": "Ошибка обновления задачи: ` + err.Error() + `"}`, http.StatusInternalServerError)
        return
    }
    
    rowsAffected, _ := result.RowsAffected()
    if rowsAffected == 0 {
        http.Error(w, `{"error": "Задача не найдена или нет прав доступа"}`, http.StatusNotFound)
        return
    }

    var task Task
    err = db.QueryRow(
        `SELECT id, user_id, title, description, priority, is_completed, due_date, created_at 
         FROM tasks WHERE id = $1 AND user_id = $2`,
        taskID, userID,
    ).Scan(
        &task.ID, &task.UserID, &task.Title, &task.Description,
        &task.Priority, &task.IsCompleted, &task.DueDate, &task.CreatedAt,
    )
    
    if err != nil {
        http.Error(w, `{"error": "Задача обновлена, но не получена"}`, http.StatusInternalServerError)
        return
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(task)
}

func ToggleTaskCompletion(w http.ResponseWriter, r *http.Request) {
    userID := getUserIdFromRequest(r)
    if userID == 0 {
        http.Error(w, `{"error": "Неавторизованный доступ"}`, http.StatusUnauthorized)
        return
    }
    
    vars := mux.Vars(r)
    taskID, _ := strconv.Atoi(vars["id"])
    
    var req struct {
        IsCompleted bool `json:"is_completed"`
    }
    
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, `{"error": "Неверный формат данных"}`, http.StatusBadRequest)
        return
    }
    
    result, err := db.Exec(
        `UPDATE tasks 
         SET is_completed = $1 
         WHERE id = $2 AND user_id = $3`,
        req.IsCompleted, taskID, userID,
    )
    
    if err != nil {
        http.Error(w, `{"error": "Ошибка обновления задачи: ` + err.Error() + `"}`, http.StatusInternalServerError)
        return
    }
    
    rowsAffected, _ := result.RowsAffected()
    if rowsAffected == 0 {
        http.Error(w, `{"error": "Задача не найдена или нет прав доступа"}`, http.StatusNotFound)
        return
    }

    var task Task
    err = db.QueryRow(
        `SELECT id, user_id, title, description, priority, is_completed, due_date, created_at 
         FROM tasks WHERE id = $1 AND user_id = $2`,
        taskID, userID,
    ).Scan(
        &task.ID, &task.UserID, &task.Title, &task.Description,
        &task.Priority, &task.IsCompleted, &task.DueDate, &task.CreatedAt,
    )
    
    if err != nil {
        http.Error(w, `{"error": "Статус задачи обновлен, но не получен"}`, http.StatusInternalServerError)
        return
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(task)
}

func DeleteTask(w http.ResponseWriter, r *http.Request) {
    userID := getUserIdFromRequest(r)
    if userID == 0 {
        http.Error(w, `{"error": "Неавторизованный доступ"}`, http.StatusUnauthorized)
        return
    }
    
    vars := mux.Vars(r)
    taskID, _ := strconv.Atoi(vars["id"])
    
    result, err := db.Exec("DELETE FROM tasks WHERE id = $1 AND user_id = $2", taskID, userID)
    
    if err != nil {
        http.Error(w, `{"error": "Ошибка удаления задачи"}`, http.StatusInternalServerError)
        return
    }
    
    rowsAffected, _ := result.RowsAffected()
    if rowsAffected == 0 {
        http.Error(w, `{"error": "Задача не найдена или нет прав доступа"}`, http.StatusNotFound)
        return
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{"message": "Задача удалена"})
}

func GetSchedule(w http.ResponseWriter, r *http.Request) {
    userID := getUserIdFromRequest(r)
    if userID == 0 {
        http.Error(w, `{"error": "Неавторизованный доступ"}`, http.StatusUnauthorized)
        return
    }
    
    rows, err := db.Query(
        `SELECT id, title, event_type, subject, location, 
                event_date, start_time, duration_hours 
         FROM events 
         WHERE user_id = $1 AND event_date >= CURRENT_DATE 
         ORDER BY event_date, start_time 
         LIMIT 10`,
        userID,
    )
    
    if err != nil {
        http.Error(w, `{"error": "Ошибка получения расписания"}`, http.StatusInternalServerError)
        return
    }
    defer rows.Close()
    
    type ScheduleItem struct {
        ID           int     `json:"id"`
        Title        string  `json:"title"`
        EventType    string  `json:"event_type"`
        Subject      string  `json:"subject"`
        Location     string  `json:"location"`
        EventDate    string  `json:"event_date"`
        StartTime    string  `json:"start_time"`
        DurationHours float64 `json:"duration_hours"`
    }
    
    schedule := []ScheduleItem{}
    for rows.Next() {
        var item ScheduleItem
        err := rows.Scan(
            &item.ID, &item.Title, &item.EventType, &item.Subject,
            &item.Location, &item.EventDate, &item.StartTime, &item.DurationHours,
        )
        if err != nil {
            continue
        }
        schedule = append(schedule, item)
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(schedule)
}

func GetWeekSchedule(w http.ResponseWriter, r *http.Request) {
    userID := getUserIdFromRequest(r)
    if userID == 0 {
        http.Error(w, `{"error": "Неавторизованный доступ"}`, http.StatusUnauthorized)
        return
    }

    now := time.Now()
    weekday := int(now.Weekday())
    if weekday == 0 {
        weekday = 7 
    }
    
    startOfWeek := now.AddDate(0, 0, -weekday+1).Format("2006-01-02")
    endOfWeek := now.AddDate(0, 0, 7-weekday).Format("2006-01-02")
    
    rows, err := db.Query(
        `SELECT id, title, event_type, subject, location, 
                event_date, start_time, duration_hours 
         FROM events 
         WHERE user_id = $1 AND event_date BETWEEN $2 AND $3 
         ORDER BY event_date, start_time`,
        userID, startOfWeek, endOfWeek,
    )
    
    if err != nil {
        http.Error(w, `{"error": "Ошибка получения расписания на неделю"}`, http.StatusInternalServerError)
        return
    }
    defer rows.Close()
    
    weekSchedule := make(map[string][]interface{})
    for rows.Next() {
        var id int
        var title, eventType, subject, location, eventDate, startTime string
        var durationHours float64
        
        err := rows.Scan(
            &id, &title, &eventType, &subject, &location,
            &eventDate, &startTime, &durationHours,
        )
        if err != nil {
            continue
        }
        
        event := map[string]interface{}{
            "id": id,
            "title": title,
            "event_type": eventType,
            "subject": subject,
            "location": location,
            "start_time": startTime,
            "duration_hours": durationHours,
        }
        
        weekSchedule[eventDate] = append(weekSchedule[eventDate], event)
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(weekSchedule)
}

func GetStats(w http.ResponseWriter, r *http.Request) {
    userID := getUserIdFromRequest(r)
    if userID == 0 {
        http.Error(w, `{"error": "Неавторизованный доступ"}`, http.StatusUnauthorized)
        return
    }
    
    type Stats struct {
        TotalEvents    int     `json:"total_events"`
        TotalTasks     int     `json:"total_tasks"`
        CompletedTasks int     `json:"completed_tasks"`
        StudyHours     float64 `json:"study_hours"`
    }
    
    var stats Stats

    err := db.QueryRow(
        "SELECT COUNT(*) FROM events WHERE user_id = $1",
        userID,
    ).Scan(&stats.TotalEvents)
    
    if err != nil {
        http.Error(w, `{"error": "Ошибка получения статистики"}`, http.StatusInternalServerError)
        return
    }
 
    err = db.QueryRow(
        "SELECT COUNT(*) FROM tasks WHERE user_id = $1",
        userID,
    ).Scan(&stats.TotalTasks)
    
    if err != nil {
        http.Error(w, `{"error": "Ошибка получения статистики"}`, http.StatusInternalServerError)
        return
    }

    err = db.QueryRow(
        "SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND is_completed = true",
        userID,
    ).Scan(&stats.CompletedTasks)
    
    if err != nil {
        http.Error(w, `{"error": "Ошибка получения статистики"}`, http.StatusInternalServerError)
        return
    }
 
    err = db.QueryRow(
        "SELECT COALESCE(SUM(duration_hours), 0) FROM events WHERE user_id = $1",
        userID,
    ).Scan(&stats.StudyHours)
    
    if err != nil {
        http.Error(w, `{"error": "Ошибка получения статистики"}`, http.StatusInternalServerError)
        return
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(stats)
}

func CheckAuth(w http.ResponseWriter, r *http.Request) {
    userID := getUserIdFromRequest(r)
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]interface{}{
        "status": "authenticated",
        "user_id": userID,
    })
}