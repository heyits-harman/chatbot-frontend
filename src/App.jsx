import React, { useState, useEffect } from 'react';
import Login from './assets/components/login.jsx';
import Register from './assets/components/register.jsx';
import ChatInterface from './assets/components/chatInterface.jsx';

function App() {
  const [authView, setAuthView] = useState('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = (token) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
  };

  const handleRegisterSuccess = () => {
    setAuthView('login');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  if (isAuthenticated) {
    return <ChatInterface onLogout={handleLogout} />;
  }

  if (authView === 'login') {
    return (
      <Login
        onSwitchToRegister={() => setAuthView('register')}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <Register
      onSwitchToLogin={() => setAuthView('login')}
      onRegisterSuccess={handleRegisterSuccess}
    />
  );
}

export default App;