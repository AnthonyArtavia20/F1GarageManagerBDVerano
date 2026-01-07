-- ============================================================================
-- F1 Garage Manager - Base de Datos Verano CE3101
-- Schema en SQLServer
-- Grupo 3/C, Alexs, Anthony, Bryan, Felipe
-- ============================================================================

--En este archivo se encuentra la creación de la BD y las entidades fuertes

-- 1. Crear base de datos:

USE master;
GO

CREATE DATABASE F1GarageManager; -- Crear la base de datos
GO

USE F1GarageManager; -- Usarla para operar
GO

PRINT 'Base de datos F1GarageManager creada exitosamente';
GO

-- 2. Crear SCHEMA:
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'dbo')
BEGIN
    EXEC('CREATE SCHEMA dbo AUTHORIZATION dbo');
END
GO

PRINT 'Schema dbo verificado';
GO

-- 3. Creación de entidades Fuertes!!

PRINT 'Creando tabla USER...';
GO
-- *¨*¨*¨*¨*¨*¨*¨*¨*¨*¨¨*
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

-- *¨*¨*¨*¨*¨*¨*¨*¨*¨*¨¨*
PRINT 'Creando tabla TEAM...';
GO

CREATE TABLE TEAM (
    Team_id INT IDENTITY(1,1),
    Name VARCHAR(100) NOT NULL,
    
    -- Constraints
    CONSTRAINT PK_Team PRIMARY KEY (Team_id)
);
GO

PRINT 'Tabla TEAM creada exitosamente';
GO

-- *¨*¨*¨*¨*¨*¨*¨*¨*¨*¨¨*
PRINT 'Creando tabla SPONSOR...';
GO

CREATE TABLE SPONSOR (
    Sponsor_id INT IDENTITY(1,1),
    Name VARCHAR(100) NOT NULL,
    
    -- Constraints
    CONSTRAINT PK_Sponsor PRIMARY KEY (Sponsor_id)
);
GO

PRINT 'Tabla SPONSOR creada exitosamente';
GO

-- *¨*¨*¨*¨*¨*¨*¨*¨*¨*¨¨*
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

-- *¨*¨*¨*¨*¨*¨*¨*¨*¨*¨¨*
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

-- *¨*¨*¨*¨*¨*¨*¨*¨*¨*¨¨*
PRINT 'Creando tabla SIMULATION...';
GO

CREATE TABLE SIMULATION (
    Simulation_id INT IDENTITY(1,1),
    Data_time DATETIME NOT NULL DEFAULT GETDATE(),
    Circuit_id INT NOT NULL,
    Winner_Car_id INT NOT NULL,
    Winner_Driver_id INT NOT NULL,
    Team_id INT NOT NULL,
    
    -- Constraints
    CONSTRAINT PK_Simulation PRIMARY KEY (Simulation_id)
    
    -- NOTA: Las Foreign Keys se agregarán en el script 04_Foreign_Keys.sql
);
GO

PRINT 'Tabla SIMULATION creada exitosamente';
GO