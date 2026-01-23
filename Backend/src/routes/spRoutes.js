// backend/src/routes/spRoutes.js
const express = require('express');
const router = express.Router();
const spController = require('../controllers/spController');

// Rutas generales de SP
router.get('/procedures', spController.getStoredProcedures);
router.post('/execute', spController.executeStoredProcedure);

// Rutas para equipos
router.get('/teams', spController.getAllTeams);
router.get('/teams/search', spController.searchTeams);

// Rutas para inventario
router.get('/team-inventory/:teamId', spController.getTeamInventory);

//Elimié de aquí las rutas de los endpoints de CarAssembly que iban hacia spController puesto que mi backend 
// ya los maneja, estaban repetidos acá.

module.exports = router;