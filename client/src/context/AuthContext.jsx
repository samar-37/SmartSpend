import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { initializeCsrf } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  async function loadSession() {
    try {
      await initializeCsrf();
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        try {
          const { data } = await api.post('/auth/refresh');
          setUser(data.user);
        } catch {
          setUser(null);
        }
      } else setError('Unable to verify your session.');
    } finally {
      setStatus('ready');
    }
  }

  useEffect(() => { loadSession(); }, []);

  async function authenticate(endpoint, payload) {
    setError('');
    const { data } = await api.post(endpoint, payload);
    setUser(data.user);
  }

  async function register(payload) { await authenticate('/auth/register', payload); }
  async function login(payload) { await authenticate('/auth/login', payload); }
  async function logout() {
    await api.post('/auth/logout');
    setUser(null);
  }

  const value = useMemo(() => ({ user, status, error, setError, setUser, register, login, logout }), [user, status, error]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
