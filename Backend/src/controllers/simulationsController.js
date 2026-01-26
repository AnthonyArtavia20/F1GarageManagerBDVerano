// controllers/simulationsController.js
const sql = require('mssql');
const { mssqlConnect } = require('../config/database');

// ============================================================================
// GET - Obtener historial de simulaciones
// ============================================================================
const getSimulationHistory = async (req, res) => {
    try {
        const { limit = 50 } = req.query;
        const pool = await mssqlConnect();
        
        const result = await pool.request()
            .input('Limit', sql.Int, parseInt(limit))
            .execute('sp_GetSimulationHistory');
        
        res.json({
            success: true,
            data: result.recordset,
            count: result.recordset.length
        });
    } catch (error) {
        console.error('❌ Error al obtener historial de simulaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener historial de simulaciones',
            error: error.message
        });
    }
};

// ============================================================================
// GET - Obtener carros disponibles para simulación
// ============================================================================
const getAvailableCars = async (req, res) => {
    try {
        const { teamId } = req.query;
        const pool = await mssqlConnect();
        
        const result = await pool.request()
            .input('Team_id', sql.Int, teamId || null)
            .execute('sp_GetAvailableCarsForSimulation');
        
        // Agrupar por equipo para mejor visualización
        const carsByTeam = {};
        result.recordset.forEach(car => {
            if (!carsByTeam[car.Team_id]) {
                carsByTeam[car.Team_id] = {
                    teamId: car.Team_id,
                    teamName: car.Team_Name,
                    cars: []
                };
            }
            
            carsByTeam[car.Team_id].cars.push({
                carId: car.Car_id,
                teamId: car.Team_id,
                teamName: car.Team_Name,
                installedCategories: car.Installed_Categories,
                isFinalized: true,
                driverId: car.Driver_id,
                driverName: car.Driver_Name,
                driverH: car.Driver_H,
                totalP: car.Total_P || 0,
                totalA: car.Total_A || 0,
                totalM: car.Total_M || 0
            });
        });
        
        const teams = Object.values(carsByTeam);
        
        res.json({
            success: true,
      data: {
        cars: result.recordset.map(car => ({
          ...car,
          isFinalized: true 
        })),
        teams: teams
            },
            count: result.recordset.length
        });
    } catch (error) {
        console.error('❌ Error al obtener carros disponibles:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener carros disponibles',
            error: error.message
        });
    }
};

// ============================================================================
// GET - Obtener circuito por ID para simulación
// ============================================================================
const getCircuitForSimulation = async (req, res) => {
    try {
        const { id } = req.params;
        const { dc = 0.5 } = req.query;
        const pool = await mssqlConnect();
        
        // Validar circuito
        const result = await pool.request()
            .input('Circuit_id', sql.Int, id)
            .input('dc', sql.Decimal(10, 2), dc)
            .execute('sp_ValidateCircuitForSimulation');
        
        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Circuito no encontrado'
            });
        }
        
        const circuitData = result.recordset[0];
        
        res.json({
            success: true,
            data: {
                ...circuitData,
                isValid: circuitData.IsValid === 1 || circuitData.IsValid === true
            }
        });
    } catch (error) {
        console.error('❌ Error al obtener circuito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener circuito',
            error: error.message
        });
    }
};

// ============================================================================
// GET - Obtener resultados de simulación
// ============================================================================
const getSimulationResults = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await mssqlConnect();
        
        const result = await pool.request()
            .input('Simulation_id', sql.Int, id)
            .execute('sp_GetSimulationResults');
        
        if (result.recordsets.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Simulación no encontrada'
            });
        }
        
        const [simulationInfo, participants, setupDetails] = result.recordsets;
        
        res.json({
            success: true,
            data: {
                simulation: simulationInfo[0] || {},
                participants: participants || [],
                setupDetails: setupDetails || []
            }
        });
    } catch (error) {
        console.error('❌ Error al obtener resultados:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener resultados de simulación',
            error: error.message
        });
    }
};

// ============================================================================
// GET - Validar carro para simulación
// ============================================================================
const validateCar = async (req, res) => {
    try {
        const { carId } = req.params;
        const pool = await mssqlConnect();
        
        const result = await pool.request()
            .input('Car_id', sql.Int, carId)
            .output('IsValid', sql.Bit)
            .output('Message', sql.NVarChar(500))
            .output('Total_P', sql.Int)
            .output('Total_A', sql.Int)
            .output('Total_M', sql.Int)
            .execute('sp_ValidateCarForSimulation');
        
        const isValid = result.output.IsValid;
        const message = result.output.Message;
        const totalP = result.output.Total_P;
        const totalA = result.output.Total_A;
        const totalM = result.output.Total_M;
        
        // Obtener detalles del setup si es válido
        let setupDetails = [];
        if (isValid) {
            const setupResult = await pool.request()
                .input('Car_id', sql.Int, carId)
                .execute('sp_GetCarSetupDetails');
            
            setupDetails = setupResult.recordset;
        }
        
        res.json({
            success: true,
            data: {
                carId: parseInt(carId),
                isValid: isValid === 1 || isValid === true,
                message: message,
                totals: {
                    P: totalP,
                    A: totalA,
                    M: totalM
                },
                setupDetails: setupDetails
            }
        });
    } catch (error) {
        console.error('❌ Error al validar carro:', error);
        res.status(500).json({
            success: false,
            message: 'Error al validar carro',
            error: error.message
        });
    }
};

// ============================================================================
// GET - Estadísticas por circuito
// ============================================================================
const getCircuitStatistics = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await mssqlConnect();
        
        const result = await pool.request()
            .input('Circuit_id', sql.Int, id)
            .execute('sp_GetCircuitStatistics');
        
        if (result.recordsets.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Circuito no encontrado'
            });
        }
        
        const [circuitStats, topTimes] = result.recordsets;
        
        res.json({
            success: true,
            data: {
                circuit: circuitStats[0] || {},
                topTimes: topTimes || []
            }
        });
    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas del circuito',
            error: error.message
        });
    }
};

// ============================================================================
// POST - Ejecutar nueva simulación
// ============================================================================
const runSimulation = async (req, res) => {
    try {
        const { circuitId, carIds, dc = 0.5 } = req.body;
        const userId = req.session.user?.userId; // Cambiado de adminId a userId
        
        console.log('🚀 Iniciando simulación con datos:', { circuitId, carIds, dc, userId });
        
        // Validaciones básicas
        if (!circuitId) {
            return res.status(400).json({
                success: false,
                message: 'El ID del circuito es requerido'
            });
        }
        
        if (!carIds || !Array.isArray(carIds) || carIds.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren al menos 2 carros para la simulación'
            });
        }
        
        if (carIds.length > 10) {
            return res.status(400).json({
                success: false,
                message: 'Máximo 10 carros por simulación'
            });
        }
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'No autorizado. Se requiere inicio de sesión'
            });
        }
        
        // VERIFICACIÓN OPCIONAL: Solo chequear que el usuario existe
        // Ya no verificamos si es admin
        const pool = await mssqlConnect();
        const userCheck = await pool.request()
            .input('User_id', sql.Int, userId)
            .query('SELECT User_id FROM [USER] WHERE User_id = @User_id');
        
        if (userCheck.recordset.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        // Convertir array a string separado por comas
        const carIdsString = carIds.join(',');
        
        // Ejecutar simulación - AHORA USA userId DIRECTAMENTE
        const result = await pool.request()
            .input('Circuit_id', sql.Int, circuitId)
            .input('Admin_id', sql.Int, userId) // Usamos userId aunque se llame Admin_id
            .input('Car_ids', sql.NVarChar(sql.MAX), carIdsString)
            .input('dc', sql.Decimal(10, 2), dc)
            .output('Success', sql.Bit)
            .output('Message', sql.NVarChar(500))
            .output('Simulation_id', sql.Int)
            .execute('sp_RunSimulation');
        
        const success = result.output.Success;
        const message = result.output.Message;
        const simulationId = result.output.Simulation_id;
        
        if (success) {
            console.log('✅ Simulación ejecutada exitosamente. ID:', simulationId);
            
            // Obtener resultados completos
            const results = await pool.request()
                .input('Simulation_id', sql.Int, simulationId)
                .execute('sp_GetSimulationResults');
            
            const [simulationInfo, participants, setupDetails] = results.recordsets;
            
            res.status(201).json({
                success: true,
                message: message,
                data: {
                    simulationId: simulationId,
                    simulation: simulationInfo[0] || {},
                    participants: participants || [],
                    setupDetails: setupDetails || []
                }
            });
        } else {
            console.error('❌ Error en simulación:', message);
            res.status(400).json({
                success: false,
                message: message
            });
        }
    } catch (error) {
        console.error('❌ Error al ejecutar simulación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al ejecutar simulación',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// ============================================================================
// DELETE - Eliminar simulación
// ============================================================================
const deleteSimulation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.user?.userId;
        
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'No autorizado'
            });
        }
        
        const pool = await mssqlConnect();
        
        // Verificar permisos: solo admin o el creador puede eliminar
        const checkPermission = await pool.request()
            .input('Simulation_id', sql.Int, id)
            .input('User_id', sql.Int, userId)
            .query(`
                SELECT 
                    s.Created_by_admin_id,
                    (SELECT 1 FROM ADMIN WHERE User_id = @User_id) AS IsAdmin
                FROM SIMULATION s
                WHERE s.Simulation_id = @Simulation_id
            `);
        
        if (checkPermission.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Simulación no encontrada'
            });
        }
        
        const canDelete = checkPermission.recordset[0].Created_by_admin_id === userId || 
                         checkPermission.recordset[0].IsAdmin === 1;
        
        if (!canDelete) {
            return res.status(403).json({
                success: false,
                message: 'No tiene permisos para eliminar esta simulación'
            });
        }
        
        const result = await pool.request()
            .input('Simulation_id', sql.Int, id)
            .input('Admin_id', sql.Int, userId)
            .output('Success', sql.Bit)
            .output('Message', sql.NVarChar(500))
            .execute('sp_DeleteSimulation');
        
        const success = result.output.Success;
        const message = result.output.Message;
        
        if (success) {
            res.json({
                success: true,
                message: message
            });
        } else {
            res.status(400).json({
                success: false,
                message: message
            });
        }
    } catch (error) {
        console.error('❌ Error al eliminar simulación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar simulación',
            error: error.message
        });
    }
};

module.exports = {
    getSimulationHistory,
    getAvailableCars,
    getCircuitForSimulation,
    getSimulationResults,
    validateCar,
    getCircuitStatistics,
    runSimulation,
    deleteSimulation
};