import React, { useState, useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';

function MainLayout() {
    const { token } = useContext(AuthContext);
    const [view, setView] = useState('login'); // Toggle states: 'login' or 'register'

    if (token) {
        return <Dashboard />;
    }

    return view === 'login' ? (
        <Login onSwitchView={() => setView('register')} />
    ) : (
        <Register onSwitchView={() => setView('login')} />
    );
}

export default function App() {
    return (
        <AuthProvider>
            <MainLayout />
        </AuthProvider>
    );
}