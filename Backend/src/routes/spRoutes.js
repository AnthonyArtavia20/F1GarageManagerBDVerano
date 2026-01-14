/**
 * =======================================================================
 * RUTAS DE STORED PROCEDURES - F1 GARAGE MANAGER
 * =======================================================================
 *
 * Este archivo define todas las rutas (endpoints) relacionadas con
 * la ejecución de Stored Procedures en SQL Server.
 *
 * Arquitectura: REST API con Express.js
 * Base URL: /api/sp/
 * Puerto: 9090
 */

// ============================================================================
// IMPORTACIONES Y CONFIGURACIÓN INICIAL
// ============================================================================

/**
 * Importa Express.js - Framework web para Node.js
 * Express nos permite crear rutas HTTP (GET, POST, PUT, DELETE)
 */
const express = require('express');

/**
 * Crea una instancia de Router de Express
 * El router nos permite definir rutas modulares que luego se montan
 * en la aplicación principal (app.js)
 */
const router = express.Router();

//Importa el controlador de Stored Procedures
// Este controlador contiene la lógica genérica para ejecutar SPs
const spController = require('../controllers/spController');

// ============================================================================
// ENDPOINTS GENÉRICOS (Existentes)
// ============================================================================

router.get('/list', spController.getStoredProcedures); //Lista todos los Stored Procedures disponibles en la base de datos
router.post('/execute', spController.executeStoredProcedure); //Ejecuta cualquier Stored Procedure de forma genérica, para ejecutar cualquier SP desde el frontend

// ============================================================================
// MÓDULOS ESPECÍFICOS - Importación
// ============================================================================

// MÓDULO ARMADO: ENDPOINTS ESPECÍFICOS - Encargado: Anthony :b
require('./Modules/CarAssembly')(router);

// Aquí se agregarán más módulos conforme el equipo los desarrolle
// Ejemplo:
// require('./Modules/CarrerasModule')(router);
// require('./Modules/InventarioModule')(router);

// ============================================================================
// EXPORTACIÓN DEL MÓDULO
// ============================================================================

/**
 * Exporta el router para que pueda ser importado en app.js
 * En app.js se monta con: app.use('/api/sp', spRoutes);
 * Esto hace que todas estas rutas estén disponibles bajo /api/sp/
 */
module.exports = router;