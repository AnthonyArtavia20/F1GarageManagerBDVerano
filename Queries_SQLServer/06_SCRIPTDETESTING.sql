-- ============================================================================
-- SCRIPT PARA CONSULTAR Y POBLAR DATOS DE PRUEBA - CORREGIDO
-- F1 Garage Manager - Grupo 3/C
-- ============================================================================

USE F1GarageManager;
GO

PRINT '============================================================================';
PRINT 'INSERTANDO DATOS DE PRUEBA';
PRINT '============================================================================';
GO

-- ============================================================================
-- 1. INSERTAR SPONSORS
-- ============================================================================
PRINT 'Insertando Sponsors...';

INSERT INTO SPONSOR (Name, Industry, Country) VALUES
('Red Bull', 'Energy Drinks', 'Austria'),
('Petronas', 'Oil & Gas', 'Malaysia'),
('Shell', 'Oil & Gas', 'Netherlands'),
('Rolex', 'Luxury Watches', 'Switzerland'),
('Pirelli', 'Tires', 'Italy'),
('DHL', 'Logistics', 'Germany'),
('Aramco', 'Oil & Gas', 'Saudi Arabia'),
('Emirates', 'Airlines', 'UAE');
GO
PRINT 'Sponsors insertados: 8';
GO

-- ============================================================================
-- 2. INSERTAR EQUIPOS
-- ============================================================================
PRINT 'Insertando Equipos...';

INSERT INTO TEAM (Name, Total_Budget, Total_Spent) VALUES
('Mercedes-AMG', 0, 0),
('Red Bull Racing', 0, 0),
('Ferrari', 0, 0),
('McLaren', 0, 0),
('Aston Martin', 0, 0);
GO
PRINT 'Equipos insertados: 5';
GO

-- ============================================================================
-- 3. INSERTAR APORTES DE SPONSORS A EQUIPOS
-- ============================================================================
PRINT 'Insertando Aportes (Contributions)...';

INSERT INTO CONTRIBUTION (Sponsor_id, Team_id, Amount, Date, Description) VALUES
-- Red Bull Racing
(1, 2, 5000000.00, GETDATE(), 'Aporte inicial temporada 2024'),
(1, 2, 2000000.00, DATEADD(DAY, -30, GETDATE()), 'Bonus por rendimiento'),
(3, 2, 1500000.00, DATEADD(DAY, -45, GETDATE()), 'Patrocinio Shell'),
-- Mercedes
(2, 1, 6000000.00, GETDATE(), 'Patrocinio principal Petronas'),
(4, 1, 1000000.00, DATEADD(DAY, -20, GETDATE()), 'Patrocinio Rolex'),
(6, 1, 800000.00, DATEADD(DAY, -35, GETDATE()), 'Patrocinio DHL'),
-- Ferrari
(3, 3, 4500000.00, GETDATE(), 'Patrocinio Shell'),
(5, 3, 2000000.00, DATEADD(DAY, -15, GETDATE()), 'Patrocinio Pirelli'),
(7, 3, 3000000.00, DATEADD(DAY, -40, GETDATE()), 'Patrocinio Aramco'),
-- McLaren
(8, 4, 3500000.00, GETDATE(), 'Patrocinio Emirates'),
(1, 4, 1000000.00, DATEADD(DAY, -25, GETDATE()), 'Patrocinio adicional Red Bull'),
-- Aston Martin
(7, 5, 5000000.00, GETDATE(), 'Patrocinio principal Aramco'),
(4, 5, 1200000.00, DATEADD(DAY, -30, GETDATE()), 'Patrocinio Rolex');
GO
PRINT 'Aportes insertados: 13';
GO

-- Actualizar presupuestos de equipos
PRINT 'Actualizando presupuestos de equipos...';
UPDATE TEAM
SET Total_Budget = (SELECT ISNULL(SUM(Amount), 0) FROM CONTRIBUTION WHERE Team_id = TEAM.Team_id);
GO

-- ============================================================================
-- 4. INSERTAR PARTES - CORREGIDO CON COLUMNA NAME
-- ============================================================================
PRINT 'Insertando Partes al catálogo...';

INSERT INTO PART (Name, Category, Price, Stock, p, a, m) VALUES
-- Power Units
('Mercedes M15 E Performance', 'Power_Unit', 1000000.00, 5, 9, 3, 2),
('Honda RA272E', 'Power_Unit', 800000.00, 8, 7, 4, 3),
('Ferrari 066/11', 'Power_Unit', 1200000.00, 3, 9, 2, 1),

-- Aerodynamics Packages
('Low Drag Rear Wing', 'Aerodynamics_pkg', 500000.00, 10, 2, 9, 4),
('High Downforce Front Wing', 'Aerodynamics_pkg', 300000.00, 15, 1, 7, 5),
('DRS Optimized Package', 'Aerodynamics_pkg', 700000.00, 7, 3, 9, 3),

-- Wheels
('Pirelli P Zero Soft', 'Wheels', 200000.00, 20, 3, 4, 8),
('Pirelli P Zero Medium', 'Wheels', 150000.00, 25, 2, 3, 7),
('Pirelli P Zero Hard', 'Wheels', 250000.00, 15, 4, 5, 9),

-- Suspension
('Active Suspension Pro', 'Suspension', 400000.00, 12, 2, 5, 9),
('Adaptive Dampers', 'Suspension', 250000.00, 18, 1, 4, 8),
('Multi-Link Rear Suspension', 'Suspension', 500000.00, 8, 3, 6, 9),

-- Gearbox
('8-Speed Sequential', 'Gearbox', 350000.00, 10, 4, 3, 6),
('7-Speed Dual Clutch', 'Gearbox', 200000.00, 15, 3, 2, 7),
('Hybrid Gearbox System', 'Gearbox', 450000.00, 6, 5, 4, 8);
GO
PRINT 'Partes insertadas: 15';
GO

-- ============================================================================
-- 5. INSERTAR CIRCUITOS
-- ============================================================================
PRINT 'Insertando Circuitos...';

INSERT INTO CIRCUIT (Name, Total_distance, N_Curves) VALUES
('Monza', 5.793, 11),
('Silverstone', 5.891, 18),
('Suzuka', 5.807, 18),
('Circuit de Monaco', 3.337, 19),
('Spa-Francorchamps', 7.004, 19),
('Interlagos', 4.309, 15),
('Circuit of the Americas', 5.513, 20);
GO
PRINT 'Circuitos insertados: 7';
GO

-- ============================================================================
-- 6. INSERTAR USUARIOS - CORREGIDO: Solo Username, Salt, PasswordHash
-- ============================================================================
PRINT 'Insertando Usuarios...';

-- Admin
INSERT INTO [USER] (Username, Salt, PasswordHash) VALUES
('admin', 'salt123', 'hash123');

-- Engineers para cada equipo
INSERT INTO [USER] (Username, Salt, PasswordHash) VALUES
('engineer_mercedes', 'salt123', 'hash123'),
('engineer_redbull', 'salt123', 'hash123'),
('engineer_ferrari', 'salt123', 'hash123'),
('engineer_mclaren', 'salt123', 'hash123'),
('engineer_astonmartin', 'salt123', 'hash123');

-- Drivers (2 por equipo = 10 drivers)
INSERT INTO [USER] (Username, Salt, PasswordHash) VALUES
('hamilton', 'salt123', 'hash123'),
('russell', 'salt123', 'hash123'),
('verstappen', 'salt123', 'hash123'),
('perez', 'salt123', 'hash123'),
('leclerc', 'salt123', 'hash123'),
('sainz', 'salt123', 'hash123'),
('norris', 'salt123', 'hash123'),
('piastri', 'salt123', 'hash123'),
('alonso', 'salt123', 'hash123'),
('stroll', 'salt123', 'hash123');
GO
PRINT 'Usuarios insertados: 16';
GO

-- ============================================================================
-- 7. INSERTAR ADMIN
-- ============================================================================
PRINT 'Insertando Admin...';

DECLARE @AdminUserId INT = (SELECT User_id FROM [USER] WHERE Username = 'admin');

INSERT INTO ADMIN (User_id) VALUES (@AdminUserId);
GO
PRINT 'Admin insertado: 1';
GO

-- ============================================================================
-- 8. INSERTAR ENGINEERS Y ASIGNAR A EQUIPOS - CORREGIDO: Sin Specialty
-- ============================================================================
PRINT 'Insertando Engineers...';

DECLARE @MercedesEngineer INT = (SELECT User_id FROM [USER] WHERE Username = 'engineer_mercedes');
DECLARE @RedBullEngineer INT = (SELECT User_id FROM [USER] WHERE Username = 'engineer_redbull');
DECLARE @FerrariEngineer INT = (SELECT User_id FROM [USER] WHERE Username = 'engineer_ferrari');
DECLARE @McLarenEngineer INT = (SELECT User_id FROM [USER] WHERE Username = 'engineer_mclaren');
DECLARE @AstonEngineer INT = (SELECT User_id FROM [USER] WHERE Username = 'engineer_astonmartin');

INSERT INTO ENGINEER (User_id, Team_id) VALUES
(@MercedesEngineer, 1),
(@RedBullEngineer, 2),
(@FerrariEngineer, 3),
(@McLarenEngineer, 4),
(@AstonEngineer, 5);
GO
PRINT 'Engineers insertados: 5';
GO

-- ============================================================================
-- 9. INSERTAR DRIVERS - CORREGIDO: Solo User_id, Team_id, H
-- ============================================================================
PRINT 'Insertando Drivers...';

-- Mercedes Drivers
DECLARE @Hamilton INT = (SELECT User_id FROM [USER] WHERE Username = 'hamilton');
DECLARE @Russell INT = (SELECT User_id FROM [USER] WHERE Username = 'russell');
INSERT INTO DRIVER (User_id, Team_id, H) VALUES (@Hamilton, 1, 95), (@Russell, 1, 88);

-- Red Bull Drivers
DECLARE @Verstappen INT = (SELECT User_id FROM [USER] WHERE Username = 'verstappen');
DECLARE @Perez INT = (SELECT User_id FROM [USER] WHERE Username = 'perez');
INSERT INTO DRIVER (User_id, Team_id, H) VALUES (@Verstappen, 2, 98), (@Perez, 2, 85);

-- Ferrari Drivers
DECLARE @Leclerc INT = (SELECT User_id FROM [USER] WHERE Username = 'leclerc');
DECLARE @Sainz INT = (SELECT User_id FROM [USER] WHERE Username = 'sainz');
INSERT INTO DRIVER (User_id, Team_id, H) VALUES (@Leclerc, 3, 92), (@Sainz, 3, 87);

-- McLaren Drivers
DECLARE @Norris INT = (SELECT User_id FROM [USER] WHERE Username = 'norris');
DECLARE @Piastri INT = (SELECT User_id FROM [USER] WHERE Username = 'piastri');
INSERT INTO DRIVER (User_id, Team_id, H) VALUES (@Norris, 4, 90), (@Piastri, 4, 83);

-- Aston Martin Drivers
DECLARE @Alonso INT = (SELECT User_id FROM [USER] WHERE Username = 'alonso');
DECLARE @Stroll INT = (SELECT User_id FROM [USER] WHERE Username = 'stroll');
INSERT INTO DRIVER (User_id, Team_id, H) VALUES (@Alonso, 5, 94), (@Stroll, 5, 80);
GO
PRINT 'Drivers insertados: 10';
GO

-- ============================================================================
-- 10. INSERTAR CARROS PARA CADA EQUIPO
-- ============================================================================
PRINT 'Insertando Carros...';

INSERT INTO CAR (Team_id, isFinalized) VALUES
-- Mercedes (2 carros)
(1, 0), (1, 0),
-- Red Bull (2 carros)
(2, 0), (2, 0),
-- Ferrari (2 carros)
(3, 0), (3, 0),
-- McLaren (2 carros)
(4, 0), (4, 0),
-- Aston Martin (2 carros)
(5, 0), (5, 0);
GO
PRINT 'Carros insertados: 10';
GO

-- ============================================================================
-- 11. CREAR INVENTARIOS PARA CADA EQUIPO
-- ============================================================================
PRINT 'Creando Inventarios para equipos...';

INSERT INTO INVENTORY (Team_id) VALUES (1), (2), (3), (4), (5);
GO
PRINT 'Inventarios creados: 5';
GO

-- ============================================================================
-- 12. AGREGAR ALGUNAS PARTES AL INVENTARIO DE EQUIPOS (OPCIONAL)
-- ============================================================================
-- PRINT 'Agregando partes a inventarios...';
-- 
-- -- Mercedes recibe algunas partes
-- DECLARE @MercedesInv INT = (SELECT Inventory_id FROM INVENTORY WHERE Team_id = 1);
-- INSERT INTO INVENTORY_PART (Inventory_id, Part_id, Quantity) VALUES
-- (@MercedesInv, 1, 2),  -- Power Unit
-- (@MercedesInv, 4, 3),  -- Aero
-- (@MercedesInv, 7, 4);  -- Wheels
-- 
-- -- Red Bull recibe algunas partes
-- DECLARE @RedBullInv INT = (SELECT Inventory_id FROM INVENTORY WHERE Team_id = 2);
-- INSERT INTO INVENTORY_PART (Inventory_id, Part_id, Quantity) VALUES
-- (@RedBullInv, 2, 2),
-- (@RedBullInv, 5, 2),
-- (@RedBullInv, 8, 3);
-- GO
-- PRINT 'Partes agregadas a inventarios';
-- GO
-- 
-- PRINT '';
-- PRINT '============================================================================';
-- PRINT 'DATOS DE PRUEBA INSERTADOS EXITOSAMENTE';
-- PRINT '============================================================================';
-- PRINT 'Resumen:';
-- PRINT '- Sponsors: 8';
-- PRINT '- Equipos: 5';
-- PRINT '- Aportes: 13 (con presupuestos asignados)';
-- PRINT '- Partes: 15 (3 de cada categoría)';
-- PRINT '- Circuitos: 7';
-- PRINT '- Usuarios: 16 (1 admin + 5 engineers + 10 drivers)';
-- PRINT '- Admin: 1';
-- PRINT '- Engineers: 5';
-- PRINT '- Drivers: 10';
-- PRINT '- Carros: 10 (2 por equipo)';
-- PRINT '- Inventarios: 5 (1 por equipo)';
-- GO

-- ============================================================================
-- CONSULTAS DE VERIFICACIÓN
-- ============================================================================

PRINT '============================================================================';
PRINT 'CONSULTAS DE VERIFICACIÓN';
PRINT '============================================================================';
GO

-- 1. Sponsors
PRINT '1. LISTA DE TODOS LOS SPONSORS';
SELECT Sponsor_id, Name, Industry, Country FROM SPONSOR ORDER BY Name;
GO

-- 2. Sponsors con estadísticas
PRINT '2. SPONSORS CON ESTADÍSTICAS DE APORTES';
SELECT s.Sponsor_id, s.Name, COUNT(c.Contribution_id) AS Total_Aportes,
       ISNULL(SUM(c.Amount), 0) AS Monto_Total
FROM SPONSOR s
LEFT JOIN CONTRIBUTION c ON s.Sponsor_id = c.Sponsor_id
GROUP BY s.Sponsor_id, s.Name
ORDER BY Monto_Total DESC;
GO

-- 3. Equipos con presupuesto
PRINT '3. EQUIPOS CON PRESUPUESTO';
SELECT Team_id, Name, Total_Budget, Total_Spent, 
       (Total_Budget - Total_Spent) AS Available_Budget
FROM TEAM
ORDER BY Name;
GO

-- 4. Catálogo de partes
PRINT '4. CATÁLOGO DE PARTES DISPONIBLES';
SELECT Part_id, Name, Category, Price, Stock, p, a, m
FROM PART
ORDER BY Category, Part_id;
GO

-- 5. Inventarios
PRINT '5. INVENTARIOS POR EQUIPO';
SELECT t.Name AS Team, p.Name AS Part, p.Category, ip.Quantity
FROM INVENTORY i
JOIN TEAM t ON i.Team_id = t.Team_id
JOIN INVENTORY_PART ip ON i.Inventory_id = ip.Inventory_id
JOIN PART p ON ip.Part_id = p.Part_id
ORDER BY t.Name, p.Category;
GO

PRINT '';
PRINT '============================================================================';
PRINT 'SCRIPT DE TESTING COMPLETADO';
PRINT '============================================================================';
GO