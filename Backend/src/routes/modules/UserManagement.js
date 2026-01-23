// routes/modules/UserManagement.js
const express = require('express');
const router = express.Router();
const { mssqlConnect, sql } = require('../../config/database');
const bcrypt = require('bcryptjs');

// ============================================================================
// MÓDULO USER MANAGEMENT: ENDPOINTS ESPECÍFICOS
// ============================================================================

/**
 * POST /api/sp/users/create
 * Crea un nuevo usuario con bcrypt
 * Body: { username, password, role, teamId?, driverH? }
 */
router.post('/create', async (req, res) => {
    try {
        const { username, password, role, teamId, driverH } = req.body;

        // Validaciones básicas
        if (!username || !password || !role) {
        return res.status(400).json({ 
            success: false,
            error: 'username, password y role son requeridos' 
        });
        }

        // Validar rol
        if (!['Admin', 'Engineer', 'Driver'].includes(role)) {
        return res.status(400).json({ 
            success: false,
            error: 'Rol inválido. Debe ser: Admin, Engineer o Driver' 
        });
        }

        // Validar teamId para Engineer/Driver
        if (['Engineer', 'Driver'].includes(role) && !teamId) {
        return res.status(400).json({ 
            success: false,
            error: 'teamId es requerido para Engineer y Driver' 
        });
        }

    console.log(`[CREATE USER] Creating user: ${username} with role: ${role}`);

    // Generar hash bcrypt (esto es LO QUE HACE TU SCRIPT BASH)
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const passwordHash = await bcrypt.hash(password, salt);

    console.log(`[BCRYPT] Hash generated for ${username}`);

    const pool = await mssqlConnect();

    // Ejecutar SP
    const result = await pool.request()
        .input('Username', sql.NVarChar(100), username)
        .input('Salt', sql.NVarChar(255), salt)
        .input('PasswordHash', sql.NVarChar(255), passwordHash)
        .input('Role', sql.NVarChar(20), role)
        .input('TeamId', sql.Int, teamId || null)
        .input('DriverH', sql.Int, driverH || 85)
        .execute('sp_CreateUser');

    const userData = result.recordset[0];

    console.log(`✅ User created: ${userData.Username} (ID: ${userData.User_id})`);

    res.json({ 
        success: true, 
        message: 'Usuario creado exitosamente',
        user: {
            id: userData.User_id,
            username: userData.Username,
            role: userData.Role,
            teamId: userData.Team_id
        }
    });

    } catch (error) {
        console.error('❌ Error creating user:', error);
        res.status(500).json({ 
        success: false,
        error: error.message 
        });
    }
});

/**
 * PUT /api/sp/users/:userId/update
 * Actualiza un usuario existente
 * Body: { username?, password?, role?, teamId? }
 */
router.put('/:userId/update', async (req, res) => {
    try {
        const { userId } = req.params;
        const { username, password, role, teamId } = req.body;

        console.log(`[UPDATE USER] Updating user ${userId}`);

        let salt = null;
        let passwordHash = null;

        // Si se proporciona nueva contraseña, generar nuevo hash
        if (password) {
        const saltRounds = 10;
        salt = await bcrypt.genSalt(saltRounds);
        passwordHash = await bcrypt.hash(password, salt);
        console.log(`[BCRYPT] New hash generated for user ${userId}`);
    }

    const pool = await mssqlConnect();

    const result = await pool.request()
        .input('UserId', sql.Int, parseInt(userId))
        .input('NewUsername', sql.NVarChar(100), username || null)
        .input('NewSalt', sql.NVarChar(255), salt)
        .input('NewPasswordHash', sql.NVarChar(255), passwordHash)
        .input('NewRole', sql.NVarChar(20), role || null)
        .input('NewTeamId', sql.Int, teamId || null)
        .execute('sp_UpdateUser');

    const userData = result.recordset[0];

    console.log(`✅ User updated: ${userData.Username}`);

    res.json({ 
        success: true, 
        message: userData.Message,
        user: {
        id: userData.User_id,
        username: userData.Username,
        role: userData.Role,
        teamId: userData.Team_id
        }
    });

    } catch (error) {
        console.error('❌ Error updating user:', error);
        res.status(500).json({ 
        success: false,
        error: error.message 
        });
    }
});

/**
 * DELETE /api/sp/users/:userId
 * Elimina un usuario
 */
router.delete('/:userId', async (req, res) => {
    try {
    const { userId } = req.params;

    console.log(`[DELETE USER] Deleting user ${userId}`);

    const pool = await mssqlConnect();

    const result = await pool.request()
        .input('UserId', sql.Int, parseInt(userId))
        .execute('sp_DeleteUser');

    console.log(`✅ User deleted: ${userId}`);

    res.json({ 
        success: true, 
        message: result.recordset[0].Message 
    });

    } catch (error) {
        console.error('❌ Error deleting user:', error);
        res.status(500).json({ 
        success: false,
        error: error.message 
        });
    }
});

/**
 * GET /api/sp/users
 * Obtiene todos los usuarios
 */
router.get('/', async (req, res) => {
    try {
        console.log('[GET USERS] Fetching all users');

        const pool = await mssqlConnect();

        const result = await pool.request()
        .execute('sp_GetAllUsers');

        console.log(`✅ Fetched ${result.recordset.length} users`);

        res.json({ 
        success: true, 
        data: result.recordset 
        });

    } catch (error) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({ 
        success: false,
        error: error.message 
        });
    }
});

/**
 * GET /api/sp/users/search
 * Busca usuarios por username
 * Query: ?query=username
 */
router.get('/search', async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
        return res.status(400).json({ 
            success: false,
            error: 'query parameter is required' 
        });
        }

    console.log(`[SEARCH USERS] Searching for: ${query}`);

    const pool = await mssqlConnect();

    const result = await pool.request()
        .input('SearchQuery', sql.NVarChar(100), query)
        .execute('sp_SearchUsers');

    console.log(`✅ Found ${result.recordset.length} users`);

    res.json({ 
        success: true, 
        data: result.recordset 
    });

    } catch (error) {
        console.error('❌ Error searching users:', error);
        res.status(500).json({ 
        success: false,
        error: error.message 
        });
    }
});

module.exports = router;