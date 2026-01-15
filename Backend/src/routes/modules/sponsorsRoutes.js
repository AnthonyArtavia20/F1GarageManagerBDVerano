// ============================================================================
// MÓDULO SPONSORS: Gestión de patrocinadores y aportes
// ============================================================================

const sponsorsController = require('../../controllers/sponsorsController');

module.exports = (router) => {

// ========== RUTAS DE PATROCINADORES ==========

// GET /api/sp/sponsors - Obtener todos los patrocinadores
router.get('/sponsors', sponsorsController.getAllSponsors);

// POST /api/sp/sponsors - Crear nuevo patrocinador
router.post('/sponsors', sponsorsController.createSponsor);

// GET /api/sp/sponsors/:sponsorId/stats - Obtener estadísticas de un sponsor
router.get('/sponsors/:sponsorId/stats', sponsorsController.getSponsorStats);

// ========== RUTAS DE APORTES ==========

// GET /api/sp/sponsors/contributions/:teamId - Obtener aportes de un equipo
router.get('/sponsors/contributions/:teamId', sponsorsController.getTeamContributions);

// POST /api/sp/sponsors/contributions - Registrar nuevo aporte
router.post('/sponsors/contributions', sponsorsController.createContribution);

// ========== RUTAS DE PRESUPUESTO ==========

// GET /api/sp/sponsors/budget/:teamId - Calcular presupuesto de un equipo
router.get('/sponsors/budget/:teamId', sponsorsController.getTeamBudget);

// POST /api/sp/sponsors/budget/recalculate - Recalcular todos los presupuestos (admin)
router.post('/sponsors/budget/recalculate', sponsorsController.recalculateAllBudgets);

};