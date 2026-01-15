-- ============================================================================
-- SCRIPT PARA CONSULTAR SPONSORS, APORTES Y EQUIPOS CON PRESUPUESTO
-- F1 Garage Manager - Grupo 3/C
-- ============================================================================

USE F1GarageManager;
GO

PRINT '============================================================================';
PRINT 'CONSULTAS DE INFORMACIÓN FINANCIERA DEL SISTEMA';
PRINT '============================================================================';
GO

-- ============================================================================
-- 1. LISTA COMPLETA DE SPONSORS CON INFORMACIÓN BÁSICA
-- ============================================================================

PRINT '';
PRINT '1. LISTA DE TODOS LOS SPONSORS';
PRINT '============================================================================';

SELECT 
    Sponsor_id AS 'ID',
    Name AS 'Nombre',
    Industry AS 'Industria',
    Country AS 'País'
FROM SPONSOR
ORDER BY Name;
GO

-- ============================================================================
-- 2. SPONSORS CON ESTADÍSTICAS DE APORTES
-- ============================================================================

PRINT '';
PRINT '2. SPONSORS CON ESTADÍSTICAS DE APORTES';
PRINT '============================================================================';

SELECT 
    s.Sponsor_id AS 'ID Sponsor',
    s.Name AS 'Nombre Sponsor',
    s.Industry AS 'Industria',
    s.Country AS 'País',
    COUNT(c.Contribution_id) AS 'Total Aportes',
    ISNULL(SUM(c.Amount), 0) AS 'Monto Total Aportado',
    ISNULL(AVG(c.Amount), 0) AS 'Promedio por Aporte',
    MAX(c.Date) AS 'Último Aporte',
    COUNT(DISTINCT c.Team_id) AS 'Equipos Apoyados'
FROM SPONSOR s
LEFT JOIN CONTRIBUTION c ON s.Sponsor_id = c.Sponsor_id
GROUP BY s.Sponsor_id, s.Name, s.Industry, s.Country
ORDER BY SUM(c.Amount) DESC;
GO

-- ============================================================================
-- 3. DETALLE DE APORTES POR SPONSOR
-- ============================================================================

PRINT '';
PRINT '3. DETALLE DE APORTES POR SPONSOR';
PRINT '============================================================================';

SELECT 
    s.Name AS 'Sponsor',
    t.Name AS 'Equipo',
    c.Amount AS 'Monto',
    FORMAT(c.Date, 'dd/MM/yyyy HH:mm') AS 'Fecha',
    c.Description AS 'Descripción'
FROM CONTRIBUTION c
JOIN SPONSOR s ON c.Sponsor_id = s.Sponsor_id
JOIN TEAM t ON c.Team_id = t.Team_id
ORDER BY c.Date DESC, s.Name;
GO

-- ============================================================================
-- 4. RESUMEN DE APORTES POR EQUIPO
-- ============================================================================

PRINT '';
PRINT '4. RESUMEN DE APORTES POR EQUIPO';
PRINT '============================================================================';

SELECT 
    t.Team_id AS 'ID Equipo',
    t.Name AS 'Nombre Equipo',
    COUNT(c.Contribution_id) AS 'Cantidad de Aportes',
    ISNULL(SUM(c.Amount), 0) AS 'Total Recibido',
    ISNULL(AVG(c.Amount), 0) AS 'Promedio por Aporte',
    MIN(c.Date) AS 'Primer Aporte',
    MAX(c.Date) AS 'Último Aporte'
FROM TEAM t
LEFT JOIN CONTRIBUTION c ON t.Team_id = c.Team_id
GROUP BY t.Team_id, t.Name
ORDER BY SUM(c.Amount) DESC;
GO

-- ============================================================================
-- 5. EQUIPOS CON PRESUPUESTO DETALLADO
-- ============================================================================

PRINT '';
PRINT '5. EQUIPOS CON PRESUPUESTO DETALLADO';
PRINT '============================================================================';

WITH Ingresos AS (
    SELECT 
        Team_id,
        ISNULL(SUM(Amount), 0) AS Total_Ingresos,
        COUNT(*) AS Cantidad_Aportes
    FROM CONTRIBUTION
    GROUP BY Team_id
),
Gastos AS (
    SELECT 
        e.Team_id,
        ISNULL(SUM(p.Total_price), 0) AS Total_Gastado,
        COUNT(*) AS Cantidad_Compras
    FROM PURCHASE p
    JOIN ENGINEER e ON p.Engineer_User_id = e.User_id
    GROUP BY e.Team_id
)
SELECT 
    t.Team_id AS 'ID',
    t.Name AS 'Equipo',
    ISNULL(i.Total_Ingresos, 0) AS 'Total Ingresos',
    ISNULL(g.Total_Gastado, 0) AS 'Total Gastado',
    (ISNULL(i.Total_Ingresos, 0) - ISNULL(g.Total_Gastado, 0)) AS 'Presupuesto Disponible',
    ISNULL(i.Cantidad_Aportes, 0) AS '# Aportes',
    ISNULL(g.Cantidad_Compras, 0) AS '# Compras',
    CASE 
        WHEN ISNULL(i.Total_Ingresos, 0) > 0 THEN 
            CAST((ISNULL(g.Total_Gastado, 0) / ISNULL(i.Total_Ingresos, 0)) * 100 AS DECIMAL(5,2))
        ELSE 0 
    END AS '% Gastado'
FROM TEAM t
LEFT JOIN Ingresos i ON t.Team_id = i.Team_id
LEFT JOIN Gastos g ON t.Team_id = g.Team_id
ORDER BY t.Name;
GO

-- ============================================================================
-- 6. DETALLE COMPLETO DE PRESUPUESTO POR EQUIPO (VISTA AMPLIADA)
-- ============================================================================

PRINT '';
PRINT '6. DETALLE COMPLETO DE PRESUPUESTO POR EQUIPO';
PRINT '============================================================================';

SELECT 
    t.Team_id AS 'ID Equipo',
    t.Name AS 'Nombre Equipo',
    t.Total_Budget AS 'Presupuesto Total',
    t.Total_Spent AS 'Total Gastado',
    (t.Total_Budget - t.Total_Spent) AS 'Saldo Disponible',
    -- Ingenieros en el equipo
    (SELECT COUNT(*) FROM ENGINEER e WHERE e.Team_id = t.Team_id) AS '# Ingenieros',
    -- Conductores en el equipo
    (SELECT COUNT(*) FROM DRIVER d WHERE d.Team_id = t.Team_id) AS '# Conductores',
    -- Carros del equipo
    (SELECT COUNT(*) FROM CAR c WHERE c.Team_id = t.Team_id) AS '# Carros',
    -- Carros finalizados
    (SELECT COUNT(*) FROM CAR c WHERE c.Team_id = t.Team_id AND c.isFinalized = 1) AS '# Carros Finalizados',
    -- Valor total del inventario
    (SELECT ISNULL(SUM(ip.Quantity * p.Price), 0)
     FROM INVENTORY inv
     JOIN INVENTORY_PART ip ON inv.Inventory_id = ip.Inventory_id
     JOIN PART p ON ip.Part_id = p.Part_id
     WHERE inv.Team_id = t.Team_id) AS 'Valor Inventario'
FROM TEAM t
ORDER BY t.Name;
GO