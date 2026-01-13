const express = require('express');
const router = express.Router();
const spController = require('../controllers/spController');

// GET - List Stored Procedures
router.get('/list', spController.getStoredProcedures);

// POST - Execute Stored Procedures
router.post('/execute', spController.executeStoredProcedure);

module.exports = router;
