-- =========================================
-- STORED PROCEDURES PARA USER MANAGEMENT
-- =========================================
USE F1GarageManager;
GO
-- 1. SP: Crear Usuario
-- =========================================
-- NOTA: El hash bcrypt se genera en el backend (Node.js)
-- y se pasa ya procesado a este SP
CREATE OR ALTER PROCEDURE sp_CreateUser
    @Username NVARCHAR(100),
    @Salt NVARCHAR(255),
    @PasswordHash NVARCHAR(255),
    @Role NVARCHAR(20),        -- 'Admin', 'Engineer', 'Driver'
    @TeamId INT = NULL,         -- Opcional, requerido para Engineer/Driver
    @DriverH INT = 85           -- Opcional, solo para Driver
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que el username no exista
        IF EXISTS (SELECT 1 FROM [USER] WHERE Username = @Username)
        BEGIN
            RAISERROR('El nombre de usuario ya existe', 16, 1);
            RETURN;
        END
        
        -- Validar rol
        IF @Role NOT IN ('Admin', 'Engineer', 'Driver')
        BEGIN
            RAISERROR('Rol inválido. Debe ser: Admin, Engineer o Driver', 16, 1);
            RETURN;
        END
        
        -- Validar TeamId para Engineer/Driver
        IF @Role IN ('Engineer', 'Driver') AND @TeamId IS NULL
        BEGIN
            RAISERROR('TeamId es requerido para Engineer y Driver', 16, 1);
            RETURN;
        END
        
        -- Insertar usuario
        DECLARE @UserId INT;
        
        INSERT INTO [USER] (Username, Salt, PasswordHash)
        VALUES (@Username, @Salt, @PasswordHash);
        
        SET @UserId = SCOPE_IDENTITY();
        
        -- Asignar rol según tipo
        IF @Role = 'Admin'
        BEGIN
            INSERT INTO ADMIN (User_id) VALUES (@UserId);
        END
        ELSE IF @Role = 'Engineer'
        BEGIN
            INSERT INTO ENGINEER (User_id, Team_id) VALUES (@UserId, @TeamId);
        END
        ELSE IF @Role = 'Driver'
        BEGIN
            INSERT INTO DRIVER (User_id, Team_id, H) VALUES (@UserId, @TeamId, @DriverH);
        END
        
        -- Retornar resultado
        SELECT 
            @UserId as User_id,
            @Username as Username,
            @Role as Role,
            @TeamId as Team_id,
            'Usuario creado exitosamente' as Message;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO

-- 2. SP: Actualizar Usuario
-- =========================================
CREATE OR ALTER PROCEDURE sp_UpdateUser
    @UserId INT,
    @NewUsername NVARCHAR(100) = NULL,  -- NULL = no cambiar
    @NewSalt NVARCHAR(255) = NULL,      -- NULL = no cambiar password
    @NewPasswordHash NVARCHAR(255) = NULL,
    @NewRole NVARCHAR(20) = NULL,       -- NULL = no cambiar
    @NewTeamId INT = NULL               -- NULL = no cambiar
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar que el usuario existe
        IF NOT EXISTS (SELECT 1 FROM [USER] WHERE User_id = @UserId)
        BEGIN
            RAISERROR('Usuario no encontrado', 16, 1);
            RETURN;
        END
        
        -- Obtener rol actual
        DECLARE @CurrentRole NVARCHAR(20);
        SELECT @CurrentRole = 
            CASE 
                WHEN EXISTS (SELECT 1 FROM ADMIN WHERE User_id = @UserId) THEN 'Admin'
                WHEN EXISTS (SELECT 1 FROM ENGINEER WHERE User_id = @UserId) THEN 'Engineer'
                WHEN EXISTS (SELECT 1 FROM DRIVER WHERE User_id = @UserId) THEN 'Driver'
                ELSE NULL
            END;
        
        -- Actualizar username si se proporciona
        IF @NewUsername IS NOT NULL
        BEGIN
            -- Verificar que el nuevo username no exista (excepto el actual)
            IF EXISTS (SELECT 1 FROM [USER] WHERE Username = @NewUsername AND User_id != @UserId)
            BEGIN
                RAISERROR('El nombre de usuario ya existe', 16, 1);
                RETURN;
            END
            
            UPDATE [USER]
            SET Username = @NewUsername
            WHERE User_id = @UserId;
        END
        
        -- Actualizar password si se proporciona
        IF @NewSalt IS NOT NULL AND @NewPasswordHash IS NOT NULL
        BEGIN
            UPDATE [USER]
            SET Salt = @NewSalt,
                PasswordHash = @NewPasswordHash
            WHERE User_id = @UserId;
        END
        
        -- Cambiar rol si se proporciona y es diferente
        IF @NewRole IS NOT NULL AND @NewRole != @CurrentRole
        BEGIN
            -- Eliminar rol actual
            DELETE FROM ADMIN WHERE User_id = @UserId;
            DELETE FROM ENGINEER WHERE User_id = @UserId;
            DELETE FROM DRIVER WHERE User_id = @UserId;
            
            -- Asignar nuevo rol
            IF @NewRole = 'Admin'
            BEGIN
                INSERT INTO ADMIN (User_id) VALUES (@UserId);
            END
            ELSE IF @NewRole = 'Engineer'
            BEGIN
                IF @NewTeamId IS NULL
                BEGIN
                    RAISERROR('TeamId es requerido para Engineer', 16, 1);
                    RETURN;
                END
                INSERT INTO ENGINEER (User_id, Team_id) VALUES (@UserId, @NewTeamId);
            END
            ELSE IF @NewRole = 'Driver'
            BEGIN
                IF @NewTeamId IS NULL
                BEGIN
                    RAISERROR('TeamId es requerido para Driver', 16, 1);
                    RETURN;
                END
                INSERT INTO DRIVER (User_id, Team_id, H) VALUES (@UserId, @NewTeamId, 85);
            END
        END
        ELSE IF @NewTeamId IS NOT NULL AND @CurrentRole IN ('Engineer', 'Driver')
        BEGIN
            -- Solo actualizar team si no cambió el rol
            IF @CurrentRole = 'Engineer'
            BEGIN
                UPDATE ENGINEER SET Team_id = @NewTeamId WHERE User_id = @UserId;
            END
            ELSE IF @CurrentRole = 'Driver'
            BEGIN
                UPDATE DRIVER SET Team_id = @NewTeamId WHERE User_id = @UserId;
            END
        END
        
        -- Retornar resultado actualizado
        SELECT 
            u.User_id,
            u.Username,
            CASE 
                WHEN a.User_id IS NOT NULL THEN 'Admin'
                WHEN e.User_id IS NOT NULL THEN 'Engineer'
                WHEN d.User_id IS NOT NULL THEN 'Driver'
            END as Role,
            COALESCE(e.Team_id, d.Team_id) as Team_id,
            'Usuario actualizado exitosamente' as Message
        FROM [USER] u
        LEFT JOIN ADMIN a ON u.User_id = a.User_id
        LEFT JOIN ENGINEER e ON u.User_id = e.User_id
        LEFT JOIN DRIVER d ON u.User_id = d.User_id
        WHERE u.User_id = @UserId;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO

-- 3. SP: Eliminar Usuario
-- =========================================
CREATE OR ALTER PROCEDURE sp_DeleteUser
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar que el usuario existe
        IF NOT EXISTS (SELECT 1 FROM [USER] WHERE User_id = @UserId)
        BEGIN
            RAISERROR('Usuario no encontrado', 16, 1);
            RETURN;
        END
        
        -- Eliminar de tablas de roles (CASCADE debería hacerlo automáticamente)
        DELETE FROM DRIVER WHERE User_id = @UserId;
        DELETE FROM ENGINEER WHERE User_id = @UserId;
        DELETE FROM ADMIN WHERE User_id = @UserId;
        
        -- Eliminar usuario
        DELETE FROM [USER] WHERE User_id = @UserId;
        
        SELECT 'Usuario eliminado exitosamente' as Message;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO

-- 4. SP: Obtener Todos los Usuarios
-- =========================================
CREATE OR ALTER PROCEDURE sp_GetAllUsers
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        u.User_id,
        u.Username,
        CASE 
            WHEN a.User_id IS NOT NULL THEN 'Admin'
            WHEN e.User_id IS NOT NULL THEN 'Engineer'
            WHEN d.User_id IS NOT NULL THEN 'Driver'
            ELSE 'Unknown'
        END as Role,
        COALESCE(e.Team_id, d.Team_id) as Team_id,
        t.Name as Team_name
    FROM [USER] u
    LEFT JOIN ADMIN a ON u.User_id = a.User_id
    LEFT JOIN ENGINEER e ON u.User_id = e.User_id
    LEFT JOIN DRIVER d ON u.User_id = d.User_id
    LEFT JOIN TEAM t ON t.Team_id = COALESCE(e.Team_id, d.Team_id)
    ORDER BY u.Username;
END
GO

-- 5. SP: Buscar Usuarios
-- =========================================
CREATE OR ALTER PROCEDURE sp_SearchUsers
    @SearchQuery NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        u.User_id,
        u.Username,
        CASE 
            WHEN a.User_id IS NOT NULL THEN 'Admin'
            WHEN e.User_id IS NOT NULL THEN 'Engineer'
            WHEN d.User_id IS NOT NULL THEN 'Driver'
            ELSE 'Unknown'
        END as Role,
        COALESCE(e.Team_id, d.Team_id) as Team_id,
        t.Name as Team_name
    FROM [USER] u
    LEFT JOIN ADMIN a ON u.User_id = a.User_id
    LEFT JOIN ENGINEER e ON u.User_id = e.User_id
    LEFT JOIN DRIVER d ON u.User_id = d.User_id
    LEFT JOIN TEAM t ON t.Team_id = COALESCE(e.Team_id, d.Team_id)
    WHERE u.Username LIKE '%' + @SearchQuery + '%'
    ORDER BY u.Username;
END
GO

-- =========================================
-- PRUEBAS DE LOS STORED PROCEDURES
-- =========================================

-- Test 1: Crear usuario Admin
-- EXEC sp_CreateUser 'testAdmin', 'salt123', 'hash123', 'Admin', NULL, NULL;

-- Test 2: Crear usuario Engineer
-- EXEC sp_CreateUser 'testEngineer', 'salt456', 'hash456', 'Engineer', 1, NULL;

-- Test 3: Actualizar username
-- EXEC sp_UpdateUser 1, 'newUsername', NULL, NULL, NULL, NULL;

-- Test 4: Listar todos
-- EXEC sp_GetAllUsers;

-- Test 5: Buscar usuarios
-- EXEC sp_SearchUsers 'test';

PRINT '✅ Stored Procedures de User Management creados exitosamente';
GO