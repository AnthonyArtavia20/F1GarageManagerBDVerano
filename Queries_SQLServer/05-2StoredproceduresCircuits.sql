-- ============================================================================
-- F1 Garage Manager - Stored Procedures para Circuitos
-- ============================================================================

USE F1GarageManager;
GO

PRINT 'Creando Stored Procedures para CIRCUIT...';
GO

-- ============================================================================
-- SP: Crear nuevo circuito
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_CreateCircuit
    @Name VARCHAR(100),
    @Total_distance DECIMAL(10,2),
    @N_Curves INT,
    @Success BIT OUTPUT,
    @Message NVARCHAR(500) OUTPUT,
    @NewCircuitId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Success = 0;
    SET @Message = '';
    SET @NewCircuitId = 0;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validaciones
        IF @Name IS NULL OR LTRIM(RTRIM(@Name)) = ''
        BEGIN
            SET @Message = 'El nombre del circuito es obligatorio';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        IF @Total_distance <= 0
        BEGIN
            SET @Message = 'La distancia total debe ser mayor a 0';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        IF @N_Curves < 0
        BEGIN
            SET @Message = 'El número de curvas no puede ser negativo';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Verificar que no exista un circuito con el mismo nombre
        IF EXISTS (SELECT 1 FROM CIRCUIT WHERE Name = @Name)
        BEGIN
            SET @Message = 'Ya existe un circuito con ese nombre';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Insertar el circuito
        INSERT INTO CIRCUIT (Name, Total_distance, N_Curves)
        VALUES (@Name, @Total_distance, @N_Curves);
        
        SET @NewCircuitId = SCOPE_IDENTITY();
        
        COMMIT TRANSACTION;
        
        SET @Success = 1;
        SET @Message = 'Circuito creado exitosamente';
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        SET @Success = 0;
        SET @Message = 'Error al crear circuito: ' + ERROR_MESSAGE();
        SET @NewCircuitId = 0;
    END CATCH;
END
GO

PRINT 'SP sp_CreateCircuit creado';
GO

-- ============================================================================
-- SP: Obtener todos los circuitos
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_GetAllCircuits
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        Circuit_id,
        Name,
        Total_distance,
        N_Curves,
        -- Calcular distancias para preview (asumiendo dc = 0.5 km como default)
        (N_Curves * 0.5) AS Calculated_Curve_Distance,
        (Total_distance - (N_Curves * 0.5)) AS Calculated_Straight_Distance
    FROM CIRCUIT
    ORDER BY Name;
END
GO

PRINT 'SP sp_GetAllCircuits creado';
GO

-- ============================================================================
-- SP: Obtener un circuito por ID
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_GetCircuitById
    @Circuit_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        Circuit_id,
        Name,
        Total_distance,
        N_Curves
    FROM CIRCUIT
    WHERE Circuit_id = @Circuit_id;
END
GO

PRINT 'SP sp_GetCircuitById creado';
GO

-- ============================================================================
-- SP: Actualizar circuito
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_UpdateCircuit
    @Circuit_id INT,
    @Name VARCHAR(100),
    @Total_distance DECIMAL(10,2),
    @N_Curves INT,
    @Success BIT OUTPUT,
    @Message NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Success = 0;
    SET @Message = '';
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar que el circuito existe
        IF NOT EXISTS (SELECT 1 FROM CIRCUIT WHERE Circuit_id = @Circuit_id)
        BEGIN
            SET @Message = 'Circuito no encontrado';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Validaciones
        IF @Name IS NULL OR LTRIM(RTRIM(@Name)) = ''
        BEGIN
            SET @Message = 'El nombre del circuito es obligatorio';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        IF @Total_distance <= 0
        BEGIN
            SET @Message = 'La distancia total debe ser mayor a 0';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        IF @N_Curves < 0
        BEGIN
            SET @Message = 'El número de curvas no puede ser negativo';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Verificar nombre duplicado (excluyendo el actual)
        IF EXISTS (
            SELECT 1 FROM CIRCUIT 
            WHERE Name = @Name AND Circuit_id != @Circuit_id
        )
        BEGIN
            SET @Message = 'Ya existe otro circuito con ese nombre';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Actualizar
        UPDATE CIRCUIT
        SET Name = @Name,
            Total_distance = @Total_distance,
            N_Curves = @N_Curves
        WHERE Circuit_id = @Circuit_id;
        
        COMMIT TRANSACTION;
        
        SET @Success = 1;
        SET @Message = 'Circuito actualizado exitosamente';
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        SET @Success = 0;
        SET @Message = 'Error al actualizar circuito: ' + ERROR_MESSAGE();
    END CATCH;
END
GO

PRINT 'SP sp_UpdateCircuit creado';
GO

-- ============================================================================
-- SP: Eliminar circuito
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_DeleteCircuit
    @Circuit_id INT,
    @Success BIT OUTPUT,
    @Message NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Success = 0;
    SET @Message = '';
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar que el circuito existe
        IF NOT EXISTS (SELECT 1 FROM CIRCUIT WHERE Circuit_id = @Circuit_id)
        BEGIN
            SET @Message = 'Circuito no encontrado';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Verificar que no esté siendo usado en simulaciones
        IF EXISTS (SELECT 1 FROM SIMULATION WHERE Circuit_id = @Circuit_id)
        BEGIN
            SET @Message = 'No se puede eliminar: el circuito tiene simulaciones asociadas';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Eliminar
        DELETE FROM CIRCUIT WHERE Circuit_id = @Circuit_id;
        
        COMMIT TRANSACTION;
        
        SET @Success = 1;
        SET @Message = 'Circuito eliminado exitosamente';
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        SET @Success = 0;
        SET @Message = 'Error al eliminar circuito: ' + ERROR_MESSAGE();
    END CATCH;
END
GO

PRINT 'SP sp_DeleteCircuit creado';
GO

-- ============================================================================
-- SP: Validar circuito para simulación
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_ValidateCircuitForSimulation
    @Circuit_id INT,
    @dc DECIMAL(10,2) = 0.5  -- Distancia por curva (parámetro global del sistema)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Total_distance DECIMAL(10,2);
    DECLARE @N_Curves INT;
    DECLARE @D_curves DECIMAL(10,2);
    DECLARE @D_straights DECIMAL(10,2);
    DECLARE @IsValid BIT;
    DECLARE @Message NVARCHAR(500);
    
    SELECT 
        @Total_distance = Total_distance,
        @N_Curves = N_Curves
    FROM CIRCUIT
    WHERE Circuit_id = @Circuit_id;
    
    IF @Total_distance IS NULL
    BEGIN
        SELECT 
            0 AS IsValid,
            'Circuito no encontrado' AS Message;
        RETURN;
    END
    
    SET @D_curves = @N_Curves * @dc;
    SET @D_straights = @Total_distance - @D_curves;
    
    IF @D_straights < 0
    BEGIN
        SET @IsValid = 0;
        SET @Message = 'Error: Las curvas ocupan más distancia que el total del circuito';
    END
    ELSE
    BEGIN
        SET @IsValid = 1;
        SET @Message = 'Circuito válido para simulación';
    END
    
    SELECT 
        @IsValid AS IsValid,
        @Message AS Message,
        @Total_distance AS Total_Distance,
        @N_Curves AS Number_Of_Curves,
        @dc AS Distance_Per_Curve,
        @D_curves AS Total_Curve_Distance,
        @D_straights AS Total_Straight_Distance;
END
GO

PRINT 'SP sp_ValidateCircuitForSimulation creado';
GO

PRINT '============================================================================';
PRINT 'STORED PROCEDURES DE CIRCUITOS CREADOS EXITOSAMENTE';
PRINT '============================================================================';
GO