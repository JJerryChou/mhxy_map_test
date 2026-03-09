
const express = require('express');
const router = express.Router();
const priceController = require('../controllers/priceController');
const authMiddleware = require('../middleware/auth');

router.get('/', authMiddleware, priceController.getAllPrices);
router.post('/', authMiddleware, priceController.upsertPrice);
router.delete('/:id', authMiddleware, priceController.deletePrice);

module.exports = router;
