import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthProvider';

const ProtectedRoute = ({ element, permissionKey, can }) => {
  const { permissions, loginData } = useContext(AuthContext);

  const hasEditPermission = permissions?.some(
    result => result.module_name === permissionKey && result.edit
  );
  const hasDeletePermission = permissions?.some(
    result => result.module_name === permissionKey && result.del
  );
  const hasReadPermission = permissions?.some(
    result => result.module_name === permissionKey && result.view
  );
  const hasAddPermission = permissions?.some(
    result => result.module_name === permissionKey && result.add
  );

  if (loginData.role_name === 'Admin' || loginData.role_name === 'Super Admin') {
    return element;
  }

  if (permissions && hasReadPermission && can === "read") return element;
  if (permissions && hasAddPermission && can === "add") return element;
  if (permissions && hasEditPermission && can === "edit") return element;
  if (permissions && hasDeletePermission && can === "delete") return element;

  return <Navigate to="/404" />;
};

export default ProtectedRoute;
