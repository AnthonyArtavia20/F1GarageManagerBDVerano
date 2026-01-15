const { mssqlConnect, sql } = require('../config/database');

// Obener todos los equipos

exports.getAllTeams = async (req, res) => {
    try {
        const pool = await mssqlConnect();

        const result = await pool.request()
            .query('SELECT Team_id, Name FROM TEAM ORDER BY Name');

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

        let query = 'SELECT Team_id, Name FROM TEAM';
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