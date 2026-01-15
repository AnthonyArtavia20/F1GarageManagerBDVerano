// ============================================================================
// MÓDULO TEAMS: Gestión de equipos
// ============================================================================

const teamsController = require('../../controllers/teamsController');

module.exports = (router) => {

// GET /api/sp/teams - Obtener todos los equipos
router.get('/teams', teamsController.getAllTeams);

// GET /api/sp/teams/search?search=red - Buscar equipos
router.get('/teams/search', teamsController.searchTeams);

};