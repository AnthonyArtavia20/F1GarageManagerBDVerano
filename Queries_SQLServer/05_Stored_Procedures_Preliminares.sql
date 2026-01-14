-- ============================================================================
-- F1 Garage Manager
-- Parte 5: Stored Procedures Preliminares (Versión Básica)
-- Descripción: SPs simples para demostración inicial
-- ============================================================================

USE F1GarageManager;
GO
GO

-- ============================================================================
-- 1. SP: Calcular presupuesto de un equipo
-- ============================================================================

CREATE PROCEDURE sp_GetTeamBudget
    @Team_id INT
AS
BEGIN
    -- Sumar todos los aportes del equipo
    SELECT SUM(Amount) AS Total_Budget
    FROM CONTRIBUTION
    WHERE Team_id = @Team_id;
END
GO

PRINT 'SP sp_GetTeamBudget creado';
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
    -- Insertar compra (versión preliminar con valores fijos)
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
    -- Mostrar partes instaladas
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
-- 5 SP: Crear Simulación Básica
-- ============================================================================
CREATE PROCEDURE sp_CreateSimulationBasic
    @AdminID INT,
    @CircuitID INT
AS
BEGIN
    INSERT INTO SIMULATION (Circuit_id, Created_by_admin_id, Data_time)
    VALUES (@CircuitID, @AdminID, GETDATE());
    
    SELECT SCOPE_IDENTITY() AS NewSimulationID;
END
GO

-- ============================================================================
-- 6 SP: Agregar Participante
-- ============================================================================
CREATE PROCEDURE sp_AddSimulationParticipant
    @SimulationID INT,
    @CarID INT,
    @DriverID INT,
    @TeamID INT
AS
BEGIN
    -- Verificar que el carro esté finalizado
    IF EXISTS (SELECT 1 FROM CAR WHERE Car_id = @CarID AND isFinalized = 1)
    BEGIN
        INSERT INTO SIMULATION_PARTICIPANT (simulation_id, car_id, driver_id, team_id)
        VALUES (@SimulationID, @CarID, @DriverID, @TeamID);
        
        PRINT 'Participante agregado exitosamente';
    END
    ELSE
    BEGIN
        PRINT 'ERROR: El carro no está finalizado';
        THROW 51000, 'El carro debe estar finalizado para participar', 1;
    END
END
GO

PRINT 'SP sp_AddSimulationParticipant creado';
GO

-- Verificar SPs creados
SELECT 
    name AS 'Stored Procedure'
FROM sys.procedures
WHERE schema_id = SCHEMA_ID('dbo')
ORDER BY name;
GO

PRINT 'Iniciando creación de Stored Procedures...';
PRINT '';
PRINT '============================================================================';
PRINT 'Stored Procedures preliminares creados exitosamente';
PRINT '============================================================================';
PRINT '';

PRINT '';
PRINT 'Total: 6 Stored Procedures básicos creados';
GO