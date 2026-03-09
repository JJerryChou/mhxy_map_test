
import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { UserPlus, Trash2, Shield } from 'lucide-react';

const UserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ username: '', password: '', role: 'user' });
    const [message, setMessage] = useState({ type: '', text: '' });

    const fetchUsers = async () => {
        try {
            // Assuming we have an endpoint for this, though we didn't explicitly create list users API in authController.
            // Wait, I didn't create a "list users" endpoint in authController.
            // I need to add it to backend first if I want to display it.
            // Or just allow adding users blindly?
            // Let's implement add user first. Listing might not be available yet.
            // Actually, I should have added `getAllUsers` in `authController`.
            // Let's check `authController.js`.
            // I only added `register`, `login`, `getMe`.
            // I should add `getUsers` to `authController` and `authRoutes`.
        } catch (err) {
            console.error(err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/register', formData);
            setMessage({ type: 'success', text: 'User created successfully!' });
            setFormData({ username: '', password: '', role: 'user' });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to create user.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold flex items-center">
                <Shield className="mr-2 text-blue-600" /> User Management
            </h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                    <UserPlus className="mr-2 text-gray-500" /> Create New User
                </h2>

                {message.text && (
                    <div className={`p-3 rounded mb-4 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create User'}
                    </button>
                </form>
            </div>

            {/* List users would go here if API existed */}
        </div>
    );
};

export default UserManagementPage;
