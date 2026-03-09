
import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { MAPS } from '../constants/gameData';
import { Trash2, Edit2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const HistoryPage = () => {
    const { user } = useAuth();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [filterMap, setFilterMap] = useState('');

    // Edit state
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    const startEdit = (record) => {
        setEditingId(record.id);
        setEditForm({ ...record });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const saveEdit = async () => {
        try {
            await api.put(`/records/${editingId}`, editForm);
            setRecords(prev => prev.map(r => r.id === editingId ? { ...r, ...editForm } : r));
            setEditingId(null);
        } catch (err) {
            alert('保存失败');
        }
    };

    const fetchRecords = async (pageNum) => {
        setLoading(true);
        try {
            const res = await api.get('/records', {
                params: { page: pageNum, limit: 15, map_name: filterMap }
            });
            // API now returns { data, total, page, totalPages }
            setRecords(res.data.data);
            setTotalPages(res.data.totalPages || 1);
            setTotalCount(res.data.total || 0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords(1);
        setPage(1);
    }, [filterMap]);

    const handlePageChange = (newPage) => {
        setPage(newPage);
        fetchRecords(newPage);
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

    const handleClearAll = async () => {
        if (!window.confirm('确定要清空所有记录吗？此操作不可撤销！')) return;
        setLoading(true);
        try {
            await api.delete('/records/all');
            setRecords([]);
            setTotalPages(1);
            setPage(1);
            alert('所有记录已清空');
        } catch (err) {
            alert('清空失败');
        } finally {
            setLoading(false);
        }
    };

    // Formatting
    const formatDate = (isoString) => {
        if (!isoString) return '-';
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return isoString;
        return date.toLocaleString('zh-CN');
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-800">挖宝记录历史</h1>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        共 {totalCount} 条记录
                    </span>
                </div>
                <div className="flex items-center space-x-4">
                    {records.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            清空历史
                        </button>
                    )}
                    <div className="flex items-center space-x-2">
                        <Filter className="w-5 h-5 text-gray-500" />
                        <select
                            value={filterMap}
                            onChange={(e) => setFilterMap(e.target.value)}
                            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        >
                            <option value="">所有地图</option>
                            {MAPS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">地图</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">坐标</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">事件</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">物品</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">价格</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {records.length > 0 ? (
                            records.map((record) => (
                                <tr key={record.id} className="hover:bg-gray-50">
                                    {editingId === record.id ? (
                                        <>
                                            <td className="px-6 py-4">
                                                <input type="datetime-local" name="dig_time" value={editForm.dig_time} onChange={handleEditChange} className="w-full text-sm border-gray-300 rounded" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input type="text" name="map_name" value={editForm.map_name} onChange={handleEditChange} className="w-full text-sm border-gray-300 rounded" />
                                            </td>
                                            <td className="px-6 py-4 flex space-x-1">
                                                <input type="number" name="coord_x" value={editForm.coord_x} onChange={handleEditChange} className="w-12 text-sm border-gray-300 rounded" />
                                                <input type="number" name="coord_y" value={editForm.coord_y} onChange={handleEditChange} className="w-12 text-sm border-gray-300 rounded" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input type="text" name="trigger_event" value={editForm.trigger_event} onChange={handleEditChange} className="w-full text-sm border-gray-300 rounded" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input type="text" name="item_name" value={editForm.item_name} onChange={handleEditChange} className="w-full text-sm border-gray-300 rounded" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input type="text" name="output_price" value={editForm.output_price} onChange={handleEditChange} className="w-full text-sm border-gray-300 rounded font-bold text-orange-600" />
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button onClick={saveEdit} className="text-green-600 hover:text-green-900 text-sm font-medium">保存</button>
                                                <button onClick={cancelEdit} className="text-gray-600 hover:text-gray-900 text-sm font-medium">取消</button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(record.dig_time)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.map_name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">({record.coord_x}, {record.coord_y})</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.trigger_event}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">{record.item_name || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-bold">{record.output_price ? `${record.output_price}` : '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {(user.role === 'admin' || user.id === record.user_id) && (
                                                    <>
                                                        <button
                                                            onClick={() => startEdit(record)}
                                                            className="text-blue-600 hover:text-blue-900"
                                                            title="编辑"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(record.id)}
                                                            className="text-red-600 hover:text-red-900 ml-4"
                                                            title="删除"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                                    暂无记录
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination Controls */}
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => handlePageChange(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            上一页
                        </button>
                        <button
                            onClick={() => handlePageChange(page + 1)}
                            disabled={page >= totalPages}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            下一页
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                第 <span className="font-medium">{page}</span> 页 / 共 <span className="font-medium">{totalPages}</span> 页
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => handlePageChange(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <span className="sr-only">上一页</span>
                                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                </button>
                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page >= totalPages}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <span className="sr-only">下一页</span>
                                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HistoryPage;
