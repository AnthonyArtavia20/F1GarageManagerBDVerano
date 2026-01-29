const { mssqlConnect, sql } = require('../config/database');

// Obener todos los equipos

exports.getAllTeams = async (req, res) => {
    try {
        const pool = await mssqlConnect();

        const result = await pool.request()
            .query('SELECT Team_id, Name, Total_Budget, Total_Spent, (Total_Budget - Total_Spent) AS Available_Budget FROM TEAM ORDER BY Name');

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener equipos',
            error: error.message
        });
    }
};

//Buscar equipos con filtro
exports.searchTeams = async (req, res) => {
    try {
        const { search } = req.query;

        const pool = await mssqlConnect();

        let query = 'SELECT Team_id, Name, Total_Budget, Total_Spent, (Total_Budget - Total_Spent) AS Available_Budget FROM TEAM';
        const request = pool.request();

        if (search && search.trim() !== '') {
            query += ' WHERE Name LIKE @search';
            request.input('search', sql.NVarChar(100), `%${search}%`);
        }

        query += ' ORDER BY Name';

        const result = await request.query(query);

        res.json({
            success: true,
            data: result.recordset
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al buscar equipos',
            error: error.message
        });
    }
};

// Create a new team
exports.createTeam = async (req, res) => {
    const { teamName, driver1Id, driver2Id } = req.body;

    if (!teamName || !teamName.trim()) {
        return res.status(400).json({ message: 'Team name is required' });
    }

    // driver1Id and driver2Id are optional. If both are provided, ensure they are different.
    console.log('POST /teams received body:', { teamName, driver1Id, driver2Id });
    if (driver1Id && driver2Id && Number(driver1Id) === Number(driver2Id)) {
        console.log('Validation failed: same driver for both slots', { driver1Id, driver2Id });
        return res.status(400).json({ message: 'Drivers must be different' });
    }

    try {
        const pool = await mssqlConnect();

        // Create the team
        const teamResult = await pool.request()
            .input('Name', sql.VarChar, teamName.trim())
            .input('Total_Budget', sql.Decimal(10, 2), 0)
            .input('Total_Spent', sql.Decimal(10, 2), 0)
            .query(`
                INSERT INTO TEAM (Name, Total_Budget, Total_Spent)
                OUTPUT INSERTED.Team_id
                VALUES (@Name, @Total_Budget, @Total_Spent)
            `);

        const newTeamId = teamResult.recordset[0].Team_id;

        // Optionally assign driver 1 to team
        if (driver1Id) {
            await pool.request()
                .input('User_id', sql.Int, Number(driver1Id))
                .input('Team_id', sql.Int, newTeamId)
                .query(`
                    UPDATE DRIVER
                    SET Team_id = @Team_id
                    WHERE User_id = @User_id
                `);
        }

        // Optionally assign driver 2 to team
        if (driver2Id) {
            await pool.request()
                .input('User_id', sql.Int, Number(driver2Id))
                .input('Team_id', sql.Int, newTeamId)
                .query(`
                    UPDATE DRIVER
                    SET Team_id = @Team_id
                    WHERE User_id = @User_id
                `);
        }

        res.status(201).json({
            success: true,
            message: 'Team created successfully',
            teamId: newTeamId
        });
    } catch (error) {
        console.error('❌ Error creating team:', error);
        res.status(500).json({ message: 'Error creating team', error: error.message });
    }
};