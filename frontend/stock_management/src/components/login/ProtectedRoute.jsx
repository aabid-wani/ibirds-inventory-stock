import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthProvider';

const ProtectedRoute = ({ element, permissionKey, can = 'view' }) => {
  const { loginData, hasPermission } = useContext(AuthContext);

  if (!loginData) {
    return <Navigate to="/" replace />;
  }

  if (!permissionKey) {
    return element;
  }

  const action = can === 'read' ? 'view' : can === 'delete' ? 'del' : can;

  if (hasPermission(permissionKey, action)) {
    return element;
  }

  return <Navigate to="/home" replace />;
};

export default ProtectedRoute;
