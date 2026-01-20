const { mssqlConnect, sql } = require('../config/database');

exports.getTeamInventory = async (req, res) => {
  try {
        const { teamId } = req.params;
        if (!teamId || isNaN(parseInt(teamId))) {
          return res.status(400).json({
            success: false,
            message: 'Invalid team ID'
          });
        }

    
        const pool = await mssqlConnect();
        
        const request = pool.request();
        request.input('TeamId', parseInt(teamId));

        const result = await request.execute('sp_GetTeamInventory');
    
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
