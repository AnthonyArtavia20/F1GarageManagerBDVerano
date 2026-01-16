// src/models/userModel.js
const { mssqlConnect, sql } = require('../config/database');

module.exports = {
  
  // Buscar usuario por username
  async findByUsername(username) {
    const pool = await mssqlConnect();
    const result = await pool.request()
      .input('username', sql.VarChar, username)
      .query(`
        SELECT User_id, Username, PasswordHash, Salt
        FROM [USER]
        WHERE Username = @username
      `);

    return result.recordset[0];
  },

  // Crear usuario nuevo
  async createUser(username, passwordHash, salt) {
    const pool = await mssqlConnect();
    const result = await pool.request()
      .input('Username', sql.VarChar, username)
      .input('Salt', sql.VarChar, salt)
      .input('PasswordHash', sql.VarChar, passwordHash)
      .query(`
        INSERT INTO [USER](Username, Salt, PasswordHash)
        VALUES(@Username, @Salt, @PasswordHash);

        SELECT SCOPE_IDENTITY() AS userId;
      `);

    return result.recordset[0];
  }
};
