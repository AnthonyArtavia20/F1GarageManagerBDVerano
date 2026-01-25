const { mssqlConnect, sql } = require('../config/database');

/**
 * GET /api/drivers
 * Visible para TODOS los roles
 */
const getDrivers = async (req, res) => {
  try {
    const pool = await mssqlConnect();

    const result = await pool.request().query(`
      SELECT 
        u.User_id AS id,
        u.Username AS name,
        ISNULL(t.Name, 'Sin equipo') AS team,
        d.H AS skill
      FROM DRIVER d
      JOIN [USER] u ON d.User_id = u.User_id
      LEFT JOIN TEAM t ON d.Team_id = t.Team_id
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error('❌ Error fetching drivers:', error);
    res.status(500).json({ message: 'Error fetching drivers' });
  }
};

/**
 * POST /api/drivers
 * SOLO ADMIN
 */
const createDriver = async (req, res) => {
  const { driverName, teamId, skill } = req.body;

  if (!driverName || !driverName.trim()) {
    return res.status(400).json({ message: 'Driver name is required' });
  }

  if (skill < 0 || skill > 100) {
    return res.status(400).json({ message: 'Skill must be between 0 and 100' });
  }

  try {
    const pool = await mssqlConnect();

    // Step 1: Create a new USER entry with the driver name
    const userResult = await pool.request()
      .input('Username', sql.VarChar, driverName.trim())
      .input('PasswordHash', sql.VarChar, 'temp_password_hash')
      .input('Salt', sql.VarChar, 'temp_salt')
      .query(`
        INSERT INTO [USER] (Username, PasswordHash, Salt)
        OUTPUT INSERTED.User_id
        VALUES (@Username, @PasswordHash, @Salt)
      `);

    const newUserId = userResult.recordset[0].User_id;

    // Step 2: Create the DRIVER entry
    await pool.request()
      .input('User_id', sql.Int, newUserId)
      .input('Team_id', sql.Int, teamId || null)
      .input('H', sql.Int, skill)
      .query(`
        INSERT INTO DRIVER (User_id, Team_id, H)
        VALUES (@User_id, @Team_id, @H)
      `);

    res.status(201).json({ 
      message: 'Driver created successfully',
      userId: newUserId
    });
  } catch (error) {
    console.error('❌ Error creating driver:', error);
    res.status(500).json({ message: 'Error creating driver', error: error.message });
  }
};

module.exports = {
  getDrivers,
  createDriver
};
