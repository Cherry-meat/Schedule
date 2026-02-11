import React, { useState, useEffect } from 'react';
import { eventsAPI, scheduleAPI } from '../services/api';

const Dashboard = ({ user }) => {
  const [recentEvents, setRecentEvents] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [eventsResponse, scheduleResponse] = await Promise.all([
        eventsAPI.getEvents(),
        scheduleAPI.getSchedule()
      ]);

      const events = eventsResponse.data || [];
      const recent = events
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 3);
      
      setRecentEvents(recent);
      setTodaySchedule(scheduleResponse.data || []);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setRecentEvents([]);
      setTodaySchedule([]);
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeClass = (type) => {
    switch (type) {
      case 'lecture': return 'lecture';
      case 'practice': return 'practice';
      case 'exam': return 'exam';
      default: return '';
    }
  };

  const getEventTypeLabel = (type) => {
    switch (type) {
      case 'lecture': return 'Лекция';
      case 'practice': return 'Практика';
      case 'exam': return 'Экзамен';
      default: return type;
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (!user) {
    return (
      <div className="main-content">
        <div className="container">
          <div className="error">
            Ошибка: данные пользователя не загружены. Попробуйте перезайти.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="container">
        <section className="welcome-section">
          <h2>Добро пожаловать, {user?.name || 'Студент'}!</h2>
          <p>Ваше расписание на сегодня: {todaySchedule.length} события</p>
        </section>
        
        <section className="recent-events">
          <div className="section-title">
            <h3><i className="fas fa-history"></i> Недавно добавленные события</h3>
          </div>
          
          {recentEvents.length === 0 ? (
            <p>Нет недавних событий</p>
          ) : (
            <div className="events-list">
              {recentEvents.map(event => (
                <div key={event.id} className="event-card">
                  <span className={`event-type ${getEventTypeClass(event.event_type)}`}>
                    {getEventTypeLabel(event.event_type)}
                  </span>
                  <h4 className="event-title">{event.title}</h4>
                  <p>{event.description || 'Без описания'}</p>
                  <div className="event-details">
                    <span><i className="far fa-calendar"></i> {event.event_date}</span>
                    <span><i className="fas fa-map-marker-alt"></i> {event.location || 'Не указано'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        
        <section className="schedule-section">
          <div className="section-title">
            <h3><i className="fas fa-calendar-day"></i> Сегодняшние события</h3>
          </div>
          
          {todaySchedule.length === 0 ? (
            <p>На сегодня событий нет</p>
          ) : (
            <div className="events-list">
              {todaySchedule.map(event => (
                <div key={event.id} className="event-card">
                  <span className={`event-type ${getEventTypeClass(event.event_type)}`}>
                    {getEventTypeLabel(event.event_type)}
                  </span>
                  <h4 className="event-title">{event.title}</h4>
                  <p>{event.subject || 'Без предмета'}</p>
                  <div className="event-details">
                    <span><i className="far fa-clock"></i> {event.start_time}</span>
                    <span><i className="fas fa-map-marker-alt"></i> {event.location || 'Не указано'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;