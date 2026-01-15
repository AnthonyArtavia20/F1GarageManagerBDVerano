// Backend/src/routes/teamsRoutes.js
const express = require('express');
const router = express.Router();
const teamsController = require('../controllers/teamsController');

// GET /api/teams - Obtener todos los equipos
router.get('/', teamsController.getAllTeams);

// GET /api/teams/search?search=red - Buscar equipos
router.get('/search', teamsController.searchTeams);

module.exports = router;