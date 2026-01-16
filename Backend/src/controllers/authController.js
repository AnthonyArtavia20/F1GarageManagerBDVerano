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

    const pool = await mssqlConnect();

    const result = await pool.request()
      .input("username", sql.VarChar, username)
      .query("SELECT * FROM [USER] WHERE Username = @username");

    if (result.recordset.length === 0)
      return res.status(400).json({ success: false, message: "User not found" });

    const user = result.recordset[0];

    // Comparar contraseña
    const isValid = bcrypt.compareSync(password, user.PasswordHash);

    if (!isValid)
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    // Crear sesión
    req.session.user = {
      id: user.User_id,
      username: user.Username
    };

    res.json({ success: true, message: "Login successful", session: req.session.user });

  } catch (err) {
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
