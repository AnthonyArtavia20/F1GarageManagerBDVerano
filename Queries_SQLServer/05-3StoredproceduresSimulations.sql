-- ============================================================================
-- F1 Garage Manager - Stored Procedures para Simulaciones de Carreras
-- ============================================================================

USE F1GarageManager;
GO

PRINT 'Creando Stored Procedures para SIMULACIONES...';
GO

-- ============================================================================
-- 1. CREAR TABLA PARA SETUP DETALLADO (si no existe)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'SIMULATION_SETUP_DETAIL')
BEGIN
    PRINT 'Creando tabla SIMULATION_SETUP_DETAIL...';
    
    CREATE TABLE SIMULATION_SETUP_DETAIL (
        simulation_id INT NOT NULL,
        car_id INT NOT NULL,
        category VARCHAR(50) NOT NULL,
        part_id INT NOT NULL,
        part_p INT NOT NULL,
        part_a INT NOT NULL,
        part_m INT NOT NULL,
        
        CONSTRAINT PK_SimulationSetupDetail PRIMARY KEY (simulation_id, car_id, category),
        CONSTRAINT FK_SimSetupDetail_SimParticipant FOREIGN KEY (simulation_id, car_id)
            REFERENCES SIMULATION_PARTICIPANT(simulation_id, car_id)
            ON DELETE CASCADE,
        CONSTRAINT FK_SimSetupDetail_Part FOREIGN KEY (part_id)
            REFERENCES PART(Part_id),
        CONSTRAINT CHK_SimSetupDetail_Category CHECK (
            category IN ('Power_Unit', 'Aerodynamics_pkg', 'Wheels', 'Suspension', 'Gearbox')
        )
    );
    
    PRINT 'Tabla SIMULATION_SETUP_DETAIL creada exitosamente';
END
GO

-- ============================================================================
-- SP: Validar carro para simulación
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_ValidateCarForSimulation
    @Car_id INT,
    @IsValid BIT OUTPUT,
    @Message NVARCHAR(500) OUTPUT,
    @Total_P INT OUTPUT,
    @Total_A INT OUTPUT,
    @Total_M INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @IsValid = 0;
    SET @Message = '';
    SET @Total_P = 0;
    SET @Total_A = 0;
    SET @Total_M = 0;
    
    BEGIN TRY
        -- 1. Verificar que el carro existe y está finalizado
        IF NOT EXISTS (SELECT 1 FROM CAR WHERE Car_id = @Car_id AND isFinalized = 1)
        BEGIN
            SET @Message = 'Carro no encontrado o no está finalizado';
            RETURN;
        END
        
        -- 2. Verificar que tiene las 5 categorías instaladas
        DECLARE @CategoryCount INT;
        SELECT @CategoryCount = COUNT(DISTINCT Part_Category)
        FROM CAR_CONFIGURATION
        WHERE Car_id = @Car_id;
        
        IF @CategoryCount < 5
        BEGIN
            SET @Message = 'Carro no tiene las 5 categorías requeridas instaladas';
            RETURN;
        END
        
        -- 3. Calcular totales P, A, M
        SELECT 
            @Total_P = ISNULL(SUM(p.p), 0),
            @Total_A = ISNULL(SUM(p.a), 0),
            @Total_M = ISNULL(SUM(p.m), 0)
        FROM CAR_CONFIGURATION cc
        INNER JOIN PART p ON cc.Part_id = p.Part_id
        WHERE cc.Car_id = @Car_id;
        
        -- 4. Obtener driver asociado al carro (a través del equipo)
        DECLARE @Team_id INT;
        SELECT @Team_id = Team_id FROM CAR WHERE Car_id = @Car_id;
        
        IF NOT EXISTS (
            SELECT 1 FROM DRIVER d 
            WHERE d.Team_id = @Team_id
        )
        BEGIN
            SET @Message = 'El equipo no tiene conductores asignados';
            RETURN;
        END
        
        SET @IsValid = 1;
        SET @Message = 'Carro válido para simulación';
        
    END TRY
    BEGIN CATCH
        SET @IsValid = 0;
        SET @Message = 'Error en validación: ' + ERROR_MESSAGE();
    END CATCH;
END
GO

PRINT 'SP sp_ValidateCarForSimulation creado';
GO

-- ============================================================================
-- SP: Obtener setup completo de un carro
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_GetCarSetupDetails
    @Car_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        cc.Part_Category AS Category,
        cc.Part_id,
        p.Name AS Part_Name,
        p.Category AS Part_Category,
        p.p,
        p.a,
        p.m
    FROM CAR_CONFIGURATION cc
    INNER JOIN PART p ON cc.Part_id = p.Part_id
    WHERE cc.Car_id = @Car_id
    ORDER BY 
        CASE cc.Part_Category
            WHEN 'Power_Unit' THEN 1
            WHEN 'Aerodynamics_pkg' THEN 2
            WHEN 'Wheels' THEN 3
            WHEN 'Suspension' THEN 4
            WHEN 'Gearbox' THEN 5
            ELSE 6
        END;
END
GO

PRINT 'SP sp_GetCarSetupDetails creado';
GO

-- ============================================================================
-- SP: Calcular tiempos de simulación para un participante
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_CalculateRaceTimes
    @Circuit_id INT,
    @Car_P INT,
    @Car_A INT,
    @Car_M INT,
    @Driver_H INT,
    @dc DECIMAL(10,2) = 0.5,
    @V_recta DECIMAL(10,2) OUTPUT,
    @V_curva DECIMAL(10,2) OUTPUT,
    @Penalization DECIMAL(10,2) OUTPUT,
    @Time_seconds DECIMAL(10,2) OUTPUT,
    @Message NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @V_recta = 0;
    SET @V_curva = 0;
    SET @Penalization = 0;
    SET @Time_seconds = 0;
    SET @Message = '';
    
    BEGIN TRY
        -- Obtener datos del circuito
        DECLARE @Total_distance DECIMAL(10,2);
        DECLARE @N_Curves INT;
        
        SELECT 
            @Total_distance = Total_distance,
            @N_Curves = N_Curves
        FROM CIRCUIT
        WHERE Circuit_id = @Circuit_id;
        
        IF @Total_distance IS NULL
        BEGIN
            SET @Message = 'Circuito no encontrado';
            RETURN;
        END
        
        -- Calcular distancias
        DECLARE @D_curvas DECIMAL(10,2);
        DECLARE @D_rectas DECIMAL(10,2);
        
        SET @D_curvas = @N_Curves * @dc;
        SET @D_rectas = @Total_distance - @D_curvas;
        
        IF @D_rectas < 0
        BEGIN
            SET @Message = 'Circuito inválido: las curvas ocupan más distancia que el total';
            RETURN;
        END
        
        -- Calcular velocidades según fórmulas del PDF
        SET @V_recta = 200 + (3 * @Car_P) + (0.2 * @Driver_H) - (1 * @Car_A);
        SET @V_curva = 90 + (2 * @Car_A) + (2 * @Car_M) + (0.2 * @Driver_H);
        
        -- Calcular penalización
        SET @Penalization = (@N_Curves * 40.0) / (1 + (@Driver_H / 100.0));
        
        -- Calcular tiempos (en horas primero)
        DECLARE @Time_hours DECIMAL(10,6);
        SET @Time_hours = (@D_rectas / @V_recta) + (@D_curvas / @V_curva);
        
        -- Convertir a segundos y agregar penalización
        SET @Time_seconds = (@Time_hours * 3600.0) + @Penalization;
        
        SET @Message = 'Cálculos completados exitosamente';
        
    END TRY
    BEGIN CATCH
        SET @Message = 'Error en cálculos: ' + ERROR_MESSAGE();
    END CATCH;
END
GO

PRINT 'SP sp_CalculateRaceTimes creado';
GO

-- ============================================================================
-- SP: Ejecutar simulación completa
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_RunSimulation
    @Circuit_id INT,
    @Admin_id INT,
    @Car_ids NVARCHAR(MAX),  -- Lista de IDs separados por comas: '1,2,3,4'
    @Driver_ids NVARCHAR(MAX), -- Lista de IDs de conductores: '10,12,15,18'
    @dc DECIMAL(10,2) = 0.5,
    @Success BIT OUTPUT,
    @Message NVARCHAR(500) OUTPUT,
    @Simulation_id INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Success = 0;
    SET @Message = '';
    SET @Simulation_id = 0;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- 1. Validar número de participantes (2 a 10)
        DECLARE @CarCount INT;
        SELECT @CarCount = COUNT(value) 
        FROM STRING_SPLIT(@Car_ids, ',');
        
        IF @CarCount < 2
        BEGIN
            SET @Message = 'Se requieren al menos 2 carros para la simulación';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        IF @CarCount > 10
        BEGIN
            SET @Message = 'Máximo 10 carros por simulación';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Verificar que hay mismo número de carros y conductores
        DECLARE @DriverCount INT;
        SELECT @DriverCount = COUNT(value) 
        FROM STRING_SPLIT(@Driver_ids, ',');
        
        IF @CarCount != @DriverCount
        BEGIN
            SET @Message = 'Debe haber un conductor por cada carro';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 2. Validar que el circuito existe y es válido
        IF NOT EXISTS (SELECT 1 FROM CIRCUIT WHERE Circuit_id = @Circuit_id)
        BEGIN
            SET @Message = 'Circuito no encontrado';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Validar circuito con dc
        DECLARE @Total_distance DECIMAL(10,2);
        DECLARE @N_Curves INT;
        
        SELECT 
            @Total_distance = Total_distance,
            @N_Curves = N_Curves
        FROM CIRCUIT
        WHERE Circuit_id = @Circuit_id;
        
        DECLARE @D_rectas DECIMAL(10,2);
        SET @D_rectas = @Total_distance - (@N_Curves * @dc);
        
        IF @D_rectas < 0
        BEGIN
            SET @Message = 'Circuito inválido para simulación: D_rectas < 0';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 3. Crear registro de simulación
        INSERT INTO SIMULATION (Circuit_id, Created_by_admin_id, Data_time)
        VALUES (@Circuit_id, @Admin_id, GETDATE());
        
        SET @Simulation_id = SCOPE_IDENTITY();
        
        -- 4. Tabla temporal para procesar carros
        CREATE TABLE #CarParticipants (
            ID INT IDENTITY(1,1),
            Car_id INT,
            Team_id INT,
            Driver_id INT,
            Driver_H INT,
            Total_P INT,
            Total_A INT,
            Total_M INT,
            V_recta DECIMAL(10,2),
            V_curva DECIMAL(10,2),
            Penalization DECIMAL(10,2),
            Time_seconds DECIMAL(10,2),
            Position INT NULL,
            IsValid BIT DEFAULT 0
        );
        
        -- 5. Procesar cada carro
        DECLARE @CurrentCar_id INT;
        DECLARE @CarCursor CURSOR;
        
        SET @CarCursor = CURSOR FOR
        SELECT value FROM STRING_SPLIT(@Car_ids, ',');
        
        OPEN @CarCursor;
        FETCH NEXT FROM @CarCursor INTO @CurrentCar_id;
        
        WHILE @@FETCH_STATUS = 0
        BEGIN
            -- Validar carro
            DECLARE @CarIsValid BIT;
            DECLARE @CarMessage NVARCHAR(500);
            DECLARE @Car_P INT, @Car_A INT, @Car_M INT;
            DECLARE @Team_id INT, @Driver_id INT, @Driver_H INT;
            
            EXEC sp_ValidateCarForSimulation 
                @Car_id = @CurrentCar_id,
                @IsValid = @CarIsValid OUTPUT,
                @Message = @CarMessage OUTPUT,
                @Total_P = @Car_P OUTPUT,
                @Total_A = @Car_A OUTPUT,
                @Total_M = @Car_M OUTPUT;
            
            IF @CarIsValid = 1
            BEGIN
                -- Obtener equipo y conductor
                SELECT TOP 1
                    @Team_id = c.Team_id,
                    @Driver_id = d.User_id,
                    @Driver_H = d.H
                FROM CAR c
                INNER JOIN DRIVER d ON c.Team_id = d.Team_id
                WHERE c.Car_id = @CurrentCar_id;
                
                -- Calcular tiempos
                DECLARE @V_recta DECIMAL(10,2), @V_curva DECIMAL(10,2);
                DECLARE @Penalization DECIMAL(10,2), @Time_seconds DECIMAL(10,2);
                DECLARE @CalcMessage NVARCHAR(500);
                
                EXEC sp_CalculateRaceTimes
                    @Circuit_id = @Circuit_id,
                    @Car_P = @Car_P,
                    @Car_A = @Car_A,
                    @Car_M = @Car_M,
                    @Driver_H = @Driver_H,
                    @dc = @dc,
                    @V_recta = @V_recta OUTPUT,
                    @V_curva = @V_curva OUTPUT,
                    @Penalization = @Penalization OUTPUT,
                    @Time_seconds = @Time_seconds OUTPUT,
                    @Message = @CalcMessage OUTPUT;
                
                -- Insertar en tabla temporal
                INSERT INTO #CarParticipants (
                    Car_id, Team_id, Driver_id, Driver_H,
                    Total_P, Total_A, Total_M,
                    V_recta, V_curva, Penalization, Time_seconds, IsValid
                ) VALUES (
                    @CurrentCar_id, @Team_id, @Driver_id, @Driver_H,
                    @Car_P, @Car_A, @Car_M,
                    @V_recta, @V_curva, @Penalization, @Time_seconds, 1
                );
            END
            ELSE
            BEGIN
                -- Carro inválido, registrar pero sin tiempos
                INSERT INTO #CarParticipants (Car_id, IsValid)
                VALUES (@CurrentCar_id, 0);
                
                PRINT 'Carro ' + CAST(@CurrentCar_id AS VARCHAR) + ' inválido: ' + @CarMessage;
            END
            
            FETCH NEXT FROM @CarCursor INTO @CurrentCar_id;
        END
        
        CLOSE @CarCursor;
        DEALLOCATE @CarCursor;
        
        -- 6. Verificar que al menos 2 carros sean válidos
        DECLARE @ValidCarCount INT;
        SELECT @ValidCarCount = COUNT(*) FROM #CarParticipants WHERE IsValid = 1;
        
        IF @ValidCarCount < 2
        BEGIN
            SET @Message = 'Se requieren al menos 2 carros válidos para la simulación';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- 7. Ordenar por tiempo y asignar posiciones
        ;WITH RankedCars AS (
            SELECT 
                *,
                ROW_NUMBER() OVER (ORDER BY Time_seconds ASC) AS RowPosition
            FROM #CarParticipants
            WHERE IsValid = 1
        )
        UPDATE cp
        SET cp.Position = rc.RowPosition
        FROM #CarParticipants cp
        INNER JOIN RankedCars rc ON cp.Car_id = rc.Car_id
        WHERE cp.IsValid = 1;
        
        -- 8. Insertar participantes en SIMULATION_PARTICIPANT
        INSERT INTO SIMULATION_PARTICIPANT (
            simulation_id, car_id, driver_id, team_id,
            position, time_seconds, v_recta, v_curva, penalty,
            setup_p, setup_a, setup_m, driver_h
        )
        SELECT 
            @Simulation_id,
            Car_id,
            Driver_id,
            Team_id,
            Position,
            Time_seconds,
            V_recta,
            V_curva,
            Penalization,
            Total_P,
            Total_A,
            Total_M,
            Driver_H
        FROM #CarParticipants
        WHERE IsValid = 1;
        
        -- 9. Guardar setup detallado por categoría
        DECLARE @SetupCar_id INT;
        DECLARE @SetupCursor CURSOR;
        
        SET @SetupCursor = CURSOR FOR
        SELECT Car_id FROM #CarParticipants WHERE IsValid = 1;
        
        OPEN @SetupCursor;
        FETCH NEXT FROM @SetupCursor INTO @SetupCar_id;
        
        WHILE @@FETCH_STATUS = 0
        BEGIN
            INSERT INTO SIMULATION_SETUP_DETAIL (
                simulation_id, car_id, category, part_id, part_p, part_a, part_m
            )
            SELECT 
                @Simulation_id,
                @SetupCar_id,
                cc.Part_Category,
                cc.Part_id,
                p.p,
                p.a,
                p.m
            FROM CAR_CONFIGURATION cc
            INNER JOIN PART p ON cc.Part_id = p.Part_id
            WHERE cc.Car_id = @SetupCar_id;
            
            FETCH NEXT FROM @SetupCursor INTO @SetupCar_id;
        END
        
        CLOSE @SetupCursor;
        DEALLOCATE @SetupCursor;
        
        -- 10. Limpiar tabla temporal
        DROP TABLE #CarParticipants;
        
        COMMIT TRANSACTION;
        
        SET @Success = 1;
        SET @Message = 'Simulación ejecutada exitosamente con ' + CAST(@ValidCarCount AS VARCHAR) + ' participantes';
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        SET @Success = 0;
        SET @Message = 'Error en simulación: ' + ERROR_MESSAGE();
        SET @Simulation_id = 0;
        
        -- Limpiar tabla temporal si existe
        IF OBJECT_ID('tempdb..#CarParticipants') IS NOT NULL
            DROP TABLE #CarParticipants;
    END CATCH;
END
GO

PRINT 'SP sp_RunSimulation creado';
GO

-- ============================================================================
-- SP: Obtener resultados de simulación
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_GetSimulationResults
    @Simulation_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Información de la simulación
    SELECT 
        s.Simulation_id,
        s.Data_time,
        c.Circuit_id,
        c.Name AS Circuit_Name,
        c.Total_distance,
        c.N_Curves,
        a.User_id AS Admin_id,
        u.Username AS Admin_Username
    FROM SIMULATION s
    INNER JOIN CIRCUIT c ON s.Circuit_id = c.Circuit_id
    INNER JOIN ADMIN a ON s.Created_by_admin_id = a.User_id
    INNER JOIN [USER] u ON a.User_id = u.User_id
    WHERE s.Simulation_id = @Simulation_id;
    
    -- Resultados de participantes
    SELECT 
        sp.position,
        sp.time_seconds,
        sp.v_recta,
        sp.v_curva,
        sp.penalty,
        sp.setup_p,
        sp.setup_a,
        sp.setup_m,
        sp.driver_h,
        c.Car_id,
        t.Team_id,
        t.Name AS Team_Name,
        d.User_id AS Driver_id,
        du.Username AS Driver_Username,
        d.H AS Driver_H
    FROM SIMULATION_PARTICIPANT sp
    INNER JOIN CAR c ON sp.car_id = c.Car_id
    INNER JOIN TEAM t ON sp.team_id = t.Team_id
    INNER JOIN DRIVER d ON sp.driver_id = d.User_id
    INNER JOIN [USER] du ON d.User_id = du.User_id
    WHERE sp.simulation_id = @Simulation_id
    ORDER BY sp.position;
    
    -- Setup detallado por categoría
    SELECT 
        ssd.category,
        ssd.part_id,
        p.Name AS Part_Name,
        ssd.part_p,
        ssd.part_a,
        ssd.part_m,
        ssd.car_id,
        t.Name AS Team_Name
    FROM SIMULATION_SETUP_DETAIL ssd
    INNER JOIN PART p ON ssd.part_id = p.Part_id
    INNER JOIN CAR c ON ssd.car_id = c.Car_id
    INNER JOIN TEAM t ON c.Team_id = t.Team_id
    WHERE ssd.simulation_id = @Simulation_id
    ORDER BY ssd.car_id, 
        CASE ssd.category
            WHEN 'Power_Unit' THEN 1
            WHEN 'Aerodynamics_pkg' THEN 2
            WHEN 'Wheels' THEN 3
            WHEN 'Suspension' THEN 4
            WHEN 'Gearbox' THEN 5
            ELSE 6
        END;
END
GO

PRINT 'SP sp_GetSimulationResults creado';
GO

-- ============================================================================
-- SP: Obtener historial de simulaciones
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_GetSimulationHistory
    @Limit INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit)
        s.Simulation_id,
        s.Data_time,
        c.Name AS Circuit_Name,
        c.Total_distance,
        c.N_Curves,
        COUNT(sp.car_id) AS Participant_Count,
        MIN(sp.time_seconds) AS Fastest_Time,
        u.Username AS Created_By
    FROM SIMULATION s
    INNER JOIN CIRCUIT c ON s.Circuit_id = c.Circuit_id
    INNER JOIN SIMULATION_PARTICIPANT sp ON s.Simulation_id = sp.simulation_id
    INNER JOIN ADMIN a ON s.Created_by_admin_id = a.User_id
    INNER JOIN [USER] u ON a.User_id = u.User_id
    GROUP BY s.Simulation_id, s.Data_time, c.Name, c.Total_distance, c.N_Curves, u.Username
    ORDER BY s.Data_time DESC;
END
GO

PRINT 'SP sp_GetSimulationHistory creado';
GO

-- ============================================================================
-- SP: Eliminar simulación (y datos relacionados)
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_DeleteSimulation
    @Simulation_id INT,
    @Admin_id INT,
    @Success BIT OUTPUT,
    @Message NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET @Success = 0;
    SET @Message = '';
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar que la simulación existe
        IF NOT EXISTS (SELECT 1 FROM SIMULATION WHERE Simulation_id = @Simulation_id)
        BEGIN
            SET @Message = 'Simulación no encontrada';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Verificar permisos (solo el admin que creó la simulación o admin general)
        DECLARE @CreatedByAdmin INT;
        SELECT @CreatedByAdmin = Created_by_admin_id 
        FROM SIMULATION 
        WHERE Simulation_id = @Simulation_id;
        
        IF @Admin_id != @CreatedByAdmin 
        AND NOT EXISTS (SELECT 1 FROM ADMIN WHERE User_id = @Admin_id)
        BEGIN
            SET @Message = 'No tiene permisos para eliminar esta simulación';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Eliminar datos relacionados (en orden correcto)
        DELETE FROM SIMULATION_SETUP_DETAIL WHERE simulation_id = @Simulation_id;
        DELETE FROM SIMULATION_PARTICIPANT WHERE simulation_id = @Simulation_id;
        DELETE FROM SIMULATION WHERE Simulation_id = @Simulation_id;
        
        COMMIT TRANSACTION;
        
        SET @Success = 1;
        SET @Message = 'Simulación eliminada exitosamente';
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        SET @Success = 0;
        SET @Message = 'Error al eliminar simulación: ' + ERROR_MESSAGE();
    END CATCH;
END
GO

PRINT 'SP sp_DeleteSimulation creado';
GO

-- ============================================================================
-- SP: Estadísticas de simulaciones por circuito
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_GetCircuitStatistics
    @Circuit_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Estadísticas generales del circuito
    SELECT 
        c.Circuit_id,
        c.Name AS Circuit_Name,
        c.Total_distance,
        c.N_Curves,
        COUNT(DISTINCT s.Simulation_id) AS Total_Simulations,
        COUNT(DISTINCT sp.car_id) AS Total_Cars_Simulated,
        AVG(sp.time_seconds) AS Average_Time,
        MIN(sp.time_seconds) AS Fastest_Time,
        MAX(sp.time_seconds) AS Slowest_Time
    FROM CIRCUIT c
    LEFT JOIN SIMULATION s ON c.Circuit_id = s.Circuit_id
    LEFT JOIN SIMULATION_PARTICIPANT sp ON s.Simulation_id = sp.simulation_id
    WHERE c.Circuit_id = @Circuit_id
    GROUP BY c.Circuit_id, c.Name, c.Total_distance, c.N_Curves;
    
    -- Top 5 tiempos más rápidos en este circuito
    SELECT TOP 5
        sp.position,
        sp.time_seconds,
        t.Name AS Team_Name,
        du.Username AS Driver_Name,
        sp.setup_p,
        sp.setup_a,
        sp.setup_m,
        sp.driver_h,
        s.Data_time
    FROM SIMULATION_PARTICIPANT sp
    INNER JOIN SIMULATION s ON sp.simulation_id = s.Simulation_id
    INNER JOIN CAR c ON sp.car_id = c.Car_id
    INNER JOIN TEAM t ON sp.team_id = t.Team_id
    INNER JOIN DRIVER d ON sp.driver_id = d.User_id
    INNER JOIN [USER] du ON d.User_id = du.User_id
    WHERE s.Circuit_id = @Circuit_id
    ORDER BY sp.time_seconds ASC;
END
GO

PRINT 'SP sp_GetCircuitStatistics creado';
GO

-- ============================================================================
-- SP: Obtener carros disponibles para simulación
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_GetAvailableCarsForSimulation
    @Team_id INT = NULL  -- NULL para todos los equipos
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        c.Car_id,
        t.Team_id,
        t.Name AS Team_Name,
        COUNT(DISTINCT cc.Part_Category) AS Installed_Categories,
        -- Obtener conductor del equipo
        d.User_id AS Driver_id,
        du.Username AS Driver_Name,
        d.H AS Driver_H,
        -- Calcular totales P, A, M
        SUM(p.p) AS Total_P,
        SUM(p.a) AS Total_A,
        SUM(p.m) AS Total_M
    FROM CAR c
    INNER JOIN TEAM t ON c.Team_id = t.Team_id
    LEFT JOIN CAR_CONFIGURATION cc ON c.Car_id = cc.Car_id
    LEFT JOIN PART p ON cc.Part_id = p.Part_id
    LEFT JOIN DRIVER d ON t.Team_id = d.Team_id
    LEFT JOIN [USER] du ON d.User_id = du.User_id
    WHERE c.isFinalized = 1
        AND (@Team_id IS NULL OR t.Team_id = @Team_id)
    GROUP BY c.Car_id, t.Team_id, t.Name, d.User_id, du.Username, d.H
    HAVING COUNT(DISTINCT cc.Part_Category) = 5  -- Solo carros completos
    ORDER BY t.Name, c.Car_id;
END
GO

PRINT 'SP sp_GetAvailableCarsForSimulation creado';
GO

-- ============================================================================
-- SP: Obtener detalles de un circuito para simulación
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_GetCircuitForSimulation
    @Circuit_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        Circuit_id,
        Name,
        Total_distance,
        N_Curves,
        -- Calcular distancias con dc = 0.5 (valor por defecto)
        (N_Curves * 0.5) AS Calculated_Curve_Distance,
        (Total_distance - (N_Curves * 0.5)) AS Calculated_Straight_Distance,
        -- Validación
        CASE 
            WHEN (Total_distance - (N_Curves * 0.5)) >= 0 THEN 1
            ELSE 0
        END AS IsValid,
        CASE 
            WHEN (Total_distance - (N_Curves * 0.5)) >= 0 
            THEN 'Circuito válido para simulación'
            ELSE 'Error: Las curvas ocupan más distancia que el total del circuito'
        END AS Message
    FROM CIRCUIT
    WHERE Circuit_id = @Circuit_id;
END
GO

PRINT 'SP sp_GetCircuitForSimulation creado';
GO

-- ============================================================================
-- SP: Obtener conductores por equipo
-- ============================================================================
CREATE OR ALTER PROCEDURE sp_GetDriversByTeam
    @Team_id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        d.User_id AS Driver_id,
        u.Username AS Driver_Name,
        d.H AS Driver_H,
        d.Team_id,
        t.Name AS Team_Name
    FROM DRIVER d
    INNER JOIN [USER] u ON d.User_id = u.User_id
    INNER JOIN TEAM t ON d.Team_id = t.Team_id
    WHERE d.Team_id = @Team_id
    ORDER BY u.Username;
END
GO

PRINT '============================================================================';
PRINT 'STORED PROCEDURES DE SIMULACIONES CREADOS EXITOSAMENTE';
PRINT '============================================================================';
GO