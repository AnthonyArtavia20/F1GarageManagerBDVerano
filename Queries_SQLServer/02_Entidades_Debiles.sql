-- ============================================================================
-- F1 Garage Manager - Base de Datos Verano CE3101
-- Entidades Débiles
-- Grupo 3/C, Alexs, Anthony, Bryan, Felipe
-- ============================================================================

USE F1GarageManager;
GO

PRINT 'Creando entidades débiles...';
GO

-- *¨*¨*¨*¨*¨*¨*¨*¨*¨*¨¨*
PRINT 'Creando tabla ENGINEER...';
GO

-- Dependen de User
CREATE TABLE ENGINEER (
    User_id INT,
    Team_id INT NULL,
    
    -- Constraints
    CONSTRAINT PK_Engineer PRIMARY KEY (User_id)
    -- FK se agregan después en 04_Alterns.sql
);
GO

PRINT 'Tabla ENGINEER creada exitosamente';
GO

-- *¨*¨*¨*¨*¨*¨*¨*¨*¨*¨¨*
PRINT 'Creando tabla DRIVER...';
GO

CREATE TABLE DRIVER (
    User_id INT,
    Team_id INT NULL, 
    H INT NOT NULL,
    
    -- Constraints
    CONSTRAINT PK_Driver PRIMARY KEY (User_id),
    CONSTRAINT CHK_Driver_H CHECK (H >= 0 AND H <= 100)
    -- FK se agregan después en 04_Alterns.sql
);
GO

PRINT 'Tabla DRIVER creada exitosamente';
GO

-- *¨*¨*¨*¨*¨*¨*¨*¨*¨*¨¨*
PRINT 'Creando tabla ADMIN...';
GO

CREATE TABLE ADMIN (
    User_id INT,
    
    -- Constraints
    CONSTRAINT PK_Admin PRIMARY KEY (User_id)
    -- FK se agregan después en 04_Alterns.sql
);
GO

PRINT 'Tabla ADMIN creada exitosamente';
GO

-- *¨*¨*¨*¨*¨*¨*¨*¨*¨*¨¨*
-- Dependen de Team

PRINT 'Creando tabla INVENTORY...';
GO

CREATE TABLE INVENTORY (
    Inventory_id INT IDENTITY(1,1),
    Team_id INT NOT NULL,
    
    -- Constraints
    CONSTRAINT PK_Inventory PRIMARY KEY (Inventory_id),
    CONSTRAINT UK_Inventory_Team UNIQUE (Team_id)  -- Solo un inventario por equipo
    -- FK se agrega después en 04_Alterns.sql
);
GO

PRINT 'Tabla INVENTORY creada exitosamente';
GO

-- *¨*¨*¨*¨*¨*¨*¨*¨*¨*¨¨*

PRINT 'Creando tabla CAR...';
GO

CREATE TABLE CAR (
    Car_id INT IDENTITY(1,1),
    Team_id INT NOT NULL,
    isFinalized BIT DEFAULT 0,
    
    -- Constraints
    CONSTRAINT PK_Car PRIMARY KEY (Car_id)
    -- FK se agrega después en 04_Alterns.sql
);
GO

PRINT 'Tabla CAR creada exitosamente';
GO

PRINT '';
PRINT '============================================================================';
PRINT 'Todas las entidades débiles creadas exitosamente';
PRINT '============================================================================';
GO