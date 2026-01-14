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

-- ============================================================================
-- MÓDULO ARMADO: Nuevos Stored Procedures para Ensamblaje de Autos
-- ============================================================================

-- ============================================================================
-- 7 SP: Instalar Parte en Auto
-- Descripción: Instala una parte en un auto, validando inventario y compatibilidad
-- ============================================================================
CREATE PROCEDURE sp_InstallPart
    @Car_id INT,
    @Part_id INT,
    @Team_id INT
AS
BEGIN
    DECLARE @Category VARCHAR(50);
    DECLARE @Stock INT;
    DECLARE @TeamInventory INT;
    DECLARE @Budget DECIMAL(10,2);
    DECLARE @PartPrice DECIMAL(10,2);

    -- Obtener categoría y precio de la parte
    SELECT @Category = Category, @PartPrice = Price, @Stock = Stock
    FROM PART
    WHERE Part_id = @Part_id;

    IF @Category IS NULL
    BEGIN
        THROW 51001, 'Parte no encontrada', 1;
    END

    -- Verificar si ya hay una parte instalada en esa categoría
    IF EXISTS (SELECT 1 FROM CAR_CONFIGURATION WHERE Car_id = @Car_id AND Part_Category = @Category)
    BEGIN
        THROW 51002, 'Ya hay una parte instalada en esta categoría. Use reemplazo.', 1;
    END

    -- Verificar stock global
    IF @Stock <= 0
    BEGIN
        THROW 51003, 'Parte sin stock disponible', 1;
    END

    -- Verificar inventario del equipo
    SELECT @TeamInventory = Quantity
    FROM INVENTORY i
    JOIN INVENTORY_PART ip ON i.Inventory_id = ip.Inventory_id
    WHERE i.Team_id = @Team_id AND ip.Part_id = @Part_id;

    IF @TeamInventory IS NULL OR @TeamInventory <= 0
    BEGIN
        THROW 51004, 'Equipo no tiene esta parte en inventario', 1;
    END

    -- Verificar presupuesto del equipo
    SELECT @Budget = SUM(Amount) FROM CONTRIBUTION WHERE Team_id = @Team_id;

    IF @Budget IS NULL OR @Budget < @PartPrice
    BEGIN
        THROW 51005, 'Presupuesto insuficiente para instalar esta parte', 1;
    END

    -- Instalar parte
    INSERT INTO CAR_CONFIGURATION (Car_id, Part_Category, Part_id)
    VALUES (@Car_id, @Category, @Part_id);

    -- Reducir stock global y del equipo
    UPDATE PART SET Stock = Stock - 1 WHERE Part_id = @Part_id;

    UPDATE ip
    SET Quantity = Quantity - 1
    FROM INVENTORY_PART ip
    JOIN INVENTORY i ON ip.Inventory_id = i.Inventory_id
    WHERE i.Team_id = @Team_id AND ip.Part_id = @Part_id;

    PRINT 'Parte instalada exitosamente';
END
GO

PRINT 'SP sp_InstallPart creado';
GO

-- ============================================================================
-- 8 SP: Reemplazar Parte en Auto
-- Descripción: Reemplaza una parte existente por otra, validando todo
-- ============================================================================
CREATE PROCEDURE sp_ReplacePart
    @Car_id INT,
    @OldPart_id INT,
    @NewPart_id INT,
    @Team_id INT
AS
BEGIN
    DECLARE @Category VARCHAR(50);
    DECLARE @NewCategory VARCHAR(50);
    DECLARE @Stock INT;
    DECLARE @TeamInventory INT;
    DECLARE @Budget DECIMAL(10,2);
    DECLARE @PartPrice DECIMAL(10,2);

    -- Verificar que la parte vieja esté instalada
    SELECT @Category = Part_Category
    FROM CAR_CONFIGURATION
    WHERE Car_id = @Car_id AND Part_id = @OldPart_id;

    IF @Category IS NULL
    BEGIN
        THROW 51006, 'La parte vieja no está instalada en este auto', 1;
    END

    -- Obtener datos de la nueva parte
    SELECT @NewCategory = Category, @PartPrice = Price, @Stock = Stock
    FROM PART
    WHERE Part_id = @NewPart_id;

    IF @NewCategory IS NULL
    BEGIN
        THROW 51001, 'Nueva parte no encontrada', 1;
    END

    -- Verificar que sea la misma categoría
    IF @Category != @NewCategory
    BEGIN
        THROW 51007, 'La nueva parte debe ser de la misma categoría', 1;
    END

    -- Verificar stock
    IF @Stock <= 0
    BEGIN
        THROW 51003, 'Nueva parte sin stock disponible', 1;
    END

    -- Verificar inventario del equipo
    SELECT @TeamInventory = Quantity
    FROM INVENTORY i
    JOIN INVENTORY_PART ip ON i.Inventory_id = ip.Inventory_id
    WHERE i.Team_id = @Team_id AND ip.Part_id = @NewPart_id;

    IF @TeamInventory IS NULL OR @TeamInventory <= 0
    BEGIN
        THROW 51004, 'Equipo no tiene la nueva parte en inventario', 1;
    END

    -- Verificar presupuesto
    SELECT @Budget = SUM(Amount) FROM CONTRIBUTION WHERE Team_id = @Team_id;

    IF @Budget IS NULL OR @Budget < @PartPrice
    BEGIN
        THROW 51005, 'Presupuesto insuficiente para reemplazar esta parte', 1;
    END

    -- Reemplazar parte
    UPDATE CAR_CONFIGURATION
    SET Part_id = @NewPart_id, Installed_date = GETDATE()
    WHERE Car_id = @Car_id AND Part_Category = @Category;

    -- Ajustar stocks: devolver la vieja, quitar la nueva
    UPDATE PART SET Stock = Stock + 1 WHERE Part_id = @OldPart_id;
    UPDATE PART SET Stock = Stock - 1 WHERE Part_id = @NewPart_id;

    UPDATE ip
    SET Quantity = Quantity + 1
    FROM INVENTORY_PART ip
    JOIN INVENTORY i ON ip.Inventory_id = i.Inventory_id
    WHERE i.Team_id = @Team_id AND ip.Part_id = @OldPart_id;

    UPDATE ip
    SET Quantity = Quantity - 1
    FROM INVENTORY_PART ip
    JOIN INVENTORY i ON ip.Inventory_id = i.Inventory_id
    WHERE i.Team_id = @Team_id AND ip.Part_id = @NewPart_id;

    PRINT 'Parte reemplazada exitosamente';
END
GO

PRINT 'SP sp_ReplacePart creado';
GO

-- ============================================================================
-- 9 SP: Calcular Parámetros Reales del Auto
-- Descripción: Calcula stats (p, a, m) basados en partes instaladas
-- ============================================================================
CREATE PROCEDURE sp_CalculateCarStats
    @Car_id INT
AS
BEGIN
    DECLARE @TotalP INT = 0;
    DECLARE @TotalA INT = 0;
    DECLARE @TotalM INT = 0;

    -- Sumar parámetros de todas las partes instaladas
    SELECT 
        @TotalP = SUM(p.p),
        @TotalA = SUM(p.a),
        @TotalM = SUM(p.m)
    FROM CAR_CONFIGURATION cc
    JOIN PART p ON cc.Part_id = p.Part_id
    WHERE cc.Car_id = @Car_id;

    -- Si no hay partes, devolver 0
    SELECT 
        ISNULL(@TotalP, 0) AS Power,
        ISNULL(@TotalA, 0) AS Aerodynamics,
        ISNULL(@TotalM, 0) AS Maneuverability,
        (ISNULL(@TotalP, 0) + ISNULL(@TotalA, 0) + ISNULL(@TotalM, 0)) AS TotalPerformance;
END
GO

PRINT 'SP sp_CalculateCarStats creado';
GO

-- ============================================================================
-- 10 SP: Verificar Compatibilidad de Parte
-- Descripción: Valida si una parte es compatible (ej: misma categoría)
-- ============================================================================
CREATE PROCEDURE sp_ValidatePartCompatibility
    @Car_id INT,
    @Part_id INT
AS
BEGIN
    DECLARE @CarCategory VARCHAR(50);
    DECLARE @PartCategory VARCHAR(50);

    -- Obtener categoría de la parte
    SELECT @PartCategory = Category FROM PART WHERE Part_id = @Part_id;

    IF @PartCategory IS NULL
    BEGIN
        SELECT 'INVALID' AS Status, 'Parte no existe' AS Message;
        RETURN;
    END

    -- Verificar si ya hay parte en esa categoría
    IF EXISTS (SELECT 1 FROM CAR_CONFIGURATION WHERE Car_id = @Car_id AND Part_Category = @PartCategory)
    BEGIN
        SELECT 'REPLACE' AS Status, 'Ya hay parte instalada, se puede reemplazar' AS Message;
    END
    ELSE
    BEGIN
        SELECT 'INSTALL' AS Status, 'Parte compatible para instalación' AS Message;
    END
END
GO

PRINT 'SP sp_ValidatePartCompatibility creado';
GO

PRINT '';
PRINT 'Módulo Armado implementado exitosamente';
PRINT 'SPs agregados: sp_InstallPart, sp_ReplacePart, sp_CalculateCarStats, sp_ValidatePartCompatibility';
GO