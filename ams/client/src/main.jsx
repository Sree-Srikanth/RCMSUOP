import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './lib/auth';
import { MasterProvider } from './lib/master';
import { ToastProvider } from './components/ui';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <MasterProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MasterProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
