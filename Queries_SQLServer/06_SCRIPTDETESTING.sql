-- ============================================================================
-- SCRIPT PARA CONSULTAR Y POBLAR DATOS DE PRUEBA - NOMBRES CORREGIDOS
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
('Crypto.com', 'Cryptocurrency', 'Singapore'),
('Oracle', 'Technology', 'USA'),
('Mobil 1', 'Oil & Gas', 'USA'),
('Castrol', 'Oil & Gas', 'UK'),
('Monster Energy', 'Energy Drinks', 'USA');
GO
PRINT 'Sponsors insertados: ' + CAST(@@ROWCOUNT AS VARCHAR);
GO

-- ============================================================================
-- 2. INSERTAR EQUIPOS (NOMBRES SIMPLIFICADOS)
-- ============================================================================
PRINT 'Insertando Equipos...';

INSERT INTO TEAM (Name, Total_Budget, Total_Spent) VALUES
('Mercedes', 0, 0),
('Red Bull', 0, 0),
('Ferrari', 0, 0),
('McLaren', 0, 0),
('Aston Martin', 0, 0),
('Alpine', 0, 0),
('Williams', 0, 0),
('AlphaTauri', 0, 0),
('Alfa Romeo', 0, 0),
('Haas', 0, 0);
GO
PRINT 'Equipos insertados: ' + CAST(@@ROWCOUNT AS VARCHAR);
GO

-- ============================================================================
-- 3. INSERTAR APORTES DE SPONSORS A EQUIPOS
-- ============================================================================
PRINT 'Insertando Aportes (Contributions)...';

INSERT INTO CONTRIBUTION (Sponsor_id, Team_id, Amount, Date, Description) VALUES
-- Mercedes
(2, 1, 10000000.00, GETDATE(), 'Patrocinio principal temporada 2024'),
(10, 1, 5000000.00, DATEADD(DAY, -30, GETDATE()), 'Patrocinio tecnológico'),
(4, 1, 2000000.00, DATEADD(DAY, -20, GETDATE()), 'Patrocinio oficial de tiempo'),
-- Red Bull
(1, 2, 15000000.00, GETDATE(), 'Patrocinio principal'),
(3, 2, 8000000.00, DATEADD(DAY, -45, GETDATE()), 'Patrocinio combustible'),
(9, 2, 6000000.00, DATEADD(DAY, -60, GETDATE()), 'Motor y desarrollo'),
(14, 2, 5000000.00, DATEADD(DAY, -10, GETDATE()), 'Patrocinio tecnología'),
-- Ferrari
(11, 3, 12000000.00, GETDATE(), 'Patrocinio principal'),
(7, 3, 7000000.00, DATEADD(DAY, -15, GETDATE()), 'Patrocinio energético'),
(5, 3, 3000000.00, DATEADD(DAY, -40, GETDATE()), 'Patrocinio neumáticos'),
-- McLaren
(12, 4, 9000000.00, GETDATE(), 'Patrocinio principal'),
(8, 4, 5000000.00, DATEADD(DAY, -25, GETDATE()), 'Patrocinio aerolínea'),
(13, 4, 4000000.00, DATEADD(DAY, -35, GETDATE()), 'Patrocinio tecnología'),
-- Aston Martin
(8, 5, 8000000.00, GETDATE(), 'Patrocinio principal'),
(4, 5, 2500000.00, DATEADD(DAY, -30, GETDATE()), 'Patrocinio tiempo'),
(15, 5, 3000000.00, DATEADD(DAY, -15, GETDATE()), 'Patrocinio lubricantes'),
-- Alpine
(8, 6, 6000000.00, GETDATE(), 'Patrocinio principal'),
(16, 6, 2000000.00, DATEADD(DAY, -25, GETDATE()), 'Patrocinio aceites'),
-- Williams
(6, 7, 4000000.00, GETDATE(), 'Patrocinio logística'),
(4, 7, 1500000.00, DATEADD(DAY, -20, GETDATE()), 'Patrocinio tiempo'),
-- AlphaTauri
(17, 8, 5000000.00, GETDATE(), 'Patrocinio principal'),
-- Alfa Romeo
(4, 9, 3500000.00, GETDATE(), 'Patrocinio principal'),
-- Haas
(15, 10, 3000000.00, GETDATE(), 'Patrocinio principal');
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
-- Power Units
('Mercedes-AMG M15 E Performance', 'Power_Unit', 1200000.00, 10, 9, 3, 2),
('Honda RA624H Hybrid', 'Power_Unit', 1100000.00, 12, 8, 4, 3),
('Ferrari 066/12', 'Power_Unit', 1250000.00, 8, 9, 2, 1),
('Renault E-Tech RE24', 'Power_Unit', 950000.00, 15, 7, 3, 4),
('Audi V6 Hybrid', 'Power_Unit', 1050000.00, 6, 8, 3, 3),

-- Aerodynamics Packages
('Low Drag Monza Spec', 'Aerodynamics_pkg', 550000.00, 20, 2, 9, 4),
('High Downforce Monaco Spec', 'Aerodynamics_pkg', 650000.00, 18, 1, 8, 5),
('DRS Plus System', 'Aerodynamics_pkg', 750000.00, 12, 3, 9, 3),
('Spa High Efficiency Wing', 'Aerodynamics_pkg', 600000.00, 16, 2, 8, 4),
('Silverstone Spec Package', 'Aerodynamics_pkg', 500000.00, 22, 1, 7, 6),

-- Wheels
('Pirelli P Zero Soft (C3)', 'Wheels', 220000.00, 30, 3, 4, 8),
('Pirelli P Zero Medium (C2)', 'Wheels', 180000.00, 35, 2, 3, 7),
('Pirelli P Zero Hard (C1)', 'Wheels', 280000.00, 25, 4, 5, 9),
('Pirelli Intermediates', 'Wheels', 320000.00, 20, 2, 6, 6),
('Pirelli Full Wets', 'Wheels', 350000.00, 15, 1, 7, 5),

-- Suspension
('Active Suspension Pro 2024', 'Suspension', 450000.00, 15, 2, 5, 9),
('Adaptive Dampers Pro', 'Suspension', 380000.00, 20, 1, 4, 8),
('Multi-Link Rear System', 'Suspension', 550000.00, 12, 3, 6, 9),
('Hydraulic Anti-Roll System', 'Suspension', 480000.00, 14, 2, 5, 8),
('Carbon Fiber Suspension', 'Suspension', 620000.00, 10, 3, 6, 9),

-- Gearbox
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

-- Engineers (1 por equipo = 10)
INSERT INTO [USER] (Username, Salt, PasswordHash) VALUES
('engineer_mercedes', 'salt123', 'hash123'),
('engineer_redbull', 'salt123', 'hash123'),
('engineer_ferrari', 'salt123', 'hash123'),
('engineer_mclaren', 'salt123', 'hash123'),
('engineer_astonmartin', 'salt123', 'hash123'),
('engineer_alpine', 'salt123', 'hash123'),
('engineer_williams', 'salt123', 'hash123'),
('engineer_alphatauri', 'salt123', 'hash123'),
('engineer_alfaromeo', 'salt123', 'hash123'),
('engineer_haas', 'salt123', 'hash123');

-- Drivers (2 por equipo = 20 drivers)
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
('sargeant', 'salt123', 'hash123'),
('tsunoda', 'salt123', 'hash123'),
('ricciardo', 'salt123', 'hash123'),
('bottas', 'salt123', 'hash123'),
('zhou', 'salt123', 'hash123'),
('hulkenberg', 'salt123', 'hash123'),
('kevin_magnussen', 'salt123', 'hash123');
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
-- 8. INSERTAR ENGINEERS Y ASIGNAR A EQUIPOS (NOMBRES SIMPLIFICADOS)
-- ============================================================================
PRINT 'Insertando Engineers...';

-- Asignar cada engineer a su equipo correspondiente
INSERT INTO ENGINEER (User_id, Team_id) VALUES
((SELECT User_id FROM [USER] WHERE Username = 'engineer_mercedes'), 1),
((SELECT User_id FROM [USER] WHERE Username = 'engineer_redbull'), 2),
((SELECT User_id FROM [USER] WHERE Username = 'engineer_ferrari'), 3),
((SELECT User_id FROM [USER] WHERE Username = 'engineer_mclaren'), 4),
((SELECT User_id FROM [USER] WHERE Username = 'engineer_astonmartin'), 5),
((SELECT User_id FROM [USER] WHERE Username = 'engineer_alpine'), 6),
((SELECT User_id FROM [USER] WHERE Username = 'engineer_williams'), 7),
((SELECT User_id FROM [USER] WHERE Username = 'engineer_alphatauri'), 8),
((SELECT User_id FROM [USER] WHERE Username = 'engineer_alfaromeo'), 9),
((SELECT User_id FROM [USER] WHERE Username = 'engineer_haas'), 10);
GO
PRINT 'Engineers insertados: ' + CAST(@@ROWCOUNT AS VARCHAR);
GO

-- ============================================================================
-- 9. INSERTAR DRIVERS (NOMBRES SIMPLIFICADOS)
-- ============================================================================
PRINT 'Insertando Drivers...';

-- Mercedes Drivers
INSERT INTO DRIVER (User_id, Team_id, H)
SELECT User_id, 1, 95 FROM [USER] WHERE Username = 'hamilton';

INSERT INTO DRIVER (User_id, Team_id, H)
SELECT User_id, 1, 88 FROM [USER] WHERE Username = 'russell';

-- Red Bull Drivers
INSERT INTO DRIVER (User_id, Team_id, H)
SELECT User_id, 2, 98 FROM [USER] WHERE Username = 'verstappen';

INSERT INTO DRIVER (User_id, Team_id, H)
SELECT User_id, 2, 85 FROM [USER] WHERE Username = 'perez';

-- Ferrari Drivers
INSERT INTO DRIVER (User_id, Team_id, H)
SELECT User_id, 3, 92 FROM [USER] WHERE Username = 'leclerc';

INSERT INTO DRIVER (User_id, Team_id, H)
SELECT User_id, 3, 87 FROM [USER] WHERE Username = 'sainz';

-- McLaren Drivers
INSERT INTO DRIVER (User_id, Team_id, H)
SELECT User_id, 4, 90 FROM [USER] WHERE Username = 'norris';

INSERT INTO DRIVER (User_id, Team_id, H)
SELECT User_id, 4, 83 FROM [USER] WHERE Username = 'piastri';

-- Aston Martin Drivers
INSERT INTO DRIVER (User_id, Team_id, H)
SELECT User_id, 5, 94 FROM [USER] WHERE Username = 'alonso';

INSERT INTO DRIVER (User_id, Team_id, H)
SELECT User_id, 5, 80 FROM [USER] WHERE Username = 'stroll';

-- Alpine Drivers
INSERT INTO DRIVER (User_id, Team_id, H)
SELECT User_id, 6, 86 FROM [USER] WHERE Username = 'gasly';

INSERT INTO DRIVER (User_id, Team_id, H)
SELECT User_id, 6, 84 FROM [USER] WHERE Username = 'ocon';

-- Williams Drivers
INSERT INTO DRIVER (User_id, Team_id, H)
SELECT User_id, 7, 82 FROM [USER] WHERE Username = 'albon';

INSERT INTO DRIVER (User_id, Team_id, H)
SELECT User_id, 7, 75 FROM [USER] WHERE Username = 'sargeant';

-- AlphaTauri Drivers
INSERT INTO DRIVER (User_id, Team_id, H)
SELECT User_id, 8, 81 FROM [USER] WHERE Username = 'tsunoda';

INSERT INTO DRIVER (User_id, Team_id, H)
SELECT User_id, 8, 88 FROM [USER] WHERE Username = 'ricciardo';

-- Alfa Romeo Drivers
INSERT INTO DRIVER (User_id, Team_id, H)
SELECT User_id, 9, 83 FROM [USER] WHERE Username = 'bottas';

INSERT INTO DRIVER (User_id, Team_id, H)
SELECT User_id, 9, 78 FROM [USER] WHERE Username = 'zhou';

-- Haas Drivers
INSERT INTO DRIVER (User_id, Team_id, H)
SELECT User_id, 10, 82 FROM [USER] WHERE Username = 'hulkenberg';

INSERT INTO DRIVER (User_id, Team_id, H)
SELECT User_id, 10, 79 FROM [USER] WHERE Username = 'kevin_magnussen';
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

-- ============================================================================
-- RESULTADO FINAL
-- ============================================================================
PRINT '';
PRINT '============================================================================';
PRINT 'DATOS DE PRUEBA INSERTADOS EXITOSAMENTE';
PRINT '============================================================================';
PRINT 'RESUMEN:';
PRINT '--------';
PRINT '- Sponsors: 17';
PRINT '- Equipos: 10 (Mercedes, Red Bull, Ferrari, McLaren, Aston Martin, Alpine, Williams, AlphaTauri, Alfa Romeo, Haas)';
PRINT '- Aportes: 21 (presupuestos actualizados)';
PRINT '- Partes en catálogo: 25 (5 de cada categoría)';
PRINT '- Circuitos: 10';
PRINT '- Usuarios: 31 (1 admin + 10 engineers + 20 drivers)';
PRINT '- Admin: 1';
PRINT '- Engineers: 10 (1 por equipo)';
PRINT '- Drivers: 20 (2 por equipo)';
PRINT '- Carros: 20 (2 por equipo)';
PRINT '- Inventarios: 10 (1 por equipo, TODOS VACÍOS)';
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

-- 1. Equipos con presupuesto
PRINT '1. EQUIPOS CON PRESUPUESTO';
SELECT Team_id, Name, 
       FORMAT(Total_Budget, 'C') AS Presupuesto_Total,
       FORMAT(Total_Spent, 'C') AS Gastado,
       FORMAT((Total_Budget - Total_Spent), 'C') AS Presupuesto_Disponible
FROM TEAM
ORDER BY Total_Budget DESC;
GO

-- 2. Catálogo de partes
PRINT '2. CATÁLOGO DE PARTES DISPONIBLES (TIENDA)';
SELECT Part_id, Name, Category, 
       FORMAT(Price, 'C') AS Precio,
       Stock AS Stock_Disponible,
       CONCAT('P:', p, ' A:', a, ' M:', m) AS Stats
FROM PART
ORDER BY Category, Part_id;
GO

-- 3. Inventarios por equipo (deben estar vacíos)
PRINT '3. INVENTARIOS POR EQUIPO (DEBEN ESTAR VACÍOS)';
SELECT t.Name AS Equipo, 
       COUNT(ip.Part_id) AS Partes_En_Inventario,
       ISNULL(SUM(ip.Quantity), 0) AS Total_Unidades
FROM INVENTORY i
JOIN TEAM t ON i.Team_id = t.Team_id
LEFT JOIN INVENTORY_PART ip ON i.Inventory_id = ip.Inventory_id
GROUP BY t.Name
ORDER BY t.Name;
GO

-- 4. Carros y su estado (deben estar incompletos)
PRINT '4. CARROS Y ESTADO DE ENSAMBLAJE (DEBEN ESTAR INCOMPLETOS)';
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
ORDER BY t.Team_id, c.Car_id;
GO

-- 5. Verificar que no hay partes instaladas en ningún carro
PRINT '5. VERIFICACIÓN: PARTES INSTALADAS EN CARROS';
SELECT COUNT(*) AS Total_Partes_Instaladas FROM CAR_CONFIGURATION;
IF (SELECT COUNT(*) FROM CAR_CONFIGURATION) = 0
       PRINT '✓ Correcto: Ninguna parte instalada en carros';
ELSE
       PRINT '✗ Error: Hay partes instaladas en carros';
GO

-- 6. Verificar que no hay partes en inventarios
PRINT '6. VERIFICACIÓN: PARTES EN INVENTARIOS';
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