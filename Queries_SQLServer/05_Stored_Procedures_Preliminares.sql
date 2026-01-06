-- ============================================================================
-- F1 Garage Manager
-- Parte 5: Stored Procedures Preliminares (Versión Básica para entregable 2 toca mejorarlos para entregable 3)
-- Descripción: SPs simples para demostración inicial
-- ============================================================================

USE F1GarageManager;
GO

PRINT 'Iniciando creación de Stored Procedures:';
GO

-- ============================================================================
-- 1. SP: Calcular presupuesto de un equipo
-- ============================================================================

CREATE PROCEDURE sp_GetTeamBudget
    @Team_id INT -- parámetro de entrada @Team_id
AS -- Inicio del cuerpo del porcedimiento
BEGIN --Inicio del bloque de ejecución
    SELECT SUM(Amount) AS Total_Budget
    FROM CONTRIBUTION -- Usando la tabla contribution
    WHERE Team_id = @Team_id; -- Donde el Team_id coincida con el parámtro proporcionado.
END
GO

PRINT 'SP sp_GetTeamBudget creado!!';
GO

-- ============================================================================
-- 2. SP: Ver inventario de un equipo
-- ============================================================================
CREATE PROCEDURE sp_GetTeamInventory
    @Team_id INT
AS
BEGIN
    -- Mostrar partes en inventario, todo lo que el equipo ha comprado por el momento
    SELECT --Seleccionamos los atributos importantes
        p.Part_id,
        p.Category,
        ip.Quantity
    FROM INVENTORY i     -- Desde la tabla INVENTORY (alias i)
    JOIN INVENTORY_PART ip ON i.Inventory_id = ip.Inventory_id -- Unir con INVENTORY_PART (alias ip) donde Inventory_id coincida
    JOIN PART p ON ip.Part_id = p.Part_id   -- Unir con PART (alias p) donde Part_id coincida
    WHERE i.Team_id = @Team_id; -- Solo donde TEAM _id del parámtro.
END
GO

PRINT 'SP sp_GetTeamInventory creado!!';
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
    INSERT INTO PURCHASE (Engineer_User_id, Part_id, Quantity, Unit_price, Total_price)
    VALUES (@Engineer_User_id, @Part_id, @Quantity, 100, 100 * @Quantity);+
    --Insersión de valores prueba.
    PRINT 'Compra registrada';
END
GO

PRINT 'SP sp_RegisterPurchase creado!!';
GO

-- ============================================================================
-- 4. SP: Ver configuración de un carro
-- ============================================================================
CREATE PROCEDURE sp_GetCarConfiguration
    @Car_id INT
AS
BEGIN
    SELECT 
        Part_Category, -- Categoría de la parte
        Part_id --Id de la misma para identificación
    FROM CAR_CONFIGURATION
    WHERE Car_id = @Car_id;
END
GO

PRINT 'SP sp_GetCarConfiguration creado!!';
GO


PRINT '============================================================================';
PRINT 'Stored Procedures preliminares creados exitosamente';
PRINT '============================================================================';

-- Consultar y mostrar una lista de los SPs existentes para verificar que se creen bien.
SELECT 
    name AS 'Stored Procedure' FROM sys.procedures --Para renombrar el campo name como Stored Procedure, esto para que aparezca en el encabezado de los resultados.
WHERE schema_id = SCHEMA_ID('dbo')-- Filtrar para mostrar solo los SPs que son del esquema dbo.
ORDER BY name;-- Ordenar alfabéticamente por nombre
GO

PRINT 'Total: 4 Stored Procedures básicos';
-- GO separa lotes
GO