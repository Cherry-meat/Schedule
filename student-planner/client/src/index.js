import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import App from './App';

if (!window.Promise) {
  console.error('Promise не поддерживается в этом браузере');
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Не найден элемент с id="root"');
  document.body.innerHTML = `
    <div style="padding: 20px; color: red; font-family: sans-serif;">
      <h1>Ошибка загрузки приложения</h1>
      <p>Не найден корневой элемент с id="root"</p>
      <p>Проверьте файл public/index.html</p>
    </div>
  `;
} else {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

console.log('React приложение загружено');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('API URL:', process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8080/api');