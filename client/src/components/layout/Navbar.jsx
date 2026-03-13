
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Map, PlusCircle, Database, User, Settings } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <nav className="hidden md:flex bg-white shadow-sm border-b border-gray-200 px-6 py-4 justify-between items-center">
            <div className="flex items-center space-x-2">
                <div className="bg-blue-600 p-2 rounded-lg">
                    <Map className="text-white w-6 h-6" />
                </div>
                <span className="text-xl font-bold text-gray-800">梦幻挖图分析系统</span>
            </div>

            <div className="flex items-center space-x-6">
                <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium flex items-center gap-2">
                    <PlusCircle className="w-5 h-5" /> 录入
                </Link>
                <Link to="/predict" className="text-gray-600 hover:text-blue-600 font-medium flex items-center gap-2">
                    <Database className="w-5 h-5" /> 预测
                </Link>
                <Link to="/history" className="text-gray-600 hover:text-blue-600 font-medium flex items-center gap-2">
                    <Database className="w-5 h-5" /> 历史记录
                </Link>
                {user.role === 'admin' && (
                    <>
                        <Link to="/admin/prices" className="text-gray-600 hover:text-blue-600 font-medium flex items-center gap-2">
                            <PlusCircle className="w-5 h-5" /> 价格管理
                        </Link>
                        <Link to="/admin/maps" className="text-gray-600 hover:text-blue-600 font-medium flex items-center gap-2">
                            <Settings className="w-5 h-5" /> 地图设置
                        </Link>
                        <Link to="/admin/users" className="text-gray-600 hover:text-blue-600 font-medium flex items-center gap-2">
                            <User className="w-5 h-5" /> 用户管理
                        </Link>
                    </>
                )}
                <div className="flex items-center gap-4 ml-6 border-l pl-6">
                    <span className="text-gray-500 text-sm">你好, {user.username}</span>
                    <button onClick={handleLogout} className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm font-medium">
                        <LogOut className="w-4 h-4" /> 退出
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
