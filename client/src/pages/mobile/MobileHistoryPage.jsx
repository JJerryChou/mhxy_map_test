
import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { TRIGGER_EVENTS, MAPS, MAP_SCROLL_MAPPING, ADVANCED_INNER_CORES } from '../../constants/gameData';
import { Edit2, Trash2, ChevronDown, ChevronUp, Search } from 'lucide-react';

const MobileHistoryPage = () => {
    const { user } = useAuth();
    const [records, setRecords] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [filterMap, setFilterMap] = useState('');

    // Edit Form State
    const [editForm, setEditForm] = useState({});

    const fetchRecords = async (pageNum, reset = false) => {
        setLoading(true);
        try {
            const res = await api.get('/records', {
                params: { page: pageNum, limit: 20, map_name: filterMap }
            });
            const { data, totalPages: total } = res.data;
            if (reset) {
                setRecords(data);
            } else {
                setRecords(prev => [...prev, ...data]);
            }
            setTotalPages(total || 1);
            setTotalCount(total || 0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords(1, true);
        setPage(1);
    }, [filterMap]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchRecords(nextPage);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('确定要删除这条记录吗？')) return;
        try {
            await api.delete(`/records/${id}`);
            setRecords(prev => prev.filter(r => r.id !== id));
        } catch (err) {
            alert('删除失败');
        }
    };

    const handleEditClick = (record) => {
        setEditingId(record.id);
        setEditForm(record);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdate = async () => {
        try {
            await api.put(`/records/${editingId}`, editForm);
            setRecords(prev => prev.map(r => r.id === editingId ? editForm : r));
            setEditingId(null);
        } catch (err) {
            alert('更新失败');
        }
    };

    const getItemOptions = () => {
        if (editForm.trigger_event === '高级魔兽要诀') {
            const mapScrolls = MAP_SCROLL_MAPPING[editForm.map_name] || [];
            return mapScrolls.map(s => <option key={s} value={s}>{s}</option>);
        }
        if (editForm.trigger_event === '高级召唤兽内丹') {
            return ADVANCED_INNER_CORES.map(c => <option key={c} value={c}>{c}</option>);
        }
        return null;
    };

    const formatDate = (isoString) => {
        return new Date(isoString).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    const canEdit = (record) => user.role === 'admin' || user.id === record.user_id;

    return (
        <div className="pb-20 min-h-screen bg-gray-50">
            <div className="sticky top-0 bg-white z-10 shadow-sm p-4">
                <div className="flex gap-2 items-center">
                    <select
                        value={filterMap}
                        onChange={(e) => setFilterMap(e.target.value)}
                        className="flex-1 rounded-md border-gray-300 shadow-sm text-sm p-2 border"
                    >
                        <option value="">所有地图</option>
                        {MAPS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <div className="text-xs text-gray-500 whitespace-nowrap bg-gray-100 px-2 py-1 rounded">
                        共 {totalCount} 条
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {records.map(record => (
                    <div key={record.id} className="bg-white rounded-lg shadow p-4 transition-all">
                        {editingId === record.id ? (
                            <div className="space-y-3">
                                {/* Edit Mode */}
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-lg">编辑记录</h3>
                                    <button onClick={() => setEditingId(null)} className="text-gray-500 text-sm">取消</button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <input type="datetime-local" name="dig_time" value={editForm.dig_time} onChange={handleEditChange} className="border p-2 rounded w-full" />
                                    <select name="map_name" value={editForm.map_name} onChange={handleEditChange} className="border p-2 rounded w-full">
                                        {MAPS.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <input type="number" name="coord_x" value={editForm.coord_x} onChange={handleEditChange} className="border p-2 rounded w-full" placeholder="X" />
                                    <input type="number" name="coord_y" value={editForm.coord_y} onChange={handleEditChange} className="border p-2 rounded w-full" placeholder="Y" />
                                    <input type="text" name="output_price" value={editForm.output_price} onChange={handleEditChange} className="border p-2 rounded w-full" placeholder="价格" />
                                </div>
                                <select name="trigger_event" value={editForm.trigger_event} onChange={handleEditChange} className="border p-2 rounded w-full">
                                    {TRIGGER_EVENTS.map(e => <option key={e} value={e}>{e}</option>)}
                                </select>
                                {(editForm.trigger_event === '高级魔兽要诀' || editForm.trigger_event === '高级召唤兽内丹') ? (
                                    <select name="item_name" value={editForm.item_name} onChange={handleEditChange} className="border p-2 rounded w-full">
                                        <option value="">选择物品</option>
                                        {getItemOptions()}
                                    </select>
                                ) : (
                                    <input type="text" name="item_name" value={editForm.item_name} onChange={handleEditChange} className="border p-2 rounded w-full" />
                                )}
                                <button onClick={handleUpdate} className="w-full bg-blue-600 text-white p-2 rounded mt-2">保存修改</button>
                            </div>
                        ) : (
                            <div onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="text-sm text-gray-500 mb-1">{formatDate(record.dig_time)}</div>
                                        <div className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                            {record.map_name} <span className="text-sm font-normal text-gray-500">({record.coord_x}, {record.coord_y})</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-blue-600 font-medium">{record.item_name || record.trigger_event}</div>
                                        {record.output_price && <div className="text-orange-500 font-bold">{record.output_price}</div>}
                                    </div>
                                </div>

                                {expandedId === record.id && canEdit(record) && (
                                    <div className="mt-4 flex justify-end gap-3 pt-3 border-t">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleEditClick(record); }}
                                            className="flex items-center text-blue-600 px-3 py-1 rounded bg-blue-50"
                                        >
                                            <Edit2 className="w-4 h-4 mr-1" /> 编辑
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }}
                                            className="flex items-center text-red-600 px-3 py-1 rounded bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4 mr-1" /> 删除
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {page < totalPages && (
                    <button
                        onClick={handleLoadMore}
                        className="w-full py-3 bg-white text-gray-500 rounded-lg shadow text-sm font-medium"
                        disabled={loading}
                    >
                        {loading ? '加载中...' : '加载更多'}
                    </button>
                )}
                {page >= totalPages && records.length > 0 && (
                    <div className="text-center text-gray-400 text-sm py-4">已加载全部数据</div>
                )}
            </div>
        </div>
    );
};

export default MobileHistoryPage;
