const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

router.get('/:teamId', inventoryController.getTeamInventory);

module.exports = router;
