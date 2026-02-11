import React, { useState, useEffect } from 'react';
import { statsAPI, eventsAPI, tasksAPI } from '../services/api';

const Statistics = ({ user }) => {
  const [stats, setStats] = useState({
    total_events: 0,
    total_tasks: 0,
    completed_tasks: 0,
    study_hours: 0,
  });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsResponse, tasksResponse] = await Promise.all([
        eventsAPI.getEvents(),
        tasksAPI.getTasks()
      ]);
      
      const eventsData = eventsResponse.data;
      const tasksData = tasksResponse.data;
      
      const totalEvents = eventsData.length;
      const totalTasks = tasksData.length;
      const completedTasks = tasksData.filter(task => task.is_completed).length;
      const studyHours = eventsData.reduce((total, event) => total + (event.duration_hours || 0), 0);
      
      const eventTypes = {};
      eventsData.forEach(event => {
        eventTypes[event.event_type] = (eventTypes[event.event_type] || 0) + 1;
      });
      
      setEvents(eventsData);
      setStats({
        total_events: totalEvents,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        study_hours: studyHours,
        event_types: eventTypes
      });
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletionRate = () => {
    if (stats.total_tasks === 0) return 0;
    return Math.round((stats.completed_tasks / stats.total_tasks) * 100);
  };

  const getEventTypeStats = () => {
    if (!stats.event_types || Object.keys(stats.event_types).length === 0) {
      return [
        { type: 'lecture', count: 0, percentage: 0 },
        { type: 'practice', count: 0, percentage: 0 },
        { type: 'exam', count: 0, percentage: 0 },
        { type: 'meeting', count: 0, percentage: 0 }
      ];
    }
    
    const total = stats.total_events;
    return Object.entries(stats.event_types).map(([type, count]) => ({
      type,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));
  };

  if (loading) {
    return <div className="loading">Загрузка статистики...</div>;
  }

  const eventTypeStats = getEventTypeStats();

  return (
    <div className="main-content">
      <div className="container">
        <section className="stats-section">
          <div className="section-title">
            <h3><i className="fas fa-chart-bar"></i> Статистика обучения</h3>
          </div>
          
          <div className="stats-grid">
            <div className="stat-card">
              <i className="fas fa-calendar-check fa-2x"></i>
              <div className="stat-value">{stats.total_events}</div>
              <div className="stat-label">Всего занятий</div>
            </div>
            
            <div className="stat-card">
              <i className="fas fa-tasks fa-2x"></i>
              <div className="stat-value">
                {stats.completed_tasks}/{stats.total_tasks}
              </div>
              <div className="stat-label">Выполнено задач</div>
            </div>
            
            <div className="stat-card">
              <i className="fas fa-clock fa-2x"></i>
              <div className="stat-value">{Math.round(stats.study_hours)}ч</div>
              <div className="stat-label">Часов обучения</div>
            </div>
            
            <div className="stat-card">
              <i className="fas fa-percentage fa-2x"></i>
              <div className="stat-value">{calculateCompletionRate()}%</div>
              <div className="stat-label">Выполнение задач</div>
            </div>
          </div>
        </section>
        
        <section className="tasks-section">
          <div className="section-title">
            <h3><i className="fas fa-chart-pie"></i> Распределение по типам событий</h3>
          </div>
          
          {stats.total_events === 0 ? (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              backgroundColor: '#f9f9ff',
              borderRadius: '8px'
            }}>
              <i className="fas fa-chart-pie" style={{ fontSize: '3rem', color: '#ccc', marginBottom: '20px' }}></i>
              <p style={{ fontSize: '1.1rem', color: '#666' }}>Нет данных для отображения статистики</p>
              <p style={{ color: '#888' }}>Добавьте события, чтобы увидеть статистику</p>
            </div>
          ) : (
            <div className="stats-grid">
              {eventTypeStats.map((stat, index) => {
                const colors = ['#1565c0', '#2e7d32', '#c62828', '#6a1b9a'];
                const labels = {
                  'lecture': 'Лекции',
                  'practice': 'Практика', 
                  'exam': 'Экзамены',
                  'meeting': 'Встречи',
                  'other': 'Другое'
                };
                
                return (
                  <div 
                    key={stat.type} 
                    className="stat-card" 
                    style={{ borderTopColor: colors[index % colors.length] }}
                  >
                    <div className="stat-value" style={{ color: colors[index % colors.length] }}>
                      {stat.percentage}%
                    </div>
                    <div className="stat-label">
                      {labels[stat.type] || stat.type}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '5px' }}>
                      {stat.count} событий
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {stats.total_events > 0 && (
            <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f9f9ff', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '15px' }}>Детализация событий:</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {eventTypeStats.map(stat => (
                  <li key={stat.type} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: '1px solid #eee'
                  }}>
                    <span>{stat.type === 'lecture' ? 'Лекции' : 
                          stat.type === 'practice' ? 'Практика' : 
                          stat.type === 'exam' ? 'Экзамены' : 
                          stat.type === 'meeting' ? 'Встречи' : 'Другое'}</span>
                    <span><strong>{stat.count}</strong> ({stat.percentage}%)</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Statistics;