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

  const login = (token) => {
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
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    sessionStorage.clear();
    setLoginData(null);
    setLoginStatus(false);
    setToken(null);
    setPermissions([]);
    setNotifications([]);
    setNotifiedProductIds([]);
    notifiedRef.current = [];
  };

  const addNotification = (message, product) => {
    setNotifications((prev) => [
      ...prev,
      { message, product, id: Date.now() },
    ]);
  };

  const clearNotifications = () => setNotifications([]);

  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        const response = await  StockManagementApis.getLowStockProducts();
        if (!response.ok) throw new Error('Failed to fetch products');

        const data = await response.json();
        
        
        
        const lowStockProducts = data.filter(
          (item) => item.available_quantity < item.min_quantity
        );

        lowStockProducts.forEach((product) => {
          if (!notifiedRef.current.includes(product.id)) {
            const message = `Stock of ${product.name} is below minimum threshold!`;
            addNotification(message, product);

            const audio = new Audio(mp3Music);
            audio.play().catch((err) => {
            });

            setNotifiedProductIds((prev) => [...prev, product.id]);
            notifiedRef.current.push(product.id);
          }
        });
      } catch (err) {
        throw err
      }
    };

    fetchLowStock();
    const interval = setInterval(fetchLowStock, 3600000);

    return () => clearInterval(interval);
  }, []);

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
    notifications,
    addNotification,
    clearNotifications,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      <audio id="notification-sound" src={mp3Music} preload="auto" />
      {children}
    </AuthContext.Provider>
  );
};
