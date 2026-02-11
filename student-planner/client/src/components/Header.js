import React from 'react';
import { NavLink } from 'react-router-dom';

const Header = ({ user, onLogout }) => {
  return (
    <header className="header">
      <div className="container header-container">
        <NavLink to="/" className="logo">
          <i className="fas fa-calendar-alt"></i>
          <h1>Student<span>Planner</span></h1>
        </NavLink>
        
        <nav>
          <ul>
            <li>
              <NavLink to="/" className={({ isActive }) => isActive ? "active" : ""}>
                Главная
              </NavLink>
            </li>
            <li>
              <NavLink to="/schedule" className={({ isActive }) => isActive ? "active" : ""}>
                Расписание
              </NavLink>
            </li>
            <li>
              <NavLink to="/tasks" className={({ isActive }) => isActive ? "active" : ""}>
                Задачи
              </NavLink>
            </li>
            <li>
              <NavLink to="/stats" className={({ isActive }) => isActive ? "active" : ""}>
                Статистика
              </NavLink>
            </li>
          </ul>
        </nav>
        
        <div className="user-info">
          <span>Привет, {user?.name || 'Студент'}!</span>
          <button onClick={onLogout} className="btn btn-outline">
            <i className="fas fa-sign-out-alt"></i> Выйти
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;