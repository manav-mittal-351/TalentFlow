// ─── main.jsx ────────────────────────────────────────────────────────────────
// Entry point for the React application. Mounts QueryClient and global Providers.

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient.js';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { NotificationProvider } from './contexts/NotificationContext.jsx';
import App from './App.jsx';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
