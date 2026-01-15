-- ============================================================================
-- SCRIPT COMPLETO PARA REGENERAR LA BASE DE DATOS F1GarageManager
-- Versión corregida - Grupo 3/C, Alexs, Anthony, Bryan, Felipe
-- ============================================================================

USE master;
GO

-- 1. Eliminar la base de datos si existe
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'F1GarageManager')
BEGIN
    ALTER DATABASE F1GarageManager SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE F1GarageManager;
    PRINT 'Base de datos F1GarageManager eliminada.';
END
GO

-- 2. Crear nuevamente la base de datos
CREATE DATABASE F1GarageManager;
GO

USE F1GarageManager;
GO

PRINT 'Base de datos F1GarageManager creada exitosamente';
GO

-- 3. Verificar/crear schema dbo
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'dbo')
BEGIN
    EXEC('CREATE SCHEMA dbo AUTHORIZATION dbo');
END
GO

PRINT 'Schema dbo verificado';
GO

-- ============================================================================
-- 4. CREACIÓN DE ENTIDADES FUERTES
-- ============================================================================

PRINT 'Creando tabla USER...';
GO

CREATE TABLE [USER] (
    User_id INT IDENTITY(1,1),
    Username VARCHAR(50) NOT NULL,
    Salt VARCHAR(255) NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    
    -- Constraints
    CONSTRAINT PK_User PRIMARY KEY (User_id),
    CONSTRAINT UK_User_Username UNIQUE (Username)
);
GO

PRINT 'Tabla USER creada exitosamente';
GO

PRINT 'Creando tabla TEAM...';
GO

CREATE TABLE TEAM (
    Team_id INT IDENTITY(1,1),
    Name VARCHAR(100) NOT NULL,
    Total_Budget DECIMAL(10,2) DEFAULT 0,
    Total_Spent DECIMAL(10,2) DEFAULT 0,
    
    -- Constraints
    CONSTRAINT PK_Team PRIMARY KEY (Team_id)
);
GO

PRINT 'Tabla TEAM creada exitosamente';
GO

PRINT 'Creando tabla SPONSOR...';
GO

CREATE TABLE SPONSOR (
    Sponsor_id INT IDENTITY(1,1),
    Name VARCHAR(100) NOT NULL,
    Industry NVARCHAR(100),
    Country NVARCHAR(50),
    
    -- Constraints
    CONSTRAINT PK_Sponsor PRIMARY KEY (Sponsor_id)
);
GO

PRINT 'Tabla SPONSOR creada exitosamente';
GO

PRINT 'Creando tabla PART...';
GO

CREATE TABLE PART (
    Part_id INT IDENTITY(1,1),
    Category VARCHAR(50) NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    Stock INT NOT NULL,
    p INT NOT NULL,
    a INT NOT NULL,
    m INT NOT NULL,
    
    -- Constraints
    CONSTRAINT PK_Part PRIMARY KEY (Part_id),
    CONSTRAINT CHK_Part_Category CHECK (
        Category IN ('Power_Unit', 'Aerodynamics_pkg', 'Wheels', 'Suspension', 'Gearbox')
    ),
    CONSTRAINT CHK_Part_Price CHECK (Price > 0),
    CONSTRAINT CHK_Part_Stock CHECK (Stock >= 0),
    CONSTRAINT CHK_Part_p CHECK (p >= 0 AND p <= 9),
    CONSTRAINT CHK_Part_a CHECK (a >= 0 AND a <= 9),
    CONSTRAINT CHK_Part_m CHECK (m >= 0 AND m <= 9)
);
GO

PRINT 'Tabla PART creada exitosamente';
GO

PRINT 'Creando tabla CIRCUIT...';
GO

CREATE TABLE CIRCUIT (
    Circuit_id INT IDENTITY(1,1),
    Name VARCHAR(100) NOT NULL,
    Total_distance DECIMAL(10,2) NOT NULL,
    N_Curves INT NOT NULL,
    
    -- Constraints
    CONSTRAINT PK_Circuit PRIMARY KEY (Circuit_id),
    CONSTRAINT CHK_Circuit_Distance CHECK (Total_distance > 0),
    CONSTRAINT CHK_Circuit_Curves CHECK (N_Curves >= 0)
);
GO

PRINT 'Tabla CIRCUIT creada exitosamente';
GO

PRINT 'Creando tabla SIMULATION...';
GO

CREATE TABLE SIMULATION (
    Simulation_id INT IDENTITY(1,1),
    Data_time DATETIME NOT NULL DEFAULT GETDATE(),
    Circuit_id INT NOT NULL,
    Created_by_admin_id INT NOT NULL,
    
    CONSTRAINT PK_Simulation PRIMARY KEY (Simulation_id)
);
GO

PRINT 'Tabla SIMULATION creada exitosamente';
GO

-- ============================================================================
-- 5. CREACIÓN DE ENTIDADES DÉBILES
-- ============================================================================

PRINT 'Creando tabla ENGINEER...';
GO

CREATE TABLE ENGINEER (
    User_id INT,
    Team_id INT NULL,
    
    -- Constraints
    CONSTRAINT PK_Engineer PRIMARY KEY (User_id)
);
GO

PRINT 'Tabla ENGINEER creada exitosamente';
GO

PRINT 'Creando tabla DRIVER...';
GO

CREATE TABLE DRIVER (
    User_id INT,
    Team_id INT NULL, 
    H INT NOT NULL,
    
    -- Constraints
    CONSTRAINT PK_Driver PRIMARY KEY (User_id),
    CONSTRAINT CHK_Driver_H CHECK (H >= 0 AND H <= 100)
);
GO

PRINT 'Tabla DRIVER creada exitosamente';
GO

PRINT 'Creando tabla ADMIN...';
GO

CREATE TABLE ADMIN (
    User_id INT,
    
    -- Constraints
    CONSTRAINT PK_Admin PRIMARY KEY (User_id)
);
GO

PRINT 'Tabla ADMIN creada exitosamente';
GO

PRINT 'Creando tabla INVENTORY...';
GO

CREATE TABLE INVENTORY (
    Inventory_id INT IDENTITY(1,1),
    Team_id INT NOT NULL,
    
    -- Constraints
    CONSTRAINT PK_Inventory PRIMARY KEY (Inventory_id),
    CONSTRAINT UK_Inventory_Team UNIQUE (Team_id)
);
GO

PRINT 'Tabla INVENTORY creada exitosamente';
GO

PRINT 'Creando tabla CAR...';
GO

CREATE TABLE CAR (
    Car_id INT IDENTITY(1,1),
    Team_id INT NOT NULL,
    isFinalized BIT DEFAULT 0,
    
    -- Constraints
    CONSTRAINT PK_Car PRIMARY KEY (Car_id)
);
GO

PRINT 'Tabla CAR creada exitosamente';
GO

-- ============================================================================
-- 6. CREACIÓN DE TABLAS INTERMEDIAS
-- ============================================================================

PRINT 'Creando tabla CONTRIBUTION...';
GO

CREATE TABLE CONTRIBUTION(
    Contribution_id INT IDENTITY(1,1),
    Sponsor_id INT NOT NULL,
    Team_id INT NOT NULL,
    Date DATETIME NOT NULL DEFAULT GETDATE(),
    Amount DECIMAL(10,2) NOT NULL,
    Description VARCHAR(500),

    --Constraints
    CONSTRAINT PK_Contribution PRIMARY KEY (Contribution_id),
    CONSTRAINT CHK_Contribution_Amount CHECK (Amount > 0)
);
GO

PRINT 'Tabla CONTRIBUTION creada exitosamente';
GO

PRINT 'Creando tabla PURCHASE...';
GO

CREATE TABLE PURCHASE(
    Purchase_id INT IDENTITY(1,1),
    Engineer_User_id INT NOT NULL,
    Part_id INT NOT NULL,
    Purchase_Date DATETIME NOT NULL DEFAULT GETDATE(),
    Quantity INT NOT NULL,
    Unit_price DECIMAL(10,2) NOT NULL,
    Total_price DECIMAL(10,2) NOT NULL,

    --Constraints
    CONSTRAINT PK_Purchase PRIMARY KEY (Purchase_id),
    CONSTRAINT CHK_Purchase_Quantity CHECK (Quantity > 0),
    CONSTRAINT CHK_Purchase_UnitPrice CHECK (Unit_price > 0),
    CONSTRAINT CHK_Purchase_TotalPrice CHECK (Total_price > 0)
);
GO

PRINT 'Tabla PURCHASE creada exitosamente';
GO

PRINT 'Creando tabla INVENTORY_PART...';
GO

CREATE TABLE INVENTORY_PART(
    Inventory_id INT NOT NULL,
    Part_id INT NOT NULL,
    Quantity INT NOT NULL,
    Acquisition_date DATETIME NOT NULL DEFAULT GETDATE(),

    --Constraints
    CONSTRAINT PK_InventoryPart PRIMARY KEY (Inventory_id, Part_id),
    CONSTRAINT CHK_InventoryPart_Quantity CHECK (Quantity >= 0)
);
GO

PRINT 'Tabla INVENTORY_PART creada exitosamente';
GO

PRINT 'Creando tabla CAR_CONFIGURATION...';
GO

CREATE TABLE CAR_CONFIGURATION (
    Car_id INT NOT NULL,
    Part_Category VARCHAR(50) NOT NULL,
    Part_id INT NOT NULL,
    Installed_date DATETIME NOT NULL DEFAULT GETDATE(),
    
    -- Constraints
    CONSTRAINT PK_CarConfiguration PRIMARY KEY (Car_id, Part_Category),
    CONSTRAINT CHK_CarConfiguration_Category CHECK (
        Part_Category IN ('Power_Unit', 'Aerodynamics_pkg', 'Wheels', 'Suspension', 'Gearbox')
    )
);
GO

PRINT 'Tabla CAR_CONFIGURATION creada exitosamente';
GO

PRINT 'Creando tabla SIMULATION_PARTICIPANT...';
GO

CREATE TABLE SIMULATION_PARTICIPANT (
    simulation_id INT NOT NULL,
    car_id INT NOT NULL,
    driver_id INT NOT NULL,
    team_id INT NOT NULL,
    position INT NULL,
    time_seconds DECIMAL(10,2) NULL,
    v_recta DECIMAL(10,2) NULL,
    v_curva DECIMAL(10,2) NULL,
    penalty DECIMAL(10,2) NULL,
    setup_p INT NULL,
    setup_a INT NULL,
    setup_m INT NULL,
    driver_h INT NULL,
    
    -- Constraints
    CONSTRAINT PK_SimulationParticipant PRIMARY KEY (simulation_id, car_id)
);
GO

PRINT 'Tabla SIMULATION_PARTICIPANT creada exitosamente';
GO

-- ============================================================================
-- 7. AGREGAR FOREIGN KEYS
-- ============================================================================

PRINT 'Agregando FKs a ENGINEER...';
GO

ALTER TABLE ENGINEER
ADD CONSTRAINT FK_Engineer_User FOREIGN KEY (User_id)
REFERENCES [USER](User_id);
GO

ALTER TABLE ENGINEER
ADD CONSTRAINT FK_Engineer_Team FOREIGN KEY (Team_id)
REFERENCES TEAM(Team_id);
GO

PRINT 'FKs de ENGINEER agregadas';
GO

PRINT 'Agregando FKs a DRIVER...';
GO

ALTER TABLE DRIVER
ADD CONSTRAINT FK_Driver_User FOREIGN KEY (User_id)
REFERENCES [USER](User_id);
GO

ALTER TABLE DRIVER
ADD CONSTRAINT FK_Driver_Team FOREIGN KEY (Team_id)
REFERENCES TEAM(Team_id);
GO

PRINT 'FKs de DRIVER agregadas';
GO

PRINT 'Agregando FKs a ADMIN...';
GO

ALTER TABLE ADMIN
ADD CONSTRAINT FK_Admin_User FOREIGN KEY (User_id)
REFERENCES [USER](User_id);
GO

PRINT 'FKs de ADMIN agregadas';
GO

PRINT 'Agregando FKs a INVENTORY...';
GO

ALTER TABLE INVENTORY
ADD CONSTRAINT FK_Inventory_Team FOREIGN KEY (Team_id)
REFERENCES TEAM(Team_id);
GO

PRINT 'FKs de INVENTORY agregadas';
GO

PRINT 'Agregando FKs a CAR...';
GO

ALTER TABLE CAR
ADD CONSTRAINT FK_Car_Team FOREIGN KEY (Team_id)
REFERENCES TEAM(Team_id);
GO

PRINT 'FKs de CAR agregadas';
GO

PRINT 'Agregando FKs a SIMULATION...';
GO

ALTER TABLE SIMULATION
ADD CONSTRAINT FK_Simulation_Circuit FOREIGN KEY (Circuit_id)
REFERENCES CIRCUIT(Circuit_id);
GO

ALTER TABLE SIMULATION
ADD CONSTRAINT FK_Simulation_Admin FOREIGN KEY (Created_by_admin_id)
REFERENCES ADMIN(User_id);
GO

PRINT 'FKs de SIMULATION agregadas';
GO

PRINT 'Agregando FKs a CONTRIBUTION...';
GO

ALTER TABLE CONTRIBUTION
ADD CONSTRAINT FK_Contribution_Sponsor FOREIGN KEY (Sponsor_id)
REFERENCES SPONSOR(Sponsor_id);
GO

ALTER TABLE CONTRIBUTION
ADD CONSTRAINT FK_Contribution_Team FOREIGN KEY (Team_id)
REFERENCES TEAM(Team_id);
GO

PRINT 'FKs de CONTRIBUTION agregadas';
GO

PRINT 'Agregando FKs a PURCHASE...';
GO

ALTER TABLE PURCHASE
ADD CONSTRAINT FK_Purchase_Engineer FOREIGN KEY (Engineer_User_id)
REFERENCES ENGINEER(User_id);
GO

ALTER TABLE PURCHASE
ADD CONSTRAINT FK_Purchase_Part FOREIGN KEY (Part_id)
REFERENCES PART(Part_id);
GO

PRINT 'FKs de PURCHASE agregadas';
GO

PRINT 'Agregando FKs a INVENTORY_PART...';
GO

ALTER TABLE INVENTORY_PART
ADD CONSTRAINT FK_InventoryPart_Inventory FOREIGN KEY (Inventory_id)
REFERENCES INVENTORY(Inventory_id);
GO

ALTER TABLE INVENTORY_PART
ADD CONSTRAINT FK_InventoryPart_Part FOREIGN KEY (Part_id)
REFERENCES PART(Part_id);
GO

PRINT 'FKs de INVENTORY_PART agregadas';
GO

PRINT 'Agregando FKs a CAR_CONFIGURATION...';
GO

ALTER TABLE CAR_CONFIGURATION
ADD CONSTRAINT FK_CarConfig_Car FOREIGN KEY (Car_id)
REFERENCES CAR(Car_id);
GO

ALTER TABLE CAR_CONFIGURATION
ADD CONSTRAINT FK_CarConfig_Part FOREIGN KEY (Part_id)
REFERENCES PART(Part_id);
GO

PRINT 'FKs de CAR_CONFIGURATION agregadas';
GO

PRINT 'Agregando FKs a SIMULATION_PARTICIPANT...';
GO

ALTER TABLE SIMULATION_PARTICIPANT
ADD CONSTRAINT FK_SimPart_Simulation FOREIGN KEY (simulation_id)
REFERENCES SIMULATION(Simulation_id);

ALTER TABLE SIMULATION_PARTICIPANT
ADD CONSTRAINT FK_SimPart_Car FOREIGN KEY (car_id)
REFERENCES CAR(Car_id);

ALTER TABLE SIMULATION_PARTICIPANT
ADD CONSTRAINT FK_SimPart_Driver FOREIGN KEY (driver_id)
REFERENCES DRIVER(User_id);

ALTER TABLE SIMULATION_PARTICIPANT
ADD CONSTRAINT FK_SimPart_Team FOREIGN KEY (team_id)
REFERENCES TEAM(Team_id);

PRINT 'FKs de SIMULATION_PARTICIPANT agregadas';
GO

-- ============================================================================
-- 8. STORED PROCEDURES CORREGIDOS
-- ============================================================================

PRINT 'Creando Stored Procedures corregidos...';
GO

-- SP 1: Calcular presupuesto de un equipo (CORREGIDO)
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

PRINT 'SP sp_GetTeamBudget creado exitosamente';
GO

-- SP 2: Ver inventario de un equipo
CREATE OR ALTER PROCEDURE sp_GetTeamInventory
    @Team_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        p.Part_id,
        p.Category,
        p.Price,
        p.p,
        p.a,
        p.m,
        ip.Quantity,
        ip.Acquisition_date
    FROM INVENTORY i
    JOIN INVENTORY_PART ip ON i.Inventory_id = ip.Inventory_id
    JOIN PART p ON ip.Part_id = p.Part_id
    WHERE i.Team_id = @Team_id
    ORDER BY p.Category, p.Part_id;
END
GO

PRINT 'SP sp_GetTeamInventory creado exitosamente';
GO

-- SP 3: Registrar compra (CORREGIDO)
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

        -- Obtener Team_id del Engineer
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

        -- Calcular presupuesto disponible
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

        -- Insertar registro de compra
        INSERT INTO PURCHASE (Engineer_User_id, Part_id, Quantity, Unit_price, Total_price, Purchase_Date)
        VALUES (@Engineer_User_id, @Part_id, @Quantity, @Unit_price, @Total_price, GETDATE());

        -- Reducir stock de la tienda
        UPDATE PART
        SET Stock = Stock - @Quantity
        WHERE Part_id = @Part_id;

        -- Actualizar Total_Spent en TEAM
        UPDATE TEAM
        SET Total_Spent = Total_Spent + @Total_price
        WHERE Team_id = @Team_id;

        -- AGREGAR AL INVENTARIO
        DECLARE @Inventory_id INT;

        -- Obtener inventario del equipo
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

        -- Calcular nuevo presupuesto disponible
        SELECT @TotalIncome = ISNULL(SUM(Amount), 0)
        FROM CONTRIBUTION
        WHERE Team_id = @Team_id;

        SELECT @NewAvailableBudget = @TotalIncome - ISNULL(SUM(Total_price), 0)
        FROM PURCHASE p
        INNER JOIN ENGINEER e ON p.Engineer_User_id = e.User_id
        WHERE e.Team_id = @Team_id;

        SET @NewAvailableBudget = ISNULL(@NewAvailableBudget, @TotalIncome);

        COMMIT TRANSACTION;

        -- Retornar información de la compra
        SELECT
            SCOPE_IDENTITY() AS Purchase_id,
            @Total_price AS Total_Paid,
            @NewAvailableBudget AS New_Available_Budget;

        PRINT 'Compra registrada exitosamente. Presupuesto disponible: ' + CAST(@NewAvailableBudget AS VARCHAR(20));

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

PRINT 'SP sp_RegisterPurchase creado exitosamente';
GO

-- SP 4: Ver configuración de un carro
CREATE OR ALTER PROCEDURE sp_GetCarConfiguration
    @Car_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        cc.Part_Category,
        cc.Part_id,
        p.Category,
        p.Price,
        p.p,
        p.a,
        p.m,
        cc.Installed_date
    FROM CAR_CONFIGURATION cc
    JOIN PART p ON cc.Part_id = p.Part_id
    WHERE cc.Car_id = @Car_id
    ORDER BY cc.Part_Category;
END
GO

PRINT 'SP sp_GetCarConfiguration creado exitosamente';
GO

-- SP 5: Crear Simulación Básica
CREATE OR ALTER PROCEDURE sp_CreateSimulationBasic
    @AdminID INT,
    @CircuitID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO SIMULATION (Circuit_id, Created_by_admin_id, Data_time)
    VALUES (@CircuitID, @AdminID, GETDATE());
    
    SELECT SCOPE_IDENTITY() AS NewSimulationID;
END
GO

PRINT 'SP sp_CreateSimulationBasic creado exitosamente';
GO

-- SP 6: Agregar Participante
CREATE OR ALTER PROCEDURE sp_AddSimulationParticipant
    @SimulationID INT,
    @CarID INT,
    @DriverID INT,
    @TeamID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Verificar que el carro esté finalizado
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

PRINT 'SP sp_AddSimulationParticipant creado exitosamente';
GO

-- SP 7: Instalar Parte en Auto (CORREGIDO)
CREATE OR ALTER PROCEDURE sp_InstallPart
    @Car_id INT,
    @Part_id INT,
    @Team_id INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Category VARCHAR(50);
    DECLARE @TeamInventory INT;
    DECLARE @Inventory_id INT;

    -- Obtener categoría de la parte
    SELECT @Category = Category
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

    -- Verificar inventario del equipo
    SELECT @TeamInventory = ip.Quantity,
           @Inventory_id = i.Inventory_id
    FROM INVENTORY i
    JOIN INVENTORY_PART ip ON i.Inventory_id = ip.Inventory_id
    WHERE i.Team_id = @Team_id AND ip.Part_id = @Part_id;

    IF @TeamInventory IS NULL OR @TeamInventory <= 0
    BEGIN
        THROW 51004, 'Equipo no tiene esta parte en inventario', 1;
    END

    BEGIN TRANSACTION;

    BEGIN TRY
        -- Instalar parte
        INSERT INTO CAR_CONFIGURATION (Car_id, Part_Category, Part_id, Installed_date)
        VALUES (@Car_id, @Category, @Part_id, GETDATE());

        -- Reducir inventario del equipo
        UPDATE INVENTORY_PART
        SET Quantity = Quantity - 1
        WHERE Inventory_id = @Inventory_id AND Part_id = @Part_id;

        COMMIT TRANSACTION;
        PRINT 'Parte instalada exitosamente';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

PRINT 'SP sp_InstallPart creado exitosamente';
GO

-- SP 8: Reemplazar Parte en Auto (CORREGIDO)
CREATE OR ALTER PROCEDURE sp_ReplacePart
    @Car_id INT,
    @OldPart_id INT,
    @NewPart_id INT,
    @Team_id INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Category VARCHAR(50);
    DECLARE @NewCategory VARCHAR(50);
    DECLARE @TeamInventory INT;
    DECLARE @Inventory_id INT;

    -- Verificar que la parte vieja esté instalada
    SELECT @Category = Part_Category
    FROM CAR_CONFIGURATION
    WHERE Car_id = @Car_id AND Part_id = @OldPart_id;

    IF @Category IS NULL
    BEGIN
        THROW 51006, 'La parte vieja no está instalada en este auto', 1;
    END

    -- Obtener datos de la nueva parte
    SELECT @NewCategory = Category
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

    -- Verificar inventario del equipo para nueva parte
    SELECT @TeamInventory = ip.Quantity,
           @Inventory_id = i.Inventory_id
    FROM INVENTORY i
    JOIN INVENTORY_PART ip ON i.Inventory_id = ip.Inventory_id
    WHERE i.Team_id = @Team_id AND ip.Part_id = @NewPart_id;

    IF @TeamInventory IS NULL OR @TeamInventory <= 0
    BEGIN
        THROW 51004, 'Equipo no tiene la nueva parte en inventario', 1;
    END

    BEGIN TRANSACTION;

    BEGIN TRY
        -- Reemplazar parte
        UPDATE CAR_CONFIGURATION
        SET Part_id = @NewPart_id, Installed_date = GETDATE()
        WHERE Car_id = @Car_id AND Part_Category = @Category;

        -- Ajustar inventario: devolver la vieja, quitar la nueva
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

        COMMIT TRANSACTION;
        PRINT 'Parte reemplazada exitosamente';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

PRINT 'SP sp_ReplacePart creado exitosamente';
GO

-- SP 9: Calcular Parámetros Reales del Auto
CREATE OR ALTER PROCEDURE sp_CalculateCarStats
    @Car_id INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @TotalP INT = 0;
    DECLARE @TotalA INT = 0;
    DECLARE @TotalM INT = 0;

    SELECT 
        @TotalP = SUM(p.p),
        @TotalA = SUM(p.a),
        @TotalM = SUM(p.m)
    FROM CAR_CONFIGURATION cc
    JOIN PART p ON cc.Part_id = p.Part_id
    WHERE cc.Car_id = @Car_id;

    SELECT 
        ISNULL(@TotalP, 0) AS Power,
        ISNULL(@TotalA, 0) AS Aerodynamics,
        ISNULL(@TotalM, 0) AS Maneuverability,
        (ISNULL(@TotalP, 0) + ISNULL(@TotalA, 0) + ISNULL(@TotalM, 0)) AS TotalPerformance;
END
GO

PRINT 'SP sp_CalculateCarStats creado exitosamente';
GO

-- SP 10: Verificar Compatibilidad de Parte
CREATE OR ALTER PROCEDURE sp_ValidatePartCompatibility
    @Car_id INT,
    @Part_id INT
AS
BEGIN
    SET NOCOUNT ON;

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

PRINT 'SP sp_ValidatePartCompatibility creado exitosamente';
GO

-- SP 11: Registrar Aporte de Patrocinador (CORREGIDO)
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
        -- Validaciones
        IF NOT EXISTS (SELECT 1 FROM SPONSOR WHERE Sponsor_id = @Sponsor_id)
        BEGIN
            THROW 52001, 'Sponsor no existe', 1;
        END

        IF NOT EXISTS (SELECT 1 FROM TEAM WHERE Team_id = @Team_id)
        BEGIN
            THROW 52002, 'Equipo no existe', 1;
        END

        IF @Amount <= 0
        BEGIN
            THROW 52003, 'El monto del aporte debe ser positivo', 1;
        END

        -- Insertar aporte
        INSERT INTO CONTRIBUTION (Sponsor_id, Team_id, Amount, Date, Description)
        VALUES (@Sponsor_id, @Team_id, @Amount, GETDATE(), @Description);

        -- Actualizar Total_Budget en TEAM
        UPDATE TEAM
        SET Total_Budget = Total_Budget + @Amount
        WHERE Team_id = @Team_id;

        -- Obtener nuevo presupuesto total
        SELECT @NewBudget = Total_Budget
        FROM TEAM
        WHERE Team_id = @Team_id;

        COMMIT TRANSACTION;

        -- Retornar resultados
        SELECT
            SCOPE_IDENTITY() AS Contribution_id,
            @NewBudget AS NewBudget;

        PRINT 'Aporte registrado exitosamente. Nuevo presupuesto: ' + CAST(@NewBudget AS VARCHAR(20));

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

PRINT 'SP sp_RegisterContribution creado exitosamente';
GO

-- SP 12: Obtener Aportes de un Equipo con Detalles
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

PRINT 'SP sp_GetTeamContributionsDetailed creado exitosamente';
GO

-- SP 13: Calcular Presupuesto Disponible (CORREGIDO)
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

    -- Total recibido de aportes
    SELECT @TotalIncome = ISNULL(SUM(Amount), 0)
    FROM CONTRIBUTION
    WHERE Team_id = @Team_id;

    -- Total gastado en compras
    SELECT @TotalSpent = ISNULL(SUM(p.Total_price), 0)
    FROM PURCHASE p
    INNER JOIN ENGINEER e ON p.Engineer_User_id = e.User_id
    WHERE e.Team_id = @Team_id;

    -- Resumen completo
    SELECT
        @Team_id AS Team_ID,
        @TeamName AS Team_Name,
        @TotalIncome AS Total_Income,
        @TotalSpent AS Total_Spent,
        (@TotalIncome - @TotalSpent) AS Available_Budget,
        (SELECT COUNT(*) FROM CONTRIBUTION WHERE Team_id = @Team_id) AS Total_Contributions,
        (SELECT COUNT(*) FROM PURCHASE p 
         INNER JOIN ENGINEER e ON p.Engineer_User_id = e.User_id
         WHERE e.Team_id = @Team_id) AS Total_Purchases;
END
GO

PRINT 'SP sp_CalculateAvailableBudget creado exitosamente';
GO

-- SP 14: Obtener Estadísticas de Sponsor
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

PRINT 'SP sp_GetSponsorStats creado exitosamente';
GO

-- SP 15: Validar compra antes de realizar (CORREGIDO)
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

    -- Obtener Team_id
    SELECT @Team_id = Team_id
    FROM ENGINEER
    WHERE User_id = @Engineer_User_id;

    -- Obtener datos de la parte
    SELECT @Unit_price = Price, @Stock = Stock
    FROM PART
    WHERE Part_id = @Part_id;

    -- Calcular presupuesto disponible
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

PRINT 'SP sp_ValidatePurchase creado exitosamente';
GO

-- ============================================================================
-- 9. DATOS DE PRUEBA
-- ============================================================================

PRINT 'Insertando datos de prueba...';
GO

-- Insertar algunos patrocinadores
INSERT INTO SPONSOR (Name, Industry, Country) VALUES
('Red Bull', 'Energy Drinks', 'Austria'),
('Petronas', 'Oil & Gas', 'Malaysia'),
('Shell', 'Oil & Gas', 'Netherlands'),
('Rolex', 'Luxury Watches', 'Switzerland'),
('Pirelli', 'Tires', 'Italy');
GO

-- Insertar equipos
INSERT INTO TEAM (Name) VALUES
('Mercedes-AMG'),
('Red Bull Racing'),
('Ferrari'),
('McLaren');
GO

-- Insertar partes de ejemplo
INSERT INTO PART (Category, Price, Stock, p, a, m) VALUES
('Power_Unit', 1000000.00, 5, 9, 3, 2),
('Power_Unit', 800000.00, 8, 7, 4, 3),
('Aerodynamics_pkg', 500000.00, 10, 2, 9, 4),
('Aerodynamics_pkg', 300000.00, 15, 1, 7, 5),
('Wheels', 200000.00, 20, 3, 4, 8),
('Wheels', 150000.00, 25, 2, 3, 7),
('Suspension', 400000.00, 12, 2, 5, 9),
('Suspension', 250000.00, 18, 1, 4, 8),
('Gearbox', 350000.00, 10, 4, 3, 6),
('Gearbox', 200000.00, 15, 3, 2, 7);
GO

-- Insertar circuitos
INSERT INTO CIRCUIT (Name, Total_distance, N_Curves) VALUES
('Monza', 5.793, 11),
('Silverstone', 5.891, 18),
('Suzuka', 5.807, 18),
('Circuit de Monaco', 3.337, 19);
GO

-- Insertar usuario admin
INSERT INTO [USER] (Username, Salt, PasswordHash) VALUES
('admin', 'salt123', 'hash123');
GO

INSERT INTO ADMIN (User_id) VALUES (1);
GO

PRINT 'Datos de prueba insertados exitosamente';
GO
