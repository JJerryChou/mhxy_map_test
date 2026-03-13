
import React, { useEffect, useMemo, useState } from 'react';
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
    const [mapSettings, setMapSettings] = useState([]);
    const [mapSettingsLoading, setMapSettingsLoading] = useState(false);
    const [mapSettingsError, setMapSettingsError] = useState('');

    useEffect(() => {
        let isActive = true;

        const fetchMapSettings = async () => {
            setMapSettingsLoading(true);
            setMapSettingsError('');
            try {
                const res = await api.get('/map-settings');
                if (isActive) {
                    setMapSettings(res.data);
                }
            } catch (err) {
                if (isActive) {
                    setMapSettingsError('地图配置加载失败，请稍后重试。');
                }
            } finally {
                if (isActive) {
                    setMapSettingsLoading(false);
                }
            }
        };

        fetchMapSettings();

        return () => {
            isActive = false;
        };
    }, []);

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

    const handleMapChange = (value) => {
        setMapName(value);
        setResult(null);
    };

    const handleCoordXChange = (value) => {
        setCoordX(value);
        setResult(null);
    };

    const handleCoordYChange = (value) => {
        setCoordY(value);
        setResult(null);
    };

    const currentMapSetting = useMemo(
        () => mapSettings.find((item) => item.map_name === mapName) || null,
        [mapName, mapSettings]
    );

    const chartData = useMemo(
        () => (result ? Object.entries(result.probabilities).map(([name, value]) => ({
            name,
            probability: parseFloat(value)
        })) : []),
        [result]
    );

    const mapPreviewUrl = useMemo(() => {
        if (!currentMapSetting?.image_url) return '';
        const cacheKey = encodeURIComponent(currentMapSetting.updated_at || '');
        return cacheKey ? `${currentMapSetting.image_url}?v=${cacheKey}` : currentMapSetting.image_url;
    }, [currentMapSetting]);

    const targetPoint = useMemo(() => {
        if (coordX === '' || coordY === '') {
            return { status: 'empty' };
        }

        const x = Number(coordX);
        const y = Number(coordY);

        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            return { status: 'invalid' };
        }

        if (!currentMapSetting || !Number.isInteger(currentMapSetting.max_x) || !Number.isInteger(currentMapSetting.max_y) || currentMapSetting.max_x <= 0 || currentMapSetting.max_y <= 0) {
            return { status: 'missing-bounds', x, y };
        }

        if (x < 0 || x > currentMapSetting.max_x || y < 0 || y > currentMapSetting.max_y) {
            return {
                status: 'out-of-bounds',
                x,
                y,
                maxX: currentMapSetting.max_x,
                maxY: currentMapSetting.max_y
            };
        }

        return {
            status: 'ready',
            x,
            y,
            leftPercent: (x / currentMapSetting.max_x) * 100,
            topPercent: (1 - (y / currentMapSetting.max_y)) * 100
        };
    }, [coordX, coordY, currentMapSetting]);

    const mapStatusMessage = useMemo(() => {
        if (!mapName) return '选择地图后，这里会显示目标位置对应的地图。';
        if (mapSettingsLoading) return '正在加载地图配置...';
        if (mapSettingsError) return mapSettingsError;
        if (!currentMapSetting) return '当前地图暂无配置，请先到地图设置中保存。';
        if (!currentMapSetting.image_url) return '当前地图还没有上传图片，请先到地图设置中保存地图。';
        if (!Number.isInteger(currentMapSetting.max_x) || !Number.isInteger(currentMapSetting.max_y) || currentMapSetting.max_x <= 0 || currentMapSetting.max_y <= 0) {
            return '当前地图还没有配置最大 X/Y，请先到地图设置中保存坐标范围。';
        }
        if (targetPoint.status === 'empty') return '输入目标坐标后，会在地图上显示对应红点。';
        if (targetPoint.status === 'invalid') return '请输入有效的数字坐标。';
        if (targetPoint.status === 'out-of-bounds') {
            return `坐标超出范围：当前地图有效范围为 X 0-${targetPoint.maxX}，Y 0-${targetPoint.maxY}。`;
        }
        return `坐标原点在左下角：当前范围 0,0 至 ${currentMapSetting.max_x},${currentMapSetting.max_y}。`;
    }, [currentMapSetting, mapName, mapSettingsError, mapSettingsLoading, targetPoint]);

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
                                onChange={(e) => handleMapChange(e.target.value)}
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
                                    onChange={(e) => handleCoordXChange(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 shadow-sm p-3 border text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">坐标 Y</label>
                                <input
                                    type="number"
                                    value={coordY}
                                    onChange={(e) => handleCoordYChange(e.target.value)}
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

                    <div className="space-y-6">
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-base font-semibold text-gray-800">目标地图定位</h3>
                                    <p className="text-sm text-gray-500">{mapStatusMessage}</p>
                                </div>
                                {currentMapSetting && Number.isInteger(currentMapSetting.max_x) && Number.isInteger(currentMapSetting.max_y) && currentMapSetting.max_x > 0 && currentMapSetting.max_y > 0 && (
                                    <div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
                                        范围 0,0 - {currentMapSetting.max_x},{currentMapSetting.max_y}
                                    </div>
                                )}
                            </div>

                            {mapPreviewUrl ? (
                                <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
                                    <div className="relative">
                                        <img
                                            src={mapPreviewUrl}
                                            alt={`${mapName} 地图`}
                                            className="block w-full h-auto"
                                        />
                                        {targetPoint.status === 'ready' && (
                                            <div
                                                className="absolute z-10"
                                                style={{
                                                    left: `${targetPoint.leftPercent}%`,
                                                    top: `${targetPoint.topPercent}%`,
                                                    transform: 'translate(-50%, -50%)'
                                                }}
                                            >
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className="h-4 w-4 rounded-full border-2 border-white bg-red-500 shadow-lg" />
                                                    <span className="rounded bg-black/75 px-2 py-1 text-xs font-semibold text-white whitespace-nowrap">
                                                        {targetPoint.x}, {targetPoint.y}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4 flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white text-sm text-gray-400">
                                    {mapName ? '当前地图暂无可展示图片' : '请选择左侧地图'}
                                </div>
                            )}
                        </div>

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
                            <div className="h-40 flex flex-col items-center justify-center text-gray-400 rounded-xl border border-dashed border-gray-200 bg-gray-50">
                            <Search className="w-12 h-12 mb-2 opacity-20" />
                            <p>输入坐标后点击“分析概率”查看统计结果</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PredictionPage;
