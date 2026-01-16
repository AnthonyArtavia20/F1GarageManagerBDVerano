// ============================================================================
// MÓDULO TEAMS: Gestión de equipos
// ============================================================================

const teamsController = require('../../controllers/teamsController');

module.exports = (router) => {

// GET /api/sp/teams - Obtener todos los equipos
router.get('/teams', teamsController.getAllTeams);

// GET /api/sp/teams/search?search=red - Buscar equipos
router.get('/teams/search', teamsController.searchTeams);

// ============================================================================
// ENDPOINTS ADICIONALES PARA CAR ASSEMBLY
// ============================================================================

/**
 * GET /api/sp/team-inventory/:teamId
 * Obtiene el inventario de partes de un equipo
 */
router.get('/team-inventory/:teamId', async (req, res) => {
    try {
        const { teamId } = req.params;
        const pool = await require('../../config/database').mssqlConnect();
    
    // Obtener partes del inventario del equipo con sus atributos
        const result = await pool.request()
        .input('Team_id', require('../../config/database').sql.Int, parseInt(teamId))
        .query(`
            SELECT 
            p.Part_id,
            p.Category,
            p.Price,
            p.Stock,
            p.p,
            p.a,
            p.m,
            ip.Quantity
        FROM INVENTORY i
        INNER JOIN INVENTORY_PART ip ON i.Inventory_id = ip.Inventory_id
        INNER JOIN PART p ON ip.Part_id = p.Part_id
        WHERE i.Team_id = @Team_id AND ip.Quantity > 0
        ORDER BY p.Category, p.Part_id
        `);
    
    res.json({ 
        success: true, 
        data: result.recordset 
    });
    } catch (error) {
        console.error('Error al obtener inventario:', error);
        res.status(500).json({ 
        success: false,
        error: error.message 
        });
    }
});

/**
 * GET /api/sp/car-configuration/:carId
 * Obtiene la configuración actual de partes de un carro
 */
router.get('/car-configuration/:carId', async (req, res) => {
    try {
        const { carId } = req.params;
        const pool = await require('../../config/database').mssqlConnect();
    
        const result = await pool.request()
        .input('Car_id', require('../../config/database').sql.Int, parseInt(carId))
        .execute('sp_GetCarConfiguration');
    
        res.json({ 
        success: true, 
        parts: result.recordset 
        });
    } catch (error) {
        console.error('Error al obtener configuración:', error);
        res.status(500).json({ 
        success: false,
        error: error.message 
        });
    }
});

};