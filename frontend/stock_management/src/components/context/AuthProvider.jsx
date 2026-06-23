import { useState, createContext, useEffect, useRef } from 'react';
import { jwtDecode } from 'jwt-decode';
import mp3Music from '../sounds/alert.mp3';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // 🧠 Initial states
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

  const [notifiedProductIds, setNotifiedProductIds] = useState([]);
  const notifiedRef = useRef([]);

  // 🔐 LOGIN FUNCTION
  const login = (token) => {
    try {
      const data = jwtDecode(token);

      // 🗄️ Save all session data properly
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('loginData', JSON.stringify(data.user));
      sessionStorage.setItem('permissions', JSON.stringify(data.permission));
      sessionStorage.setItem('loginStatus', 'true'); // ✅ FIXED

      // 🧠 Update states
      setToken(token);
      setLoginData(data.user);
      setPermissions(data.permission);
      setLoginStatus(true);
    } catch (err) {
      console.error('Invalid token:', err);
    }
  };

  // 🚪 LOGOUT FUNCTION
  const logout = () => {
    // Token must live in sessionStorage (expires when tab is closed)
    sessionStorage.clear();
    setLoginData(null);
    setLoginStatus(false);
    setToken(null);
    setPermissions([]);
    setNotifications([]);
    setNotifiedProductIds([]);
    notifiedRef.current = [];
  };

  // 🔔 ADD NOTIFICATION
  const addNotification = (message, product) => {
    setNotifications((prev) => [
      ...prev,
      { message, product, id: Date.now() },
    ]);
  };

  // ❌ CLEAR ALL NOTIFICATIONS
  const clearNotifications = () => setNotifications([]);

  // 📦 FETCH LOW STOCK PRODUCTS — every 1 hour
  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        const response = await fetch('http://localhost:3001/product/lowStock');
        if (!response.ok) throw new Error('Failed to fetch products');

        const data = await response.json();
        
        console.log('Low stock products fetched:', data);
        
        
        const lowStockProducts = data.filter(
          (item) => item.available_quantity < item.min_quantity
        );

        lowStockProducts.forEach((product) => {
          if (!notifiedRef.current.includes(product.id)) {
            const message = `Stock of ${product.name} is below minimum threshold!`;
            addNotification(message, product);

            // 🔊 Play alert sound
            const audio = new Audio(mp3Music);
            audio.play().catch((err) => {
              console.warn('Audio autoplay blocked:', err);
            });

            setNotifiedProductIds((prev) => [...prev, product.id]);
            notifiedRef.current.push(product.id);
          }
        });
      } catch (err) {
        console.error('Error fetching low stock products:', err);
      }
    };

    // Run immediately once, then every hour
    fetchLowStock();
    const interval = setInterval(fetchLowStock, 3600000);

    return () => clearInterval(interval);
  }, []);

  // 🧩 CONTEXT VALUE
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
      {/* Preload sound to prevent first-play delay */}
      <audio id="notification-sound" src={mp3Music} preload="auto" />
      {children}
    </AuthContext.Provider>
  );
};
