// backend/src/routes/teamsRoutes.js
const express = require('express');
const router = express.Router();
const teamsController = require('../controllers/teamsController');
const authenticate = require('./middleware/authMiddleware');
const isAdmin = require('../middleware/isAdmin');

// POST /api/teams - Crear nuevo equipo (solo admin) - MUST COME FIRST
router.post('/', authenticate, isAdmin, teamsController.createTeam);

// GET /api/teams - Obtener todos los equipos
router.get('/', teamsController.getAllTeams);

// GET /api/teams/search?search=red - Buscar equipos
router.get('/search', teamsController.searchTeams);

module.exports = router;