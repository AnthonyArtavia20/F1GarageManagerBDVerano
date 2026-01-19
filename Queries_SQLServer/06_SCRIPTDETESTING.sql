-- ============================================================================
-- SCRIPT PARA CONSULTAR Y POBLAR DATOS DE PRUEBA - CON INVENTARIOS VACÍOS
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
('Emirates', 'Airlines', 'UAE'),
('Honda', 'Automotive', 'Japan'),
('Mercedes-Benz', 'Automotive', 'Germany'),
('Ferrari', 'Automotive', 'Italy'),
('McLaren', 'Automotive', 'UK'),
('Crypto.com', 'Cryptocurrency', 'Singapore');
GO
PRINT 'Sponsors insertados: ' + CAST(@@ROWCOUNT AS VARCHAR);
GO

-- ============================================================================
-- 2. INSERTAR EQUIPOS
-- ============================================================================
PRINT 'Insertando Equipos...';

INSERT INTO TEAM (Name, Total_Budget, Total_Spent) VALUES
('Mercedes-AMG Petronas', 0, 0),
('Red Bull Racing', 0, 0),
('Scuderia Ferrari', 0, 0),
('McLaren F1 Team', 0, 0),
('Aston Martin Aramco', 0, 0),
('Alpine F1 Team', 0, 0),
('Williams Racing', 0, 0);
GO
PRINT 'Equipos insertados: ' + CAST(@@ROWCOUNT AS VARCHAR);
GO

-- ============================================================================
-- 3. INSERTAR APORTES DE SPONSORS A EQUIPOS
-- ============================================================================
PRINT 'Insertando Aportes (Contributions)...';

INSERT INTO CONTRIBUTION (Sponsor_id, Team_id, Amount, Date, Description) VALUES
-- Mercedes-AMG Petronas
(2, 1, 10000000.00, GETDATE(), 'Patrocinio principal temporada 2024'),
(10, 1, 5000000.00, DATEADD(DAY, -30, GETDATE()), 'Patrocinio tecnológico'),
(4, 1, 2000000.00, DATEADD(DAY, -20, GETDATE()), 'Patrocinio oficial de tiempo'),
-- Red Bull Racing
(1, 2, 15000000.00, GETDATE(), 'Patrocinio principal'),
(3, 2, 8000000.00, DATEADD(DAY, -45, GETDATE()), 'Patrocinio combustible'),
(9, 2, 6000000.00, DATEADD(DAY, -60, GETDATE()), 'Motor y desarrollo'),
-- Scuderia Ferrari
(11, 3, 12000000.00, GETDATE(), 'Patrocinio principal'),
(7, 3, 7000000.00, DATEADD(DAY, -15, GETDATE()), 'Patrocinio energético'),
(5, 3, 3000000.00, DATEADD(DAY, -40, GETDATE()), 'Patrocinio neumáticos'),
-- McLaren F1 Team
(12, 4, 9000000.00, GETDATE(), 'Patrocinio principal'),
(8, 4, 5000000.00, DATEADD(DAY, -25, GETDATE()), 'Patrocinio aerolínea'),
(13, 4, 4000000.00, DATEADD(DAY, -35, GETDATE()), 'Patrocinio tecnología'),
-- Aston Martin Aramco
(7, 5, 11000000.00, GETDATE(), 'Patrocinio principal'),
(4, 5, 2500000.00, DATEADD(DAY, -30, GETDATE()), 'Patrocinio tiempo'),
-- Alpine F1 Team
(8, 6, 6000000.00, GETDATE(), 'Patrocinio principal'),
-- Williams Racing
(6, 7, 4000000.00, GETDATE(), 'Patrocinio logística');
GO
PRINT 'Aportes insertados: ' + CAST(@@ROWCOUNT AS VARCHAR);
GO

-- Actualizar presupuestos de equipos
PRINT 'Actualizando presupuestos de equipos...';
UPDATE TEAM
SET Total_Budget = (SELECT ISNULL(SUM(Amount), 0) FROM CONTRIBUTION WHERE Team_id = TEAM.Team_id);
GO

-- ============================================================================
-- 4. INSERTAR PARTES - CATÁLOGO COMPLETO
-- ============================================================================
PRINT 'Insertando Partes al catálogo...';

INSERT INTO PART (Name, Category, Price, Stock, p, a, m) VALUES
-- Power Units (9-10 unidades cada una)
('Mercedes-AMG M15 E Performance', 'Power_Unit', 1200000.00, 10, 9, 3, 2),
('Honda RA624H Hybrid', 'Power_Unit', 1100000.00, 12, 8, 4, 3),
('Ferrari 066/12', 'Power_Unit', 1250000.00, 8, 9, 2, 1),
('Renault E-Tech RE24', 'Power_Unit', 950000.00, 15, 7, 3, 4),
('Audi V6 Hybrid', 'Power_Unit', 1050000.00, 6, 8, 3, 3),

-- Aerodynamics Packages (15-20 unidades cada una)
('Low Drag Monza Spec', 'Aerodynamics_pkg', 550000.00, 20, 2, 9, 4),
('High Downforce Monaco Spec', 'Aerodynamics_pkg', 650000.00, 18, 1, 8, 5),
('DRS Plus System', 'Aerodynamics_pkg', 750000.00, 12, 3, 9, 3),
('Spa High Efficiency Wing', 'Aerodynamics_pkg', 600000.00, 16, 2, 8, 4),
('Silverstone Spec Package', 'Aerodynamics_pkg', 500000.00, 22, 1, 7, 6),

-- Wheels (20-30 unidades cada una)
('Pirelli P Zero Soft (C3)', 'Wheels', 220000.00, 30, 3, 4, 8),
('Pirelli P Zero Medium (C2)', 'Wheels', 180000.00, 35, 2, 3, 7),
('Pirelli P Zero Hard (C1)', 'Wheels', 280000.00, 25, 4, 5, 9),
('Pirelli Intermediates', 'Wheels', 320000.00, 20, 2, 6, 6),
('Pirelli Full Wets', 'Wheels', 350000.00, 15, 1, 7, 5),

-- Suspension (12-18 unidades cada una)
('Active Suspension Pro 2024', 'Suspension', 450000.00, 15, 2, 5, 9),
('Adaptive Dampers Pro', 'Suspension', 380000.00, 20, 1, 4, 8),
('Multi-Link Rear System', 'Suspension', 550000.00, 12, 3, 6, 9),
('Hydraulic Anti-Roll System', 'Suspension', 480000.00, 14, 2, 5, 8),
('Carbon Fiber Suspension', 'Suspension', 620000.00, 10, 3, 6, 9),

-- Gearbox (10-15 unidades cada una)
('8-Speed Sequential Pro', 'Gearbox', 420000.00, 15, 4, 3, 6),
('7-Speed Dual Clutch Plus', 'Gearbox', 350000.00, 18, 3, 2, 7),
('Hybrid Gearbox System V2', 'Gearbox', 520000.00, 12, 5, 4, 8),
('Quick Shift Gearbox', 'Gearbox', 480000.00, 14, 4, 3, 7),
('Seamless Shift Gearbox', 'Gearbox', 580000.00, 10, 5, 4, 8);
GO
PRINT 'Partes insertadas: ' + CAST(@@ROWCOUNT AS VARCHAR);
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
('Circuit of the Americas', 5.513, 20),
('Bahrain International', 5.412, 15),
('Yas Marina', 5.281, 16),
('Hungaroring', 4.381, 14);
GO
PRINT 'Circuitos insertados: ' + CAST(@@ROWCOUNT AS VARCHAR);
GO

-- ============================================================================
-- 6. INSERTAR USUARIOS
-- ============================================================================
PRINT 'Insertando Usuarios...';

-- Admin (1)
INSERT INTO [USER] (Username, Salt, PasswordHash) VALUES
('admin', 'salt123', 'hash123');

-- Engineers (1 por equipo = 7)
INSERT INTO [USER] (Username, Salt, PasswordHash) VALUES
('engineer_mercedes', 'salt123', 'hash123'),
('engineer_redbull', 'salt123', 'hash123'),
('engineer_ferrari', 'salt123', 'hash123'),
('engineer_mclaren', 'salt123', 'hash123'),
('engineer_astonmartin', 'salt123', 'hash123'),
('engineer_alpine', 'salt123', 'hash123'),
('engineer_williams', 'salt123', 'hash123');

-- Drivers (2 por equipo = 14 drivers)
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
('stroll', 'salt123', 'hash123'),
('gasly', 'salt123', 'hash123'),
('ocon', 'salt123', 'hash123'),
('albon', 'salt123', 'hash123'),
('sargeant', 'salt123', 'hash123');
GO
PRINT 'Usuarios insertados: ' + CAST(@@ROWCOUNT AS VARCHAR);
GO

-- ============================================================================
-- 7. INSERTAR ADMIN
-- ============================================================================
PRINT 'Insertando Admin...';

INSERT INTO ADMIN (User_id) 
SELECT User_id FROM [USER] WHERE Username = 'admin';
GO
PRINT 'Admin insertado: ' + CAST(@@ROWCOUNT AS VARCHAR);
GO

-- ============================================================================
-- 8. INSERTAR ENGINEERS Y ASIGNAR A EQUIPOS
-- ============================================================================
PRINT 'Insertando Engineers...';

INSERT INTO ENGINEER (User_id, Team_id)
SELECT u.User_id, t.Team_id
FROM [USER] u
CROSS JOIN TEAM t
WHERE u.Username LIKE 'engineer_%' 
              AND t.Name LIKE 
              CASE 
              WHEN u.Username = 'engineer_mercedes' THEN '%Mercedes%'
              WHEN u.Username = 'engineer_redbull' THEN '%Red Bull%'
              WHEN u.Username = 'engineer_ferrari' THEN '%Ferrari%'
              WHEN u.Username = 'engineer_mclaren' THEN '%McLaren%'
              WHEN u.Username = 'engineer_astonmartin' THEN '%Aston Martin%'
              WHEN u.Username = 'engineer_alpine' THEN '%Alpine%'
              WHEN u.Username = 'engineer_williams' THEN '%Williams%'
       END;
GO
PRINT 'Engineers insertados: ' + CAST(@@ROWCOUNT AS VARCHAR);
GO

-- ============================================================================
-- 9. INSERTAR DRIVERS
-- ============================================================================
PRINT 'Insertando Drivers...';

-- Mercedes Drivers
INSERT INTO DRIVER (User_id, Team_id, H)
SELECT u.User_id, t.Team_id, 95
FROM [USER] u, TEAM t
WHERE u.Username = 'hamilton' AND t.Name LIKE '%Mercedes%';

INSERT INTO DRIVER (User_id, Team_id, H)
SELECT u.User_id, t.Team_id, 88
FROM [USER] u, TEAM t
WHERE u.Username = 'russell' AND t.Name LIKE '%Mercedes%';

-- Red Bull Drivers
INSERT INTO DRIVER (User_id, Team_id, H)
SELECT u.User_id, t.Team_id, 98
FROM [USER] u, TEAM t
WHERE u.Username = 'verstappen' AND t.Name LIKE '%Red Bull%';

INSERT INTO DRIVER (User_id, Team_id, H)
SELECT u.User_id, t.Team_id, 85
FROM [USER] u, TEAM t
WHERE u.Username = 'perez' AND t.Name LIKE '%Red Bull%';

-- Ferrari Drivers
INSERT INTO DRIVER (User_id, Team_id, H)
SELECT u.User_id, t.Team_id, 92
FROM [USER] u, TEAM t
WHERE u.Username = 'leclerc' AND t.Name LIKE '%Ferrari%';

INSERT INTO DRIVER (User_id, Team_id, H)
SELECT u.User_id, t.Team_id, 87
FROM [USER] u, TEAM t
WHERE u.Username = 'sainz' AND t.Name LIKE '%Ferrari%';

-- McLaren Drivers
INSERT INTO DRIVER (User_id, Team_id, H)
SELECT u.User_id, t.Team_id, 90
FROM [USER] u, TEAM t
WHERE u.Username = 'norris' AND t.Name LIKE '%McLaren%';

INSERT INTO DRIVER (User_id, Team_id, H)
SELECT u.User_id, t.Team_id, 83
FROM [USER] u, TEAM t
WHERE u.Username = 'piastri' AND t.Name LIKE '%McLaren%';

-- Aston Martin Drivers
INSERT INTO DRIVER (User_id, Team_id, H)
SELECT u.User_id, t.Team_id, 94
FROM [USER] u, TEAM t
WHERE u.Username = 'alonso' AND t.Name LIKE '%Aston Martin%';

INSERT INTO DRIVER (User_id, Team_id, H)
SELECT u.User_id, t.Team_id, 80
FROM [USER] u, TEAM t
WHERE u.Username = 'stroll' AND t.Name LIKE '%Aston Martin%';

-- Alpine Drivers
INSERT INTO DRIVER (User_id, Team_id, H)
SELECT u.User_id, t.Team_id, 86
FROM [USER] u, TEAM t
WHERE u.Username = 'gasly' AND t.Name LIKE '%Alpine%';

INSERT INTO DRIVER (User_id, Team_id, H)
SELECT u.User_id, t.Team_id, 84
FROM [USER] u, TEAM t
WHERE u.Username = 'ocon' AND t.Name LIKE '%Alpine%';

-- Williams Drivers
INSERT INTO DRIVER (User_id, Team_id, H)
SELECT u.User_id, t.Team_id, 82
FROM [USER] u, TEAM t
WHERE u.Username = 'albon' AND t.Name LIKE '%Williams%';

INSERT INTO DRIVER (User_id, Team_id, H)
SELECT u.User_id, t.Team_id, 75
FROM [USER] u, TEAM t
WHERE u.Username = 'sargeant' AND t.Name LIKE '%Williams%';
GO
PRINT 'Drivers insertados: ' + CAST(@@ROWCOUNT AS VARCHAR);
GO

-- ============================================================================
-- 10. INSERTAR CARROS PARA CADA EQUIPO (2 por equipo)
-- ============================================================================
PRINT 'Insertando Carros...';

INSERT INTO CAR (Team_id, isFinalized)
SELECT Team_id, 0 FROM TEAM
CROSS JOIN (SELECT 1 AS n UNION SELECT 2) AS numbers;
GO
PRINT 'Carros insertados: ' + CAST(@@ROWCOUNT AS VARCHAR);
GO

-- ============================================================================
-- 11. CREAR INVENTARIOS PARA CADA EQUIPO (VACÍOS)
-- ============================================================================
PRINT 'Creando Inventarios vacíos para equipos...';

INSERT INTO INVENTORY (Team_id) 
SELECT Team_id FROM TEAM;
GO
PRINT 'Inventarios creados: ' + CAST(@@ROWCOUNT AS VARCHAR);
GO

-- NOTA: Los inventarios están vacíos intencionalmente para demostrar 
--       la funcionalidad de compra de partes desde la tienda.

-- ============================================================================
-- RESULTADO FINAL
-- ============================================================================
PRINT '';
PRINT '============================================================================';
PRINT 'DATOS DE PRUEBA INSERTADOS EXITOSAMENTE';
PRINT '============================================================================';
PRINT 'RESUMEN:';
PRINT '--------';
PRINT '- Sponsors: 13';
PRINT '- Equipos: 7';
PRINT '- Aportes: 13 (presupuestos actualizados)';
PRINT '- Partes en catálogo: 25 (5 de cada categoría)';
PRINT '- Circuitos: 10';
PRINT '- Usuarios: 22 (1 admin + 7 engineers + 14 drivers)';
PRINT '- Admin: 1';
PRINT '- Engineers: 7 (1 por equipo)';
PRINT '- Drivers: 14 (2 por equipo)';
PRINT '- Carros: 14 (2 por equipo)';
PRINT '- Inventarios: 7 (1 por equipo, TODOS VACÍOS)';
PRINT '';
PRINT 'NOTA: Los inventarios están vacíos intencionalmente.';
PRINT '      Para ensamblar autos, primero debes comprar partes desde la tienda.';
PRINT '============================================================================';
GO

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
SELECT Team_id, Name, 
       FORMAT(Total_Budget, 'C') AS Presupuesto_Total,
       FORMAT(Total_Spent, 'C') AS Gastado,
       FORMAT((Total_Budget - Total_Spent), 'C') AS Presupuesto_Disponible
FROM TEAM
ORDER BY Total_Budget DESC;
GO

-- 4. Catálogo de partes
PRINT '4. CATÁLOGO DE PARTES DISPONIBLES (TIENDA)';
SELECT Part_id, Name, Category, 
       FORMAT(Price, 'C') AS Precio,
       Stock AS Stock_Disponible,
       CONCAT('P:', p, ' A:', a, ' M:', m) AS Stats
FROM PART
ORDER BY Category, Part_id;
GO

-- 5. Inventarios por equipo (deben estar vacíos)
PRINT '5. INVENTARIOS POR EQUIPO (DEBEN ESTAR VACÍOS)';
SELECT t.Name AS Equipo, 
       COUNT(ip.Part_id) AS Partes_En_Inventario,
       ISNULL(SUM(ip.Quantity), 0) AS Total_Unidades
FROM INVENTORY i
JOIN TEAM t ON i.Team_id = t.Team_id
LEFT JOIN INVENTORY_PART ip ON i.Inventory_id = ip.Inventory_id
GROUP BY t.Name
ORDER BY t.Name;
GO

-- 6. Carros y su estado (deben estar incompletos)
PRINT '6. CARROS Y ESTADO DE ENSAMBLAJE (DEBEN ESTAR INCOMPLETOS)';
SELECT c.Car_id, t.Name AS Equipo,
       CASE c.isFinalized 
              WHEN 1 THEN 'Completo' 
              ELSE 'Incompleto' 
       END AS Estado,
       ISNULL(cc.Parts_Count, 0) AS Partes_Instaladas,
       CASE 
              WHEN ISNULL(cc.Parts_Count, 0) = 5 THEN 'READY TO RACE'
              ELSE CONCAT('Faltan ', 5 - ISNULL(cc.Parts_Count, 0), ' partes')
       END AS Estado_Ensamblaje
FROM CAR c
JOIN TEAM t ON c.Team_id = t.Team_id
LEFT JOIN (
       SELECT Car_id, COUNT(*) AS Parts_Count
       FROM CAR_CONFIGURATION
       GROUP BY Car_id
) cc ON c.Car_id = cc.Car_id
ORDER BY t.Name, c.Car_id;
GO

-- 7. Verificar que no hay partes instaladas en ningún carro
PRINT '7. VERIFICACIÓN: PARTES INSTALADAS EN CARROS';
SELECT COUNT(*) AS Total_Partes_Instaladas FROM CAR_CONFIGURATION;
IF (SELECT COUNT(*) FROM CAR_CONFIGURATION) = 0
       PRINT '✓ Correcto: Ninguna parte instalada en carros';
ELSE
       PRINT '✗ Error: Hay partes instaladas en carros';
GO

-- 8. Verificar que no hay partes en inventarios
PRINT '8. VERIFICACIÓN: PARTES EN INVENTARIOS';
SELECT COUNT(*) AS Total_Partes_En_Inventarios FROM INVENTORY_PART;
IF (SELECT COUNT(*) FROM INVENTORY_PART) = 0
       PRINT '✓ Correcto: Ninguna parte en inventarios (listo para compras)';
ELSE
       PRINT '✗ Error: Hay partes en inventarios';
GO

PRINT '';
PRINT '============================================================================';
PRINT 'SCRIPT DE TESTING COMPLETADO';
PRINT '============================================================================';
GO

-- ============================================================================
-- CONSULTAS ADICIONALES PARA DEBUG
-- ============================================================================
PRINT '';
PRINT '============================================================================';
PRINT 'CONSULTAS ADICIONALES PARA DEBUG';
PRINT '============================================================================';

-- Verificar relación entre carros y equipos
PRINT 'Relación Carros - Equipos:';
SELECT c.Car_id, t.Team_id, t.Name AS Team_Name, c.isFinalized
FROM CAR c
INNER JOIN TEAM t ON c.Team_id = t.Team_id
ORDER BY t.Team_id, c.Car_id;

-- Verificar inventarios (deben existir pero vacíos)
PRINT 'Inventarios existentes (deben estar vacíos):';
SELECT i.Inventory_id, t.Team_id, t.Name AS Team_Name,
       (SELECT COUNT(*) FROM INVENTORY_PART ip WHERE ip.Inventory_id = i.Inventory_id) AS Partes_En_Inventario
FROM INVENTORY i
INNER JOIN TEAM t ON i.Team_id = t.Team_id
ORDER BY t.Team_id;
GO