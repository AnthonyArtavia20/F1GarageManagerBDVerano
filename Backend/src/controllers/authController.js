const { mssqlConnect } = require('../config/database');
const mssql = require('mssql');

exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required"
      });
    }
    
    // Verificar si el usuario ya existe
    const pool = await mssqlConnect();
    const checkResult = await pool.request()
      .input('username', mssql.VarChar, username)
      .query('SELECT User_id FROM [USER] WHERE Username = @username');
    
    if (checkResult.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Username already exists"
      });
    }
    
    // Crear nuevo usuario (EN PRODUCCIÓN DEBES HASH LA CONTRASEÑA)
    const insertResult = await pool.request()
      .input('username', mssql.VarChar, username)
      .input('passwordHash', mssql.VarChar, password) // ¡EN PRODUCCIÓN USA BCRYPT!
      .query(`
        INSERT INTO [USER] (Username, PasswordHash, Created_at)
        OUTPUT INSERTED.User_id
        VALUES (@username, @passwordHash, GETDATE())
      `);
    
    const newUserId = insertResult.recordset[0].User_id;
    
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      userId: newUserId
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: "Server error during registration"
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log(`🔐 Intento de login: ${username}`);
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required"
      });
    }
    
    // Buscar usuario en la base de datos
    const pool = await mssqlConnect();
    
    const result = await pool.request()
      .input('username', mssql.VarChar, username)
      .query(`
        SELECT 
          u.User_id,
          u.Username,
          u.PasswordHash,
          CASE 
            WHEN a.User_id IS NOT NULL THEN 'admin'
            WHEN e.User_id IS NOT NULL THEN 'engineer'
            WHEN d.User_id IS NOT NULL THEN 'driver'
            ELSE 'user'
          END as role,
          COALESCE(e.Team_id, d.Team_id) as Team_id,
          t.Name as teamName
        FROM [USER] u
        LEFT JOIN ADMIN a ON u.User_id = a.User_id
        LEFT JOIN ENGINEER e ON u.User_id = e.User_id
        LEFT JOIN DRIVER d ON u.User_id = d.User_id
        LEFT JOIN TEAM t ON (
          e.Team_id = t.Team_id OR 
          d.Team_id = t.Team_id
        )
        WHERE u.Username = @username
      `);
    
    if (result.recordset.length === 0) {
      console.log(`❌ Usuario no encontrado: ${username}`);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }
    
    const user = result.recordset[0];
    
    // VERIFICACIÓN DE CONTRASEÑA (SIMPLIFICADA PARA DESARROLLO)
    // EN PRODUCCIÓN DEBES USAR: await bcrypt.compare(password, user.PasswordHash)
    const isValidPassword = (password === 'winAdmin123*' && username === 'winAdmin') ||
                           (password === 'winEngineer123*' && username === 'winEngineer') ||
                           (password === 'winDriver123*' && username === 'winDriver') ||
                           (password === user.PasswordHash); // Para usuarios ya existentes
    
    if (!isValidPassword) {
      console.log(`❌ Contraseña incorrecta para: ${username}`);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }
    
    // Configurar datos de sesión
    const sessionUser = {
      id: user.User_id,
      username: user.Username,
      role: user.role || 'user',
      teamId: user.Team_id || null,
      teamName: user.teamName || null
    };
    
    // Guardar en sesión
    req.session.user = sessionUser;
    
    // Forzar guardado de sesión
    req.session.save((saveErr) => {
      if (saveErr) {
        console.error('❌ Error guardando sesión:', saveErr);
        return res.status(500).json({
          success: false,
          message: "Session error"
        });
      }
      
      console.log(`✅ Login exitoso: ${username} (${sessionUser.role})`);
      console.log(`   Session ID: ${req.sessionID}`);
      console.log(`   Team: ${sessionUser.teamName || 'None'}`);
      
      res.json({
        success: true,
        user: sessionUser,
        message: "Login successful"
      });
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: "Server error during login"
    });
  }
};

exports.logout = (req, res) => {
  const username = req.session.user?.username || 'unknown';
  
  req.session.destroy((err) => {
    if (err) {
      console.error('❌ Logout error:', err);
      return res.status(500).json({
        success: false,
        message: "Logout failed"
      });
    }
    
    console.log(`✅ Logout exitoso: ${username}`);
    
    res.clearCookie('f1garage.sid');
    res.json({
      success: true,
      message: "Logged out successfully"
    });
  });
};

// Función auxiliar para verificar sesión (middleware)
exports.requireAuth = (req, res, next) => {
  if (!req.session.user) {
    console.log('❌ Acceso no autorizado - sin sesión');
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Please login"
    });
  }
  
  console.log(`✅ Sesión válida para: ${req.session.user.username}`);
  next();
};