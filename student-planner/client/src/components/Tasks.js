import React, { useState, useEffect } from 'react';
import { tasksAPI } from '../services/api';

function Tasks({ user }) {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await tasksAPI.getTasks();
      setTasks(response.data);
    } catch (err) {
      console.error('Ошибка загрузки задач:', err);
      setError('Не удалось загрузить задачи');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask({
      ...newTask,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!newTask.title.trim()) {
      setError('Введите название задачи');
      return;
    }
    
    try {
      const response = await tasksAPI.createTask(newTask);
      setTasks([response.data, ...tasks]);
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        due_date: ''
      });
      setSuccess('Задача успешно добавлена');
    } catch (err) {
      console.error('Ошибка создания задачи:', err);
      setError('Не удалось создать задачу');
    }
  };

  const handleToggleComplete = async (taskId, currentStatus) => {
    try {
      setError('');
      const response = await tasksAPI.toggleTaskCompletion(taskId, !currentStatus);
      
      setTasks(tasks.map(task => 
        task.id === taskId ? response.data : task
      ));
      
      setSuccess('Статус задачи обновлен');
    } catch (err) {
      console.error('Ошибка обновления задачи:', err);
      setError('Не удалось обновить статус задачи');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту задачу?')) {
      return;
    }
    
    try {
      await tasksAPI.deleteTask(taskId);
      setTasks(tasks.filter(task => task.id !== taskId));
      setSuccess('Задача успешно удалена');
    } catch (err) {
      console.error('Ошибка удаления задачи:', err);
      setError('Не удалось удалить задачу');
    }
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      high: 'Высокий',
      medium: 'Средний',
      low: 'Низкий'
    };
    return labels[priority] || priority;
  };

  const getPriorityClass = (priority) => {
    return `priority-${priority}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Без срока';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const pendingTasks = tasks.filter(task => !task.is_completed);
  const completedTasks = tasks.filter(task => task.is_completed);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Загрузка задач...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="main-content">
        <div className="welcome-section">
          <h2>Задачи и дедлайны</h2>
          <p>Управляйте своими учебными задачами и отслеживайте сроки выполнения</p>
        </div>

        {error && <div className="message error">{error}</div>}
        {success && <div className="message success">{success}</div>}

        <div className="add-event-form">
          <h3>Добавить новую задачу</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Название задачи *</label>
                <input
                  type="text"
                  name="title"
                  value={newTask.title}
                  onChange={handleInputChange}
                  placeholder="Например: Решить задачи по математике"
                  required
                />
              </div>
              <div className="form-group">
                <label>Приоритет</label>
                <select
                  name="priority"
                  value={newTask.priority}
                  onChange={handleInputChange}
                >
                  <option value="low">Низкий</option>
                  <option value="medium">Средний</option>
                  <option value="high">Высокий</option>
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Описание (необязательно)</label>
                <textarea
                  name="description"
                  value={newTask.description}
                  onChange={handleInputChange}
                  placeholder="Подробное описание задачи..."
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Срок выполнения</label>
                <input
                  type="date"
                  name="due_date"
                  value={newTask.due_date}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <button type="submit" className="btn btn-primary">
              <i className="fas fa-plus"></i> Добавить задачу
            </button>
          </form>
        </div>

        <div className="tasks-section">
          <div className="section-title">
            <h3>Ожидающие задачи ({pendingTasks.length})</h3>
          </div>
          
          {pendingTasks.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
              Нет ожидающих задач. Добавьте новую задачу!
            </p>
          ) : (
            <ul className="task-list">
              {pendingTasks.map(task => (
                <li key={task.id} className={`task-item ${getPriorityClass(task.priority)}`}>
                  <div className="task-checkbox">
                    <input
                      type="checkbox"
                      checked={task.is_completed}
                      onChange={() => handleToggleComplete(task.id, task.is_completed)}
                    />
                  </div>
                  <div className="task-content">
                    <div className="task-title">{task.title}</div>
                    {task.description && (
                      <div className="task-description">{task.description}</div>
                    )}
                    <div className="task-details">
                      <span className="task-priority">
                        <i className="fas fa-flag"></i> {getPriorityLabel(task.priority)}
                      </span>
                      <span className="task-due">
                        <i className="far fa-calendar"></i> Срок: {formatDate(task.due_date)}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteTask(task.id)}
                    className="btn btn-danger btn-small"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {completedTasks.length > 0 && (
          <div className="tasks-section">
            <div className="section-title">
              <h3>Выполненные задачи ({completedTasks.length})</h3>
            </div>
            <ul className="task-list">
              {completedTasks.map(task => (
                <li key={task.id} className="task-item" style={{ opacity: 0.7 }}>
                  <div className="task-checkbox">
                    <input
                      type="checkbox"
                      checked={task.is_completed}
                      onChange={() => handleToggleComplete(task.id, task.is_completed)}
                    />
                  </div>
                  <div className="task-content">
                    <div className="task-title" style={{ textDecoration: 'line-through' }}>
                      {task.title}
                    </div>
                    {task.description && (
                      <div className="task-description">{task.description}</div>
                    )}
                    <div className="task-details">
                      <span className="task-priority">
                        <i className="fas fa-flag"></i> {getPriorityLabel(task.priority)}
                      </span>
                      <span className="task-due">
                        <i className="far fa-calendar"></i> Срок: {formatDate(task.due_date)}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteTask(task.id)}
                    className="btn btn-danger btn-small"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default Tasks;