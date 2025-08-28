import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './pages/App';
import './index.css';
import { BYOMProvider } from '@byom/sdk';
import { getAccessToken } from './store/auth';
import { api } from './lib/api';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BYOMProvider baseUrl={api.baseUrl} getAccessToken={getAccessToken}>
      <App />
    </BYOMProvider>
  </React.StrictMode>
);
