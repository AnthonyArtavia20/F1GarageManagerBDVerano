-- ============================================================================
-- F1 Garage Manager
-- Parte 5: Stored Procedures Preliminares (Versión Básica para entregable 2 toca mejorarlos para entregable 3)
-- Descripción: SPs simples para demostración inicial
-- ============================================================================

USE F1GarageManager;
GO

PRINT 'Iniciando creación de Stored Procedures:';
GO

-- ============================================================================
-- 1. SP: Calcular presupuesto de un equipo
-- ============================================================================
CREATE PROCEDURE sp_GetTeamBudget
    @Team_id INT
AS
BEGIN
    -- Sumar aportes del equipo
    SELECT SUM(Amount) AS Total_Budget
    FROM CONTRIBUTION
    WHERE Team_id = @Team_id;
END
GO

PRINT 'SP sp_GetTeamBudget creado!!';
GO

-- ============================================================================
-- 2. SP: Ver inventario de un equipo
-- ============================================================================
CREATE PROCEDURE sp_GetTeamInventory
    @Team_id INT
AS
BEGIN
    -- Mostrar partes en inventario
    SELECT 
        p.Part_id,
        p.Category,
        ip.Quantity
    FROM INVENTORY i
    JOIN INVENTORY_PART ip ON i.Inventory_id = ip.Inventory_id
    JOIN PART p ON ip.Part_id = p.Part_id
    WHERE i.Team_id = @Team_id;
END
GO

PRINT 'SP sp_GetTeamInventory creado';
GO

-- ============================================================================
-- 3. SP: Registrar una compra simple
-- ============================================================================
CREATE PROCEDURE sp_RegisterPurchase
    @Engineer_User_id INT,
    @Part_id INT,
    @Quantity INT
AS
BEGIN
    -- Insertar compra
    INSERT INTO PURCHASE (Engineer_User_id, Part_id, Quantity, Unit_price, Total_price)
    VALUES (@Engineer_User_id, @Part_id, @Quantity, 100, 100 * @Quantity);
    
    PRINT 'Compra registrada';
END
GO

PRINT 'SP sp_RegisterPurchase creado';
GO

-- ============================================================================
-- 4. SP: Ver configuración de un carro
-- ============================================================================
CREATE PROCEDURE sp_GetCarConfiguration
    @Car_id INT
AS
BEGIN
    -- Mostrar partes instaladas en un carro
    SELECT 
        Part_Category,
        Part_id
    FROM CAR_CONFIGURATION
    WHERE Car_id = @Car_id;
END
GO

PRINT 'SP sp_GetCarConfiguration creado';
GO

-- ============================================================================
-- Verificación
-- ============================================================================
PRINT '';
PRINT '============================================================================';
PRINT 'Stored Procedures preliminares creados exitosamente';
PRINT '============================================================================';
PRINT '';

SELECT 
    name AS 'Stored Procedure'
FROM sys.procedures
WHERE schema_id = SCHEMA_ID('dbo')
ORDER BY name;
GO

PRINT '';
PRINT 'Total: 4 Stored Procedures básicos';
GO