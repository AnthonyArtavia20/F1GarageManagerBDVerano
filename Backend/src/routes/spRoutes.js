// backend/src/routes/spRoutes.js
const express = require('express');
const router = express.Router();
const spController = require('../controllers/spController');

// Rutas para equipos
router.get('/teams', spController.getAllTeams);
router.get('/teams/search', spController.searchTeams);

// Rutas para inventario
router.get('/team-inventory/:teamId', spController.getTeamInventory);

// Rutas para configuración de carros
router.get('/car-configuration/:carId', spController.getCarConfiguration);
router.post('/install-part', spController.installPart);
router.post('/replace-part', spController.replacePart);
router.post('/uninstall-part', spController.uninstallPart);
router.get('/car-stats/:carId', spController.getCarStats);
router.get('/validate-part/:carId/:partId', spController.validatePart);

module.exports = router;