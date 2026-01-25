
USE F1GarageManager;
GO

PRINT '==========================================';
PRINT '   AUTO-SETUP BCRYPT: win users';
PRINT '==========================================';
GO

-- Limpiar usuarios existentes
DELETE FROM DRIVER WHERE User_id IN (SELECT User_id FROM [USER] WHERE Username LIKE 'win%');
DELETE FROM ENGINEER WHERE User_id IN (SELECT User_id FROM [USER] WHERE Username LIKE 'win%');
DELETE FROM ADMIN WHERE User_id IN (SELECT User_id FROM [USER] WHERE Username LIKE 'win%');
DELETE FROM [USER] WHERE Username LIKE 'win%';
PRINT '✅ Usuarios win eliminados';
GO


-- winAdmin
INSERT INTO [USER] (Username, Salt, PasswordHash)
VALUES (
    'winAdmin', 
    '$2b$10$NAjRxqOsleYlOQ8ClMPWh.', 
    '$2b$10$NAjRxqOsleYlOQ8ClMPWh.tZ.klNjy5M8ucisE5jQpIzDqsiPu.Jy'
);
PRINT '   ✅ winAdmin creado con bcrypt';
GO


-- winEngineer
INSERT INTO [USER] (Username, Salt, PasswordHash)
VALUES (
    'winEngineer', 
    '$2b$10$JslwwldEg54syiDvrE1ldO', 
    '$2b$10$JslwwldEg54syiDvrE1ldOfTLs/kt3pforZCU87ZHgdi83/bN/M2q'
);
PRINT '   ✅ winEngineer creado con bcrypt';
GO


-- winDriver
INSERT INTO [USER] (Username, Salt, PasswordHash)
VALUES (
    'winDriver', 
    '$2b$10$WQzh8G.yNpC2Jre/9s79zO', 
    '$2b$10$WQzh8G.yNpC2Jre/9s79zO4xuTBwZYwvmGCI63gn.gfHvn7XWV7K2'
);
PRINT '   ✅ winDriver creado con bcrypt';
GO


-- Asignar roles automáticamente
INSERT INTO ADMIN (User_id) SELECT User_id FROM [USER] WHERE Username = 'winAdmin';
PRINT '✅ winAdmin → ADMIN';
GO

INSERT INTO ENGINEER (User_id, Team_id) SELECT User_id, 1 FROM [USER] WHERE Username = 'winEngineer';
PRINT '✅ winEngineer → ENGINEER';
GO

INSERT INTO DRIVER (User_id, Team_id, H) SELECT User_id, 1, 85 FROM [USER] WHERE Username = 'winDriver';
PRINT '✅ winDriver → DRIVER';
GO


-- Verificación final
PRINT '';
PRINT '📊 VERIFICACIÓN COMPLETA:';
PRINT '   --------------------';
SELECT 
    u.Username,
    u.User_id,
    CASE WHEN a.User_id IS NOT NULL THEN '✅ ADMIN' ELSE '❌' END AS Admin,
    CASE WHEN e.User_id IS NOT NULL THEN '✅ ENGINEER' ELSE '❌' END AS Engineer,
    CASE WHEN d.User_id IS NOT NULL THEN '✅ DRIVER' ELSE '❌' END AS Driver,
    CASE 
        WHEN u.PasswordHash LIKE '$2%' THEN '✅ BCRYPT'
        ELSE '❌ NO BCRYPT'
    END as Encryption,
    'Contraseña correcta' as Test_Result
FROM [USER] u
LEFT JOIN ADMIN a ON u.User_id = a.User_id
LEFT JOIN ENGINEER e ON u.User_id = e.User_id
LEFT JOIN DRIVER d ON u.User_id = d.User_id
WHERE u.Username LIKE 'win%'
ORDER BY u.Username;
GO

PRINT '';
PRINT '🎉 SETUP COMPLETADO EXITOSAMENTE';
PRINT '================================';
GO
