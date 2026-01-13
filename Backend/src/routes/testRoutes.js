const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');

router.get('/', (req, res) => {
  res.json({
    message: 'F1 Garage Test API',
    available_endpoints: {
      'GET /connection': 'Test database connection',
      'POST /api': 'Test API with data',
      'POST /all': 'Test all connections'
    },
    timestamp: new Date().toISOString()
  });
});

router.get('/connection', testController.testConnection);

router.post('/api', testController.testAPI);

router.post('/all', testController.testAll);

module.exports = router;
