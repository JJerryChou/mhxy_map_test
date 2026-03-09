
import React, { useState } from 'react';
import api from '../../api/axios';
import { MAPS } from '../../constants/gameData';
import { Search, Loader } from 'lucide-react';

const MobilePredictionPage = () => {
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

    return (
        <div className="pb-20 p-4 min-h-screen bg-gray-50">
            <h1 className="text-xl font-bold mb-4">挖宝预测</h1>

            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <form onSubmit={handlePredict} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">地图</label>
                        <select
                            value={mapName}
                            onChange={(e) => setMapName(e.target.value)}
                            className="w-full rounded-lg border-gray-300 shadow-sm p-3 border text-lg bg-gray-50"
                            required
                        >
                            <option value="">选择地图</option>
                            {MAPS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">X 坐标</label>
                            <input
                                type="number"
                                value={coordX}
                                onChange={(e) => setCoordX(e.target.value)}
                                className="w-full rounded-lg border-gray-300 shadow-sm p-3 border text-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Y 坐标</label>
                            <input
                                type="number"
                                value={coordY}
                                onChange={(e) => setCoordY(e.target.value)}
                                className="w-full rounded-lg border-gray-300 shadow-sm p-3 border text-lg"
                                required
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-lg mt-4 active:scale-95 transition-transform"
                    >
                        {loading ? <Loader className="animate-spin w-6 h-6" /> : <Search className="w-5 h-5 mr-2" />}
                        {loading ? '分析中...' : '开始预测'}
                    </button>
                </form>
            </div>

            {result && (
                <div className="bg-white rounded-lg shadow p-4 animate-fade-in">
                    <div className="text-center mb-4">
                        <div className="text-3xl font-bold text-blue-600 mb-1">参考样本: {result.total}</div>
                        <div className="text-sm text-gray-500">附近 {15} 坐标范围内的历史记录</div>
                    </div>

                    <div className="space-y-3">
                        {Object.entries(result.probabilities)
                            .sort(([, a], [, b]) => parseFloat(b) - parseFloat(a))
                            .map(([event, prob]) => (
                                <div key={event} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                                    <span className="font-medium text-gray-800">{event}:</span>
                                    <span className={`font-bold text-lg ${parseFloat(prob) > 20 ? 'text-green-600' : 'text-gray-600'}`}>
                                        {prob}
                                    </span>
                                </div>
                            ))}
                    </div>

                    {result.highValueRecords && result.highValueRecords.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-gray-200">
                            <h3 className="font-bold text-gray-800 mb-2">附近高价值记录:</h3>
                            <div className="space-y-2">
                                {result.highValueRecords.map((r, idx) => (
                                    <div key={idx} className="text-sm bg-yellow-50 p-2 rounded border border-yellow-100 text-yellow-800 flex justify-between">
                                        <span>{r.item_name}</span>
                                        <span>({r.coord_x}, {r.coord_y})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MobilePredictionPage;
