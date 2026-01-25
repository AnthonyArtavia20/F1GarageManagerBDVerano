const express = require('express');
const router = express.Router();
const circuitsController = require('../controllers/circuitsController');

// ============================================================================
// RUTAS DE CIRCUITOS
// ============================================================================

// GET - Obtener todos los circuitos
router.get('/', circuitsController.getAllCircuits);

// GET - Obtener circuito por ID
router.get('/:id', circuitsController.getCircuitById);

// POST - Crear nuevo circuito
router.post('/', circuitsController.createCircuit);

// PUT - Actualizar circuito
router.put('/:id', circuitsController.updateCircuit);

// DELETE - Eliminar circuito
router.delete('/:id', circuitsController.deleteCircuit);

// GET - Validar circuito para simulación
router.get('/:id/validate', circuitsController.validateCircuit);

module.exports = router;