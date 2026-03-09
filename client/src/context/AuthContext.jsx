
import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // Check expiration
                if (decoded.exp * 1000 < Date.now()) {
                    logout();
                } else {
                    setUser(decoded);
                    // Optionally fetch fresh user data from /api/auth/me
                }
            } catch (e) {
                logout();
            }
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const res = await api.post('/auth/login', { username, password });
            const { token, user } = res.data;
            localStorage.setItem('token', token);
            setUser(user);
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
