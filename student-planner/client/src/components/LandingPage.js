import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <div className="landing-header">
        <div className="container">
          <div className="logo">
            <i className="fas fa-calendar-alt"></i>
            <h1>Student<span>Planner</span></h1>
          </div>
        </div>
      </div>

      <div className="landing-hero">
        <div className="container">
          <div className="hero-content">
            <h2>Расписание для учебы</h2>
            <p>Планируй занятия, отслеживай задачи и дедлайны. Простой способ организовать учебный процесс.</p>
            <div className="hero-buttons">
              <Link to="/register" className="btn btn-primary btn-large">
                <i className="fas fa-user-plus"></i> Зарегистрироваться
              </Link>
              <Link to="/login" className="btn btn-outline btn-large">
                <i className="fas fa-sign-in-alt"></i> Войти
              </Link>
            </div>
          </div>
          <div className="hero-image">
            <div className="calendar-icon">
              <i className="fas fa-calendar-check"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;