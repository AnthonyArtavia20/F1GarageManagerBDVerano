const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');

// Test de conexión a base de datos
router.get('/connection', testController.testConnection);

// Test de API (recibe datos del frontend)
router.post('/api', testController.testAPI);

// Test completo (BD + API)
router.post('/all', testController.testAll);

module.exports = router;
