
import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { TRIGGER_EVENTS, MAPS, MAP_SCROLL_MAPPING, ADVANCED_INNER_CORES } from '../../constants/gameData';
import { Save, AlertCircle } from 'lucide-react';

const MobileEntryPage = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [formData, setFormData] = useState({
        dig_time: new Date().toISOString().slice(0, 10),
        map_name: '',
        coord_x: '',
        coord_y: '',
        trigger_event: '',
        item_name: '',
        output_price: ''
    });

    useEffect(() => {
        if (formData.trigger_event === '幼儿园') {
            setFormData(prev => ({ ...prev, item_name: '幼儿园' }));
        }
    }, [formData.trigger_event]);

    // Auto-fill price from database
    useEffect(() => {
        const fetchPrice = async () => {
            if (formData.item_name && (formData.trigger_event === '高级魔兽要诀' || formData.trigger_event === '高级召唤兽内丹')) {
                try {
                    const res = await api.get('/prices');
                    const item = res.data.find(p => p.item_name === formData.item_name);
                    if (item) {
                        setFormData(prev => ({ ...prev, output_price: item.price }));
                    }
                } catch (err) {
                    console.error('Failed to fetch price', err);
                }
            }
        };
        fetchPrice();
    }, [formData.item_name, formData.trigger_event]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            await api.post('/records', formData);
            setMessage({ type: 'success', text: '已保存!' });
            setFormData(prev => ({ ...prev, item_name: '', output_price: '' }));
            // Auto hide message after 2s
            setTimeout(() => setMessage({ type: '', text: '' }), 2000);
        } catch (err) {
            setMessage({ type: 'error', text: '保存失败' });
        } finally {
            setLoading(false);
        }
    };

    const getItemOptions = () => {
        if (formData.trigger_event === '高级魔兽要诀') {
            const mapScrolls = MAP_SCROLL_MAPPING[formData.map_name] || [];
            return mapScrolls.map(s => <option key={s} value={s}>{s}</option>);
        }
        if (formData.trigger_event === '高级召唤兽内丹') {
            return ADVANCED_INNER_CORES.map(c => <option key={c} value={c}>{c}</option>);
        }
        return null;
    };

    return (
        <div className="pb-20">
            <h1 className="text-xl font-bold mb-4 px-2">录入记录</h1>

            {message.text && (
                <div className={`fixed top-4 left-4 right-4 p-4 rounded-md shadow-lg z-50 text-center ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-lg shadow">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">时间</label>
                    <input
                        type="date"
                        name="dig_time"
                        value={formData.dig_time}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border-gray-300 shadow-sm p-3 border text-lg"
                        required
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">X 坐标</label>
                        <input
                            type="number"
                            name="coord_x"
                            value={formData.coord_x}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border-gray-300 shadow-sm p-3 border text-lg"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Y 坐标</label>
                        <input
                            type="number"
                            name="coord_y"
                            value={formData.coord_y}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border-gray-300 shadow-sm p-3 border text-lg"
                            required
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">地图</label>
                    <select
                        name="map_name"
                        value={formData.map_name}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border-gray-300 shadow-sm p-3 border text-lg bg-gray-50"
                        required
                    >
                        <option value="">选择地图</option>
                        {MAPS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">触发事件</label>
                    <select
                        name="trigger_event"
                        value={formData.trigger_event}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border-gray-300 shadow-sm p-3 border text-lg bg-gray-50"
                        required
                    >
                        <option value="">选择事件</option>
                        {TRIGGER_EVENTS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                </div>

                {(formData.trigger_event === '高级魔兽要诀' || formData.trigger_event === '高级召唤兽内丹') ? (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">获得物品</label>
                        <select
                            name="item_name"
                            value={formData.item_name}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border-gray-300 shadow-sm p-3 border text-lg bg-gray-50"
                            required
                        >
                            <option value="">选择物品</option>
                            {getItemOptions()}
                        </select>
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">获得物品</label>
                        <input
                            type="text"
                            name="item_name"
                            value={formData.item_name}
                            onChange={handleInputChange}
                            disabled={formData.trigger_event === '幼儿园'}
                            className="w-full rounded-lg border-gray-300 shadow-sm p-3 border text-lg"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">产出价格 (万)</label>
                    <input
                        type="text"
                        name="output_price"
                        value={formData.output_price}
                        onChange={handleInputChange}
                        placeholder="例如: 4200w"
                        className="w-full rounded-lg border-gray-300 shadow-sm p-3 border text-lg"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-lg text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-lg mt-6 active:scale-95 transition-transform"
                >
                    <Save className="w-5 h-5 mr-2" />
                    保存记录
                </button>
            </form>
        </div>
    );
};

export default MobileEntryPage;
