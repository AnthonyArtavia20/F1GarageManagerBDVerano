-- =========================================
-- FUTURE: STORED PROCEDURE PARA CREAR USUARIOS
-- (Basado en el script automático)
-- =========================================

CREATE OR ALTER PROCEDURE sp_CreateBcryptUser
    @Username NVARCHAR(100),
    @PlainPassword NVARCHAR(100),  -- Contraseña en texto plano
    @UserType NVARCHAR(20),        -- 'Admin', 'Engineer', 'Driver'
    @TeamId INT = 1,
    @DriverH INT = 85
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- 1. Verificar si usuario ya existe
        IF EXISTS (SELECT 1 FROM [USER] WHERE Username = @Username)
        BEGIN
            RAISERROR('El usuario ya existe', 16, 1);
            RETURN;
        END
        
        -- 2. En producción: Generar hash bcrypt desde aplicación
        --    (No se puede desde SQL Server directamente)
        --    Por ahora, esperamos que el hash ya venga generado
        
        -- 3. Insertar usuario (EN PRODUCCIÓN: @PasswordHash vendría de la app)
        DECLARE @UserId INT;
        
        INSERT INTO [USER] (Username, Salt, PasswordHash)
        VALUES (@Username, 'auto_salt', @PlainPassword);  -- Temporal
        
        SET @UserId = SCOPE_IDENTITY();
        
        -- 4. Asignar rol según tipo
        IF @UserType = 'Admin'
        BEGIN
            INSERT INTO ADMIN (User_id) VALUES (@UserId);
        END
        ELSE IF @UserType = 'Engineer'
        BEGIN
            INSERT INTO ENGINEER (User_id, Team_id) VALUES (@UserId, @TeamId);
        END
        ELSE IF @UserType = 'Driver'
        BEGIN
            INSERT INTO DRIVER (User_id, Team_id, H) VALUES (@UserId, @TeamId, @DriverH);
        END
        
        -- 5. Retornar resultado
        SELECT 
            'Success' as Status,
            @UserId as UserId,
            @Username as Username,
            @UserType as UserType;
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        
        SELECT 
            'Error' as Status,
            ERROR_MESSAGE() as Message,
            ERROR_NUMBER() as ErrorNumber;
    END CATCH
END
GO

-- Ejemplo de uso:
-- EXEC sp_CreateBcryptUser 'linuxAdmin', 'linuxAdmin123*', 'Admin';
-- EXEC sp_CreateBcryptUser 'linuxEngineer', 'linuxEngineer123*', 'Engineer';
-- EXEC sp_CreateBcryptUser 'linuxDriver', 'linuxDriver123*', 'Driver';

PRINT '✅ Stored Procedure creada para el futuro';
PRINT '⚠️  NOTA: En producción, la app debe generar el hash bcrypt';
PRINT '         y pasar el hash ya generado como parámetro';
GO
