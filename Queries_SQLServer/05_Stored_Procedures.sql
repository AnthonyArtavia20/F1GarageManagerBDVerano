-- ============================================================================
-- F1 Garage Manager
-- Parte 5: Stored Procedures Corregidos
-- Descripción: SPs con correcciones de dependencias y variables
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

    SELECT @TeamName = Name FROM TEAM WHERE Team_id = @Team_id;

    SELECT @TotalIncome = ISNULL(SUM(Amount), 0)
    FROM CONTRIBUTION WHERE Team_id = @Team_id;

    SELECT @TotalSpent = ISNULL(SUM(p.Total_price), 0)
    FROM PURCHASE p
    INNER JOIN ENGINEER e ON p.Engineer_User_id = e.User_id
    WHERE e.Team_id = @Team_id;

    UPDATE TEAM 
    SET Total_Budget = @TotalIncome, Total_Spent = @TotalSpent
    WHERE Team_id = @Team_id;

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
CREATE OR ALTER PROCEDURE sp_GetTeamInventory
    @Team_id INT
AS
BEGIN
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
        DECLARE @Team_id INT, @Unit_price DECIMAL(10,2), @Total_price DECIMAL(10,2);
        DECLARE @Available_Budget DECIMAL(10,2), @Stock INT, @TotalIncome DECIMAL(10,2);

        SELECT @Team_id = Team_id FROM ENGINEER WHERE User_id = @Engineer_User_id;
        IF @Team_id IS NULL THROW 53001, 'Engineer no encontrado', 1;

        SELECT @Unit_price = Price, @Stock = Stock FROM PART WHERE Part_id = @Part_id;
        IF @Unit_price IS NULL THROW 53002, 'Parte no encontrada', 1;
        IF @Quantity <= 0 THROW 53003, 'Cantidad debe ser mayor a 0', 1;
        IF @Stock < @Quantity THROW 53004, 'Stock insuficiente', 1;

        SET @Total_price = @Unit_price * @Quantity;

        SELECT @TotalIncome = ISNULL(SUM(Amount), 0) FROM CONTRIBUTION WHERE Team_id = @Team_id;
        SELECT @Available_Budget = @TotalIncome - ISNULL(SUM(Total_price), 0)
        FROM PURCHASE p INNER JOIN ENGINEER e ON p.Engineer_User_id = e.User_id
        WHERE e.Team_id = @Team_id;
        SET @Available_Budget = ISNULL(@Available_Budget, @TotalIncome);

        IF @Available_Budget < @Total_price
        BEGIN
            DECLARE @ErrorMsg NVARCHAR(200) = 
                'Presupuesto insuficiente. Disponible: ' + CAST(@Available_Budget AS VARCHAR(20)) + 
                ', Necesario: ' + CAST(@Total_price AS VARCHAR(20));
            THROW 53005, @ErrorMsg, 1;
        END

        INSERT INTO PURCHASE (Engineer_User_id, Part_id, Quantity, Unit_price, Total_price, Purchase_Date)
        VALUES (@Engineer_User_id, @Part_id, @Quantity, @Unit_price, @Total_price, GETDATE());

        UPDATE PART SET Stock = Stock - @Quantity WHERE Part_id = @Part_id;
        UPDATE TEAM SET Total_Spent = Total_Spent + @Total_price WHERE Team_id = @Team_id;

        DECLARE @Inventory_id INT;
        SELECT @Inventory_id = Inventory_id FROM INVENTORY WHERE Team_id = @Team_id;
        
        IF @Inventory_id IS NULL
        BEGIN
            INSERT INTO INVENTORY (Team_id) VALUES (@Team_id);
            SET @Inventory_id = SCOPE_IDENTITY();
        END

        IF EXISTS (SELECT 1 FROM INVENTORY_PART WHERE Inventory_id = @Inventory_id AND Part_id = @Part_id)
            UPDATE INVENTORY_PART SET Quantity = Quantity + @Quantity, Acquisition_date = GETDATE()
            WHERE Inventory_id = @Inventory_id AND Part_id = @Part_id;
        ELSE
            INSERT INTO INVENTORY_PART (Inventory_id, Part_id, Quantity, Acquisition_date)
            VALUES (@Inventory_id, @Part_id, @Quantity, GETDATE());

        SELECT @NewAvailableBudget = (@TotalIncome - ISNULL(SUM(Total_price), 0))
        FROM PURCHASE p INNER JOIN ENGINEER e ON p.Engineer_User_id = e.User_id
        WHERE e.Team_id = @Team_id;
        SET @NewAvailableBudget = ISNULL(@NewAvailableBudget, @TotalIncome);

        COMMIT TRANSACTION;

        SELECT SCOPE_IDENTITY() AS Purchase_id, @Total_price AS Total_Paid, 
                @NewAvailableBudget AS New_Available_Budget;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO
PRINT 'SP sp_RegisterPurchase creado';
GO

-- ============================================================================
-- 4. SP: Ver configuración de un carro
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_GetCarConfiguration
    @Car_id INT
AS
BEGIN
    SELECT Part_Category, Part_id
    FROM CAR_CONFIGURATION
    WHERE Car_id = @Car_id;
END
GO
PRINT 'SP sp_GetCarConfiguration creado';
GO

-- ============================================================================
-- 5. SP: Crear Simulación Básica
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_CreateSimulationBasic
    @AdminID INT,
    @CircuitID INT
AS
BEGIN
    INSERT INTO SIMULATION (Circuit_id, Created_by_admin_id, Data_time)
    VALUES (@CircuitID, @AdminID, GETDATE());
    SELECT SCOPE_IDENTITY() AS NewSimulationID;
END
GO
PRINT 'SP sp_CreateSimulationBasic creado';
GO

-- ============================================================================
-- 6. SP: Agregar Participante
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_AddSimulationParticipant
    @SimulationID INT,
    @CarID INT,
    @DriverID INT,
    @TeamID INT
AS
BEGIN
    IF EXISTS (SELECT 1 FROM CAR WHERE Car_id = @CarID AND isFinalized = 1)
    BEGIN
        INSERT INTO SIMULATION_PARTICIPANT (simulation_id, car_id, driver_id, team_id)
        VALUES (@SimulationID, @CarID, @DriverID, @TeamID);
        PRINT 'Participante agregado exitosamente';
    END
    ELSE
    BEGIN
        THROW 51000, 'El carro debe estar finalizado para participar', 1;
    END
END
GO
PRINT 'SP sp_AddSimulationParticipant creado';
GO

PRINT '============================================================================';
PRINT 'MÓDULO ARMADO: Stored Procedures para Ensamblaje de Autos';
PRINT '============================================================================';
GO

-- ============================================================================
-- 7. SP: Calcular Parámetros Reales del Auto (PRIMERO - Dependencia)
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_CalculateCarStats
    @Car_id INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Total_P INT = 0;
    DECLARE @Total_A INT = 0;
    DECLARE @Total_M INT = 0;
    DECLARE @PartCount INT = 0;
    DECLARE @TotalPerformance INT = 0;

    SELECT 
        @Total_P = ISNULL(SUM(p.p), 0),
        @Total_A = ISNULL(SUM(p.a), 0),
        @Total_M = ISNULL(SUM(p.m), 0),
        @PartCount = COUNT(*)
    FROM CAR_CONFIGURATION cc
    INNER JOIN PART p ON cc.Part_id = p.Part_id
    WHERE cc.Car_id = @Car_id;

    SET @TotalPerformance = @Total_P + @Total_A + @Total_M;

    SELECT 
        @Car_id AS Car_id,
        @Total_P AS Power,
        @Total_A AS Aerodynamics,
        @Total_M AS Maneuverability,
        @TotalPerformance AS TotalPerformance,
        @PartCount AS Parts_Installed;
END
GO
PRINT 'SP sp_CalculateCarStats creado';
GO

-- ============================================================================
-- 8. SP: Verificar Compatibilidad de Parte (SEGUNDO - Dependencia)
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_ValidatePartCompatibility
    @Car_id INT,
    @Part_id INT,
    @Status VARCHAR(50) OUTPUT,
    @Message NVARCHAR(200) OUTPUT
AS
BEGIN
    DECLARE @PartCategory VARCHAR(50);

    SELECT @PartCategory = Category FROM PART WHERE Part_id = @Part_id;

    IF @PartCategory IS NULL
    BEGIN
        SET @Status = 'INVALID';
        SET @Message = 'Parte no existe';
        RETURN;
    END

    IF EXISTS (SELECT 1 FROM CAR_CONFIGURATION WHERE Car_id = @Car_id AND Part_Category = @PartCategory)
    BEGIN
        SET @Status = 'REPLACE';
        SET @Message = 'Ya hay parte instalada, se puede reemplazar';
    END
    ELSE
    BEGIN
        SET @Status = 'OK';
        SET @Message = 'Parte compatible para instalación';
    END
END
GO
PRINT 'SP sp_ValidatePartCompatibility creado';
GO

-- ============================================================================
-- 9. SP: Instalar Parte en Auto (AHORA SÍ PUEDE CREARSE)
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_InstallPart
    @Car_id INT,
    @Part_id INT,
    @Team_id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @Category VARCHAR(50);
        DECLARE @Inventory_id INT;
        DECLARE @Quantity INT;

        SELECT @Category = Category FROM PART WHERE Part_id = @Part_id;
        IF @Category IS NULL THROW 50001, 'Parte no encontrada', 1;

        IF EXISTS (SELECT 1 FROM CAR_CONFIGURATION WHERE Car_id = @Car_id AND Part_Category = @Category)
            THROW 50004, 'Categoría ya instalada. Use Replace', 1;

        SELECT @Inventory_id = Inventory_id FROM INVENTORY WHERE Team_id = @Team_id;
        IF @Inventory_id IS NULL THROW 50006, 'Equipo no tiene inventario', 1;

        SELECT @Quantity = Quantity FROM INVENTORY_PART
        WHERE Inventory_id = @Inventory_id AND Part_id = @Part_id;

        IF @Quantity IS NULL OR @Quantity <= 0 
            THROW 50003, 'Parte no disponible en inventario', 1;

        INSERT INTO CAR_CONFIGURATION (Car_id, Part_Category, Part_id)
        VALUES (@Car_id, @Category, @Part_id);

        UPDATE INVENTORY_PART SET Quantity = Quantity - 1
        WHERE Inventory_id = @Inventory_id AND Part_id = @Part_id;

        EXEC sp_CalculateCarStats @Car_id;

        DECLARE @RequiredCategories INT = 5;
        DECLARE @InstalledCategories INT;

        SELECT @InstalledCategories = COUNT(DISTINCT Part_Category)
        FROM CAR_CONFIGURATION WHERE Car_id = @Car_id;

        IF @InstalledCategories = @RequiredCategories
            UPDATE CAR SET isFinalized = 1 WHERE Car_id = @Car_id;

        COMMIT TRANSACTION;
        SELECT 'OK' AS Status, 'Parte instalada exitosamente' AS Message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO
PRINT 'SP sp_InstallPart creado';
GO

-- ============================================================================
-- 10. SP: Reemplazar Parte en Auto (CORREGIDO)
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_ReplacePart
    @Car_id INT,
    @OldPart_id INT,
    @NewPart_id INT,
    @Team_id INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @Category VARCHAR(50);
        DECLARE @NewCategory VARCHAR(50);
        DECLARE @Inventory_id INT;
        DECLARE @NewQuantity INT;

        -- Verificar categorías
        SELECT @Category = Category FROM PART WHERE Part_id = @OldPart_id;
        SELECT @NewCategory = Category FROM PART WHERE Part_id = @NewPart_id;

        IF @Category IS NULL OR @NewCategory IS NULL
            THROW 50001, 'Una de las partes no existe', 1;

        IF @Category <> @NewCategory
            THROW 50007, 'Las partes deben ser de la misma categoría', 1;

        -- Verificar que la parte vieja esté instalada
        IF NOT EXISTS (SELECT 1 FROM CAR_CONFIGURATION WHERE Car_id = @Car_id AND Part_id = @OldPart_id)
            THROW 50008, 'La parte antigua no está instalada', 1;

        -- Verificar inventario de nueva parte
        SELECT @Inventory_id = Inventory_id FROM INVENTORY WHERE Team_id = @Team_id;
        IF @Inventory_id IS NULL THROW 50006, 'Equipo no tiene inventario', 1;

        SELECT @NewQuantity = Quantity FROM INVENTORY_PART
        WHERE Inventory_id = @Inventory_id AND Part_id = @NewPart_id;

        IF @NewQuantity IS NULL OR @NewQuantity <= 0
            THROW 50003, 'Nueva parte no disponible en inventario', 1;

        -- Reemplazar parte
        UPDATE CAR_CONFIGURATION SET Part_id = @NewPart_id
        WHERE Car_id = @Car_id AND Part_id = @OldPart_id;

        -- Devolver parte vieja al inventario
        IF EXISTS (SELECT 1 FROM INVENTORY_PART WHERE Inventory_id = @Inventory_id AND Part_id = @OldPart_id)
            UPDATE INVENTORY_PART SET Quantity = Quantity + 1
            WHERE Inventory_id = @Inventory_id AND Part_id = @OldPart_id;
        ELSE
            INSERT INTO INVENTORY_PART (Inventory_id, Part_id, Quantity, Acquisition_date)
            VALUES (@Inventory_id, @OldPart_id, 1, GETDATE());

        -- Consumir nueva parte del inventario
        UPDATE INVENTORY_PART SET Quantity = Quantity - 1
        WHERE Inventory_id = @Inventory_id AND Part_id = @NewPart_id;

        EXEC sp_CalculateCarStats @Car_id;

        COMMIT TRANSACTION;
        SELECT 'OK' AS Status, 'Parte reemplazada exitosamente' AS Message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO
PRINT 'SP sp_ReplacePart creado';
GO

PRINT 'Módulo Armado completado exitosamente';
GO

-- ============================================================================
-- MÓDULO SPONSORS
-- ============================================================================

CREATE OR ALTER PROCEDURE sp_CalculateAvailableBudget
    @Team_id INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @TotalIncome DECIMAL(10,2), @TotalSpent DECIMAL(10,2), @TeamName VARCHAR(100);

    SELECT @TeamName = Name FROM TEAM WHERE Team_id = @Team_id;
    SELECT @TotalIncome = ISNULL(SUM(Amount), 0) FROM CONTRIBUTION WHERE Team_id = @Team_id;
    SELECT @TotalSpent = ISNULL(SUM(p.Total_price), 0)
    FROM PURCHASE p INNER JOIN ENGINEER e ON p.Engineer_User_id = e.User_id
    WHERE e.Team_id = @Team_id;

    SELECT @Team_id AS Team_ID, @TeamName AS Team_Name, @TotalIncome AS Total_Income,
            @TotalSpent AS Total_Spent, (@TotalIncome - @TotalSpent) AS Available_budget,
            (SELECT COUNT(*) FROM CONTRIBUTION WHERE Team_id = @Team_id) AS Total_contributions,
            (SELECT COUNT(*) FROM PURCHASE p INNER JOIN ENGINEER e ON p.Engineer_User_id = e.User_id
            WHERE e.Team_id = @Team_id) AS Total_Purchases;
END
GO
PRINT 'SP sp_CalculateAvailableBudget creado';
GO

CREATE OR ALTER PROCEDURE sp_RegisterContribution
    @Sponsor_id INT,
    @Team_id INT,
    @Amount DECIMAL(10,2),
    @Description NVARCHAR(200) = NULL,
    @NewBudget DECIMAL(10,2) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM SPONSOR WHERE Sponsor_id = @Sponsor_id)
            THROW 52001, 'Sponsor no existe', 1;
        IF NOT EXISTS (SELECT 1 FROM TEAM WHERE Team_id = @Team_id)
            THROW 52002, 'Equipo no existe', 1;
        IF @Amount <= 0 THROW 52003, 'Monto debe ser positivo', 1;

        INSERT INTO CONTRIBUTION (Sponsor_id, Team_id, Amount, Date, Description)
        VALUES (@Sponsor_id, @Team_id, @Amount, GETDATE(), @Description);

        UPDATE TEAM SET Total_Budget = Total_Budget + @Amount WHERE Team_id = @Team_id;
        SELECT @NewBudget = Total_Budget FROM TEAM WHERE Team_id = @Team_id;

        COMMIT TRANSACTION;
        SELECT SCOPE_IDENTITY() AS Contribution_id, @NewBudget AS NewBudget;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO
PRINT 'SP sp_RegisterContribution creado';
GO

CREATE OR ALTER PROCEDURE sp_GetTeamContributionsDetailed
    @Team_id INT
AS
BEGIN
    SELECT c.Contribution_id, c.Sponsor_id, s.Name AS Sponsor_Name, s.Industry, s.Country,
            c.Team_id, c.Amount, c.Date, c.Description
    FROM CONTRIBUTION c
    INNER JOIN SPONSOR s ON c.Sponsor_id = s.Sponsor_id
    WHERE c.Team_id = @Team_id
    ORDER BY c.Date DESC;
END
GO
PRINT 'SP sp_GetTeamContributionsDetailed creado';
GO

CREATE OR ALTER PROCEDURE sp_GetSponsorStats
    @Sponsor_id INT
AS
BEGIN
    SELECT s.Sponsor_id, s.Name, s.Industry, s.Country,
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

CREATE OR ALTER PROCEDURE sp_ValidatePurchase
    @Engineer_User_id INT,
    @Part_id INT,
    @Quantity INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @Team_id INT, @Unit_price DECIMAL(10,2), @Total_price DECIMAL(10,2);
    DECLARE @Available_Budget DECIMAL(10,2), @Stock INT, @TotalIncome DECIMAL(10,2);

    SELECT @Team_id = Team_id FROM ENGINEER WHERE User_id = @Engineer_User_id;
    SELECT @Unit_price = Price, @Stock = Stock FROM PART WHERE Part_id = @Part_id;
    
    SELECT @TotalIncome = ISNULL(SUM(Amount), 0) FROM CONTRIBUTION WHERE Team_id = @Team_id;
    SELECT @Available_Budget = @TotalIncome - ISNULL(SUM(Total_price), 0)
    FROM PURCHASE p INNER JOIN ENGINEER e ON p.Engineer_User_id = e.User_id
    WHERE e.Team_id = @Team_id;
    SET @Available_Budget = ISNULL(@Available_Budget, @TotalIncome);
    SET @Total_price = @Unit_price * @Quantity;

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
        CASE WHEN @Available_Budget >= @Total_price AND @Stock >= @Quantity THEN 1 ELSE 0 END AS CanPurchase;
END
GO
PRINT 'SP sp_ValidatePurchase creado';
GO

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
        IF @Category NOT IN ('Power_Unit', 'Aerodynamics_pkg', 'Wheels', 'Suspension', 'Gearbox')
            THROW 54001, 'Categoría inválida', 1;
        IF @p < 0 OR @p > 9 OR @a < 0 OR @a > 9 OR @m < 0 OR @m > 9
            THROW 54002, 'Valores P/A/M deben estar entre 0-9', 1;
        IF @Price <= 0 THROW 54003, 'Precio debe ser mayor a 0', 1;
        IF @Stock < 0 THROW 54004, 'Stock no puede ser negativo', 1;

        INSERT INTO PART (Category, Price, Stock, p, a, m)
        VALUES (@Category, @Price, @Stock, @p, @a, @m);

        DECLARE @NewPartID INT = SCOPE_IDENTITY();
        COMMIT TRANSACTION;

        SELECT Part_id, Category, Price, Stock, p, a, m
        FROM PART WHERE Part_id = @NewPartID;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO
PRINT 'SP sp_AddPart creado';
GO

PRINT '============================================================================';
PRINT 'TODOS LOS STORED PROCEDURES CREADOS EXITOSAMENTE';
PRINT '============================================================================';
GO