-- ============================================================================
-- F1 Garage Manager - Datos de Prueba (Población)
-- ============================================================================

USE F1GarageManager;
GO

PRINT 'Iniciando población de datos de prueba...';
GO

PRINT 'Limpiando datos existentes...';
GO

DELETE FROM SIMULATION_PARTICIPANT;
DELETE FROM SIMULATION_SETUP_DETAIL;
DELETE FROM SIMULATION;
DELETE FROM CAR_CONFIGURATION;
DELETE FROM CAR;
DELETE FROM INVENTORY_PART;
DELETE FROM INVENTORY;
DELETE FROM PURCHASE;
DELETE FROM CONTRIBUTION;
DELETE FROM DRIVER;
DELETE FROM ENGINEER;
DELETE FROM ADMIN;
DELETE FROM [USER];
DELETE FROM CIRCUIT;
DELETE FROM PART;
DELETE FROM TEAM;
DELETE FROM SPONSOR;
GO

PRINT 'Poblando circuitos...';
GO

INSERT INTO CIRCUIT (Name, Total_distance, N_Curves) VALUES
('Monza GP', 5.793, 11),
('Silverstone', 5.891, 18),
('Spa-Francorchamps', 7.004, 19),
('Suzuka', 5.807, 18);
GO

PRINT 'Circuitos creados: ' + CAST(@@ROWCOUNT AS VARCHAR);
GO

PRINT 'Poblando equipos...';
GO

INSERT INTO TEAM (Name, Total_Budget, Total_Spent) VALUES
('Red Bull Racing', 0, 0),
('Mercedes AMG', 0, 0),
('Ferrari', 0, 0),
('McLaren', 0, 0);
GO

PRINT 'Equipos creados: ' + CAST(@@ROWCOUNT AS VARCHAR);
GO

PRINT 'Poblando usuarios (conductores)...';
GO

INSERT INTO [USER] (Username, Salt, PasswordHash) VALUES
('max_verstappen', 'testsalt', 'password123'),
('lewis_hamilton', 'testsalt', 'password123'),
('charles_leclerc', 'testsalt', 'password123'),
('lando_norris', 'testsalt', 'password123'),

('admin1', 'adminsalt', 'password123'),
('admin2', 'adminsalt', 'password123');
GO

PRINT 'Usuarios creados: ' + CAST(@@ROWCOUNT AS VARCHAR);
GO

-- **CAMBIOS AQUÍ: Declarar variables antes de usarlas, SIN GO intermedio**
PRINT 'Poblando conductores...';
GO

-- Declarar todas las variables necesarias
DECLARE @max_verstappen_id INT, @lewis_hamilton_id INT, @charles_leclerc_id INT, @lando_norris_id INT;
DECLARE @redbull_id INT, @mercedes_id INT, @ferrari_id INT, @mclaren_id INT;

-- Asignar valores
SELECT @max_verstappen_id = User_id FROM [USER] WHERE Username = 'max_verstappen';
SELECT @lewis_hamilton_id = User_id FROM [USER] WHERE Username = 'lewis_hamilton';
SELECT @charles_leclerc_id = User_id FROM [USER] WHERE Username = 'charles_leclerc';
SELECT @lando_norris_id = User_id FROM [USER] WHERE Username = 'lando_norris';

SELECT @redbull_id = Team_id FROM TEAM WHERE Name = 'Red Bull Racing';
SELECT @mercedes_id = Team_id FROM TEAM WHERE Name = 'Mercedes AMG';
SELECT @ferrari_id = Team_id FROM TEAM WHERE Name = 'Ferrari';
SELECT @mclaren_id = Team_id FROM TEAM WHERE Name = 'McLaren';

-- Insertar conductores
INSERT INTO DRIVER (User_id, Team_id, H) VALUES
(@max_verstappen_id, @redbull_id, 95),
(@lewis_hamilton_id, @mercedes_id, 92),
(@charles_leclerc_id, @ferrari_id, 88),
(@lando_norris_id, @mclaren_id, 85);

PRINT 'Conductores creados: ' + CAST(@@ROWCOUNT AS VARCHAR);
GO

PRINT 'Poblando admins...';
GO

DECLARE @admin1_id INT, @admin2_id INT;
SELECT @admin1_id = User_id FROM [USER] WHERE Username = 'admin1';
SELECT @admin2_id = User_id FROM [USER] WHERE Username = 'admin2';

INSERT INTO ADMIN (User_id) VALUES
(@admin1_id),
(@admin2_id);

PRINT 'Admins creados: ' + CAST(@@ROWCOUNT AS VARCHAR);
GO

PRINT 'Poblando patrocinadores...';
GO

INSERT INTO SPONSOR (Name, Industry, Country) VALUES
('Red Bull Energy', 'Bebidas Energéticas', 'Austria'),
('Mercedes-Benz', 'Automotriz', 'Alemania'),
('Scuderia Ferrari', 'Automotriz', 'Italia'),
('McLaren Group', 'Tecnología y Automotriz', 'Reino Unido');
GO

PRINT 'Patrocinadores creados: ' + CAST(@@ROWCOUNT AS VARCHAR);
GO

PRINT 'Poblando aportes de patrocinadores...';
GO

DECLARE @redbull_id INT, @mercedes_id INT, @ferrari_id INT, @mclaren_id INT;

SELECT @redbull_id = Team_id FROM TEAM WHERE Name = 'Red Bull Racing';
SELECT @mercedes_id = Team_id FROM TEAM WHERE Name = 'Mercedes AMG';
SELECT @ferrari_id = Team_id FROM TEAM WHERE Name = 'Ferrari';
SELECT @mclaren_id = Team_id FROM TEAM WHERE Name = 'McLaren';

IF @redbull_id IS NULL OR @mercedes_id IS NULL OR @ferrari_id IS NULL OR @mclaren_id IS NULL
BEGIN
    PRINT 'ERROR: No se pudieron encontrar todos los equipos';
    RETURN;
END

DECLARE @sponsor_rb_id INT, @sponsor_merc_id INT, @sponsor_ferr_id INT, @sponsor_mcl_id INT;

SELECT @sponsor_rb_id = Sponsor_id FROM SPONSOR WHERE Name = 'Red Bull Energy';
SELECT @sponsor_merc_id = Sponsor_id FROM SPONSOR WHERE Name = 'Mercedes-Benz';
SELECT @sponsor_ferr_id = Sponsor_id FROM SPONSOR WHERE Name = 'Scuderia Ferrari';
SELECT @sponsor_mcl_id = Sponsor_id FROM SPONSOR WHERE Name = 'McLaren Group';

IF @sponsor_rb_id IS NULL 
    PRINT 'ADVERTENCIA: No se encontró patrocinador "Red Bull Energy"';
IF @sponsor_merc_id IS NULL 
    PRINT 'ADVERTENCIA: No se encontró patrocinador "Mercedes-Benz"';
IF @sponsor_ferr_id IS NULL 
    PRINT 'ADVERTENCIA: No se encontró patrocinador "Scuderia Ferrari"';
IF @sponsor_mcl_id IS NULL 
    PRINT 'ADVERTENCIA: No se encontró patrocinador "McLaren Group"';

BEGIN TRY
    INSERT INTO CONTRIBUTION (Sponsor_id, Team_id, Date, Amount, Description) VALUES
    (@sponsor_rb_id, @redbull_id, '2025-12-01', 200000, 'Aporte inicial de patrocinio'),
    (@sponsor_merc_id, @mercedes_id, '2025-12-01', 250000, 'Aporte inicial de patrocinio'),
    (@sponsor_ferr_id, @ferrari_id, '2025-12-01', 180000, 'Aporte inicial de patrocinio'),
    (@sponsor_mcl_id, @mclaren_id, '2025-12-01', 150000, 'Aporte inicial de patrocinio');
    
    PRINT 'Aportes insertados: ' + CAST(@@ROWCOUNT AS VARCHAR);
    
    UPDATE TEAM 
    SET Total_Budget = 
        CASE Team_id
            WHEN @redbull_id THEN 200000
            WHEN @mercedes_id THEN 250000
            WHEN @ferrari_id THEN 180000
            WHEN @mclaren_id THEN 150000
            ELSE Total_Budget
        END
    WHERE Team_id IN (@redbull_id, @mercedes_id, @ferrari_id, @mclaren_id);
    
    PRINT 'Presupuestos actualizados exitosamente';
    
END TRY
BEGIN CATCH
    PRINT 'ERROR al insertar contribuciones: ' + ERROR_MESSAGE();
END CATCH;
GO

PRINT 'Aportes creados y presupuestos actualizados';
GO

PRINT 'Poblando partes (catálogo de tienda)...';
GO

INSERT INTO PART (Name, Category, Price, Stock, p, a, m) VALUES
('Motor V6 Turbo Híbrido Estándar', 'Power_Unit', 50000, 10, 6, 2, 3),
('Motor V6 Turbo Híbrido Avanzado', 'Power_Unit', 75000, 8, 8, 3, 4),
('Motor V6 Turbo Híbrido Premium', 'Power_Unit', 100000, 5, 9, 4, 5);

INSERT INTO PART (Name, Category, Price, Stock, p, a, m) VALUES
('Alerón Trasero Estándar', 'Aerodynamics_pkg', 30000, 12, 1, 5, 2),
('Alerón Trasero Avanzado', 'Aerodynamics_pkg', 45000, 10, 2, 7, 3),
('Alerón Trasero Premium', 'Aerodynamics_pkg', 60000, 8, 3, 9, 4);

INSERT INTO PART (Name, Category, Price, Stock, p, a, m) VALUES
('Neumáticos Duros', 'Wheels', 15000, 20, 2, 3, 6),
('Neumáticos Medios', 'Wheels', 20000, 18, 3, 4, 7),
('Neumáticos Suaves', 'Wheels', 25000, 15, 4, 5, 8);

INSERT INTO PART (Name, Category, Price, Stock, p, a, m) VALUES
('Suspensión Estándar', 'Suspension', 25000, 15, 1, 2, 5),
('Suspensión Avanzada', 'Suspension', 35000, 12, 2, 3, 7),
('Suspensión Premium', 'Suspension', 50000, 10, 3, 4, 9);

INSERT INTO PART (Name, Category, Price, Stock, p, a, m) VALUES
('Caja de Cambios Manual', 'Gearbox', 20000, 18, 3, 1, 4),
('Caja de Cambios Semi-Automática', 'Gearbox', 30000, 15, 5, 2, 6),
('Caja de Cambios Automática Avanzada', 'Gearbox', 40000, 12, 7, 3, 8);
GO

PRINT 'Partes creadas: ' + CAST(@@ROWCOUNT AS VARCHAR);
GO

PRINT 'Creando inventarios para equipos...';
GO

INSERT INTO INVENTORY (Team_id) 
SELECT Team_id FROM TEAM;
GO

PRINT 'Inventarios creados: ' + CAST(@@ROWCOUNT AS VARCHAR);
GO

PRINT 'Creando carros básicos para equipos...';
GO

INSERT INTO CAR (Team_id, isFinalized)
SELECT Team_id, 0 FROM TEAM
CROSS JOIN (SELECT 1 AS n UNION SELECT 2) AS numbers;
GO

PRINT 'Carros básicos creados: ' + CAST(@@ROWCOUNT AS VARCHAR);
GO

PRINT '';
PRINT '============================================================================';
PRINT 'RESUMEN DE DATOS POBLADOS:';
PRINT '============================================================================';

DECLARE @CircuitCount INT, @TeamCount INT, @UserCount INT, @DriverCount INT;
DECLARE @AdminCount INT, @SponsorCount INT, @ContributionCount INT, @PartCount INT;
DECLARE @InventoryCount INT, @CarCount INT;

SELECT @CircuitCount = COUNT(*) FROM CIRCUIT;
SELECT @TeamCount = COUNT(*) FROM TEAM;
SELECT @UserCount = COUNT(*) FROM [USER];
SELECT @DriverCount = COUNT(*) FROM DRIVER;
SELECT @AdminCount = COUNT(*) FROM ADMIN;
SELECT @SponsorCount = COUNT(*) FROM SPONSOR;
SELECT @ContributionCount = COUNT(*) FROM CONTRIBUTION;
SELECT @PartCount = COUNT(*) FROM PART;
SELECT @InventoryCount = COUNT(*) FROM INVENTORY;
SELECT @CarCount = COUNT(*) FROM CAR;

PRINT 'Circuitos: ' + CAST(@CircuitCount AS VARCHAR);
PRINT 'Equipos: ' + CAST(@TeamCount AS VARCHAR);
PRINT 'Usuarios: ' + CAST(@UserCount AS VARCHAR);
PRINT 'Conductores: ' + CAST(@DriverCount AS VARCHAR);
PRINT 'Admins: ' + CAST(@AdminCount AS VARCHAR);
PRINT 'Patrocinadores: ' + CAST(@SponsorCount AS VARCHAR);
PRINT 'Aportes: ' + CAST(@ContributionCount AS VARCHAR);
PRINT 'Partes: ' + CAST(@PartCount AS VARCHAR);
PRINT 'Inventarios: ' + CAST(@InventoryCount AS VARCHAR);
PRINT 'Carros: ' + CAST(@CarCount AS VARCHAR);
GO
