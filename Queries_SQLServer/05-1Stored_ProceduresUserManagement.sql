-- ============================================================================
-- F1 Garage Manager
-- Parte 5.1: Stored Procedures para User Management (ACTUALIZADO)
-- Permite TeamId NULL para Engineer y Driver
-- ============================================================================
USE F1GarageManager;
GO

-- ============================================================================
-- 1. SP: Crear Usuario (ACTUALIZADO - TeamId opcional)
-- ============================================================================
IF OBJECT_ID('sp_CreateUser', 'P') IS NOT NULL
    DROP PROCEDURE sp_CreateUser;
GO

CREATE PROCEDURE sp_CreateUser
    @Username NVARCHAR(100),
    @Salt NVARCHAR(255),
    @PasswordHash NVARCHAR(255),
    @Role NVARCHAR(20),        -- 'Admin', 'Engineer', 'Driver'
    @TeamId INT = NULL,        -- AHORA ES OPCIONAL para Engineer/Driver
    @DriverH INT = 85          -- Opcional, solo para Driver
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Validar que el username no exista
        IF EXISTS (SELECT 1 FROM [USER] WHERE Username = @Username)
            THROW 51001, 'El nombre de usuario ya existe', 1;
        
        -- Validar rol
        IF @Role NOT IN ('Admin', 'Engineer', 'Driver')
            THROW 51002, 'Rol inválido. Debe ser: Admin, Engineer o Driver', 1;
        
        -- CAMBIO: Ya NO validamos que TeamId sea obligatorio
        -- Engineer y Driver ahora pueden tener TeamId = NULL
        
        -- Insertar usuario
        DECLARE @UserId INT;
        
        INSERT INTO [USER] (Username, Salt, PasswordHash)
        VALUES (@Username, @Salt, @PasswordHash);
        
        SET @UserId = SCOPE_IDENTITY();
        
        -- Asignar rol según tipo
        IF @Role = 'Admin'
            INSERT INTO ADMIN (User_id) VALUES (@UserId);
        ELSE IF @Role = 'Engineer'
            INSERT INTO ENGINEER (User_id, Team_id) VALUES (@UserId, @TeamId); -- ✅ Permite NULL
        ELSE IF @Role = 'Driver'
            INSERT INTO DRIVER (User_id, Team_id, H) VALUES (@UserId, @TeamId, @DriverH); -- ✅ Permite NULL
        
        -- Retornar resultado
        SELECT 
            'OK' AS Status,
            @UserId AS User_id,
            @Username AS Username,
            @Role AS Role,
            @TeamId AS Team_id,
            'Usuario creado exitosamente' AS Message;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

PRINT '✅ SP sp_CreateUser creado (TeamId opcional)';
GO

-- ============================================================================
-- 2. SP: Actualizar Usuario (ACTUALIZADO - Permite quitar TeamId)
-- ============================================================================
IF OBJECT_ID('sp_UpdateUser', 'P') IS NOT NULL
    DROP PROCEDURE sp_UpdateUser;
GO

CREATE PROCEDURE sp_UpdateUser
    @UserId INT,
    @NewUsername NVARCHAR(100) = NULL,
    @NewSalt NVARCHAR(255) = NULL,
    @NewPasswordHash NVARCHAR(255) = NULL,
    @NewRole NVARCHAR(20) = NULL,
    @NewTeamId INT = NULL, -- Puede ser NULL para quitar equipo
    @UpdateTeamId BIT = 0  -- Flag para saber si actualizar TeamId
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar que el usuario existe
        IF NOT EXISTS (SELECT 1 FROM [USER] WHERE User_id = @UserId)
            THROW 51004, 'Usuario no encontrado', 1;
        
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
                THROW 51005, 'El nombre de usuario ya existe', 1;
            
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
                INSERT INTO ADMIN (User_id) VALUES (@UserId);
            ELSE IF @NewRole = 'Engineer'
                INSERT INTO ENGINEER (User_id, Team_id) VALUES (@UserId, @NewTeamId);
            ELSE IF @NewRole = 'Driver'
                INSERT INTO DRIVER (User_id, Team_id, H) VALUES (@UserId, @NewTeamId, 85);
        END
        ELSE IF @UpdateTeamId = 1 AND @CurrentRole IN ('Engineer', 'Driver')
        BEGIN
            -- ✅ Solo actualizar si el flag está activado
            IF @CurrentRole = 'Engineer'
                UPDATE ENGINEER SET Team_id = @NewTeamId WHERE User_id = @UserId;
            ELSE IF @CurrentRole = 'Driver'
                UPDATE DRIVER SET Team_id = @NewTeamId WHERE User_id = @UserId;
        END
        
        -- Retornar resultado actualizado
        SELECT 
            'OK' AS Status,
            u.User_id,
            u.Username,
            CASE 
                WHEN a.User_id IS NOT NULL THEN 'Admin'
                WHEN e.User_id IS NOT NULL THEN 'Engineer'
                WHEN d.User_id IS NOT NULL THEN 'Driver'
            END AS Role,
            COALESCE(e.Team_id, d.Team_id) AS Team_id,
            'Usuario actualizado exitosamente' AS Message
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
        THROW;
    END CATCH
END
GO

PRINT '✅ SP sp_UpdateUser creado (permite quitar TeamId)';
GO

-- ============================================================================
-- 3. SP: Eliminar Usuario
-- ============================================================================
IF OBJECT_ID('sp_DeleteUser', 'P') IS NOT NULL
    DROP PROCEDURE sp_DeleteUser;
GO

CREATE PROCEDURE sp_DeleteUser
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar que el usuario existe
        IF NOT EXISTS (SELECT 1 FROM [USER] WHERE User_id = @UserId)
            THROW 51008, 'Usuario no encontrado', 1;
        
        -- Obtener info del usuario antes de eliminar
        DECLARE @Username NVARCHAR(100);
        DECLARE @Role NVARCHAR(20);
        
        SELECT @Username = Username,
                @Role = CASE 
                    WHEN EXISTS (SELECT 1 FROM ADMIN WHERE User_id = @UserId) THEN 'Admin'
                    WHEN EXISTS (SELECT 1 FROM ENGINEER WHERE User_id = @UserId) THEN 'Engineer'
                    WHEN EXISTS (SELECT 1 FROM DRIVER WHERE User_id = @UserId) THEN 'Driver'
                    ELSE 'Unknown'
                END
        FROM [USER]
        WHERE User_id = @UserId;
        
        -- Eliminar de tablas de roles
        DELETE FROM DRIVER WHERE User_id = @UserId;
        DELETE FROM ENGINEER WHERE User_id = @UserId;
        DELETE FROM ADMIN WHERE User_id = @UserId;
        
        -- Eliminar usuario
        DELETE FROM [USER] WHERE User_id = @UserId;
        
        SELECT 
            'OK' AS Status,
            @UserId AS Deleted_User_id,
            @Username AS Deleted_Username,
            @Role AS Deleted_Role,
            'Usuario eliminado exitosamente' AS Message;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

PRINT '✅ SP sp_DeleteUser creado';
GO

-- ============================================================================
-- 4. SP: Obtener Todos los Usuarios
-- ============================================================================
IF OBJECT_ID('sp_GetAllUsers', 'P') IS NOT NULL
    DROP PROCEDURE sp_GetAllUsers;
GO

CREATE PROCEDURE sp_GetAllUsers
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            u.User_id,
            u.Username,
            CASE 
                WHEN a.User_id IS NOT NULL THEN 'Admin'
                WHEN e.User_id IS NOT NULL THEN 'Engineer'
                WHEN d.User_id IS NOT NULL THEN 'Driver'
                ELSE 'Unknown'
            END AS Role,
            COALESCE(e.Team_id, d.Team_id) AS Team_id,
            t.Name AS Team_name
        FROM [USER] u
        LEFT JOIN ADMIN a ON u.User_id = a.User_id
        LEFT JOIN ENGINEER e ON u.User_id = e.User_id
        LEFT JOIN DRIVER d ON u.User_id = d.User_id
        LEFT JOIN TEAM t ON t.Team_id = COALESCE(e.Team_id, d.Team_id)
        ORDER BY u.Username;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

PRINT '✅ SP sp_GetAllUsers creado';
GO

-- ============================================================================
-- 5. SP: Buscar Usuarios
-- ============================================================================
IF OBJECT_ID('sp_SearchUsers', 'P') IS NOT NULL
    DROP PROCEDURE sp_SearchUsers;
GO

CREATE PROCEDURE sp_SearchUsers
    @SearchQuery NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            u.User_id,
            u.Username,
            CASE 
                WHEN a.User_id IS NOT NULL THEN 'Admin'
                WHEN e.User_id IS NOT NULL THEN 'Engineer'
                WHEN d.User_id IS NOT NULL THEN 'Driver'
                ELSE 'Unknown'
            END AS Role,
            COALESCE(e.Team_id, d.Team_id) AS Team_id,
            t.Name AS Team_name
        FROM [USER] u
        LEFT JOIN ADMIN a ON u.User_id = a.User_id
        LEFT JOIN ENGINEER e ON u.User_id = e.User_id
        LEFT JOIN DRIVER d ON u.User_id = d.User_id
        LEFT JOIN TEAM t ON t.Team_id = COALESCE(e.Team_id, d.Team_id)
        WHERE u.Username LIKE '%' + @SearchQuery + '%'
        ORDER BY u.Username;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

PRINT '✅ SP sp_SearchUsers creado';
GO

-- ============================================================================
-- 6. SP: Obtener Usuario por ID
-- ============================================================================
IF OBJECT_ID('sp_GetUserById', 'P') IS NOT NULL
    DROP PROCEDURE sp_GetUserById;
GO

CREATE PROCEDURE sp_GetUserById
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        SELECT 
            u.User_id,
            u.Username,
            CASE 
                WHEN a.User_id IS NOT NULL THEN 'Admin'
                WHEN e.User_id IS NOT NULL THEN 'Engineer'
                WHEN d.User_id IS NOT NULL THEN 'Driver'
                ELSE 'Unknown'
            END AS Role,
            COALESCE(e.Team_id, d.Team_id) AS Team_id,
            t.Name AS Team_name
        FROM [USER] u
        LEFT JOIN ADMIN a ON u.User_id = a.User_id
        LEFT JOIN ENGINEER e ON u.User_id = e.User_id
        LEFT JOIN DRIVER d ON u.User_id = d.User_id
        LEFT JOIN TEAM t ON t.Team_id = COALESCE(e.Team_id, d.Team_id)
        WHERE u.User_id = @UserId;
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

PRINT '✅ SP sp_GetUserById creado';
GO
