import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../../api/axios';
import { Save, RefreshCw, AlertCircle, Image as ImageIcon } from 'lucide-react';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

const MapSettingsPage = () => {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [savingSettings, setSavingSettings] = useState({});
    const [message, setMessage] = useState({ type: '', text: '' });
    const [boundsForm, setBoundsForm] = useState({});
    const [selectedFiles, setSelectedFiles] = useState({});
    const [localPreviews, setLocalPreviews] = useState({});
    const previewRef = useRef({});

    const hydrateForms = (rows) => {
        const next = {};
        rows.forEach((row) => {
            next[row.map_name] = {
                max_x: row.max_x ?? '',
                max_y: row.max_y ?? ''
            };
        });
        setBoundsForm(next);
    };

    const fetchMapSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/map-settings');
            setSettings(res.data);
            hydrateForms(res.data);
        } catch (err) {
            setMessage({ type: 'error', text: '获取地图设置失败。' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMapSettings();
    }, []);

    useEffect(() => {
        previewRef.current = localPreviews;
    }, [localPreviews]);

    useEffect(() => {
        return () => {
            Object.values(previewRef.current).forEach((url) => URL.revokeObjectURL(url));
        };
    }, []);

    const settingsMap = useMemo(() => {
        const map = new Map();
        settings.forEach((item) => map.set(item.map_name, item));
        return map;
    }, [settings]);

    const updateLocalSetting = (updated) => {
        setSettings((prev) =>
            prev.map((item) => (item.map_name === updated.map_name ? { ...item, ...updated } : item))
        );
    };

    const onBoundsChange = (mapName, field, value) => {
        setBoundsForm((prev) => ({
            ...prev,
            [mapName]: {
                ...(prev[mapName] || {}),
                [field]: value
            }
        }));
    };

    const clearSelectedImage = (mapName) => {
        setSelectedFiles((prev) => {
            const next = { ...prev };
            delete next[mapName];
            return next;
        });
        setLocalPreviews((prev) => {
            if (prev[mapName]) URL.revokeObjectURL(prev[mapName]);
            const next = { ...prev };
            delete next[mapName];
            return next;
        });
    };

    const saveSettings = async (mapName) => {
        const payload = boundsForm[mapName] || {};
        const maxX = Number(payload.max_x);
        const maxY = Number(payload.max_y);
        const file = selectedFiles[mapName];

        if (!Number.isInteger(maxX) || maxX <= 0 || !Number.isInteger(maxY) || maxY <= 0) {
            setMessage({ type: 'error', text: `${mapName} 的最大 X/Y 必须为正整数。` });
            return;
        }

        const form = new FormData();
        form.append('max_x', String(maxX));
        form.append('max_y', String(maxY));
        if (file) {
            form.append('image', file);
        }

        setSavingSettings((prev) => ({ ...prev, [mapName]: true }));
        try {
            const encoded = encodeURIComponent(mapName);
            const res = await api.put(`/map-settings/${encoded}`, form);
            updateLocalSetting(res.data.data);
            clearSelectedImage(mapName);
            setMessage({ type: 'success', text: `${mapName} 地图设置已保存。` });
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || `保存 ${mapName} 失败。` });
        } finally {
            setSavingSettings((prev) => ({ ...prev, [mapName]: false }));
        }
    };

    const onSelectImage = (mapName, file) => {
        if (!file) return;

        if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
            setMessage({ type: 'error', text: '仅支持 PNG、JPG、WEBP 图片。' });
            return;
        }
        if (file.size > MAX_IMAGE_SIZE) {
            setMessage({ type: 'error', text: '图片大小不能超过 5MB。' });
            return;
        }

        setSelectedFiles((prev) => ({ ...prev, [mapName]: file }));
        setLocalPreviews((prev) => {
            if (prev[mapName]) URL.revokeObjectURL(prev[mapName]);
            return { ...prev, [mapName]: URL.createObjectURL(file) };
        });
    };

    const getPreviewUrl = (mapName) => {
        if (localPreviews[mapName]) return localPreviews[mapName];
        const row = settingsMap.get(mapName);
        if (!row?.image_url) return '';
        const cacheKey = encodeURIComponent(row.updated_at || '');
        return cacheKey ? `${row.image_url}?v=${cacheKey}` : row.image_url;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">地图设置</h1>
                <button
                    type="button"
                    onClick={fetchMapSettings}
                    className="inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50"
                    disabled={loading}
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    刷新
                </button>
            </div>

            {message.text && (
                <div className={`p-4 rounded-md flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.type === 'error' && <AlertCircle className="w-5 h-5 mr-2" />}
                    <span>{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {settings.map((setting) => {
                    const previewUrl = getPreviewUrl(setting.map_name);
                    const bounds = boundsForm[setting.map_name] || { max_x: '', max_y: '' };
                    return (
                        <div key={setting.map_name} className="bg-white rounded-lg shadow border border-gray-100 p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-800">{setting.map_name}</h2>
                                <span className="text-xs text-gray-500">仅管理员可编辑</span>
                            </div>

                            <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 h-52 flex items-center justify-center overflow-hidden">
                                {previewUrl ? (
                                    <img src={previewUrl} alt={`${setting.map_name} 地图`} className="w-full h-full object-contain" />
                                ) : (
                                    <div className="text-gray-400 text-sm flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4" />
                                        未上传地图图片
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3">
                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={(e) => onSelectImage(setting.map_name, e.target.files?.[0])}
                                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                                />
                            </div>
                            {selectedFiles[setting.map_name] && (
                                <p className="text-sm text-blue-600">
                                    已选择新地图图片，点击下方保存按钮后会与坐标一起生效。
                                </p>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">最大 X</label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={bounds.max_x}
                                        onChange={(e) => onBoundsChange(setting.map_name, 'max_x', e.target.value)}
                                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">最大 Y</label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={bounds.max_y}
                                        onChange={(e) => onBoundsChange(setting.map_name, 'max_y', e.target.value)}
                                        className="w-full rounded-md border border-gray-300 p-2 text-sm"
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => saveSettings(setting.map_name)}
                                className="w-full inline-flex items-center justify-center px-3 py-2 rounded-md bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50"
                                disabled={savingSettings[setting.map_name]}
                            >
                                {savingSettings[setting.map_name] ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        保存地图和坐标
                                    </>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MapSettingsPage;
