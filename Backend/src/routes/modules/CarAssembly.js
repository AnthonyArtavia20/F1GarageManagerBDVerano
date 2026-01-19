// ============================================================================
// MÓDULO ARMADO: ENDPOINTS ESPECÍFICOS - Encargado: Anthony :b
// ============================================================================
/**
 * =============================================================================
 * FUNCIONALIDADES DEL MÓDULO ARMADO:
 * - Instalar partes en autos
 * - Reemplazar partes existentes
 * - Calcular estadísticas automáticas (Power/Aerodynamics/Maneuverability)
 * - Validar compatibilidad de partes
 *
 * Estos endpoints llaman directamente a SPs específicos en lugar de usar
 * el endpoint genérico, para mayor claridad y control.
 * =============================================================================
 */

module.exports = (router) => {

/**
 * POST /api/sp/install-part
 * Instala una nueva parte en un auto
 */
router.post('/install-part', async (req, res) => {
try {
    const { carId, partId, teamId } = req.body;

    if (!carId || !partId || !teamId) {
        return res.status(400).json({ error: 'carId, partId, teamId requeridos' });
    }

    const pool = await require('../../config/database').mssqlConnect();

    const result = await pool.request()
        .input('Car_id', require('../../config/database').sql.Int, carId)
        .input('Part_id', require('../../config/database').sql.Int, partId)
        .input('Team_id', require('../../config/database').sql.Int, teamId)
        .execute('sp_InstallPart');

    res.json({ success: true, message: 'Parte instalada exitosamente' });
    } catch (error) {
    res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/sp/replace-part
 * Reemplaza una parte existente en un auto por otra nueva
 */
router.post('/replace-part', async (req, res) => {
try {
    const { carId, oldPartId, newPartId, teamId } = req.body;
    
    if (!carId || !oldPartId || !newPartId || !teamId) {
        return res.status(400).json({ error: 'carId, oldPartId, newPartId, teamId requeridos' });
    }
    
    const pool = await require('../../config/database').mssqlConnect();

    const result = await pool.request()
        .input('Car_id', require('../../config/database').sql.Int, carId)
        .input('OldPart_id', require('../../config/database').sql.Int, oldPartId)
        .input('NewPart_id', require('../../config/database').sql.Int, newPartId)
        .input('Team_id', require('../../config/database').sql.Int, teamId)
        .execute('sp_ReplacePart');

    res.json({ success: true, message: 'Parte reemplazada exitosamente' });
    } catch (error) {
    res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/sp/car-stats/:carId
 * Calcula y retorna las estadísticas actuales de un auto
 */
router.get('/car-stats/:carId', async (req, res) => {
try {
    const { carId } = req.params;
    const pool = await require('../../config/database').mssqlConnect();

    const result = await pool.request()
        .input('Car_id', require('../../config/database').sql.Int, parseInt(carId))
        .execute('sp_CalculateCarStats');
        
    res.json({ success: true, stats: result.recordset[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/sp/validate-part/:carId/:partId
 * Valida si una parte puede instalarse en un auto específico
 */
router.get('/validate-part/:carId/:partId', async (req, res) => {
try {
    const { carId, partId } = req.params;
    const pool = await require('../../config/database').mssqlConnect();
    
    const result = await pool.request()
        .input('Car_id', require('../../config/database').sql.Int, parseInt(carId))
        .input('Part_id', require('../../config/database').sql.Int, parseInt(partId))
        .execute('sp_ValidatePartCompatibility');

    res.json({ success: true, validation: result.recordset[0] });
    } catch (error) {
    res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/sp/car-parts/:carId
 * Obtiene la lista de partes instaladas en un carro (con nombres)
 */
router.get('/car-parts/:carId', async (req, res) => {
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
    res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/sp/uninstall-part
 * Desinstala una parte del auto y la devuelve al inventario
 */
router.post('/uninstall-part', async (req, res) => {
    try {
        const { carId, partId, teamId } = req.body;
        
        if (!carId || !partId || !teamId) {
            return res.status(400).json({ error: 'carId, partId, teamId requeridos' });
        }
        
        const pool = await require('../../config/database').mssqlConnect();
        
        // Obtener categoría de la parte
        const partInfo = await pool.request()
            .input('Part_id', require('../../config/database').sql.Int, partId)
            .query('SELECT Category FROM PART WHERE Part_id = @Part_id');
        
        if (partInfo.recordset.length === 0) {
            return res.status(404).json({ error: 'Parte no encontrada' });
        }
        
        const category = partInfo.recordset[0].Category;
        
        // Eliminar de CAR_CONFIGURATION
        await pool.request()
            .input('Car_id', require('../../config/database').sql.Int, carId)
            .input('Part_Category', require('../../config/database').sql.VarChar, category)
            .query('DELETE FROM CAR_CONFIGURATION WHERE Car_id = @Car_id AND Part_Category = @Part_Category');
        
        // Devolver al inventario
        const inventoryInfo = await pool.request()
            .input('Team_id', require('../../config/database').sql.Int, teamId)
            .query('SELECT Inventory_id FROM INVENTORY WHERE Team_id = @Team_id');
        
        const inventoryId = inventoryInfo.recordset[0].Inventory_id;
        
        // Verificar si ya existe en inventario
        const existingPart = await pool.request()
            .input('Inventory_id', require('../../config/database').sql.Int, inventoryId)
            .input('Part_id', require('../../config/database').sql.Int, partId)
            .query('SELECT Quantity FROM INVENTORY_PART WHERE Inventory_id = @Inventory_id AND Part_id = @Part_id');
        
        if (existingPart.recordset.length > 0) {
            // Incrementar cantidad
            await pool.request()
                .input('Inventory_id', require('../../config/database').sql.Int, inventoryId)
                .input('Part_id', require('../../config/database').sql.Int, partId)
                .query('UPDATE INVENTORY_PART SET Quantity = Quantity + 1 WHERE Inventory_id = @Inventory_id AND Part_id = @Part_id');
        } else {
            // Agregar al inventario
            await pool.request()
                .input('Inventory_id', require('../../config/database').sql.Int, inventoryId)
                .input('Part_id', require('../../config/database').sql.Int, partId)
                .query('INSERT INTO INVENTORY_PART (Inventory_id, Part_id, Quantity) VALUES (@Inventory_id, @Part_id, 1)');
        }
        
        res.json({ success: true, message: 'Parte desinstalada exitosamente' });
    } catch (error) {
        console.error('Error en uninstall-part:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/sp/team-inventory/:teamId
 * Obtiene el inventario de un equipo CON NOMBRES de las partes
 */
router.get('/team-inventory/:teamId', async (req, res) => {
    try {
        const { teamId } = req.params;
        const pool = await require('../../config/database').mssqlConnect();
        
        // Query SQL directo que obtiene datos de INVENTORY_PART + PART
        const result = await pool.request()
            .input('Team_id', require('../../config/database').sql.Int, parseInt(teamId))
            .query(`
                SELECT 
                    p.Part_id,
                    p.Name,
                    p.Category,
                    p.Price,
                    ip.Quantity AS Stock,
                    p.p,
                    p.a,
                    p.m
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
        console.error('Error en team-inventory:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * NUEVO ENDPOINT para obtener la config del carro: GET /api/sp/car-configuration/:carId
 * Obtiene la configuración actual del carro CON NOMBRES Y STATS (p, a, m)
 */
router.get('/car-configuration/:carId', async (req, res) => {
    try {
        const { carId } = req.params;
        const pool = await require('../../config/database').mssqlConnect();
        
        // Query que obtiene Part_Category, Part_id, Name Y p, a, m
        const result = await pool.request()
            .input('Car_id', require('../../config/database').sql.Int, parseInt(carId))
            .query(`
                SELECT 
                    cc.Part_Category,
                    cc.Part_id,
                    p.Name AS Part_Name,
                    p.p,
                    p.a,
                    p.m
                FROM CAR_CONFIGURATION cc
                INNER JOIN PART p ON cc.Part_id = p.Part_id
                WHERE cc.Car_id = @Car_id
            `);
        
        res.json({ 
            success: true, 
            parts: result.recordset 
        });
    } catch (error) {
        console.error('Error en car-configuration:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

};