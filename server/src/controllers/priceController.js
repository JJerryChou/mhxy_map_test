
const db = require('../database');

exports.getAllPrices = (req, res) => {
    db.all('SELECT * FROM item_prices ORDER BY item_type, item_name', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

exports.upsertPrice = (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Permission denied.' });
    }

    const { item_type, item_name, price } = req.body;
    if (!item_type || !item_name || price === undefined) {
        return res.status(400).json({ error: 'Missing item_type, item_name or price.' });
    }

    db.run(`INSERT INTO item_prices (item_type, item_name, price, updated_at) 
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(item_name) DO UPDATE SET 
            price = excluded.price,
            item_type = excluded.item_type,
            updated_at = CURRENT_TIMESTAMP`,
        [item_type, item_name, price], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Price updated successfully.' });
        });
};

exports.deletePrice = (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Permission denied.' });
    }

    const { id } = req.params;
    db.run('DELETE FROM item_prices WHERE id = ?', [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Price deleted successfully.' });
    });
};
