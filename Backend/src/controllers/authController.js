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

    res.json({ success: true, message: "User registered successfully" });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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

    // 1️⃣ Buscar usuario
    const result = await pool.request()
      .input("username", sql.VarChar, username)
      .query("SELECT * FROM [USER] WHERE Username = @username");

    if (result.recordset.length === 0) {
      return res.status(400).json({ success: false, message: "User not found" });
    }

    const user = result.recordset[0];

    // 2️⃣ Verificar contraseña
    const isValid = bcrypt.compareSync(password, user.PasswordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // 3️⃣ Determinar ROL por tablas (OPCIÓN A)
    let role = null;

    const adminCheck = await pool.request()
      .input("uid", sql.Int, user.User_id)
      .query("SELECT 1 FROM ADMIN WHERE User_id = @uid");
    if (adminCheck.recordset.length > 0) role = "admin";

    const engineerCheck = await pool.request()
      .input("uid", sql.Int, user.User_id)
      .query("SELECT 1 FROM ENGINEER WHERE User_id = @uid");
    if (engineerCheck.recordset.length > 0) role = "engineer";

    const driverCheck = await pool.request()
      .input("uid", sql.Int, user.User_id)
      .query("SELECT 1 FROM DRIVER WHERE User_id = @uid");
    if (driverCheck.recordset.length > 0) role = "driver";

    if (!role) {
      return res.status(403).json({ success: false, message: "User has no role assigned" });
    }

    // 4️⃣ Crear sesión
    req.session.user = {
      id: user.User_id,
      username: user.Username,
      role: role
    };

    // 5️⃣ Respuesta al frontend
    res.json({
      success: true,
      message: "Login successful",
      session: req.session.user
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: err.message });
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
