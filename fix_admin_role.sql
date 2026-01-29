-- Find winAdmin user_id and add to ADMIN table if not already there
USE F1GarageManager;
GO

DECLARE @winAdminId INT;

-- Get the User_id for winAdmin
SELECT @winAdminId = User_id FROM [USER] WHERE Username = 'winAdmin';

IF @winAdminId IS NOT NULL
BEGIN
    PRINT 'Found winAdmin with User_id: ' + CAST(@winAdminId AS VARCHAR(10));
    
    -- Check if already in ADMIN table
    IF NOT EXISTS (SELECT 1 FROM ADMIN WHERE User_id = @winAdminId)
    BEGIN
        INSERT INTO ADMIN (User_id) VALUES (@winAdminId);
        PRINT 'Added winAdmin to ADMIN table';
    END
    ELSE
    BEGIN
        PRINT 'winAdmin is already in ADMIN table';
    END
END
ELSE
BEGIN
    PRINT 'winAdmin user not found in USER table';
END
GO
