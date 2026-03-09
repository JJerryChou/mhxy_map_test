
const express = require('express');
const router = express.Router();
const recordController = require('../controllers/recordController');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Public (or authenticated?) - Requirement: "All users can see all data". 
// Let's require auth for consistency, or strictly follow "All users to see". 
// Usually read-only might be public or auth-only. Given "Mobile H5", likely need auth or at least a user context.
// Let's enforce auth for everything for now, as User System is requested.

router.post('/', authMiddleware, recordController.createRecord);
router.post('/batch', authMiddleware, recordController.batchCreateRecords);
router.put('/:id', authMiddleware, recordController.updateRecord);
router.delete('/all', authMiddleware, recordController.clearAllRecords);
router.delete('/:id', authMiddleware, recordController.deleteRecord);
router.get('/', authMiddleware, recordController.getRecords); // List

router.post('/import/parse', authMiddleware, upload.single('file'), recordController.parseImport);

// Prediction might be public or auth?
router.get('/predict', authMiddleware, recordController.predict);

module.exports = router;
