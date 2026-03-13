const fs = require('fs');
const path = require('path');
const db = require('../database');
const { MAPS } = require('../constants/gameData');
const { mapUploadsDir } = require('../config');

const MAP_IMAGE_PREFIX = '/uploads/maps/';
const MAP_IMAGE_DIR = mapUploadsDir;

const isAdmin = (req) => req.user && req.user.role === 'admin';

const isValidMap = (mapName) => MAPS.includes(mapName);

const deleteImageByUrl = (imageUrl) => {
    if (!imageUrl || !imageUrl.startsWith(MAP_IMAGE_PREFIX)) return;
    const fileName = path.basename(imageUrl);
    const absolutePath = path.join(MAP_IMAGE_DIR, fileName);
    if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
    }
};

const deleteFileIfExists = (filePath) => {
    if (!filePath) return;
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

exports.getMapSettings = (req, res) => {
    db.all('SELECT map_name, image_url, max_x, max_y, updated_at FROM map_settings', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        const rowByMap = new Map(rows.map((row) => [row.map_name, row]));
        const result = MAPS.map((mapName) => {
            const row = rowByMap.get(mapName);
            return {
                map_name: mapName,
                image_url: row?.image_url || null,
                max_x: row?.max_x ?? null,
                max_y: row?.max_y ?? null,
                updated_at: row?.updated_at || null
            };
        });

        res.json(result);
    });
};

exports.updateMapBounds = (req, res) => {
    if (!isAdmin(req)) {
        return res.status(403).json({ error: 'Permission denied.' });
    }

    const { mapName } = req.params;
    if (!isValidMap(mapName)) {
        return res.status(400).json({ error: 'Invalid map_name.' });
    }

    const maxX = Number(req.body.max_x);
    const maxY = Number(req.body.max_y);

    if (!Number.isInteger(maxX) || maxX <= 0 || !Number.isInteger(maxY) || maxY <= 0) {
        return res.status(400).json({ error: 'max_x and max_y must be positive integers.' });
    }

    const query = `INSERT INTO map_settings (map_name, max_x, max_y, updated_at)
                   VALUES (?, ?, ?, CURRENT_TIMESTAMP)
                   ON CONFLICT(map_name) DO UPDATE SET
                   max_x = excluded.max_x,
                   max_y = excluded.max_y,
                   updated_at = CURRENT_TIMESTAMP`;

    db.run(query, [mapName, maxX, maxY], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        db.get(
            'SELECT map_name, image_url, max_x, max_y, updated_at FROM map_settings WHERE map_name = ?',
            [mapName],
            (getErr, row) => {
                if (getErr) return res.status(500).json({ error: getErr.message });
                res.json({ message: 'Map bounds updated successfully.', data: row });
            }
        );
    });
};

exports.uploadMapImage = (req, res) => {
    if (!isAdmin(req)) {
        deleteFileIfExists(req.file?.path);
        return res.status(403).json({ error: 'Permission denied.' });
    }

    const { mapName } = req.params;
    if (!isValidMap(mapName)) {
        deleteFileIfExists(req.file?.path);
        return res.status(400).json({ error: 'Invalid map_name.' });
    }

    if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded.' });
    }

    const imageUrl = `${MAP_IMAGE_PREFIX}${req.file.filename}`;

    db.get('SELECT image_url FROM map_settings WHERE map_name = ?', [mapName], (findErr, existing) => {
        if (findErr) {
            deleteFileIfExists(req.file.path);
            return res.status(500).json({ error: findErr.message });
        }

        const previousImageUrl = existing?.image_url || null;
        const query = `INSERT INTO map_settings (map_name, image_url, updated_at)
                       VALUES (?, ?, CURRENT_TIMESTAMP)
                       ON CONFLICT(map_name) DO UPDATE SET
                       image_url = excluded.image_url,
                       updated_at = CURRENT_TIMESTAMP`;

        db.run(query, [mapName, imageUrl], function (upsertErr) {
            if (upsertErr) {
                deleteFileIfExists(req.file.path);
                return res.status(500).json({ error: upsertErr.message });
            }

            db.get(
                'SELECT map_name, image_url, max_x, max_y, updated_at FROM map_settings WHERE map_name = ?',
                [mapName],
                (getErr, row) => {
                    if (getErr) return res.status(500).json({ error: getErr.message });

                    if (previousImageUrl && previousImageUrl !== imageUrl) {
                        deleteImageByUrl(previousImageUrl);
                    }

                    res.json({ message: 'Map image updated successfully.', data: row });
                }
            );
        });
    });
};
