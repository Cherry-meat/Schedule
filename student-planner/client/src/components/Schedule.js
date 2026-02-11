import React, { useState, useEffect } from 'react';
import { eventsAPI } from '../services/api';

const Schedule = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'lecture',
    subject: '',
    location: '',
    event_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    duration_hours: 1.5,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await eventsAPI.getEvents();
      setEvents(response.data || []);
    } catch (error) {
      console.error('Ошибка загрузки событий:', error);
      setMessage('Ошибка загрузки событий');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'duration_hours' ? parseFloat(value) : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    if (!formData.title.trim()) {
      setMessage('Введите название события');
      return;
    }
    
    if (!formData.event_date) {
      setMessage('Выберите дату');
      return;
    }
    
    try {
      await eventsAPI.createEvent(formData);
      setMessage('Событие успешно добавлено!');
      
      setFormData({
        title: '',
        description: '',
        event_type: 'lecture',
        subject: '',
        location: '',
        event_date: new Date().toISOString().split('T')[0],
        start_time: '09:00',
        duration_hours: 1.5,
      });
      
      fetchEvents();
      
      setTimeout(() => {
        setMessage('');
        setShowAddForm(false);
      }, 3000);
      
    } catch (error) {
      console.error('Ошибка создания события:', error);
      setMessage(error.response?.data?.error || 'Ошибка создания события');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Вы уверены, что хотите удалить это событие?')) {
      try {
        await eventsAPI.deleteEvent(eventId);
        setMessage('Событие успешно удалено');
        fetchEvents();
        
        setTimeout(() => {
          setMessage('');
        }, 3000);
      } catch (error) {
        console.error('Ошибка удаления события:', error);
        setMessage(error.response?.data?.error || 'Ошибка удаления события');
      }
    }
  };

  const getEventTypeClass = (type) => {
    switch (type) {
      case 'lecture': return 'lecture';
      case 'practice': return 'practice';
      case 'exam': return 'exam';
      case 'meeting': return 'meeting';
      default: return '';
    }
  };

  const getEventTypeLabel = (type) => {
    switch (type) {
      case 'lecture': return 'Лекция';
      case 'practice': return 'Практика';
      case 'exam': return 'Экзамен';
      case 'meeting': return 'Встреча';
      default: return type;
    }
  };

  if (loading) {
    return <div className="loading">Загрузка расписания...</div>;
  }

  return (
    <div className="main-content">
      <div className="container">
        <section className="schedule-section">
          <div className="section-title">
            <h3><i className="fas fa-calendar-week"></i> Расписание</h3>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <i className="fas fa-plus"></i> {showAddForm ? 'Скрыть форму' : 'Добавить событие'}
            </button>
          </div>
          
          {message && (
            <div className={`message ${message.includes('успешно') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
          
          {showAddForm && (
            <div className="add-event-form">
              <h3><i className="fas fa-plus-circle"></i> Добавить новое событие</h3>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="title">Название события *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Например: Лекция по математике"
                    required
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="event_type">Тип события *</label>
                    <select
                      id="event_type"
                      name="event_type"
                      value={formData.event_type}
                      onChange={handleInputChange}
                      required
                      style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '8px' }}
                    >
                      <option value="lecture">Лекция</option>
                      <option value="practice">Практическое занятие</option>
                      <option value="exam">Экзамен</option>
                      <option value="meeting">Встреча</option>
                      <option value="other">Другое</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="duration_hours">Продолжительность (часы) *</label>
                    <input
                      type="number"
                      id="duration_hours"
                      name="duration_hours"
                      value={formData.duration_hours}
                      onChange={handleInputChange}
                      min="0.5"
                      max="8"
                      step="0.5"
                      required
                      style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '8px' }}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="event_date">Дата *</label>
                    <input
                      type="date"
                      id="event_date"
                      name="event_date"
                      value={formData.event_date}
                      onChange={handleInputChange}
                      required
                      style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '8px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="start_time">Время *</label>
                    <input
                      type="time"
                      id="start_time"
                      name="start_time"
                      value={formData.start_time}
                      onChange={handleInputChange}
                      required
                      style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '8px' }}
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="subject">Предмет</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Название предмета"
                      style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '8px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="location">Место</label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Аудитория или онлайн"
                      style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '8px' }}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="description">Описание</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Дополнительная информация о событии"
                    style={{ width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '8px' }}
                  />
                </div>
                
                <div className="form-row" style={{ marginTop: '20px' }}>
                  <button type="submit" className="btn btn-primary">
                    <i className="fas fa-calendar-plus"></i> Добавить в расписание
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setMessage('');
                    }}
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          )}
          
          <div style={{ marginTop: '30px' }}>
            <h3><i className="fas fa-list"></i> Все события ({events.length})</h3>
            
            {events.length === 0 ? (
              <div style={{ 
                padding: '40px', 
                textAlign: 'center', 
                backgroundColor: '#f9f9ff',
                borderRadius: '8px',
                marginTop: '20px'
              }}>
                <i className="fas fa-calendar-plus" style={{ fontSize: '3rem', color: '#ccc', marginBottom: '20px' }}></i>
                <p style={{ fontSize: '1.1rem', color: '#666' }}>Событий пока нет</p>
                <button 
                  className="btn btn-primary" 
                  onClick={() => setShowAddForm(true)}
                  style={{ marginTop: '20px' }}
                >
                  <i className="fas fa-plus"></i> Добавить первое событие
                </button>
              </div>
            ) : (
              <div className="events-list" style={{ marginTop: '20px' }}>
                {events.map(event => (
                  <div key={event.id} className="event-card" style={{ position: 'relative' }}>
                    <button 
                      className="btn btn-danger" 
                      style={{ 
                        position: 'absolute', 
                        top: '10px', 
                        right: '10px', 
                        padding: '5px 10px',
                        fontSize: '0.8rem'
                      }}
                      onClick={() => handleDeleteEvent(event.id)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                    
                    <span className={`event-type ${getEventTypeClass(event.event_type)}`}>
                      {getEventTypeLabel(event.event_type)}
                    </span>
                    <h4 className="event-title">{event.title}</h4>
                    {event.subject && <p><strong>Предмет:</strong> {event.subject}</p>}
                    {event.description && <p>{event.description}</p>}
                    <div className="event-details">
                      <span><i className="far fa-calendar"></i> {event.event_date} {event.start_time}</span>
                      <span><i className="fas fa-clock"></i> {event.duration_hours} ч.</span>
                      {event.location && <span><i className="fas fa-map-marker-alt"></i> {event.location}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Schedule;