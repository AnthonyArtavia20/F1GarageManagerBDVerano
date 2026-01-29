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

        // ⚠️ CAMBIO: Ya NO validamos que teamId sea obligatorio
        // Ahora Engineer y Driver pueden existir sin equipo asignado

    console.log(`[CREATE USER] Creating user: ${username} with role: ${role}`);

    // Generar hash bcrypt (esto es LO QUE HACE TU SCRIPT BASH)
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const passwordHash = await bcrypt.hash(password, salt);

    console.log(`[BCRYPT] Hash generated for ${username}`);

    const pool = await mssqlConnect();

    // If creating a Driver and assigning to a team, ensure team has space (max 2 drivers)
    if (role === 'Driver' && teamId) {
        const countRes = await pool.request().input('TeamId', sql.Int, teamId).query('SELECT COUNT(1) AS cnt FROM DRIVER WHERE Team_id = @TeamId');
        const currentCount = countRes.recordset?.[0]?.cnt ?? 0;
        if (currentCount >= 2) {
            return res.status(400).json({ success: false, error: 'Team already has maximum drivers (2)' });
        }
    }

    // Ejecutar SP
    const result = await pool.request()
        .input('Username', sql.NVarChar(100), username)
        .input('Salt', sql.NVarChar(255), salt)
        .input('PasswordHash', sql.NVarChar(255), passwordHash)
        .input('Role', sql.NVarChar(20), role)
        .input('TeamId', sql.Int, teamId || null)  // ✅ Permite null
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
        console.log('[UPDATE USER] Request body:', req.body);

        let salt = null;
        let passwordHash = null;

        if (password) { // Si se proporciona nueva contraseña, generar nuevo hash
        const saltRounds = 10;
        salt = await bcrypt.genSalt(saltRounds);
        passwordHash = await bcrypt.hash(password, salt);
        console.log(`[BCRYPT] New hash generated for user ${userId}`);
    }

    const pool = await mssqlConnect();
    
    // ✅ Determinar si se debe actualizar TeamId
    const updateTeamId = req.body.hasOwnProperty('teamId');
    
    console.log(`[UPDATE USER] UpdateTeamId flag: ${updateTeamId}, TeamId value: ${teamId}`);

    // If user is being assigned to a team, ensure the team has capacity for another driver (max 2)
    if (updateTeamId && teamId) {
        const countRes = await pool.request()
            .input('TeamId', sql.Int, teamId)
            .input('UserId', sql.Int, parseInt(userId))
            .query('SELECT COUNT(1) AS cnt FROM DRIVER WHERE Team_id = @TeamId AND User_id != @UserId');
        const cnt = countRes.recordset?.[0]?.cnt ?? 0;
        if (cnt >= 2) {
            return res.status(400).json({ success: false, error: 'Team already has maximum drivers (2)' });
        }
    }
    
    const result = await pool.request()
        .input('UserId', sql.Int, parseInt(userId))
        .input('NewUsername', sql.NVarChar(100), username || null)
        .input('NewSalt', sql.NVarChar(255), salt)
        .input('NewPasswordHash', sql.NVarChar(255), passwordHash)
        .input('NewRole', sql.NVarChar(20), role || null)
        .input('NewTeamId', sql.Int, teamId || null)
        .input('UpdateTeamId', sql.Bit, updateTeamId ? 1 : 0)  // ✅ Nuevo parámetro
        .execute('sp_UpdateUser');

    const userData = result.recordset[0];
    console.log(`✅ User updated: ${userData.Username}`)
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
        let errorMessage = 'Error al actualizar usuario' //captura errores que el SQLServer pase desde los SP

        if (error.number === 51004) {
            errorMessage = 'Usuario no encontrado';
        } else if (error.number === 51005) {
            errorMessage = 'El nombre de usuario ya existe';
        } else if (error.number === 51006 || error.number === 51007) {
            errorMessage = 'El equipo es requerido para este rol';
        } else if (error.message) {
            errorMessage = error.message;
        }
        res.status(error.number === 51004 ? 404 : 500).json({ 
            success: false,
            error: errorMessage
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