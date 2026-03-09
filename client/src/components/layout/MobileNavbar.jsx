
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PlusCircle, History, Database } from 'lucide-react';

const MobileNavbar = () => {
    const location = useLocation();

    // Only show on mobile

    const isActive = (path) => location.pathname === path ? 'text-blue-600' : 'text-gray-400';

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-3 pb-5 px-6 flex justify-between items-center z-50">
            <Link to="/mobile/entry" className={`flex flex-col items-center gap-1 ${isActive('/mobile/entry')}`}>
                <PlusCircle className="w-6 h-6" />
                <span className="text-xs font-medium">录入</span>
            </Link>
            <Link to="/mobile/history" className={`flex flex-col items-center gap-1 ${isActive('/mobile/history')}`}>
                <History className="w-6 h-6" />
                <span className="text-xs font-medium">历史</span>
            </Link>
            <Link to="/mobile/predict" className={`flex flex-col items-center gap-1 ${isActive('/mobile/predict')}`}>
                <Database className="w-6 h-6" />
                <span className="text-xs font-medium">预测</span>
            </Link>
        </nav>
    );
};

export default MobileNavbar;
