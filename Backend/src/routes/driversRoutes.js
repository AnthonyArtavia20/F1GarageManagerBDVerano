const express = require('express');
const router = express.Router();

const {
  getDrivers,
  createDriver,
} = require('../controllers/driversController');

const authenticate = require('./middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');

// Todos los roles
router.get('/', authenticate, getDrivers);

// Solo Admin
router.post('/', authenticate, isAdmin, createDriver);

module.exports = router;
