
import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { TRIGGER_EVENTS, MAPS, MAP_SCROLL_MAPPING, ADVANCED_INNER_CORES } from '../constants/gameData';
import { Upload, Save, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

const RecordPage = () => {
    const [activeTab, setActiveTab] = useState('manual'); // manual | import
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Manual Entry State
    const [formData, setFormData] = useState({
        dig_time: new Date().toISOString().slice(0, 10),
        map_name: '',
        coord_x: '',
        coord_y: '',
        trigger_event: '',
        item_name: '',
        output_price: ''
    });

    // Batch Import State
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [importStep, setImportStep] = useState('upload'); // upload | preview

    useEffect(() => {
        // Auto-fill item based on event logic
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
            setMessage({ type: 'success', text: '记录保存成功！' });
            // Reset form partly?
            setFormData(prev => ({ ...prev, item_name: '', output_price: '' }));
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || '保存记录失败。' });
        } finally {
            setLoading(false);
        }
    };

    // Import Handlers
    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleParse = async () => {
        if (!file) return;
        setLoading(true);
        const data = new FormData();
        data.append('file', file);
        try {
            const res = await api.post('/records/import/parse', data);
            setParsedData(res.data);
            setImportStep('preview');
        } catch (err) {
            setMessage({ type: 'error', text: '解析文件失败。' });
        } finally {
            setLoading(false);
        }
    };

    const handleBatchSubmit = async () => {
        setLoading(true);
        try {
            await api.post('/records/batch', parsedData);
            setMessage({ type: 'success', text: `成功导入 ${parsedData.length} 条记录。` });
            setImportStep('upload');
            setParsedData([]);
            setFile(null);
        } catch (err) {
            setMessage({ type: 'error', text: '批量导入失败。' });
        } finally {
            setLoading(false);
        }
    };

    // Helper to get item options
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
        <div className="space-y-6">
            <div className="flex space-x-4 border-b border-gray-200">
                <button
                    className={`pb-2 px-4 font-medium ${activeTab === 'manual' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('manual')}
                >
                    手动录入
                </button>
                <button
                    className={`pb-2 px-4 font-medium ${activeTab === 'import' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('import')}
                >
                    批量导入
                </button>
            </div>

            {message.text && (
                <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {activeTab === 'manual' ? (
                <div className="bg-white shadow rounded-lg p-6">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">时间</label>
                            <input
                                type="date"
                                name="dig_time"
                                value={formData.dig_time}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">地图</label>
                            <select
                                name="map_name"
                                value={formData.map_name}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                required
                            >
                                <option value="">选择地图</option>
                                {MAPS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">坐标 X</label>
                            <input
                                type="number"
                                name="coord_x"
                                value={formData.coord_x}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">坐标 Y</label>
                            <input
                                type="number"
                                name="coord_y"
                                value={formData.coord_y}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">事件</label>
                            <select
                                name="trigger_event"
                                value={formData.trigger_event}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                required
                            >
                                <option value="">选择事件</option>
                                {TRIGGER_EVENTS.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                        </div>

                        {(formData.trigger_event === '高级魔兽要诀' || formData.trigger_event === '高级召唤兽内丹') ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">获得物品</label>
                                <select
                                    name="item_name"
                                    value={formData.item_name}
                                    onChange={handleInputChange}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                    required
                                >
                                    <option value="">选择物品</option>
                                    {getItemOptions()}
                                </select>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">获得物品</label>
                                <input
                                    type="text"
                                    name="item_name"
                                    value={formData.item_name}
                                    onChange={handleInputChange}
                                    disabled={formData.trigger_event === '幼儿园'}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700">产出价格 (万)</label>
                            <input
                                type="text"
                                name="output_price"
                                value={formData.output_price}
                                onChange={handleInputChange}
                                placeholder="例如: 4200"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {loading ? '保存中...' : '保存记录'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="bg-white shadow rounded-lg p-6">
                    {importStep === 'upload' ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors">
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="mt-4 flex justify-center text-sm text-gray-600">
                                <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                    <span>上传文件</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".xlsx, .xls" />
                                </label>
                                <p className="pl-1">或拖拽文件到这里</p>
                            </div>
                            <p className="text-xs text-gray-500">CSV 文件最大 10MB</p>
                            {file && <p className="mt-2 text-sm text-blue-500">{file.name}</p>}
                            <button
                                onClick={handleParse}
                                disabled={!file || loading}
                                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? '解析中...' : '解析并预览'}
                            </button>
                        </div>
                    ) : (
                        <div>
                            {/* Header translation map */}
                            {(() => {
                                const headerTranslation = {
                                    'dig_time': '时间',
                                    'map_name': '地图',
                                    'coord_x': '坐标X',
                                    'coord_y': '坐标Y',
                                    'trigger_event': '事件',
                                    'item_name': '物品',
                                    'output_price': '价格',
                                    'user_id': '上传者'
                                };
                                return (
                                    <>
                                        <div className="mb-4 flex justify-between items-center">
                                            <h3 className="text-lg font-medium text-gray-900">预览数据 ({parsedData.length} 行)</h3>
                                            <div className="space-x-2">
                                                <button
                                                    onClick={() => { setImportStep('upload'); setParsedData([]); }}
                                                    className="text-gray-600 hover:text-gray-900 px-3 py-1 border rounded"
                                                >
                                                    取消
                                                </button>
                                                <button
                                                    onClick={handleBatchSubmit}
                                                    disabled={loading}
                                                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                                                >
                                                    {loading ? '导入中...' : '确认导入'}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        {parsedData.length > 0 && Object.keys(parsedData[0]).map(key => (
                                                            <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                                {headerTranslation[key] || key}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {parsedData.slice(0, 500).map((row, i) => (
                                                        <tr key={i}>
                                                            {Object.entries(row).map(([key, val], j) => (
                                                                <td key={j} className="px-6 py-4 white-space-nowrap text-sm text-gray-500">
                                                                    {key === 'dig_time' ? val : (val || '-')}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {parsedData.length > 500 && (
                                                <p className="text-center text-sm text-gray-500 mt-2">仅显示前 500 行...</p>
                                            )}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default RecordPage;
