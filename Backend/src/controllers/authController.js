const bcrypt = require("bcryptjs");
const { mssqlConnect, sql } = require("../config/database");

// =========================
//  REGISTER
// =========================
exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ success: false, message: "Missing fields" });

    const pool = await mssqlConnect();

    // 1. Verificar si el usuario existe
    const check = await pool.request()
      .input("username", sql.VarChar, username)
      .query("SELECT * FROM [USER] WHERE Username = @username");

    if (check.recordset.length > 0)
      return res.status(400).json({ success: false, message: "User already exists" });

    // 2. Crear salt + hash
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    // 3. Insertar usuario
    await pool.request()
      .input("username", sql.VarChar, username)
      .input("salt", sql.VarChar, salt)
      .input("hash", sql.VarChar, hash)
      .query(`
        INSERT INTO [USER] (Username, Salt, PasswordHash)
        VALUES (@username, @salt, @hash)
      `);

    return res.json({ success: true, message: "User registered successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// =========================
//  LOGIN
// =========================
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Missing credentials" });
    }

    const pool = await mssqlConnect();

    // 1) Buscar usuario
    const result = await pool.request()
      .input("username", sql.VarChar, username)
      .query("SELECT * FROM [USER] WHERE Username = @username");

    if (result.recordset.length === 0) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    const user = result.recordset[0];

    // 2) Verificar contraseña
    const isValid = bcrypt.compareSync(password, user.PasswordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // 3) Determinar ROL por tablas (OPCIÓN A)
    let role = null;

    const adminCheck = await pool.request()
      .input("uid", sql.Int, user.User_id)
      .query("SELECT 1 AS ok FROM ADMIN WHERE User_id = @uid");
    if (adminCheck.recordset.length > 0) role = "admin";

    const engineerCheck = await pool.request()
      .input("uid", sql.Int, user.User_id)
      .query("SELECT 1 AS ok FROM ENGINEER WHERE User_id = @uid");
    if (engineerCheck.recordset.length > 0) role = "engineer";

    const driverCheck = await pool.request()
      .input("uid", sql.Int, user.User_id)
      .query("SELECT 1 AS ok FROM DRIVER WHERE User_id = @uid");
    if (driverCheck.recordset.length > 0) role = "driver";

    if (!role) {
      return res.status(403).json({ success: false, message: "User has no role assigned" });
    }

    // 4) Determinar equipo por rol (Team_id) + nombre
    let teamId = null;
    let teamName = null;

    if (role === "driver") {
      const t = await pool.request()
        .input("uid", sql.Int, user.User_id)
        .query(`
          SELECT TOP 1 t.Team_id, t.Name
          FROM DRIVER d
          JOIN TEAM t ON t.Team_id = d.Team_id
          WHERE d.User_id = @uid
        `);

      if (t.recordset.length > 0) {
        teamId = t.recordset[0].Team_id;
        teamName = t.recordset[0].Name;
      }
    }

    if (role === "engineer") {
      const t = await pool.request()
        .input("uid", sql.Int, user.User_id)
        .query(`
          SELECT TOP 1 t.Team_id, t.Name
          FROM ENGINEER e
          JOIN TEAM t ON t.Team_id = e.Team_id
          WHERE e.User_id = @uid
        `);

      if (t.recordset.length > 0) {
        teamId = t.recordset[0].Team_id;
        teamName = t.recordset[0].Name;
      }
    }

    // admin normalmente no tiene team (null), a menos que tu modelo lo tenga

    // 5) Crear sesión
    req.session.user = {
      id: user.User_id,
      username: user.Username,
      role,
      teamId,
      teamName,
    };

    // 6) Respuesta al frontend
    return res.json({
      success: true,
      message: "Login successful",
      session: req.session.user,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// =========================
//  LOGOUT
// =========================
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: "Logged out" });
  });
};
