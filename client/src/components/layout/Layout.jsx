
import React from 'react';
import Navbar from './Navbar';
import MobileNavbar from './MobileNavbar';
import { useAuth } from '../../context/AuthContext';

const Layout = ({ children }) => {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20 md:pb-0">
            {user && <Navbar />}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {children}
            </main>
            {user && <MobileNavbar />}
        </div>
    );
};

export default Layout;
