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
 *
 * Método: POST, Body esperado: { carId: number, partId: number, teamId: number }
 * Validaciones realizadas:
 *   - Verifica que la parte existe en tabla PART, Verifica stock disponible en INVENTORY, Verifica presupuesto disponible del equipo, Verifica compatibilidad de categoría
 *   - Instala parte (INSERT en CAR_CONFIGURATION), Actualiza inventario (UPDATE INVENTORY), Recalcula estadísticas del auto
 * Respuesta exitosa: { success: true, message: "Parte instalada exitosamente" }
 * Respuesta error: { error: "mensaje descriptivo del error" }
 */
router.post('/install-part', async (req, res) => {
try {
    // Extrae parámetros del body de la petición HTTP
    const { carId, partId, teamId } = req.body;
    // Validación básica de parámetros requeridos, Si falta algún parámetro, retorna error 400 (Bad Request)
    if (!carId || !partId || !teamId) {
        return res.status(400).json({ error: 'carId, partId, teamId requeridos' });
    }
    const pool = await require('../../config/database').mssqlConnect(); // Establece conexión con SQL Server usando configuración centralizada

    // Prepara la ejecución del Stored Procedure
    // .request() crea una nueva petición SQL
    // .input() define cada parámetro con su tipo de dato
    const result = await pool.request()
      .input('Car_id', require('../../config/database').sql.Int, carId)      // ID del auto
      .input('Part_id', require('../../config/database').sql.Int, partId)    // ID de la parte a instalar
      .input('Team_id', require('../../config/database').sql.Int, teamId)    // ID del equipo (para presupuesto)
      .execute('sp_InstallPart');  // Ejecuta el SP específico

    res.json({ success: true, message: 'Parte instalada exitosamente' }); // Si todo sale bien, retorna éxito
    } catch (error) {
    res.status(500).json({ error: error.message }); // Si ocurre cualquier error (validación, conexión, etc.) Retorna error 500 (Internal Server Error) con mensaje del error
    }
});

/**
 * POST /api/sp/replace-part
 * Reemplaza una parte existente en un auto por otra nueva
 *
 * Método: POST, Body esperado: { carId: number, oldPartId: number, newPartId: number, teamId: number }
 * Validaciones realizadas:
 *   - Verifica que la parte antigua esté instalada en el auto, Verifica que la nueva parte existe y hay stock, Verifica presupuesto para la diferencia de costo
 *   - Verifica compatibilidad de categoría, Reemplaza parte (UPDATE en CAR_CONFIGURATION), Actualiza inventario (devuelve antigua, consume nueva), Recalcula estadísticas del auto
 * Respuesta exitosa: { success: true, message: "Parte reemplazada exitosamente" }
 */
router.post('/replace-part', async (req, res) => {
try {
    const { carId, oldPartId, newPartId, teamId } = req.body;//Extrae los 4 parámetros requeridos del body
    if (!carId || !oldPartId || !newPartId || !teamId) {// Validación de parámetros obligatorios
        return res.status(400).json({ error: 'carId, oldPartId, newPartId, teamId requeridos' });
    }
    const pool = await require('../../config/database').mssqlConnect(); // Conexión a base de datos
    const result = await pool.request() // Ejecuta SP de reemplazo con 4 parámetros
        .input('Car_id', require('../../config/database').sql.Int, carId)        // Auto objetivo
        .input('OldPart_id', require('../../config/database').sql.Int, oldPartId) // Parte a quitar
        .input('NewPart_id', require('../../config/database').sql.Int, newPartId) // Parte a poner
        .input('Team_id', require('../../config/database').sql.Int, teamId)      // Equipo (presupuesto)
        .execute('sp_ReplacePart');

    res.json({ success: true, message: 'Parte reemplazada exitosamente' });
    } catch (error) {
    res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/sp/car-stats/:carId
 * Calcula y retorna las estadísticas actuales de un auto
 * Método: GET (solo lectura, no modifica datos), Parámetros: carId en la URL (ej: /api/sp/car-stats/1)
 * Lógica: Suma los valores P/A/M de todas las partes instaladas en el auto
 * Respuesta: { success: true, stats: { Power: 150, Aerodynamics: 120, Maneuverability: 130, TotalPerformance: 400 } }, Uso típico: Se llama después de instalar/reemplazar partes para actualizar la UI
 */
router.get('/car-stats/:carId', async (req, res) => {
try {
    const { carId } = req.params;// Extrae carId de los parámetros de la URL
    const pool = await require('../../config/database').mssqlConnect();// Conexión a BD
    // Ejecuta SP que calcula estadísticas, parseInt() convierte string de URL a número
    const result = await pool.request()
        .input('Car_id', require('../../config/database').sql.Int, parseInt(carId))
        .execute('sp_CalculateCarStats');
    res.json({ success: true, stats: result.recordset[0] }); //Retorna las estadísticas calculadas, result.recordset[0] contiene la fila de resultado del SP
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/sp/validate-part/:carId/:partId, Valida si una parte puede instalarse en un auto específico
 * Método: GET (solo lectura), Parámetros: carId y partId en la URL (ej: /api/sp/validate-part/1/5)
 * Validaciones realizadas: Verifica que el auto existe, Verifica que la parte existe, Verifica compatibilidad de categoría, Verifica que no haya conflicto con partes ya instaladas
 * Respuesta: { success: true, validation: { Status: "VALID"|"INVALID", Message: "descripción" } }, Uso típico: Antes de mostrar opción de instalar, para deshabilitar partes incompatibles
 */
router.get('/validate-part/:carId/:partId', async (req, res) => {
try {
    const { carId, partId } = req.params;// Extrae ambos IDs de la URL
    const pool = await require('../../config/database').mssqlConnect();// Conexión a BD
    const result = await pool.request()    // Ejecuta SP de validación
        .input('Car_id', require('../../config/database').sql.Int, parseInt(carId))
        .input('Part_id', require('../../config/database').sql.Int, parseInt(partId))
        .execute('sp_ValidatePartCompatibility');
    res.json({ success: true, validation: result.recordset[0] });    // Retorna resultado de validación
    } catch (error) {
    res.status(500).json({ error: error.message });
    }
});

 // * GET /api/sp/car-parts/:carId,  * Obtiene la lista de partes instaladas en un carro (con nombres)
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

// ---------------EndPoints finales para la parte de configuración del Carro---------------

/**
 * ENDPOINT: GET /api/sp/team-inventory/:teamId
 * Obtiene el inventario de un equipo CON NOMBRES de las partes,
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
        console.error('Error a la hora de obtener el inventario de un equipo(Con nombres de las piezas):', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

/**
 * ENDPOINT: GET /api/sp/car-configuration/:carId
 * Obtiene la configuración actual del carro CON NOMBRES
 */
router.get('/car-configuration/:carId', async (req, res) => {
    try {
        const { carId } = req.params;
        const pool = await require('../../config/database').mssqlConnect();
        
        // Query que obtiene Part_Category, Part_id Y Name
        const result = await pool.request()
            .input('Car_id', require('../../config/database').sql.Int, parseInt(carId))
            .query(`
                SELECT 
                    cc.Part_Category,
                    cc.Part_id,
                    p.Name AS Part_Name
                FROM CAR_CONFIGURATION cc
                INNER JOIN PART p ON cc.Part_id = p.Part_id
                WHERE cc.Car_id = @Car_id
            `);
        res.json({ 
            success: true, 
            parts: result.recordset 
        });
    } catch (error) {
        console.error('Error a la hora de obtener la configuración actual de un carro(Con nombres):', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});
};