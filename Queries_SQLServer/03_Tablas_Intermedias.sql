-- ============================================================================
-- F1 Garage Manager - Base de Datos Verano CE3101
-- Tablas Intermedias (Relaciones N:M)
-- Grupo 3/C, Alexs, Anthony, Bryan, Felipe
-- ============================================================================

USE F1GarageManager;
GO

PRINT 'Creando tablas intermedias (relaciones N:M)...';
GO

-- *Ø*Ø*Ø*Ø*Ø*Ø*Ø*Ø*Ø*ØØ*
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

-- *Ø*Ø*Ø*Ø*Ø*Ø*Ø*Ø*Ø*ØØ*
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

-- *Ø*Ø*Ø*Ø*Ø*Ø*Ø*Ø*Ø*ØØ*
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

-- *Ø*Ø*Ø*Ø*Ø*Ø*Ø*Ø*Ø*ØØ*
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

PRINT 'Todas las tablas intermedias creadas exitosamente';
GO