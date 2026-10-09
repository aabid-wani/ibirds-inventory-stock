import { useState, createContext, useEffect, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import mp3Music from '../sounds/alert.mp3';
import StockManagementApis from '../apis/StockManagementApis';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
 
  const [notifications, setNotifications] = useState([]);
  const [loginData, setLoginData] = useState(() => {
    const saved = sessionStorage.getItem('loginData');
    return saved ? JSON.parse(saved) : null;
  });

  const [loginStatus, setLoginStatus] = useState(() => {
    return sessionStorage.getItem('loginStatus') === 'true';
  });

  const [sidebarVisibility, setSidebarVisibility] = useState(true);

  const [token, setToken] = useState(() => sessionStorage.getItem('token') || null);

  const [permissions, setPermissions] = useState(() => {
    const savedToken = sessionStorage.getItem('token');
    try {
      return savedToken ? jwtDecode(savedToken).permission || [] : [];
    } catch {
      return [];
    }
  });

  const [, setNotifiedProductIds] = useState([]);
  const notifiedRef = useRef([]);

  const [sessionId, setSessionId] = useState(() => sessionStorage.getItem('sessionId') || null);

  const login = async (token) => {
    try {
      const data = jwtDecode(token);

      sessionStorage.setItem('token', token);
      sessionStorage.setItem('loginData', JSON.stringify(data.user));
      sessionStorage.setItem('permissions', JSON.stringify(data.permission));
      sessionStorage.setItem('loginStatus', 'true'); 

      setToken(token);
      setLoginData(data.user);
      setPermissions(data.permission);
      setLoginStatus(true);

      // Start user session
      try {
        const sessRes = await StockManagementApis.startSession();
        if (sessRes?.session?.id) {
          sessionStorage.setItem('sessionId', sessRes.session.id);
          setSessionId(sessRes.session.id);
        }
      } catch (e) {
        console.warn('Session initiation error:', e);
      }
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    const activeSession = sessionId || sessionStorage.getItem('sessionId');
    if (activeSession) {
      StockManagementApis.endSession(activeSession).catch(() => {});
    }
    sessionStorage.clear();
    setLoginData(null);
    setLoginStatus(false);
    setToken(null);
    setSessionId(null);
    setPermissions([]);
    setNotifications([]);
    setNotifiedProductIds([]);
    notifiedRef.current = [];
  };

  // Heartbeat to keep session duration accurate
  useEffect(() => {
    if (!loginStatus) return;

    const checkOrStartSession = async () => {
      let currentSess = sessionId || sessionStorage.getItem('sessionId');
      if (!currentSess && token) {
        const res = await StockManagementApis.startSession();
        if (res?.session?.id) {
          currentSess = res.session.id;
          sessionStorage.setItem('sessionId', currentSess);
          setSessionId(currentSess);
        }
      }
    };
    checkOrStartSession();

    const heartbeatInterval = setInterval(() => {
      const currentSess = sessionId || sessionStorage.getItem('sessionId');
      if (currentSess) {
        StockManagementApis.heartbeatSession(currentSess).catch(() => {});
      }
    }, 45000);

    const handleBeforeUnload = () => {
      const currentSess = sessionId || sessionStorage.getItem('sessionId');
      if (currentSess) {
        StockManagementApis.endSession(currentSess).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(heartbeatInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [loginStatus, sessionId, token]);

  const logUserActivity = async (actionType, actionCategory, module, description, metadata = null) => {
    try {
      const currentSess = sessionId || sessionStorage.getItem('sessionId');
      await StockManagementApis.logActivity({
        session_id: currentSess,
        action_type: actionType,
        action_category: actionCategory,
        module: module,
        description: description,
        metadata: metadata
      });
    } catch (err) {
      console.warn('Failed to log user action:', err);
    }
  };

  const addNotification = (message, product) => {
    setNotifications((prev) => [
      ...prev,
      { message, product, id: `${product?.id || 'item'}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}` },
    ]);
  };

  const clearNotifications = () => setNotifications([]);

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        const data = await StockManagementApis.getLowStockProducts();
        if (!Array.isArray(data)) return;

        const lowStockProducts = data.filter(
          (item) => Number(item.available_quantity) <= Number(item.min_quantity)
        );

        lowStockProducts.forEach((product) => {
          const productId = product.id || product.name;
          if (productId && !notifiedRef.current.includes(productId)) {
            const message = `Stock of ${product.name} is below minimum threshold!`;
            addNotification(message, product);

            const audio = new Audio(mp3Music);
            audio.play().catch(() => {});

            setNotifiedProductIds((prev) => [...prev, productId]);
            notifiedRef.current.push(productId);
          }
        });
      } catch (err) {
        console.warn("Background low stock check:", err?.message || err);
      }
    };

    fetchLowStock();
    const interval = setInterval(fetchLowStock, 3600000);

    return () => clearInterval(interval);
  }, []);

  const hasPermission = (moduleName, action = 'view') => {
    if (!loginData) return false;
    if (loginData.role_name === 'Super Admin') return true;

    const aliasMap = {
      product: 'products',
      products: 'products',
      productcategory: 'productCategory',
      productCategory: 'productCategory',
      category: 'productCategory',
      categories: 'productCategory',
      order: 'orders',
      orders: 'orders',
      vendor: 'vendors',
      vendors: 'vendors',
      issue: 'provisions',
      issues: 'provisions',
      provision: 'provisions',
      provisions: 'provisions',
      employee: 'employees',
      employees: 'employees',
      branch: 'branches',
      branches: 'branches',
      user: 'users',
      users: 'users',
      permission: 'permissions',
      permissions: 'permissions',
      role: 'permissions',
      roles: 'permissions',
      report: 'reports',
      reports: 'reports',
      monthly_report: 'monthly reports',
      'monthly reports': 'monthly reports',
      yearly_report: 'reports',
      inventory_report: 'reports',
      low_stock: 'reports',
      assets_report: 'reports',
      assets: 'products',
      assets_type: 'products',
      location: 'branches',
      modules: 'permissions',
    };

    const target = aliasMap[(moduleName || '').toLowerCase()] || (moduleName || '').toLowerCase();

    // Special rule: Permissions module is exclusively accessible to System Admin (and Super Admin)
    if (target === 'permissions') {
      const isSystemAdmin = loginData.role_name === 'System Admin' || loginData.role_name === 'Super Admin';
      return isSystemAdmin;
    }

    // Special rule: System Users module is exclusively accessible to Super Admin
    if (target === 'users') {
      return loginData.role_name === 'Super Admin';
    }

    const perm = permissions?.find(
      (p) => p.module_name && (p.module_name.toLowerCase() === target.toLowerCase() || p.module_name === target)
    );

    if (perm) {
      if (action === 'view' || action === 'read') return !!perm.view;
      if (action === 'add' || action === 'create') return !!perm.add;
      if (action === 'edit' || action === 'update') return !!perm.edit;
      if (action === 'del' || action === 'delete') return !!perm.del;
      return false;
    }

    if (loginData.role_name === 'Admin' && target !== 'permissions') {
      return true;
    }

    return false;
  };

  const contextValue = {
    loginData,
    setLoginData,
    sidebarVisibility,
    setSidebarVisibility,
    login,
    logout,
    loginStatus,
    token,
    setToken,
    setLoginStatus,
    permissions,
    setPermissions,
    hasPermission,
    notifications,
    addNotification,
    clearNotifications,
    removeNotification,
    sessionId,
    logUserActivity,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      <audio id="notification-sound" src={mp3Music} preload="auto" />
      {children}
    </AuthContext.Provider>
  );
};
