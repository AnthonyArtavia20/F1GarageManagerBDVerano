const { mssqlConnect } = require('../config/database');
const mssql = require('mssql');
const bcrypt = require('bcryptjs');  // IMPORTANTE: npm install bcryptjs

exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(200).json({ //se cambia de 401(Unauthorized) para 200 OK + success: false, para errores de validación/negocio (credenciales incorrectas, campos faltantes, etc.)
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
      return res.status(200).json({
        success: false,
        message: "Username already exists"
      });
    }
    
    // Crear nuevo usuario con bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const insertResult = await pool.request()
      .input('username', mssql.VarChar, username)
      .input('passwordHash', mssql.VarChar, hashedPassword)
      .input('salt', mssql.VarChar, salt)
      .query(`
        INSERT INTO [USER] (Username, PasswordHash, Salt)
        OUTPUT INSERTED.User_id
        VALUES (@username, @passwordHash, @salt)
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
    
    console.log(`🔐 [LOGIN] Intento de login para: ${username}`);
    console.log(`   Contraseña recibida: "${password}"`);
    
    if (!username || !password) {
      return res.status(200).json({ //Cambio de 400 a 200 para poder mostrar correctamente el feedback
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
          u.Salt,
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
      console.log(`❌ [LOGIN] Usuario no encontrado: ${username}`);
      return res.status(200).json({ //En lugar de 401, 200, para mostrar la feedback
        success: false,
        message: "Usuario no encontrado"
      });
    }
    
    const user = result.recordset[0];
    
    console.log(`🔍 [LOGIN] Usuario encontrado en DB:`);
    console.log(`   ID: ${user.User_id}, Rol: ${user.role || 'user'}`);
    console.log(`   PasswordHash (primeros 30 chars): "${user.PasswordHash?.substring(0, 30)}..."`);
    console.log(`   Tipo de hash: ${user.PasswordHash?.startsWith('$2') ? 'Bcrypt' : 'Texto plano'}`);
    console.log(`   Salt: "${user.Salt}"`);
    
    // =================================================
    // 🔧 VERIFICACIÓN DE CONTRASEÑA - VERSIÓN CORREGIDA
    // =================================================
    let isValidPassword = false;
    let authMethod = '';
    
    // 1. SI ES HASH BCRYPT (usuarios Windows)
    if (user.PasswordHash && user.PasswordHash.startsWith('$2')) {
      authMethod = 'bcrypt';
      try {
        console.log(`   🔐 Intentando bcrypt.compare()...`);
        isValidPassword = await bcrypt.compare(password, user.PasswordHash);
        console.log(`   ✅ bcrypt.compare() resultado: ${isValidPassword}`);
      } catch (bcryptError) {
        console.error(`❌ Error en bcrypt.compare():`, bcryptError);
        isValidPassword = false;
      }
    }
    // 2. SI ES TEXTO PLANO (usuarios Linux)
    else {
      authMethod = 'texto_plano';
      
      // Definir todas las credenciales de desarrollo
      const devCredentials = {
        // Usuarios Windows (están en bcrypt, pero por si acaso)
        'winAdmin': 'winAdmin123*',
        'winEngineer': 'winEngineer123*',
        'winDriver': 'winDriver123*',
        
        // Usuarios Linux (texto plano)
        'linuxAdmin': 'linuxAdmin123*',
        'linuxEngineer': 'linuxEngineer123*',
        'linuxDriver': 'linuxDriver123*',
        
        // Usuarios Mac (si los agregas)
        'macAdmin': 'macAdmin123*',
        'macEngineer': 'macEngineer123*',
        'macDriver': 'macDriver123*'
      };
      
      // Verificar si está en las credenciales de desarrollo
      if (devCredentials[username]) {
        console.log(`   🔍 Comparando con credencial dev: "${devCredentials[username]}"`);
        if (password === devCredentials[username]) {
          isValidPassword = true;
          console.log(`   ✅ Coincide con credencial dev`);
        } else {
          console.log(`   ❌ NO coincide con credencial dev`);
        }
      }
      
      // También verificar si coincide directamente con PasswordHash
      if (!isValidPassword && password === user.PasswordHash) {
        isValidPassword = true;
        console.log(` Coincide directamente con PasswordHash`);
      }
    }
    
    console.log(`📊 [LOGIN] Resumen:`);
    console.log(`   Método: ${authMethod}`);
    console.log(`   Válido: ${isValidPassword}`);
    
    if (!isValidPassword) {
      console.log(`❌ [LOGIN] Contraseña incorrecta para: ${username}`);
      console.log(`   Método usado: ${authMethod}`);
      console.log(`   ¿Necesitas convertir usuarios Windows a texto plano?`);
      
      return res.status(200).json({ // De igual forma pasamos de 401 a 20 para mostrar errores desde la BD
        success: false,
        message: "Contraseña incorrecta"
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
      
      console.log(`✅ [LOGIN] Login exitoso: ${username} (${sessionUser.role})`);
      console.log(`   Session ID: ${req.sessionID}`);
      console.log(`   Team: ${sessionUser.teamName || 'None'}`);
      console.log(`   User ID: ${sessionUser.id}`);
      
      res.json({
        success: true,
        user: sessionUser,
        message: "Login successful"
      });
    });
    
  } catch (error) {
    console.error('❌ [LOGIN] Error general:', error);
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

// Nueva función: Check current session
exports.checkSession = (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: "No active session"
    });
  }
  
  res.json({
    success: true,
    user: req.session.user
  });
};