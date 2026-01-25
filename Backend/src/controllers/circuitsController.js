const sql = require('mssql');
const { mssqlConnect } = require('../config/database');

// ============================================================================
// GET - Obtener todos los circuitos
// ============================================================================
const getAllCircuits = async (req, res) => {
    try {
        const pool = await mssqlConnect();
        const result = await pool.request()
            .execute('sp_GetAllCircuits');

        res.json({
            success: true,
            data: result.recordset,
            count: result.recordset.length
        });
    } catch (error) {
        console.error('Error al obtener circuitos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener circuitos',
            error: error.message
        });
    }
};

// ============================================================================
// GET - Obtener circuito por ID
// ============================================================================
const getCircuitById = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await mssqlConnect();
        
        const result = await pool.request()
            .input('Circuit_id', sql.Int, id)
            .execute('sp_GetCircuitById');

        if (result.recordset.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Circuito no encontrado'
            });
        }

        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Error al obtener circuito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener circuito',
            error: error.message
        });
    }
};

// ============================================================================
// POST - Crear nuevo circuito
// ============================================================================
const createCircuit = async (req, res) => {
    try {
        const { name, totalDistance, numberOfCurves } = req.body;

        // Validación básica
        if (!name || !totalDistance || numberOfCurves === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos (name, totalDistance, numberOfCurves)'
            });
        }

        const pool = await mssqlConnect();
        
        const result = await pool.request()
            .input('Name', sql.VarChar(100), name)
            .input('Total_distance', sql.Decimal(10, 2), totalDistance)
            .input('N_Curves', sql.Int, numberOfCurves)
            .output('Success', sql.Bit)
            .output('Message', sql.NVarChar(500))
            .output('NewCircuitId', sql.Int)
            .execute('sp_CreateCircuit');

        const success = result.output.Success;
        const message = result.output.Message;
        const newCircuitId = result.output.NewCircuitId;

        if (success) {
            res.status(201).json({
                success: true,
                message: message,
                data: {
                    circuitId: newCircuitId,
                    name: name,
                    totalDistance: totalDistance,
                    numberOfCurves: numberOfCurves
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: message
            });
        }
    } catch (error) {
        console.error('Error al crear circuito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear circuito',
            error: error.message
        });
    }
};

// ============================================================================
// PUT - Actualizar circuito
// ============================================================================
const updateCircuit = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, totalDistance, numberOfCurves } = req.body;

        if (!name || !totalDistance || numberOfCurves === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos'
            });
        }

        const pool = await mssqlConnect();
        
        const result = await pool.request()
            .input('Circuit_id', sql.Int, id)
            .input('Name', sql.VarChar(100), name)
            .input('Total_distance', sql.Decimal(10, 2), totalDistance)
            .input('N_Curves', sql.Int, numberOfCurves)
            .output('Success', sql.Bit)
            .output('Message', sql.NVarChar(500))
            .execute('sp_UpdateCircuit');

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
        console.error('Error al actualizar circuito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar circuito',
            error: error.message
        });
    }
};

// ============================================================================
// DELETE - Eliminar circuito
// ============================================================================
const deleteCircuit = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await mssqlConnect();
        
        const result = await pool.request()
            .input('Circuit_id', sql.Int, id)
            .output('Success', sql.Bit)
            .output('Message', sql.NVarChar(500))
            .execute('sp_DeleteCircuit');

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
        console.error('Error al eliminar circuito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar circuito',
            error: error.message
        });
    }
};

// ============================================================================
// GET - Validar circuito para simulación
// ============================================================================
const validateCircuit = async (req, res) => {
    try {
        const { id } = req.params;
        const dc = req.query.dc || 0.5; // dc por defecto
        
        const pool = await mssqlConnect();
        
        const result = await pool.request()
            .input('Circuit_id', sql.Int, id)
            .input('dc', sql.Decimal(10, 2), dc)
            .execute('sp_ValidateCircuitForSimulation');

        res.json({
            success: true,
            data: result.recordset[0]
        });
    } catch (error) {
        console.error('Error al validar circuito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al validar circuito',
            error: error.message
        });
    }
};

module.exports = {
    getAllCircuits,
    getCircuitById,
    createCircuit,
    updateCircuit,
    deleteCircuit,
    validateCircuit
};