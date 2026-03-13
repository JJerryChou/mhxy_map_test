const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const authMiddleware = require('../middleware/auth');
const mapSettingsController = require('../controllers/mapSettingsController');
const { MAPS } = require('../constants/gameData');
const { mapUploadsDir } = require('../config');

const router = express.Router();

fs.mkdirSync(mapUploadsDir, { recursive: true });

const allowedMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);
const mimeToExt = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp'
};

const getFileExtension = (file) => {
    const originalExt = path.extname(file.originalname).toLowerCase();
    if (originalExt) return originalExt;
    return mimeToExt[file.mimetype] || '.png';
};

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, mapUploadsDir),
        filename: (req, file, cb) => {
            const mapName = req.params.mapName;
            const mapIndex = MAPS.indexOf(mapName);
            const ext = getFileExtension(file);
            cb(null, `map-${mapIndex + 1}${ext}`);
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!allowedMimeTypes.has(file.mimetype)) {
            return cb(new Error('仅支持 PNG、JPG、WEBP 图片。'));
        }
        cb(null, true);
    }
});

const ensureMapName = (req, res, next) => {
    const { mapName } = req.params;
    if (!MAPS.includes(mapName)) {
        return res.status(400).json({ error: 'Invalid map_name.' });
    }
    next();
};

const handleImageUpload = (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (!err) return next();
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: '图片大小不能超过 5MB。' });
            }
            return res.status(400).json({ error: err.message });
        }
        return res.status(400).json({ error: err.message });
    });
};

router.get('/', authMiddleware, mapSettingsController.getMapSettings);
router.put('/:mapName', authMiddleware, ensureMapName, mapSettingsController.updateMapBounds);
router.post('/:mapName/image', authMiddleware, ensureMapName, handleImageUpload, mapSettingsController.uploadMapImage);

module.exports = router;
