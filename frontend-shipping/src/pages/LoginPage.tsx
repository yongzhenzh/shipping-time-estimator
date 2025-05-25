import React, { useState } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';

// import { authService } from '../services/api';

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (values: { username: string; password: string }) => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) throw new Error('Login failed');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      message.success('Login successful!');
      navigate('/home');
    } catch (error) {
      message.error('Login error.');
    } finally {
      setLoading(false);
    }
  };

  return <LoginForm onLogin={handleLogin} loading={loading} />;
};

export default LoginPage;
