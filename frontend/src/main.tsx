import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from '@app/App';
import '@app/styles/globals.css';

const hideLoader = () => {
  const loader = document.getElementById('initial-loader');
  if (loader) {
    loader.classList.add('fade-out');
    setTimeout(() => loader.remove(), 300);
  }
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

hideLoader();
