
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const db = require('./src/database');
const config = require('./src/config');

const app = express();
const clientIndexPath = path.join(config.clientDistDir, 'index.html');

fs.mkdirSync(config.uploadsDir, { recursive: true });
fs.mkdirSync(config.importsDir, { recursive: true });
fs.mkdirSync(config.mapUploadsDir, { recursive: true });

// Middleware
if (!config.isProduction) {
    app.use(cors());
} else if (config.corsOrigins.length > 0) {
    app.use(
        cors({
            origin: (origin, callback) => {
                if (!origin || config.corsOrigins.includes(origin)) {
                    callback(null, true);
                    return;
                }
                callback(new Error('Not allowed by CORS'));
            }
        })
    );
}

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Static files (for uploaded assets)
app.use('/uploads', express.static(config.uploadsDir));

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const recordRoutes = require('./src/routes/recordRoutes');
const priceRoutes = require('./src/routes/priceRoutes');
const mapSettingsRoutes = require('./src/routes/mapSettingsRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/prices', priceRoutes);
app.use('/api/map-settings', mapSettingsRoutes);

if (config.serveClient && fs.existsSync(clientIndexPath)) {
    app.use(express.static(config.clientDistDir));

    app.use((req, res, next) => {
        if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path === '/health') {
            next();
            return;
        }

        res.sendFile(clientIndexPath);
    });
} else {
    app.get('/', (req, res) => {
        res.send('Fantasy Westward Journey Treasure Map Analysis API');
    });
}

app.use((err, req, res, next) => {
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ error: err.message });
    }
    return next(err);
});

const startServer = async () => {
    try {
        await db.ready;
        app.listen(config.port, () => {
            console.log(`Server is running on port ${config.port}`);
        });
    } catch (err) {
        console.error('Server failed to start:', err.message);
        process.exit(1);
    }
};

startServer();
