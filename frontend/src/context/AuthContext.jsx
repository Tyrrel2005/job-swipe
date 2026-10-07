import { useEffect, useState } from 'react'

import AuthContext from './auth-context'
import api from '../services/api'
import { clearToken, getToken, setToken } from '../services/authStorage'

function getApiErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(() => Boolean(getToken()))

  useEffect(() => {
    const token = getToken()

    if (!token) {
      return
    }

    api.get('/api/auth/me')
      .then((response) => setUser(response.data.user))
      .catch(() => {
        clearToken()
        setUser(null)
      })
      .finally(() => setIsLoading(false))
  }, [])

  async function login(credentials) {
    try {
      const response = await api.post('/api/auth/login', credentials)
      setToken(response.data.token)
      setUser(response.data.user)
      return response.data.user
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Connexion impossible.'))
    }
  }

  async function signup(account) {
    try {
      const response = await api.post('/api/auth/signup', account)
      setToken(response.data.token)
      setUser(response.data.user)
      return response.data.user
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Inscription impossible.'))
    }
  }

  async function refreshUser() {
    const response = await api.get('/api/auth/me')
    setUser(response.data.user)
    return response.data.user
  }

  function logout() {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}