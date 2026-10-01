import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { get, post, onAuthError } from './api';

const AuthContext = createContext(null);

export const HOME_BY_ROLE = {
  APPLICANT: '/applicant',
  REGISTRAR: '/registrar',
  HOD: '/shared',
  DEAN: '/shared',
  ADMIN: '/admin',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    try {
      const r = await get('/auth/me');
      setUser(r.user);
      return r.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(
    () =>
      onAuthError((err) => {
        if (err.status === 401) {
          setUser(null);
          navigate('/login', { replace: true, state: { expired: true } });
        } else navigate('/change-password', { replace: true });
      }),
    [navigate],
  );

  const login = async (email, password) => {
    const r = await post('/auth/login', { email, password });
    setUser(r.user);
    return r.user;
  };

  const register = async (data) => {
    const r = await post('/auth/register', data);
    setUser(r.user);
    return r.user;
  };

  const logout = async () => {
    try {
      await post('/auth/logout');
    } finally {
      setUser(null);
      navigate('/login', { replace: true });
    }
  };

  return <AuthContext.Provider value={{ user, setUser, login, logout, register, refresh }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
