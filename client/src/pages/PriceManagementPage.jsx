
import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { TRIGGER_EVENTS, MAP_SCROLL_MAPPING, ADVANCED_INNER_CORES } from '../constants/gameData';
import { Save, Search, RefreshCw, AlertCircle, Database } from 'lucide-react';

const PriceManagementPage = () => {
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState({}); // item_name -> loading
    const [message, setMessage] = useState({ type: '', text: '' });
    const [searchTerm, setSearchTerm] = useState('');

    const fetchPrices = async () => {
        setLoading(true);
        try {
            const res = await api.get('/prices');
            setPrices(res.data);
        } catch (err) {
            setMessage({ type: 'error', text: '获取价格失败' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrices();
    }, []);

    const handleSave = async (itemType, itemName, price) => {
        setSaving(prev => ({ ...prev, [itemName]: true }));
        try {
            await api.post('/prices', { item_type: itemType, item_name: itemName, price: parseFloat(price) || 0 });
            // Refresh local state if success? Or just show message
            setMessage({ type: 'success', text: `更新 ${itemName} 价格成功` });
        } catch (err) {
            setMessage({ type: 'error', text: '保存价格失败' });
        } finally {
            setSaving(prev => ({ ...prev, [itemName]: false }));
        }
    };

    // Combine all scrolls from all maps
    const allScrolls = [...new Set(Object.values(MAP_SCROLL_MAPPING).flat())].sort();

    const filteredScrolls = allScrolls.filter(s => s.includes(searchTerm));
    const filteredInnerCores = ADVANCED_INNER_CORES.filter(c => c.includes(searchTerm));

    const getPrice = (name) => {
        const item = prices.find(p => p.item_name === name);
        return item ? item.price : '';
    };

    const handlePriceChange = (name, val) => {
        // Find existing or create dummy to track in state if needed for interactive update
        // But for this UI, let's just use local input state if we were doing bulk save. 
        // For simplicity, let's use individual save buttons as planned.
        setPrices(prev => {
            const idx = prev.findIndex(p => p.item_name === name);
            if (idx > -1) {
                const updated = [...prev];
                updated[idx] = { ...updated[idx], price: val };
                return updated;
            } else {
                return [...prev, { item_name: name, price: val }];
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">物品价格管理</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="搜索物品..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm"
                    />
                </div>
            </div>

            {message.text && (
                <div className={`p-4 rounded-md flex items-center justify-between ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    <div className="flex items-center">
                        {message.type === 'error' ? <AlertCircle className="w-5 h-5 mr-2" /> : <Database className="w-5 h-5 mr-2" />}
                        {message.text}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Advanced Scrolls */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
                        <h2 className="text-lg font-semibold text-blue-800">高级魔兽要诀</h2>
                    </div>
                    <div className="max-h-[600px] overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">预设价格 (万)</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredScrolls.map(scroll => (
                                    <tr key={scroll}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{scroll}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <input
                                                type="number"
                                                value={getPrice(scroll)}
                                                onChange={(e) => handlePriceChange(scroll, e.target.value)}
                                                className="w-24 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-1 border"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <button
                                                onClick={() => handleSave('高级魔兽要诀', scroll, getPrice(scroll))}
                                                disabled={saving[scroll]}
                                                className="text-blue-600 hover:text-blue-900 font-medium disabled:opacity-50"
                                            >
                                                {saving[scroll] ? <RefreshCw className="w-4 h-4 animate-spin" /> : '保存'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Advanced Inner Cores */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-orange-50">
                        <h2 className="text-lg font-semibold text-orange-800">高级召唤兽内丹</h2>
                    </div>
                    <div className="max-h-[600px] overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">预设价格 (万)</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredInnerCores.map(core => (
                                    <tr key={core}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{core}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <input
                                                type="number"
                                                value={getPrice(core)}
                                                onChange={(e) => handlePriceChange(core, e.target.value)}
                                                className="w-24 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-1 border"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <button
                                                onClick={() => handleSave('高级召唤兽内丹', core, getPrice(core))}
                                                disabled={saving[core]}
                                                className="text-orange-600 hover:text-orange-900 font-medium disabled:opacity-50"
                                            >
                                                {saving[core] ? <RefreshCw className="w-4 h-4 animate-spin" /> : '保存'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PriceManagementPage;
