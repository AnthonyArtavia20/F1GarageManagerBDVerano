// backend/src/controllers/partsController.js
const { mssqlConnect, sql } = require('../config/database');

// Obtener todas las partes
exports.getAllParts = async (req, res) => {
  try {
    const pool = await mssqlConnect();
    const result = await pool.request()
      .query('SELECT * FROM PART ORDER BY Category, Price');
    
    // Mapear los datos al formato esperado por el frontend
    const parts = result.recordset.map(row => ({
      id: row.Part_id,
      name: `${row.Category} #${row.Part_id}`,
      category: row.Category,
      price: row.Price,
      stock: row.Stock,
      p: row.p,
      a: row.a,
      m: row.m
    }));
    
    res.json({
      success: true,
      data: parts
    });
  } catch (error) {
    console.error('Error en getAllParts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener partes',
      error: error.message
    });
  }
};

// Crear nueva parte
exports.createPart = async (req, res) => {
  try {
    const { Category, Name, Price, Stock, p, a, m } = req.body;
    
    console.log('Datos recibidos para crear parte:', req.body);
    
    // Validaciones básicas
    if (!Category || !Price || Stock === undefined || p === undefined || a === undefined || m === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios'
      });
    }

    if (Price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio debe ser mayor a 0'
      });
    }

    if (Stock < 0) {
      return res.status(400).json({
        success: false,
        message: 'El stock no puede ser negativo'
      });
    }

    // Validar que p, a, m estén entre 0 y 9
    if (p < 0 || p > 9 || a < 0 || a > 9 || m < 0 || m > 9) {
      return res.status(400).json({
        success: false,
        message: 'Los valores p, a, m deben estar entre 0 y 9'
      });
    }

    const pool = await mssqlConnect();
    
    // Primero, contar cuántas partes existen de esta categoría para generar nombre
    const countResult = await pool.request()
      .input('Category', sql.VarChar(50), Category)
      .query('SELECT COUNT(*) as count FROM PART WHERE Category = @Category');
    
    const count = countResult.recordset[0].count + 1;
    const partName = Name || `${Category.replace('_', ' ')} ${count}`;
    
    // Insertar en la base de datos
    const result = await pool.request()
      .input('Category', sql.VarChar(50), Category)
      .input('Price', sql.Decimal(10, 2), Price)
      .input('Stock', sql.Int, Stock)
      .input('p', sql.Int, p)
      .input('a', sql.Int, a)
      .input('m', sql.Int, m)
      .query(`
        INSERT INTO PART (Category, Price, Stock, p, a, m)
        OUTPUT INSERTED.*
        VALUES (@Category, @Price, @Stock, @p, @a, @m)
      `);
    
    const newPart = result.recordset[0];
    
    res.status(201).json({
      success: true,
      message: 'Parte creada exitosamente',
      data: {
        id: newPart.Part_id,
        name: partName,
        category: newPart.Category,
        price: newPart.Price,
        stock: newPart.Stock,
        p: newPart.p,
        a: newPart.a,
        m: newPart.m
      }
    });
  } catch (error) {
    console.error('Error en createPart:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear parte',
      error: error.message
    });
  }
};

// Obtener parte por ID
exports.getPartById = async (req, res) => {
  try {
    const { partId } = req.params;
    
    const pool = await mssqlConnect();
    const result = await pool.request()
      .input('Part_id', sql.Int, partId)
      .query('SELECT * FROM PART WHERE Part_id = @Part_id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Parte no encontrada'
      });
    }
    
    const part = result.recordset[0];
    const partData = {
      id: part.Part_id,
      name: `${part.Category} #${part.Part_id}`,
      category: part.Category,
      price: part.Price,
      stock: part.Stock,
      p: part.p,
      a: part.a,
      m: part.m
    };
    
    res.json({
      success: true,
      data: partData
    });
  } catch (error) {
    console.error('Error en getPartById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener parte',
      error: error.message
    });
  }
};

// Actualizar parte
exports.updatePart = async (req, res) => {
  try {
    const { partId } = req.params;
    const { Price, Stock, p, a, m } = req.body;
    
    // Validaciones
    if (Price !== undefined && Price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio debe ser mayor a 0'
      });
    }

    if (Stock !== undefined && Stock < 0) {
      return res.status(400).json({
        success: false,
        message: 'El stock no puede ser negativo'
      });
    }

    // Validar que p, a, m estén entre 0 y 9
    if ((p !== undefined && (p < 0 || p > 9)) || 
        (a !== undefined && (a < 0 || a > 9)) || 
        (m !== undefined && (m < 0 || m > 9))) {
      return res.status(400).json({
        success: false,
        message: 'Los valores p, a, m deben estar entre 0 y 9'
      });
    }

    const pool = await mssqlConnect();
    
    // Verificar que la parte existe
    const checkResult = await pool.request()
      .input('Part_id', sql.Int, partId)
      .query('SELECT * FROM PART WHERE Part_id = @Part_id');
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Parte no encontrada'
      });
    }
    
    // Construir query dinámica para actualizar
    let updateFields = [];
    const request = pool.request();
    
    request.input('Part_id', sql.Int, partId);
    
    if (Price !== undefined) {
      updateFields.push('Price = @Price');
      request.input('Price', sql.Decimal(10, 2), Price);
    }
    
    if (Stock !== undefined) {
      updateFields.push('Stock = @Stock');
      request.input('Stock', sql.Int, Stock);
    }
    
    if (p !== undefined) {
      updateFields.push('p = @p');
      request.input('p', sql.Int, p);
    }
    
    if (a !== undefined) {
      updateFields.push('a = @a');
      request.input('a', sql.Int, a);
    }
    
    if (m !== undefined) {
      updateFields.push('m = @m');
      request.input('m', sql.Int, m);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }
    
    const updateQuery = `
      UPDATE PART 
      SET ${updateFields.join(', ')}
      WHERE Part_id = @Part_id
      SELECT * FROM PART WHERE Part_id = @Part_id
    `;
    
    const result = await request.query(updateQuery);
    
    const updatedPart = result.recordset[0];
    const partData = {
      id: updatedPart.Part_id,
      name: `${updatedPart.Category} #${updatedPart.Part_id}`,
      category: updatedPart.Category,
      price: updatedPart.Price,
      stock: updatedPart.Stock,
      p: updatedPart.p,
      a: updatedPart.a,
      m: updatedPart.m
    };
    
    res.json({
      success: true,
      message: 'Parte actualizada exitosamente',
      data: partData
    });
  } catch (error) {
    console.error('Error en updatePart:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar parte',
      error: error.message
    });
  }
};

// Eliminar parte
exports.deletePart = async (req, res) => {
  try {
    const { partId } = req.params;
    
    const pool = await mssqlConnect();
    
    // Verificar que la parte existe
    const checkResult = await pool.request()
      .input('Part_id', sql.Int, partId)
      .query('SELECT * FROM PART WHERE Part_id = @Part_id');
    
    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Parte no encontrada'
      });
    }
    
    // Verificar si hay partes en inventario o instaladas
    const inventoryCheck = await pool.request()
      .input('Part_id', sql.Int, partId)
      .query(`
        SELECT COUNT(*) as count FROM INVENTORY_PART WHERE Part_id = @Part_id
        UNION ALL
        SELECT COUNT(*) FROM CAR_CONFIGURATION WHERE Part_id = @Part_id
      `);
    
    const inInventory = inventoryCheck.recordsets[0][0].count > 0;
    const inCars = inventoryCheck.recordsets[1][0].count > 0;
    
    if (inInventory || inCars) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar la parte porque está en inventario o instalada en carros',
        details: {
          inInventory,
          inCars
        }
      });
    }
    
    // Eliminar la parte
    await pool.request()
      .input('Part_id', sql.Int, partId)
      .query('DELETE FROM PART WHERE Part_id = @Part_id');
    
    res.json({
      success: true,
      message: 'Parte eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error en deletePart:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar parte',
      error: error.message
    });
  }
};