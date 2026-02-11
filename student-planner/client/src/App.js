import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Schedule from './components/Schedule';
import Tasks from './components/Tasks';
import Statistics from './components/Statistics';
import LandingPage from './components/LandingPage';
import { authAPI, testConnection } from './services/api';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState('checking');

  useEffect(() => {
    checkServerConnection();
  }, []);

  const checkServerConnection = async () => {
    try {
      await testConnection();
      setServerStatus('connected');
      checkSavedSession();
    } catch (error) {
      console.error('Cannot connect to server:', error);
      setServerStatus('disconnected');
      setLoading(false);
    }
  };

  const checkSavedSession = () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      setIsAuthenticated(true);
      setUser(userData);
    } catch (error) {
      console.error('Invalid saved session:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (response) => {
    const userData = response.data || response;
    
    const userToSave = {
      id: userData.id || userData.ID,
      email: userData.email,
      name: userData.name,
      created_at: userData.created_at
    };
    
    const token = `user-${userToSave.id}-${Date.now()}`;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userToSave));
    setIsAuthenticated(true);
    setUser(userToSave);
  };

  const handleRegister = (response) => {
    handleLogin(response);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  const retryConnection = () => {
    setServerStatus('checking');
    setLoading(true);
    checkServerConnection();
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Проверка соединения с сервером...</p>
      </div>
    );
  }

  if (serverStatus === 'disconnected') {
    return (
      <div className="server-error">
        <h2>⚠️ Не удалось подключиться к серверу</h2>
        <p>Убедитесь, что:</p>
        <ul>
          <li>Сервер запущен на порту 8080</li>
          <li>Выполните команду: <code>cd server && go run .</code></li>
          <li>Сервер должен быть доступен по адресу: <a href="http://localhost:8080/api/test" target="_blank" rel="noopener noreferrer">http://localhost:8080/api/test</a></li>
        </ul>
        <button onClick={retryConnection} className="btn btn-primary">
          <i className="fas fa-sync-alt"></i> Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        {isAuthenticated && <Header user={user} onLogout={handleLogout} />}
        <Routes>
          <Route 
            path="/" 
            element={
              isAuthenticated ? 
              <Navigate to="/dashboard" /> : 
              <LandingPage />
            } 
          />
          
          <Route 
            path="/login" 
            element={
              !isAuthenticated ? 
              <Login onLogin={handleLogin} /> : 
              <Navigate to="/dashboard" />
            } 
          />
          
          <Route 
            path="/register" 
            element={
              !isAuthenticated ? 
              <Register onRegister={handleRegister} /> : 
              <Navigate to="/dashboard" />
            } 
          />
          
          <Route 
            path="/dashboard" 
            element={
              isAuthenticated ? 
              <Dashboard user={user} /> : 
              <Navigate to="/login" />
            } 
          />
          
          <Route 
            path="/schedule" 
            element={
              isAuthenticated ? 
              <Schedule user={user} /> : 
              <Navigate to="/login" />
            } 
          />
          
          <Route 
            path="/tasks" 
            element={
              isAuthenticated ? 
              <Tasks user={user} /> : 
              <Navigate to="/login" />
            } 
          />
          
          <Route 
            path="/stats" 
            element={
              isAuthenticated ? 
              <Statistics user={user} /> : 
              <Navigate to="/login" />
            } 
          />
          
          <Route 
            path="*" 
            element={
              <Navigate to={isAuthenticated ? "/dashboard" : "/"} />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;