const express = require('express');
const router = express.Router();
const sponsorsController = require('../controllers/sponsorsController');

// ========== RUTAS DE PATROCINADORES ==========

// GET /api/sponsors - Obtener todos los patrocinadores
router.get('/', sponsorsController.getAllSponsors);

// POST /api/sponsors - Crear nuevo patrocinador
router.post('/', sponsorsController.createSponsor);

// GET /api/sponsors/:sponsorId/stats - Obtener estadísticas de un sponsor
router.get('/:sponsorId/stats', sponsorsController.getSponsorStats);

// ========== RUTAS DE APORTES ==========

// GET /api/sponsors/contributions/:teamId - Obtener aportes de un equipo
router.get('/contributions/:teamId', sponsorsController.getTeamContributions);

// POST /api/sponsors/contributions - Registrar nuevo aporte
router.post('/contributions', sponsorsController.createContribution);

// ========== RUTAS DE PRESUPUESTO ==========

// GET /api/sponsors/budget/:teamId - Calcular presupuesto de un equipo
router.get('/budget/:teamId', sponsorsController.getTeamBudget);

// POST /api/sponsors/budget/recalculate - Recalcular todos los presupuestos (admin)
router.post('/budget/recalculate', sponsorsController.recalculateAllBudgets);

module.exports = router;