#!/bin/bash

# =========================================
# generate_user_sql_corrected.sh
# SQL corregido para la estructura REAL de la BD
# =========================================

# Detectar sistema operativo
detect_os() {
    case "$(uname -s)" in
        Linux*)     OS="Linux" ;;
        Darwin*)    OS="macOS" ;;
        CYGWIN*|MINGW*|MSYS*) OS="Windows" ;;
        *)          OS="UNKNOWN" ;;
    esac
    echo "🖥️  Sistema: $OS"
}

# Configuración
setup_config() {
    case "$OS" in
        Windows)    PREFIX="win" ;;
        Linux)      PREFIX="linux" ;;
        macOS)      PREFIX="mac" ;;
        *)          PREFIX="user" ;;
    esac
    
    echo "📁 Prefijo: $PREFIX"
}

# Generar SQL CORREGIDO según estructura real
generate_correct_sql() {
    local prefix=$1
    local filename="setup_${prefix}_users_$(date '+%Y%m%d_%H%M%S').sql"
    
    cat > "$filename" << EOF
-- =========================================
-- USER SETUP FOR F1 GARAGE MANAGER
-- Generated: $(date '+%Y-%m-%d %H:%M:%S')
-- System: $OS
-- Prefix: $prefix
-- =========================================

USE F1GarageManager;
GO

PRINT '==========================================';
PRINT '   SETUP: ${prefix} users';
PRINT '==========================================';
GO

-- 1. CHECK EXISTING USERS
PRINT '1. Checking existing users...';
SELECT Username, User_id FROM [USER] 
WHERE Username IN ('${prefix}Admin', '${prefix}Engineer', '${prefix}Driver');
GO

PRINT '';
PRINT '2. CREATE USERS (if missing):';
PRINT '   --------------------------';
GO

-- Create ${prefix}Admin if doesn't exist
IF NOT EXISTS (SELECT 1 FROM [USER] WHERE Username = '${prefix}Admin')
BEGIN
    INSERT INTO [USER] (Username, Salt, PasswordHash)
    VALUES ('${prefix}Admin', 'salt123', CONVERT(VARCHAR(255), HASHBYTES('SHA2_256', '${prefix}Admin123*'), 2));
    PRINT '   ✅ ${prefix}Admin created';
END
ELSE 
    PRINT '   ⚠  ${prefix}Admin already exists';
GO

-- Create ${prefix}Engineer if doesn't exist
IF NOT EXISTS (SELECT 1 FROM [USER] WHERE Username = '${prefix}Engineer')
BEGIN
    INSERT INTO [USER] (Username, Salt, PasswordHash)
    VALUES ('${prefix}Engineer', 'salt123', CONVERT(VARCHAR(255), HASHBYTES('SHA2_256', '${prefix}Engineer123*'), 2));
    PRINT '   ✅ ${prefix}Engineer created';
END
ELSE 
    PRINT '   ⚠  ${prefix}Engineer already exists';
GO

-- Create ${prefix}Driver if doesn't exist
IF NOT EXISTS (SELECT 1 FROM [USER] WHERE Username = '${prefix}Driver')
BEGIN
    INSERT INTO [USER] (Username, Salt, PasswordHash)
    VALUES ('${prefix}Driver', 'salt123', CONVERT(VARCHAR(255), HASHBYTES('SHA2_256', '${prefix}Driver123*'), 2));
    PRINT '   ✅ ${prefix}Driver created';
END
ELSE 
    PRINT '   ⚠  ${prefix}Driver already exists';
GO

-- 3. SHOW ALL USERS WITH THEIR IDs
PRINT '';
PRINT '3. Current users with IDs:';
PRINT '   -----------------------';
SELECT 
    User_id,
    Username,
    'Created' as Status
FROM [USER] 
WHERE Username IN ('${prefix}Admin', '${prefix}Engineer', '${prefix}Driver')
ORDER BY Username;
GO

-- 4. ROLE ASSIGNMENT INSTRUCTIONS
PRINT '';
PRINT '4. ASSIGN ROLES MANUALLY:';
PRINT '   ----------------------';
PRINT '   Copy the User_id values above and use them below:';
PRINT '';
PRINT '   Example (replace X, Y, Z with actual IDs):';
PRINT '   ------------------------------------------';
PRINT '   -- ${prefix}Admin as ADMIN';
INSERT INTO ADMIN (User_id) VALUES (X);';
PRINT '';
PRINT '   -- ${prefix}Engineer as ENGINEER (Mercedes - Team_id 1)';
INSERT INTO ENGINEER (User_id, Team_id) VALUES (Y, 1);';
PRINT '';
PRINT '   -- ${prefix}Driver as DRIVER (Mercedes - Team_id 1)';
INSERT INTO DRIVER (User_id, Team_id, H) VALUES (Z, 1, 85);';
GO

-- 5. VERIFY CURRENT ROLES
PRINT '';
PRINT '5. CURRENT ROLE ASSIGNMENTS:';
PRINT '   -------------------------';
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
WHERE u.Username IN ('${prefix}Admin', '${prefix}Engineer', '${prefix}Driver');
GO

PRINT '==========================================';
PRINT '   SETUP COMPLETED';
PRINT '==========================================';
GO

-- 6. LOGIN INFORMATION
PRINT '';
PRINT 'LOGIN CREDENTIALS:';
PRINT '  Username: ${prefix}Admin     Password: ${prefix}Admin123*';
PRINT '  Username: ${prefix}Engineer  Password: ${prefix}Engineer123*';
PRINT '  Username: ${prefix}Driver    Password: ${prefix}Driver123*';
PRINT '';
PRINT 'Access: http://localhost:8080';
GO
EOF
    
    echo "$filename"
}

# Mostrar instrucciones
show_instructions() {
    local prefix=$1
    local sql_file=$2
    
    echo ""
    echo "=========================================="
    echo "   ✅ SQL FILE GENERATED"
    echo "=========================================="
    echo ""
    echo "📁 File: $sql_file"
    echo ""
    echo "📋 WHAT THIS SQL DOES:"
    echo "   1. Checks if users already exist"
    echo "   2. Creates users if they don't exist"
    echo "   3. Shows User IDs"
    echo "   4. Gives instructions to assign roles"
    echo "   5. Shows current role assignments"
    echo ""
    echo "🚀 HOW TO USE:"
    echo "   1. Open SSMS"
    echo "   2. File → Open → Select '$sql_file'"
    echo "   3. Press F5 to execute"
    echo "   4. Copy the User IDs shown"
    echo "   5. Use them to assign roles"
    echo ""
    echo "🔑 CREDENTIALS:"
    echo "   ┌──────────────────┬──────────────────────┐"
    echo "   │ Username         │ Password             │"
    echo "   ├──────────────────┼──────────────────────┤"
    echo "   │ ${prefix}Admin    │ ${prefix}Admin123*    │"
    echo "   │ ${prefix}Engineer │ ${prefix}Engineer123* │"
    echo "   │ ${prefix}Driver   │ ${prefix}Driver123*   │"
    echo "   └──────────────────┴──────────────────────┘"
    echo ""
    echo "🌍 Application: http://localhost:8080"
    echo ""
    echo "=========================================="
}

# Proceso principal
main() {
    clear
    echo "=========================================="
    echo "   🚀 F1 GARAGE - SQL GENERATOR"
    echo "=========================================="
    echo ""
    
    detect_os
    setup_config
    
    echo ""
    echo "🔍 Generating SQL file..."
    echo ""
    
    # Generar archivo SQL
    sql_file=$(generate_correct_sql "$PREFIX")
    
    # Mostrar instrucciones
    show_instructions "$PREFIX" "$sql_file"
    
    # Mostrar vista previa
    echo ""
    echo "📜 SQL PREVIEW (first 20 lines):"
    echo "------------------------------------------"
    head -20 "$sql_file"
    echo "------------------------------------------"
    echo "... (complete file: $sql_file)"
    echo ""
    
    echo "✅ Done! Execute the SQL file in SSMS."
}

# Ejecutar
main "$@"