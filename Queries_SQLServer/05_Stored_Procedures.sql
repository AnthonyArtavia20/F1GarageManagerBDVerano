-- ============================================================================
-- F1 Garage Manager
-- Parte 5: Stored Procedures Preliminares (Versión Básica)
-- Descripción: SPs simples para demostración inicial
-- ============================================================================
USE F1GarageManager;
GO

-- ============================================================================
-- 1. SP: Calcular presupuesto de un equipo
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_GetTeamBudget
    @Team_id INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @TotalIncome DECIMAL(10,2);
    DECLARE @TotalSpent DECIMAL(10,2);
    DECLARE @TeamName VARCHAR(100);

    -- Obtener nombre del equipo
    SELECT @TeamName = Name 
    FROM TEAM 
    WHERE Team_id = @Team_id;

    -- Total recibido de aportes
    SELECT @TotalIncome = ISNULL(SUM(Amount), 0)
    FROM CONTRIBUTION
    WHERE Team_id = @Team_id;

    -- Total gastado en compras
    SELECT @TotalSpent = ISNULL(SUM(p.Total_price), 0)
    FROM PURCHASE p
    INNER JOIN ENGINEER e ON p.Engineer_User_id = e.User_id
    WHERE e.Team_id = @Team_id;

    -- Actualizar campos en TEAM
    UPDATE TEAM 
    SET Total_Budget = @TotalIncome,
        Total_Spent = @TotalSpent
    WHERE Team_id = @Team_id;

    -- Retornar resultado
    SELECT
        @Team_id AS Team_id,
        @TeamName AS Name,
        @TotalIncome AS Total_Budget,
        @TotalSpent AS Total_Spent,
        (@TotalIncome - @TotalSpent) AS Available_Budget,
        (SELECT COUNT(*) FROM CONTRIBUTION WHERE Team_id = @Team_id) AS Total_Contributions,
        (SELECT COUNT(*) FROM PURCHASE p 
         INNER JOIN ENGINEER e ON p.Engineer_User_id = e.User_id
         WHERE e.Team_id = @Team_id) AS Total_Purchases;
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
CREATE OR ALTER PROCEDURE sp_RegisterPurchase
    @Engineer_User_id INT,
    @Part_id INT,
    @Quantity INT,
    @NewAvailableBudget DECIMAL(10,2) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRANSACTION;

    BEGIN TRY
        DECLARE @Team_id INT;
        DECLARE @Unit_price DECIMAL(10,2);
        DECLARE @Total_price DECIMAL(10,2);
        DECLARE @Available_Budget DECIMAL(10,2);
        DECLARE @Stock INT;
        DECLARE @TotalIncome DECIMAL(10,2);

        -- Obtener Team_id del Engineer (CORREGIDO: desde ENGINEER, no USER)
        SELECT @Team_id = Team_id
        FROM ENGINEER
        WHERE User_id = @Engineer_User_id;

        IF @Team_id IS NULL
        BEGIN
            THROW 53001, 'Engineer no encontrado o no asignado a un equipo', 1;
        END

        -- Obtener precio y stock de la parte
        SELECT @Unit_price = Price, @Stock = Stock
        FROM PART
        WHERE Part_id = @Part_id;

        IF @Unit_price IS NULL
        BEGIN
            THROW 53002, 'Parte no encontrada', 1;
        END

        -- Validar cantidad
        IF @Quantity <= 0
        BEGIN
            THROW 53003, 'La cantidad debe ser mayor a 0', 1;
        END

        -- Validar stock disponible
        IF @Stock < @Quantity
        BEGIN
            THROW 53004, 'Stock insuficiente', 1;
        END

        -- Calcular precio total
        SET @Total_price = @Unit_price * @Quantity;

        -- Calcular presupuesto disponible (CORREGIDO: cálculo correcto)
        SELECT @TotalIncome = ISNULL(SUM(Amount), 0)
        FROM CONTRIBUTION
        WHERE Team_id = @Team_id;

        SELECT @Available_Budget = @TotalIncome - ISNULL(SUM(Total_price), 0)
        FROM PURCHASE p
        INNER JOIN ENGINEER e ON p.Engineer_User_id = e.User_id
        WHERE e.Team_id = @Team_id;

        SET @Available_Budget = ISNULL(@Available_Budget, @TotalIncome);

        -- Validar presupuesto suficiente
        IF @Available_Budget < @Total_price
        BEGIN
            DECLARE @ErrorMsg NVARCHAR(200) = 
                'Presupuesto insuficiente. Disponible: ' + CAST(@Available_Budget AS VARCHAR(20)) + 
                ', Necesario: ' + CAST(@Total_price AS VARCHAR(20));
            THROW 53005, @ErrorMsg, 1;
        END

        -- ========== REALIZAR COMPRA ==========
        
        -- Insertar registro de compra
        INSERT INTO PURCHASE (Engineer_User_id, Part_id, Quantity, Unit_price, Total_price, Purchase_Date)
        VALUES (@Engineer_User_id, @Part_id, @Quantity, @Unit_price, @Total_price, GETDATE());

        -- Reducir stock de la tienda
        UPDATE PART
        SET Stock = Stock - @Quantity
        WHERE Part_id = @Part_id;

        -- Actualizar Total_Spent del equipo
        UPDATE TEAM
        SET Total_Spent = Total_Spent + @Total_price
        WHERE Team_id = @Team_id;

        -- ========== AGREGAR AL INVENTARIO ==========
        
        DECLARE @Inventory_id INT;

        -- Obtener o crear inventario del equipo
        SELECT @Inventory_id = Inventory_id
        FROM INVENTORY
        WHERE Team_id = @Team_id;

        IF @Inventory_id IS NULL
        BEGIN
            INSERT INTO INVENTORY (Team_id)
            VALUES (@Team_id);
            SET @Inventory_id = SCOPE_IDENTITY();
        END

        -- Verificar si la parte ya existe en el inventario
        IF EXISTS (SELECT 1 FROM INVENTORY_PART WHERE Inventory_id = @Inventory_id AND Part_id = @Part_id)
        BEGIN
            -- Incrementar cantidad existente
            UPDATE INVENTORY_PART
            SET Quantity = Quantity + @Quantity,
                Acquisition_date = GETDATE()
            WHERE Inventory_id = @Inventory_id AND Part_id = @Part_id;
        END
        ELSE
        BEGIN
            -- Insertar nueva parte en inventario
            INSERT INTO INVENTORY_PART (Inventory_id, Part_id, Quantity, Acquisition_date)
            VALUES (@Inventory_id, @Part_id, @Quantity, GETDATE());
        END

        -- Obtener nuevo presupuesto disponible
        SELECT @NewAvailableBudget = (@TotalIncome - ISNULL(SUM(Total_price), 0))
        FROM PURCHASE p
        INNER JOIN ENGINEER e ON p.Engineer_User_id = e.User_id
        WHERE e.Team_id = @Team_id;

        SET @NewAvailableBudget = ISNULL(@NewAvailableBudget, @TotalIncome);

        -- ========== CONFIRMAR TRANSACCIÓN ==========
        
        COMMIT TRANSACTION;

        -- Retornar información de la compra
        SELECT
            SCOPE_IDENTITY() AS Purchase_id,
            @Total_price AS Total_Paid,
            @NewAvailableBudget AS New_Available_Budget;

        PRINT 'Compra registrada exitosamente. Presupuesto disponible: ' + CAST(@NewAvailableBudget AS VARCHAR(20));

    END TRY
    BEGIN CATCH
        -- Manejo de errores
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();

        RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
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

PRINT 'Iniciando creación de Stored Procedures básicos...';
PRINT '============================================================================';
PRINT 'Stored Procedures básicos creados exitosamente';
PRINT '============================================================================';
PRINT 'Total: 6 Stored Procedures básicos creados';
GO

PRINT 'Iniciando creación de Stored Procedures del Módulo de armado';
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
-- Descripción: Calcula stats (p - Power, a - Aerodynamics, m - Maneuverability) basados en partes instaladas
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_CalculateCarStats
    @Car_id INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Sumar los valores P, A, M de todas las partes instaladas
    SELECT 
        @Car_id AS Car_id,
        ISNULL(SUM(p.p), 0) AS Power,
        ISNULL(SUM(p.a), 0) AS Aerodynamics,
        ISNULL(SUM(p.m), 0) AS Maneuverability,
        (ISNULL(SUM(p.p), 0) + ISNULL(SUM(p.a), 0) + ISNULL(SUM(p.m), 0)) AS TotalPerformance,
        COUNT(cc.Part_id) AS Parts_Installed
    FROM CAR_CONFIGURATION cc
    INNER JOIN PART p ON cc.Part_id = p.Part_id
    WHERE cc.Car_id = @Car_id
    GROUP BY @Car_id;
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


PRINT 'Módulo Armado implementado exitosamente !!';
PRINT 'SPs agregados: sp_InstallPart, sp_ReplacePart, sp_CalculateCarStats, sp_ValidatePartCompatibility';
GO

-- ============================================================================
-- MÓDULO SPONSORS: Stored Procedures para Gestión de Patrocinadores y Aportes
-- ============================================================================

-- ============================================================================
-- 11 SP: Calcular el dinero disponible ?????????? Alexs? De qué es?
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_CalculateAvailableBudget
    @Team_id INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @TotalIncome DECIMAL(10,2);
    DECLARE @TotalSpent DECIMAL(10,2);
    DECLARE @TeamName VARCHAR(100);

    -- Obtener nombre del equipo
    SELECT @TeamName = Name 
    FROM TEAM 
    WHERE Team_id = @Team_id;

    --Total recibido de aporte--
    SELECT @TotalIncome = ISNULL(SUM(Amount), 0)
    FROM CONTRIBUTION
    WHERE Team_id = @Team_id;

    --Total gastado en compras-- (CORREGIDO: sin referencia a Role)
    SELECT @TotalSpent = ISNULL(SUM(p.Total_price), 0)
    FROM PURCHASE p
    INNER JOIN ENGINEER e ON p.Engineer_User_id = e.User_id
    WHERE e.Team_id = @Team_id;

    --Resumen completo--
    SELECT
        @Team_id AS Team_ID,
        @TeamName AS Team_Name,
        @TotalIncome AS Total_Income,
        @TotalSpent AS Total_Spent,
        (@TotalIncome - @TotalSpent) AS Available_budget,
        (SELECT COUNT(*) FROM CONTRIBUTION WHERE Team_id = @Team_id) AS Total_contributions,
        (SELECT COUNT(*) FROM PURCHASE p 
         INNER JOIN ENGINEER e ON p.Engineer_User_id = e.User_id
         WHERE e.Team_id = @Team_id) AS Total_Purchases;
END
GO
PRINT 'SP sp_CalculateAvailableBudget creado';
GO

-- ============================================================================
-- 12. SP: Registrar Aporte de Patrocinador (CON TRANSACCIÓN)
-- Descripción: Registra un aporte y actualiza el presupuesto del equipo
-- IMPORTANTE: Usa transacción para garantizar consistencia
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_RegisterContribution
    @Sponsor_id INT,
    @Team_id INT,
    @Amount DECIMAL(10,2),
    @Description NVARCHAR(200) = NULL,
    @NewBudget DECIMAL(10,2) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- Iniciar transacción para garantizar atomicidad
    BEGIN TRANSACTION;

    BEGIN TRY
        -- ========== VALIDACIONES ==========
        
        -- Validar que el sponsor existe
        IF NOT EXISTS (SELECT 1 FROM SPONSOR WHERE Sponsor_id = @Sponsor_id)
        BEGIN
            THROW 52001, 'Sponsor no existe', 1;
        END

        -- Validar que el equipo existe
        IF NOT EXISTS (SELECT 1 FROM TEAM WHERE Team_id = @Team_id)
        BEGIN
            THROW 52002, 'Equipo no existe', 1;
        END

        -- Validar que el monto es positivo
        IF @Amount <= 0
        BEGIN
            THROW 52003, 'El monto del aporte debe ser positivo', 1;
        END

        -- ========== INSERCIÓN DEL APORTE ==========
        
        INSERT INTO CONTRIBUTION (Sponsor_id, Team_id, Amount, Date, Description)
        VALUES (@Sponsor_id, @Team_id, @Amount, GETDATE(), @Description);

        -- ========== ACTUALIZAR PRESUPUESTO DEL EQUIPO ==========
        
        -- Incrementar Total_Budget del equipo
        UPDATE TEAM
        SET Total_Budget = Total_Budget + @Amount
        WHERE Team_id = @Team_id;

        -- Obtener el nuevo presupuesto total
        SELECT @NewBudget = Total_Budget
        FROM TEAM
        WHERE Team_id = @Team_id;

        -- ========== CONFIRMAR TRANSACCIÓN ==========
        
        COMMIT TRANSACTION;

        -- Retornar el ID del aporte creado y el nuevo presupuesto
        SELECT
            SCOPE_IDENTITY() AS Contribution_id,
            @NewBudget AS NewBudget;

        PRINT 'Aporte registrado exitosamente. Nuevo presupuesto: ' + CAST(@NewBudget AS VARCHAR(20));

    END TRY
    BEGIN CATCH
        -- Manejo de errores: revertir cambios
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        -- Obtener info del error
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();

        -- Relanzar el error para que llegue al controlador
        RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO
PRINT 'SP sp_RegisterContribution actualizado';
GO

-- ============================================================================
-- 13. SP: Obtener Aportes de un Equipo con Detalles
-- Descripción: Retorna todos los aportes de un equipo con info del sponsor
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_GetTeamContributionsDetailed
    @Team_id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.Contribution_id,
        c.Sponsor_id,
        s.Name AS Sponsor_Name,
        s.Industry,
        s.Country,
        c.Team_id,
        c.Amount,
        c.Date,
        c.Description
    FROM CONTRIBUTION c
    INNER JOIN SPONSOR s ON c.Sponsor_id = s.Sponsor_id
    WHERE c.Team_id = @Team_id
    ORDER BY c.Date DESC;
END
GO
PRINT 'SP sp_GetTeamContributionsDetailed creado';
GO

-- ============================================================================
-- 14. SP: Obtener Estadísticas de Sponsor
-- Descripción: Retorna resumen de aportes por sponsor
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_GetSponsorStats
    @Sponsor_id INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        s.Sponsor_id,
        s.Name,
        s.Industry,
        s.Country,
        COUNT(c.Contribution_id) AS Total_Contributions,
        ISNULL(SUM(c.Amount), 0) AS Total_Amount,
        MAX(c.Date) AS Last_contribution_date,
        COUNT(DISTINCT c.Team_id) AS Teams_Supported
    FROM SPONSOR s
    LEFT JOIN CONTRIBUTION c ON s.Sponsor_id = c.Sponsor_id
    WHERE s.Sponsor_id = @Sponsor_id
    GROUP BY s.Sponsor_id, s.Name, s.Industry, s.Country;

END
GO
PRINT 'SP sp_GetSponsorStats creado';
GO

-- ============================================================================
-- 15. SP: Validar compra antes de realizar
-- Útil para el frontend
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_ValidatePurchase
    @Engineer_User_id INT,
    @Part_id INT,
    @Quantity INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Team_id INT;
    DECLARE @Unit_price DECIMAL(10,2);
    DECLARE @Total_price DECIMAL(10,2);
    DECLARE @Available_Budget DECIMAL(10,2);
    DECLARE @Stock INT;
    DECLARE @TotalIncome DECIMAL(10,2);

    -- Obtener Team_id (CORREGIDO: desde ENGINEER, no USER)
    SELECT @Team_id = Team_id
    FROM ENGINEER
    WHERE User_id = @Engineer_User_id;

    -- Obtener datos de la parte
    SELECT @Unit_price = Price, @Stock = Stock
    FROM PART
    WHERE Part_id = @Part_id;

    -- Calcular presupuesto disponible (CORREGIDO: cálculo correcto)
    SELECT @TotalIncome = ISNULL(SUM(Amount), 0)
    FROM CONTRIBUTION
    WHERE Team_id = @Team_id;

    SELECT @Available_Budget = @TotalIncome - ISNULL(SUM(Total_price), 0)
    FROM PURCHASE p
    INNER JOIN ENGINEER e ON p.Engineer_User_id = e.User_id
    WHERE e.Team_id = @Team_id;

    SET @Available_Budget = ISNULL(@Available_Budget, @TotalIncome);

    -- Calcular costo total
    SET @Total_price = @Unit_price * @Quantity;

    -- Retornar validación
    SELECT
        CASE 
            WHEN @Team_id IS NULL THEN 'ERROR'
            WHEN @Unit_price IS NULL THEN 'ERROR'
            WHEN @Quantity <= 0 THEN 'ERROR'
            WHEN @Stock < @Quantity THEN 'INSUFFICIENT_STOCK'
            WHEN @Available_Budget < @Total_price THEN 'INSUFFICIENT_BUDGET'
            ELSE 'OK'
        END AS ValidationStatus,
        @Available_Budget AS Available_Budget,
        @Total_price AS Required_Amount,
        @Stock AS Available_Stock,
        @Quantity AS Requested_Quantity,
        CASE 
            WHEN @Available_Budget >= @Total_price AND @Stock >= @Quantity THEN 1
            ELSE 0
        END AS CanPurchase;
END
GO
PRINT 'SP sp_ValidatePurchase creado';
GO

-- ============================================================================
-- SP: Agregar Nueva Parte al Catálogo
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_AddPart
    @Name NVARCHAR(100),
    @Category VARCHAR(50),
    @Price DECIMAL(10,2),
    @Stock INT,
    @p INT,
    @a INT,
    @m INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRANSACTION;

    BEGIN TRY
        -- Validar categoría
        IF @Category NOT IN ('Power_Unit', 'Aerodynamics_pkg', 'Wheels', 'Suspension', 'Gearbox')
        BEGIN
            THROW 54001, 'Categoría inválida', 1;
        END

        -- Validar valores P, A, M
        IF @p < 0 OR @p > 9 OR @a < 0 OR @a > 9 OR @m < 0 OR @m > 9
        BEGIN
            THROW 54002, 'Los valores P, A, M deben estar entre 0 y 9', 1;
        END

        -- Validar precio y stock
        IF @Price <= 0
        BEGIN
            THROW 54003, 'El precio debe ser mayor a 0', 1;
        END

        IF @Stock < 0
        BEGIN
            THROW 54004, 'El stock no puede ser negativo', 1;
        END

        -- Insertar nueva parte
        INSERT INTO PART (Category, Price, Stock, p, a, m)
        VALUES (@Category, @Price, @Stock, @p, @a, @m);

        -- Obtener ID de la nueva parte
        DECLARE @NewPartID INT = SCOPE_IDENTITY();

        COMMIT TRANSACTION;

        -- Retornar la parte creada
        SELECT 
            Part_id,
            Category,
            Price,
            Stock,
            p,
            a,
            m
        FROM PART
        WHERE Part_id = @NewPartID;

        PRINT 'Parte agregada exitosamente al catálogo';

    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();

        RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO
PRINT 'SP sp_AddPart creado';
GO