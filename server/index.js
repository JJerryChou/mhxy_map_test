
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./src/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Static files (for uploaded CSVs if needed, or frontend build later)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes (Placeholders for now)
app.get('/', (req, res) => {
    res.send('Fantasy Westward Journey Treasure Map Analysis API');
});

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const recordRoutes = require('./src/routes/recordRoutes');
const priceRoutes = require('./src/routes/priceRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/prices', priceRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
