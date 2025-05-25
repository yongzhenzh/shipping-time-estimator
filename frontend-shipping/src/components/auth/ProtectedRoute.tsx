import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({ children, requireAdmin }) => {
  // Get the authentication status from local storage or a state management solution
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  let user = null;
  try {
    user = userStr ? JSON.parse(userStr) : null;
  } catch (err) {
    console.error("Failed to parse user object:", err);
    return <Navigate to="/login" replace />;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
