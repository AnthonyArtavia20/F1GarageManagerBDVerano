
[0;36m📄 [1mSQL PARA ASIGNAR ROLES[0m[0;36m:[0m
[0;34m==========================================[0m
-- =========================================
-- SQL GENERADO: 2026-01-20 12:49:16
-- Sistema: GitBash
-- =========================================

USE F1GarageManager;
GO

-- 1. OBTENER IDs DE LOS USUARIOS
SELECT User_id, Username FROM [USER] 
WHERE Username IN ('winAdmin', 'winEngineer', 'winDriver')
ORDER BY Username;
GO

-- 2. COPIAR LOS IDs Y EJECUTAR ESTOS COMANDOS:
--    (Reemplaza X, Y, Z con los IDs reales)

-- Asignar como ADMIN
INSERT INTO ADMIN (User_id) VALUES (32);

-- Asignar como ENGINEER (Mercedes - Team_id 1)
INSERT INTO ENGINEER (User_id, Team_id) VALUES (33, 1);

-- Asignar como DRIVER (Mercedes - Team_id 1)
INSERT INTO DRIVER (User_id, Team_id, H) VALUES (34, 1, 85);

GO

-- 3. VERIFICAR
SELECT 
    u.Username,
    u.User_id,
    CASE WHEN a.User_id IS NOT NULL THEN '✅ ADMIN' ELSE '❌' END AS Admin,
    CASE WHEN e.User_id IS NOT NULL THEN '✅ ENGINEER' ELSE '❌' END AS Engineer,
    CASE WHEN d.User_id IS NOT NULL THEN '✅ DRIVER' ELSE '❌' END AS Driver
FROM [USER] u
LEFT JOIN ADMIN a ON u.User_id = a.User_id
LEFT JOIN ENGINEER e ON u.User_id = e.User_id
LEFT JOIN DRIVER d ON u.User_id = d.User_id
WHERE u.Username IN ('winAdmin', 'winEngineer', 'winDriver');
GO
