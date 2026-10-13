import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('ams_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('ams_token') || null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const login = async (email, password) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('ams_token', data.token);
    localStorage.setItem('ams_user', JSON.stringify(data.user));
    return data.user;
  };

  const signup = async (userData) => {
    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('ams_token', data.token);
    localStorage.setItem('ams_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('ams_token');
    localStorage.removeItem('ams_user');
  };

  // Quick switch role utility for effortless demo testing
  const quickLoginAs = async (roleName) => {
    const demoAccounts = {
      'Admin': { email: 'admin@airport.com', password: 'password123' },
      'Airline Staff': { email: 'airline@skywings.com', password: 'password123' },
      'Ground Staff': { email: 'ground@airport.com', password: 'password123' },
      'Passenger': { email: 'john@example.com', password: 'password123' }
    };

    const target = demoAccounts[roleName] || demoAccounts['Passenger'];
    return await login(target.email, target.password);
  };

  // Fetch notifications
  const refreshNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/passenger/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      // Ignore polling errors
    }
  };

  useEffect(() => {
    if (token) {
      refreshNotifications();
      const interval = setInterval(refreshNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      signup,
      logout,
      quickLoginAs,
      notifications,
      unreadCount,
      refreshNotifications
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
