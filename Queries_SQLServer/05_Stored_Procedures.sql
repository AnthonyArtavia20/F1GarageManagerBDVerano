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
    
    -- Both Admin and Engineers allowed to make a purchase
    SELECT @TotalSpent = ISNULL(SUM(p.Total_price), 0)
    FROM PURCHASE p
    WHERE EXISTS (
        SELECT 1 FROM ENGINEER e 
        WHERE e.User_id = p.Engineer_User_id AND e.Team_id = @Team_id
    ) OR EXISTS (
        SELECT 1 FROM ADMIN a 
        WHERE a.User_id = p.Engineer_User_id
    );

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
CREATE OR ALTER PROCEDURE sp_RegisterTeamPurchase
    @Team_id INT,
    @Part_id INT,
    @User_id INT,
    @Success BIT OUTPUT,
    @Message NVARCHAR(500) OUTPUT,
    @NewAvailableBudget DECIMAL(10,2) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    SET @Success = 0;
    SET @Message = '';
    SET @NewAvailableBudget = 0;
    
    DECLARE @UserType NVARCHAR(20);
    DECLARE @UserTeam_id INT;
    DECLARE @IsAuthorized BIT = 0;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- User Authentication 
        IF EXISTS (SELECT 1 FROM ADMIN WHERE User_id = @User_id)
        BEGIN
            SET @UserType = 'ADMIN';
            SET @IsAuthorized = 1;
        END
        ELSE IF EXISTS (
            SELECT 1 
            FROM ENGINEER 
            WHERE User_id = @User_id AND Team_id = @Team_id
        )
        BEGIN
            SET @UserType = 'ENGINEER';
            SET @IsAuthorized = 1;
        END
        ELSE
        BEGIN
            SET @Message = 'WARNING: Unauthorized user trying to make a purchase';
            ROLLBACK TRANSACTION;
            RETURN;
        END;
        
        -- Validate Team existence
        IF NOT EXISTS (SELECT 1 FROM TEAM WHERE Team_id = @Team_id)
        BEGIN
            SET @Message = 'Equipo no encontrado';
            ROLLBACK TRANSACTION;
            RETURN;
        END;
        
        -- Part Availability and Information
        DECLARE @PartPrice DECIMAL(10,2);
        DECLARE @PartStock INT;
        DECLARE @PartName NVARCHAR(100);
        
        SELECT 
            @PartPrice = Price, 
            @PartStock = Stock,
            @PartName = Name
        FROM PART 
        WHERE Part_id = @Part_id;
        
        IF @PartPrice IS NULL
        BEGIN
            SET @Message = '!ERROR: Missing Part';
            ROLLBACK TRANSACTION;
            RETURN;
        END;
        
        IF @PartStock < 1
        BEGIN
            SET @Message = '!ERROR: Part [' + @PartName + '] Out of Stock';
            ROLLBACK TRANSACTION;
            RETURN;
        END;
        
        -- Check Team Budget 
        DECLARE @TotalBudget DECIMAL(10,2);
        DECLARE @CurrentSpent DECIMAL(10,2);
        DECLARE @TeamName NVARCHAR(100);
        
        SELECT 
            @TotalBudget = Total_Budget, 
            @CurrentSpent = Total_Spent,
            @TeamName = Name
        FROM TEAM
        WHERE Team_id = @Team_id;
        
        DECLARE @AvailableBudget DECIMAL(10,2) = @TotalBudget - @CurrentSpent;
        
        IF @AvailableBudget < @PartPrice
        BEGIN
            SET @Message = 'Insuficient Budget ' + @TeamName + 
                          ', Available: $' + CAST(@AvailableBudget AS VARCHAR(20)) + 
                          ', Needed: $' + CAST(@PartPrice AS VARCHAR(20));
            SET @NewAvailableBudget = @AvailableBudget;
            ROLLBACK TRANSACTION;
            RETURN;
        END;
        
        -- ============================================
        -- PROCESS PURCHASE
        -- ============================================
        
        -- Reduce Stock
        UPDATE PART 
        SET Stock = Stock - 1
        WHERE Part_id = @Part_id;
        
        -- Update Team Total_Spent
        UPDATE TEAM
        SET Total_Spent = Total_Spent + @PartPrice
        WHERE Team_id = @Team_id;
        
        -- Insert transaction in PURCHASE 
        DECLARE @PurchaseQuantity INT = 1;
        DECLARE @TotalPrice DECIMAL(10,2) = @PartPrice * @PurchaseQuantity;
        
        INSERT INTO PURCHASE (
            Engineer_User_id,
            Part_id,
            Purchase_Date,
            Quantity,
            Unit_price,
            Total_price
        ) VALUES (
            @User_id,
            @Part_id,
            GETDATE(),
            @PurchaseQuantity,
            @PartPrice,
            @TotalPrice
        );
        
        -- Create/Manage Inventory
        DECLARE @Inventory_id INT;
        
        SELECT @Inventory_id = Inventory_id 
        FROM INVENTORY 
        WHERE Team_id = @Team_id;
        
        IF @Inventory_id IS NULL
        BEGIN
            INSERT INTO INVENTORY (Team_id)
            VALUES (@Team_id);
            SET @Inventory_id = SCOPE_IDENTITY();
        END;
        
        -- Add Part to respective Inventory
        IF EXISTS (SELECT 1 FROM INVENTORY_PART 
                  WHERE Inventory_id = @Inventory_id AND Part_id = @Part_id)
        BEGIN
            UPDATE INVENTORY_PART
            SET Quantity = Quantity + 1,
                Acquisition_date = GETDATE()
            WHERE Inventory_id = @Inventory_id 
              AND Part_id = @Part_id;
            PRINT 'Inventario actualizado (Quantity +1)';
        END
        ELSE
        BEGIN
            INSERT INTO INVENTORY_PART (Inventory_id, Part_id, Quantity)
            VALUES (@Inventory_id, @Part_id, 1);
            PRINT 'Nueva entrada en inventario creada';
        END;
       
        -- Calculate New Available Budget
        SELECT @CurrentSpent = Total_Spent
        FROM TEAM
        WHERE Team_id = @Team_id;
        
        SET @NewAvailableBudget = @TotalBudget - @CurrentSpent;
        
        -- Finalize Transaction 
        COMMIT TRANSACTION;
        
        SET @Success = 1;
        SET @Message = '($  ͜ʖ $) Purchase successfully completed by [' + @UserType + 
                      '] [' + @PartName + '] now in inventory for  [' + @TeamName + 
                      '] with and available budget of: $' + CAST(@NewAvailableBudget AS NVARCHAR(20));
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        SET @Success = 0;
        SET @Message = '!ERROR is sp_RegisterTeamPurchase: ' + ERROR_MESSAGE();
        SET @NewAvailableBudget = 0;
    END CATCH;
END;
GO

PRINT '...SP sp_RegisterTeamPurchase creado';
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


CREATE OR ALTER PROCEDURE sp_GetTeamInventory
    @TeamId INT
AS
BEGIN
    BEGIN TRY
        SELECT 
            P.Part_id AS id,
            P.Name AS name,
            P.Category AS category,
            IP.Quantity AS quantity,
            CONVERT(VARCHAR(10), IP.Acquisition_date, 120) AS acquiredDate,
            P.p,
            P.a,
            P.m,
            ISNULL((
                SELECT COUNT(*) 
                FROM CAR C
                INNER JOIN CAR_CONFIGURATION CC ON C.Car_id = CC.Car_id
                WHERE C.Team_id = @TeamId
                AND CC.Part_id = P.Part_id
            ), 0) AS installed
        FROM INVENTORY I
        INNER JOIN INVENTORY_PART IP ON I.Inventory_id = IP.Inventory_id
        INNER JOIN PART P ON IP.Part_id = P.Part_id
        WHERE I.Team_id = @TeamId
        ORDER BY P.Category, P.Name;
        
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END;
GO

PRINT '============================================================================';
PRINT 'TODOS LOS STORED PROCEDURES CREADOS EXITOSAMENTE';
PRINT '============================================================================';
GO
