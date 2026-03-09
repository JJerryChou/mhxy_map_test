
const db = require('../database');
const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');
const gameData = require('../constants/gameData');

// Helper to get user role/id
const isOwnerOrAdmin = (req, recordUserId) => {
    return req.user.role === 'admin' || req.user.id === recordUserId;
};

exports.createRecord = (req, res) => {
    const { dig_time, map_name, coord_x, coord_y, trigger_event, item_name, output_price } = req.body;
    const user_id = req.user.id;

    const performInsert = (finalPrice) => {
        const stmt = db.prepare(`INSERT INTO records (user_id, dig_time, map_name, coord_x, coord_y, trigger_event, item_name, output_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
        stmt.run(user_id, dig_time, map_name, coord_x, coord_y, trigger_event, item_name, finalPrice, function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, ...req.body, output_price: finalPrice });
        });
        stmt.finalize();
    };

    // If price is missing and it's a scroll/inner core, try to fetch from price table
    if (!output_price && item_name) {
        db.get('SELECT price FROM item_prices WHERE item_name = ?', [item_name], (err, row) => {
            performInsert(row ? row.price : "");
        });
    } else {
        performInsert(output_price || "");
    }
};

exports.batchCreateRecords = (req, res) => {
    const records = req.body; // Array of records
    if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ error: 'Invalid input. Expected array of records.' });
    }
    const user_id = req.user.id;

    // Fetch all prices first for mapping
    db.all('SELECT item_name, price FROM item_prices', [], (err, priceRows) => {
        const priceMap = {};
        if (!err && priceRows) {
            priceRows.forEach(p => priceMap[p.item_name] = p.price);
        }

        db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            const stmt = db.prepare(`INSERT INTO records (user_id, dig_time, map_name, coord_x, coord_y, trigger_event, item_name, output_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

            let errors = [];
            records.forEach(r => {
                let finalPrice = r.output_price;
                if (!finalPrice && r.item_name && priceMap[r.item_name]) {
                    finalPrice = priceMap[r.item_name];
                }
                stmt.run(user_id, r.dig_time, r.map_name, r.coord_x, r.coord_y, r.trigger_event, r.item_name, finalPrice || "", (err) => {
                    if (err) errors.push(err.message);
                });
            });

            stmt.finalize(() => {
                if (errors.length > 0) {
                    db.run("ROLLBACK");
                    return res.status(500).json({ error: 'Batch insert failed.', details: errors });
                }
                db.run("COMMIT");
                res.json({ message: `Successfully imported ${records.length} records.` });
            });
        });
    });
};

exports.updateRecord = (req, res) => {
    const { id } = req.params;
    const { dig_time, map_name, coord_x, coord_y, trigger_event, item_name, output_price } = req.body;

    db.get('SELECT user_id FROM records WHERE id = ?', [id], (err, record) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!record) return res.status(404).json({ error: 'Record not found' });

        if (!isOwnerOrAdmin(req, record.user_id)) {
            return res.status(403).json({ error: 'Permission denied.' });
        }

        const stmt = db.prepare(`UPDATE records SET dig_time = ?, map_name = ?, coord_x = ?, coord_y = ?, trigger_event = ?, item_name = ?, output_price = ? WHERE id = ?`);
        stmt.run(dig_time, map_name, coord_x, coord_y, trigger_event, item_name, output_price, id, function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Record updated successfully.' });
        });
        stmt.finalize();
    });
};

exports.deleteRecord = (req, res) => {
    const { id } = req.params;

    db.get('SELECT user_id FROM records WHERE id = ?', [id], (err, record) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!record) return res.status(404).json({ error: 'Record not found' });

        if (!isOwnerOrAdmin(req, record.user_id)) {
            return res.status(403).json({ error: 'Permission denied.' });
        }

        db.run('DELETE FROM records WHERE id = ?', [id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Record deleted successfully.' });
        });
    });
};

exports.clearAllRecords = (req, res) => {
    // If admin, can clear all. If user, clear only their own records? 
    // Requirement usually implies clearing the visible list. 
    // Let's allow admin to clear everything, and user to clear theirs.
    let query = 'DELETE FROM records';
    let params = [];

    if (req.user.role !== 'admin') {
        query += ' WHERE user_id = ?';
        params.push(req.user.id);
    }

    db.run(query, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: `Successfully cleared ${this.changes} records.` });
    });
};

exports.getRecords = (req, res) => {
    const { page = 1, limit = 20, map_name, user_id } = req.query;
    const offset = (page - 1) * limit;
    let query = 'SELECT r.*, u.username as creator_name FROM records r JOIN users u ON r.user_id = u.id WHERE 1=1';
    let params = [];

    if (map_name) {
        query += ' AND r.map_name = ?';
        params.push(map_name);
    }
    // If query string has user_id or if we want to restrict seeing others data? 
    // Requirement: "All users can see all data". So we don't restrict by user_id unless filtered.
    if (user_id) {
        query += ' AND r.user_id = ?';
        params.push(user_id);
    }

    query += ' ORDER BY r.dig_time ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM records WHERE 1=1';
    let countParams = [];
    if (map_name) {
        countQuery += ' AND map_name = ?';
        countParams.push(map_name);
    }
    if (user_id) {
        countQuery += ' AND user_id = ?';
        countParams.push(user_id);
    }

    db.get(countQuery, countParams, (err, countResult) => {
        if (err) return res.status(500).json({ error: err.message });

        db.all(query, params, (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            const total = countResult.total;
            res.json({
                data: rows,
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / limit)
            });
        });
    });
};

exports.parseImport = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();

    // Restricted to Excel only as requested by user
    if (ext !== '.xlsx' && ext !== '.xls') {
        fs.unlinkSync(filePath);
        return res.status(400).json({ error: '仅支持 Excel 格式 (.xlsx, .xls)。' });
    }

    try {
        const workbook = xlsx.readFile(filePath, { cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = xlsx.utils.sheet_to_json(worksheet, { defval: "" });

        // Header Mapping logic
        const fieldMap = {
            '时间': 'dig_time',
            '日期': 'dig_time',
            '挖图时间': 'dig_time',
            '地图': 'map_name',
            '场景': 'map_name',
            '坐标X': 'coord_x',
            '坐标x': 'coord_x',
            'X坐标': 'coord_x',
            '横坐标': 'coord_x',
            '坐标Y': 'coord_y',
            '坐标y': 'coord_y',
            'Y坐标': 'coord_y',
            '纵坐标': 'coord_y',
            '事件': 'trigger_event',
            '触发事件': 'trigger_event',
            '内容': 'trigger_event',
            '结果': 'trigger_event',
            '物品': 'item_name',
            '物品名': 'item_name',
            '名字': 'item_name',
            '获得物品': 'item_name',
            '产出物': 'item_name',
            '产出价值': 'output_price',
            '产出价格': 'output_price',
            '价值': 'output_price',
            '价格': 'output_price',
            '单价': 'output_price',
            '金额': 'output_price'
        };

        const data = rawData.map(row => {
            const mappedRow = {};
            // Standard fields based on our known English keys
            const standardKeys = ['dig_time', 'map_name', 'coord_x', 'coord_y', 'trigger_event', 'item_name', 'output_price'];

            Object.keys(row).forEach(key => {
                const trimmedKey = key.trim();
                const mappedKey = fieldMap[trimmedKey]; // Try to get mapped key

                let value = row[key];

                // Special handling for date types from Excel
                if ((mappedKey === 'dig_time' || trimmedKey === '时间') && value instanceof Date) {
                    value = value.toISOString().slice(0, 16);
                } else if ((mappedKey === 'dig_time' || trimmedKey === '时间') && typeof value === 'number') {
                    const jsDate = new Date(Math.round((value - 25569) * 86400 * 1000));
                    value = jsDate.toISOString().slice(0, 16);
                }

                if (mappedKey) {
                    mappedRow[mappedKey] = value;
                }
            });

            // Ensure all standard keys exist with at least an empty string
            standardKeys.forEach(k => {
                if (mappedRow[k] === undefined) mappedRow[k] = "";
            });

            // Return ONLY standard keys to the frontend
            const finalRow = {};
            standardKeys.forEach(k => finalRow[k] = mappedRow[k]);
            return finalRow;
        });

        fs.unlinkSync(filePath);
        res.json(data);
    } catch (err) {
        console.error('Excel parse error:', err);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.status(500).json({ error: '解析 Excel 文件失败，请检查文件格式。' });
    }
};

exports.predict = (req, res) => {
    const { map_name, x, y, radius = 15 } = req.query;

    if (!map_name || x === undefined || y === undefined) {
        return res.status(400).json({ error: 'Missing map_name, x, or y.' });
    }

    const targetX = parseInt(x);
    const targetY = parseInt(y);
    const rad = parseInt(radius);

    db.all('SELECT * FROM records WHERE map_name = ?', [map_name], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const nearbyRecords = rows.filter(r => {
            const dist = Math.sqrt(Math.pow(r.coord_x - targetX, 2) + Math.pow(r.coord_y - targetY, 2));
            return dist <= rad;
        });

        const total = nearbyRecords.length;
        if (total === 0) {
            return res.json({ total: 0, probabilities: {}, nearbyRecords: [] });
        }

        const eventsCount = {};
        nearbyRecords.forEach(r => {
            eventsCount[r.trigger_event] = (eventsCount[r.trigger_event] || 0) + 1;
        });

        const probabilities = {};
        for (const [event, count] of Object.entries(eventsCount)) {
            probabilities[event] = ((count / total) * 100).toFixed(1) + '%';
        }

        res.json({
            total,
            probabilities,
            stats: eventsCount,
            // Return top 5 nearby high value items for recommendation logic if needed
            highValueRecords: nearbyRecords.filter(r => r.trigger_event === '高级魔兽要诀' || r.trigger_event === '高级召唤兽内丹').slice(0, 5)
        });
    });
};
