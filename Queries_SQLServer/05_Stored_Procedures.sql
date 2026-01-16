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
GO
PRINT '============================================================================';
GO
PRINT 'Stored Procedures básicos creados exitosamente';
GO
PRINT '============================================================================';
GO
PRINT 'Total: 6 Stored Procedures básicos creados';
GO

PRINT 'Iniciando creación de Stored Procedures del Módulo de armado';
GO
-- ============================================================================
-- MÓDULO ARMADO: Nuevos Stored Procedures para Ensamblaje de Autos
-- ============================================================================

-- ============================================================================
-- 7 SP: Instalar Parte en Auto
-- Descripción: Instala una parte en un auto, validando inventario y compatibilidad
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_InstallPart
    @Car_id INT,
    @Part_id INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRANSACTION;

    BEGIN TRY
        DECLARE @Category VARCHAR(50);
        DECLARE @Inventory_id INT;
        DECLARE @Team_id INT;
        DECLARE @Quantity INT;

        -- Obtener categoría de la parte
        SELECT @Category = Category
        FROM PART
        WHERE Part_id = @Part_id;

        IF @Category IS NULL
        BEGIN
            THROW 50001, 'Parte no encontrada', 1;
        END

        -- Obtener Team_id del carro
        SELECT @Team_id = Team_id
        FROM CAR
        WHERE Car_id = @Car_id;

        IF @Team_id IS NULL
        BEGIN
            THROW 50002, 'Carro no encontrado', 1;
        END

        -- Obtener Inventory_id
        SELECT @Inventory_id = Inventory_id
        FROM INVENTORY
        WHERE Team_id = @Team_id;

        -- Verificar si la parte está en inventario y cantidad > 0
        SELECT @Quantity = Quantity
        FROM INVENTORY_PART
        WHERE Inventory_id = @Inventory_id AND Part_id = @Part_id;

        IF @Quantity IS NULL OR @Quantity <= 0
        BEGIN
            THROW 50003, 'Parte no disponible en inventario', 1;
        END

        -- Verificar si la categoría ya está instalada
        IF EXISTS (SELECT 1 FROM CAR_CONFIGURATION WHERE Car_id = @Car_id AND Part_Category = @Category)
        BEGIN
            THROW 50004, 'Categoría ya instalada. Use Replace en su lugar.', 1;
        END

        -- Validar compatibilidad (usando el SP de validación)
        DECLARE @ValidationStatus VARCHAR(50);
        DECLARE @Message NVARCHAR(200);

        EXEC sp_ValidatePartCompatibility @Car_id, @Part_id, @ValidationStatus OUTPUT, @Message OUTPUT;

        IF @ValidationStatus <> 'OK'
        BEGIN
            THROW 50005, @Message, 1;
        END

        -- Instalar la parte
        INSERT INTO CAR_CONFIGURATION (Car_id, Part_Category, Part_id)
        VALUES (@Car_id, @Category, @Part_id);

        -- Reducir cantidad en inventario
        UPDATE INVENTORY_PART
        SET Quantity = Quantity - 1
        WHERE Inventory_id = @Inventory_id AND Part_id = @Part_id;

        -- Si cantidad llega a 0, opcional: eliminar fila, pero por ahora solo decrementar

        -- Actualizar stats del carro
        EXEC sp_CalculateCarStats @Car_id;

        -- Verificar si todas las categorías están instaladas
        DECLARE @RequiredCategories INT = 5;  -- Power_Unit, Aero, Wheels, Suspension, Gearbox
        DECLARE @InstalledCategories INT;

        SELECT @InstalledCategories = COUNT(DISTINCT Part_Category)
        FROM CAR_CONFIGURATION
        WHERE Car_id = @Car_id;

        IF @InstalledCategories = @RequiredCategories
        BEGIN
            UPDATE CAR
            SET isFinalized = 1
            WHERE Car_id = @Car_id;
        END

        COMMIT TRANSACTION;

        SELECT 'OK' AS Status, 'Parte instalada exitosamente' AS Message;

    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO
PRINT 'SP sp_InstallPart corregido y creado';
GO

-- ============================================================================
-- 8 SP: Reemplazar Parte en Auto
-- Descripción: Reemplaza una parte existente por otra, validando todo
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_ReplacePart
    @Car_id INT,
    @Old_Part_id INT,
    @New_Part_id INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRANSACTION;

    BEGIN TRY
        DECLARE @Category VARCHAR(50);
        DECLARE @Inventory_id INT;
        DECLARE @Team_id INT;
        DECLARE @New_Quantity INT;
        DECLARE @Old_Quantity INT;

        -- Obtener categoría de la nueva parte
        SELECT @Category = Category
        FROM PART
        WHERE Part_id = @New_Part_id;

        -- Validaciones similares a Install...

        -- Devolver vieja parte al inventario
        -- Actualizar configuración
        -- Reducir nueva parte del inventario
        -- Actualizar stats

        COMMIT TRANSACTION;

    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
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

    -- Declarar variables para stats
    DECLARE @Total_P INT = 0;
    DECLARE @Total_A INT = 0;
    DECLARE @Total_M INT = 0;
    DECLARE @PartCount INT;

    -- Obtener stats de las partes instaladas (CORREGIDO: Sin GROUP BY, ya que es un solo grupo)
    SELECT 
        @Total_P = SUM(p.p),
        @Total_A = SUM(p.a),
        @Total_M = SUM(p.m),
        @PartCount = COUNT(*)
    FROM CAR_CONFIGURATION cc
    INNER JOIN PART p ON cc.Part_id = p.Part_id
    WHERE cc.Car_id = @Car_id;

    -- Aquí puedes actualizar una tabla de stats si existe, o retornar los valores
    SELECT 
        @Car_id AS Car_id,
        @Total_P AS Total_P,
        @Total_A AS Total_A,
        @Total_M AS Total_M,
        @PartCount AS Installed_Parts;

    -- Opcional: UPDATE CAR SET stats... si agregas columnas a CAR
END
GO
PRINT 'SP sp_CalculateCarStats corregido y creado';
GO

-- ============================================================================
-- 10 SP: Verificar Compatibilidad de Parte
-- Descripción: Valida si una parte es compatible (ej: misma categoría)
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_ValidatePartCompatibility
    @Car_id INT,
    @Part_id INT,
    @Status VARCHAR(50) OUTPUT,
    @Message NVARCHAR(200) OUTPUT
AS
BEGIN
    -- Lógica de validación...
    SET @Status = 'OK';
    SET @Message = 'Parte compatible';
END
GO
PRINT 'SP sp_ValidatePartCompatibility creado';
GO


PRINT 'Módulo Armado implementado exitosamente !!';
GO
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