
import React, { useState } from 'react';
import api from '../api/axios';
import { MAPS } from '../constants/gameData';
import { Search, Loader, MapPin, TrendingUp, AlertTriangle } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const PredictionPage = () => {
    const [mapName, setMapName] = useState('');
    const [coordX, setCoordX] = useState('');
    const [coordY, setCoordY] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handlePredict = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.get('/records/predict', {
                params: { map_name: mapName, x: coordX, y: coordY }
            });
            setResult(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const chartData = result ? Object.entries(result.probabilities).map(([name, value]) => ({
        name,
        probability: parseFloat(value)
    })) : [];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">藏宝图分析与预测</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Input Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:col-span-1">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                        <MapPin className="w-5 h-5 mr-2 text-blue-500" />
                        目标位置
                    </h2>
                    <form onSubmit={handlePredict} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">地图</label>
                            <select
                                value={mapName}
                                onChange={(e) => setMapName(e.target.value)}
                                className="w-full rounded-lg border-gray-300 shadow-sm p-3 border text-sm"
                                required
                            >
                                <option value="">选择地图</option>
                                {MAPS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">坐标 X</label>
                                <input
                                    type="number"
                                    value={coordX}
                                    onChange={(e) => setCoordX(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 shadow-sm p-3 border text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">坐标 Y</label>
                                <input
                                    type="number"
                                    value={coordY}
                                    onChange={(e) => setCoordY(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 shadow-sm p-3 border text-sm"
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm mt-4 transition-colors"
                        >
                            {loading ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                            {loading ? '分析中...' : '分析概率'}
                        </button>
                    </form>
                </div>

                {/* Results Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:col-span-2 min-h-[400px]">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                        分析结果
                    </h2>

                    {result ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <div className="text-sm text-blue-600 font-medium">样本数量</div>
                                    <div className="text-2xl font-bold text-blue-800">{result.total} 条记录</div>
                                    <div className="text-xs text-blue-500 mt-1">半径 15 范围内</div>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <div className="text-sm text-green-600 font-medium">高价值物品</div>
                                    <div className="text-2xl font-bold text-green-800">{result.highValueRecords?.length || 0} 个发现</div>
                                    <div className="text-xs text-green-500 mt-1">附近的稀有掉落</div>
                                </div>
                            </div>

                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="probability" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* High Value List */}
                            {result.highValueRecords && result.highValueRecords.length > 0 && (
                                <div className="mt-4">
                                    <h3 className="text-sm font-semibold text-gray-700 flex items-center mb-2">
                                        <AlertTriangle className="w-4 h-4 mr-1 text-orange-500" />
                                        近期附近高价值掉落
                                    </h3>
                                    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                                        {result.highValueRecords.map((r, idx) => (
                                            <div key={idx} className="flex justify-between text-sm text-gray-600">
                                                <span>{r.item_name}</span>
                                                <span>{r.dig_time?.slice(0, 10)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <Search className="w-12 h-12 mb-2 opacity-20" />
                            <p>输入坐标查看预测结果</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PredictionPage;
