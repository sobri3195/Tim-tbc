import { createContext, useContext, useState, useEffect } from 'react';
import { getUserByCredentials } from '../data/users';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showLogin, setShowLogin] = useState(true);

  useEffect(() => {
    // Check if user was previously logged in (sessionStorage)
    const savedUser = sessionStorage.getItem('tbc_current_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
        setShowLogin(false);
      } catch (e) {
        sessionStorage.removeItem('tbc_current_user');
      }
    }
  }, []);

  const login = (username, password) => {
    const user = getUserByCredentials(username, password);
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      setShowLogin(false);
      sessionStorage.setItem('tbc_current_user', JSON.stringify(user));
      return { success: true, user };
    }
    return { success: false, message: 'Username atau password salah' };
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setLoginForm({ username: '', password: '' });
    setShowLogin(true);
    sessionStorage.removeItem('tbc_current_user');
  };

  const switchUser = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setShowLogin(false);
    sessionStorage.setItem('tbc_current_user', JSON.stringify(user));
  };

  const value = {
    currentUser,
    isAuthenticated,
    login,
    logout,
    switchUser,
    loginForm,
    setLoginForm,
    showLogin,
    setShowLogin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};