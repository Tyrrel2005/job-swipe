import { createContext, useContext, useEffect, useState } from 'react';
import { api, saveToken, token } from '../lib/api';
const Context = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    async function restore() {
      if (!token()) { setLoading(false); return; }
      try { const result = await api.get('/auth/me'); if (active) setUser(result.user); }
      catch { saveToken(null); if (active) setUser(null); }
      finally { if (active) setLoading(false); }
    }
    restore();
    const expired = () => { saveToken(null); setUser(null); setLoading(false); };
    window.addEventListener('jobswipe:expired', expired);
    return () => { active = false; window.removeEventListener('jobswipe:expired', expired); };
  }, []);
  async function login(credentials) { const result = await api.post('/auth/login', credentials); saveToken(result.token); setUser(result.user); return result.user; }
  async function signup(credentials) { const result = await api.post('/auth/signup', credentials); saveToken(result.token); setUser(result.user); return result.user; }
  async function refresh() { const result = await api.get('/auth/me'); setUser(result.user); return result.user; }
  async function updateProfile(values) { await api.patch('/profile', values); return refresh(); }
  function logout() { saveToken(null); setUser(null); }
  return <Context.Provider value={{ user, loading, login, signup, refresh, updateProfile, logout }}>{children}</Context.Provider>;
}
export function useAuth() { const value = useContext(Context); if (!value) throw new Error('AuthProvider manquant'); return value; }
