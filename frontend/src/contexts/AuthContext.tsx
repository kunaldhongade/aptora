import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { apiClient, LoginRequest, RegisterRequest, UserResponse } from '../lib/api';

interface AuthContextType {
    user: UserResponse | null;
    isAuthenticated: boolean;
    login: (data: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            if (token) {
                const userData = await apiClient.getProfile();
                setUser(userData.data!);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            apiClient.clearToken();
        } finally {
            setLoading(false);
        }
    };

    const login = async (data: LoginRequest) => {
        const response = await apiClient.login(data);
        apiClient.setToken(response.data.token);
        setUser(response.data.user);
    };

    const register = async (data: RegisterRequest) => {
        const response = await apiClient.register(data);
        apiClient.setToken(response.data.token);
        setUser(response.data.user);
    };

    const logout = () => {
        apiClient.clearToken();
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                login,
                register,
                logout,
                loading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
