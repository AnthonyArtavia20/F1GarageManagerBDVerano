-- ============================================================================
-- F1 Garage Manager - Base de Datos Verano CE3101
-- Entidades D�biles
-- Grupo 3/C, Alexs, Anthony, Bryan, Felipe
-- ============================================================================

USE F1GarageManager;
GO

PRINT 'Creando entidades d�biles...';
GO

-- *�*�*�*�*�*�*�*�*�*��*
PRINT 'Creando tabla ENGINEER...';
GO

-- Dependen de User
CREATE TABLE ENGINEER (
    User_id INT PRIMARY KEY,
    Team_id INT NULL 
    --AGREGAR FK FALTANTE

	--Constraints
	 CONSTRAINT CHK_Engineer_Team CHECK (Team_id IS NULL OR Team_id > 0)  -- Si tiene team, debe ser positivo
);
GO

PRINT 'Tabla ENGINEER creada exitosamente';
GO

-- *�*�*�*�*�*�*�*�*�*��*
PRINT 'Creando tabla DRIVER...';
GO

CREATE TABLE DRIVER (
    User_id INT PRIMARY KEY,
    Team_id INT NULL, 
    H INT NOT NULL CHECK (H >= 0 AND H <= 100),
    --AGREGAR FK FALTANTE

	--Constraints
	CONSTRAINT CHK_Driver_Team CHECK (Team_id IS NULL OR Team_id > 0)  -- Si tiene team, debe ser positivo
);
GO

PRINT 'Tabla DRIVER creada exitosamente';
GO

-- *�*�*�*�*�*�*�*�*�*��*
PRINT 'Creando tabla ADMIN...';
GO

CREATE TABLE ADMIN (
    User_id INT PRIMARY KEY
    --AGREGAR FK FALTANTE
);
GO

PRINT 'Tabla ADMIN creada exitosamente';
GO

-- *�*�*�*�*�*�*�*�*�*��*
-- Dependen de Team

PRINT 'Creando tabla INVENTORY...';
GO

CREATE TABLE INVENTORY (
	Inventory_id INT PRIMARY KEY IDENTITY(1,1),
	Team_id INT NOT NULL UNIQUE,
	-- FK se agrega despu�s

	--Constraints
    CONSTRAINT UK_Inventory_Team UNIQUE (Team_id),  -- Cada equipo solo puede tener un inventario
    CONSTRAINT CHK_Inventory_Team CHECK (Team_id > 0)  -- Team_id debe ser positivo
);
GO

PRINT 'Tabla INVENTORY creada exitosamente';
GO

-- *�*�*�*�*�*�*�*�*�*��*

PRINT 'Creando tabla CAR...';
GO

CREATE TABLE CAR (
	Car_id INT PRIMARY KEY IDENTITY(1,1),
	Team_id INT NOT NULL,
	isFinalized BIT DEFAULT 0,
	-- FK se agrega despu�s

	--Constraints
    CONSTRAINT CHK_Car_Team CHECK (Team_id > 0),  -- Team_id debe ser positivo
    CONSTRAINT DF_Car_isFinalized DEFAULT 0 FOR isFinalized  -- Valor por defecto
);
GO

PRINT 'Tabla CAR creada exitosamente';
GO

PRINT 'Todas las entidades d�biles creadas exitosamente';
GO