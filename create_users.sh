#!/bin/bash

# =========================================
# generate_users_universal.sh
# GENERADOR UNIVERSAL para backend corregido
# Compatible con: Linux, Windows, macOS
# =========================================

# Detectar sistema operativo
detect_os() {
    case "$(uname -s)" in
        Linux*)     OS="Linux" ;;
        Darwin*)    OS="macOS" ;;
        CYGWIN*|MINGW*|MSYS*) OS="Windows" ;;
        *)          OS="UNKNOWN" ;;
    esac
    echo "🖥️  Sistema detectado: $OS"
}

# Configuración
setup_config() {
    case "$OS" in
        Windows)    PREFIX="win" ;;
        Linux)      PREFIX="linux" ;;
        macOS)      PREFIX="mac" ;;
        *)          PREFIX="user" ;;
    esac
    
    # Opción para usar bcrypt (recomendado) o texto plano
    if [ "$1" == "--bcrypt" ]; then
        HASH_TYPE="bcrypt"
        echo "🔐 Usando: BCRYPT hash (recomendado para producción)"
    elif [ "$1" == "--plain" ]; then
        HASH_TYPE="plain"
        echo "📝 Usando: Texto plano (solo desarrollo)"
    else
        # Por defecto: texto plano para compatibilidad
        HASH_TYPE="plain"
        echo "📝 Usando: Texto plano (compatible con backend actual)"
    fi
    
    echo "📁 Prefijo: $PREFIX"
    echo "🔧 Tipo de hash: $HASH_TYPE"
}

# Generar contraseña según tipo
get_password() {
    local prefix=$1
    local user_type=$2
    
    case "$user_type" in
        Admin)      echo "${prefix}Admin123*" ;;
        Engineer)   echo "${prefix}Engineer123*" ;;
        Driver)     echo "${prefix}Driver123*" ;;
        *)          echo "${prefix}User123*" ;;
    esac
}

# Generar SQL UNIVERSAL según backend corregido
generate_universal_sql() {
    local prefix=$1
    local hash_type=$2
    local filename="setup_${prefix}_users_$(date '+%Y%m%d_%H%M%S').sql"
    
    # Contraseñas
    local admin_pass=$(get_password "$prefix" "Admin")
    local engineer_pass=$(get_password "$prefix" "Engineer")
    local driver_pass=$(get_password "$prefix" "Driver")
    
    cat > "$filename" << EOF
-- =========================================
-- USER SETUP FOR F1 GARAGE MANAGER
-- Generated: $(date '+%Y-%m-%d %H:%M:%S')
-- System: $OS
-- Prefix: $prefix
-- Hash Type: $hash_type
-- Backend Version: Corregido (compatible bcrypt/texto)
-- =========================================

USE F1GarageManager;
GO

PRINT '==========================================';
PRINT '   SETUP: ${prefix} users (${hash_type})';
PRINT '==========================================';
GO

-- 1. ELIMINAR USUARIOS EXISTENTES SI ES NECESARIO
PRINT '1. Limpiando usuarios ${prefix} existentes (si es necesario)...';
DELETE FROM DRIVER WHERE User_id IN (SELECT User_id FROM [USER] WHERE Username LIKE '${prefix}%');
DELETE FROM ENGINEER WHERE User_id IN (SELECT User_id FROM [USER] WHERE Username LIKE '${prefix}%');
DELETE FROM ADMIN WHERE User_id IN (SELECT User_id FROM [USER] WHERE Username LIKE '${prefix}%');
DELETE FROM [USER] WHERE Username LIKE '${prefix}%';
PRINT '   ✅ Usuarios ${prefix} eliminados';
GO

PRINT '';
PRINT '2. CREANDO USUARIOS ${prefix}:';
PRINT '   ----------------------------';
GO

-- Crear ${prefix}Admin
INSERT INTO [USER] (Username, Salt, PasswordHash)
VALUES (
    '${prefix}Admin', 
    '${hash_type}_salt', 
    '${admin_pass}'  -- 🔧 TEXTO PLANO (backend lo detecta automáticamente)
);
PRINT '   ✅ ${prefix}Admin creado';
PRINT '      Usuario: ${prefix}Admin';
PRINT '      Contraseña: ${admin_pass}';
GO

-- Crear ${prefix}Engineer
INSERT INTO [USER] (Username, Salt, PasswordHash)
VALUES (
    '${prefix}Engineer', 
    '${hash_type}_salt', 
    '${engineer_pass}'  -- 🔧 TEXTO PLANO
);
PRINT '   ✅ ${prefix}Engineer creado';
PRINT '      Usuario: ${prefix}Engineer';
PRINT '      Contraseña: ${engineer_pass}';
GO

-- Crear ${prefix}Driver
INSERT INTO [USER] (Username, Salt, PasswordHash)
VALUES (
    '${prefix}Driver', 
    '${hash_type}_salt', 
    '${driver_pass}'  -- 🔧 TEXTO PLANO
);
PRINT '   ✅ ${prefix}Driver creado';
PRINT '      Usuario: ${prefix}Driver';
PRINT '      Contraseña: ${driver_pass}';
GO

-- 3. OBTENER IDs PARA ASIGNAR ROLES
PRINT '';
PRINT '3. IDs DE USUARIOS CREADOS:';
PRINT '   ------------------------';
DECLARE @adminId INT, @engineerId INT, @driverId INT;

SELECT @adminId = User_id FROM [USER] WHERE Username = '${prefix}Admin';
SELECT @engineerId = User_id FROM [USER] WHERE Username = '${prefix}Engineer';
SELECT @driverId = User_id FROM [USER] WHERE Username = '${prefix}Driver';

SELECT 
    '${prefix}Admin' as Username, 
    @adminId as User_id,
    'Copiar → ' + CAST(@adminId AS VARCHAR(10)) as Instruccion
UNION ALL
SELECT 
    '${prefix}Engineer', 
    @engineerId,
    'Copiar → ' + CAST(@engineerId AS VARCHAR(10))
UNION ALL
SELECT 
    '${prefix}Driver', 
    @driverId,
    'Copiar → ' + CAST(@driverId AS VARCHAR(10));
GO

-- 4. ASIGNAR ROLES AUTOMÁTICAMENTE
PRINT '';
PRINT '4. ASIGNANDO ROLES AUTOMÁTICAMENTE:';
PRINT '   -------------------------------';
GO

-- Asignar ${prefix}Admin como ADMIN
INSERT INTO ADMIN (User_id) 
SELECT User_id FROM [USER] WHERE Username = '${prefix}Admin';
PRINT '   ✅ ${prefix}Admin asignado como ADMIN';
GO

-- Asignar ${prefix}Engineer como ENGINEER (Mercedes - Team 1)
INSERT INTO ENGINEER (User_id, Team_id) 
SELECT User_id, 1 FROM [USER] WHERE Username = '${prefix}Engineer';
PRINT '   ✅ ${prefix}Engineer asignado como ENGINEER (Team 1)';
GO

-- Asignar ${prefix}Driver como DRIVER (Mercedes - Team 1, H=85)
INSERT INTO DRIVER (User_id, Team_id, H) 
SELECT User_id, 1, 85 FROM [USER] WHERE Username = '${prefix}Driver';
PRINT '   ✅ ${prefix}Driver asignado como DRIVER (Team 1, H=85)';
GO

-- 5. VERIFICACIÓN COMPLETA
PRINT '';
PRINT '5. VERIFICACIÓN FINAL:';
PRINT '   -------------------';
SELECT 
    u.Username,
    u.User_id,
    CASE WHEN a.User_id IS NOT NULL THEN '✅ ADMIN' ELSE '❌' END AS Admin,
    CASE WHEN e.User_id IS NOT NULL THEN '✅ ENGINEER' ELSE '❌' END AS Engineer,
    CASE WHEN d.User_id IS NOT NULL THEN '✅ DRIVER' ELSE '❌' END AS Driver,
    e.Team_id as Engineer_Team,
    d.Team_id as Driver_Team,
    d.H as Driver_H,
    CASE 
        WHEN u.PasswordHash LIKE '$2%' THEN '🔐 Bcrypt'
        WHEN LEN(u.PasswordHash) < 30 THEN '📝 Texto plano'
        ELSE '❓ Desconocido'
    END as Hash_Type
FROM [USER] u
LEFT JOIN ADMIN a ON u.User_id = a.User_id
LEFT JOIN ENGINEER e ON u.User_id = e.User_id
LEFT JOIN DRIVER d ON u.User_id = d.User_id
WHERE u.Username IN ('${prefix}Admin', '${prefix}Engineer', '${prefix}Driver')
ORDER BY u.Username;
GO

-- 6. INFORMACIÓN DE COMPATIBILIDAD
PRINT '';
PRINT '6. COMPATIBILIDAD CON BACKEND:';
PRINT '   ---------------------------';
PRINT '   ✅ Este setup es COMPATIBLE con:';
PRINT '      • Backend corregido (authController.js v2)';
PRINT '      • Sistema: $OS';
PRINT '      • Hash: ${hash_type}';
PRINT '';
PRINT '   🔍 El backend DETECTA AUTOMÁTICAMENTE:';
PRINT '      • Si PasswordHash empieza con "$2" → usa bcrypt.compare()';
PRINT '      • Si PasswordHash es texto plano → compara directamente';
PRINT '';
PRINT '   📋 ESTADO ACTUAL:';
PRINT '      • Todos los usuarios usan TEXTO PLANO';
PRINT '      • Backend los detecta y compara correctamente';
PRINT '      • 100% funcional en desarrollo';
GO

PRINT '==========================================';
PRINT '   SETUP COMPLETADO EXITOSAMENTE';
PRINT '==========================================';
GO

-- 7. INFORMACIÓN DE LOGIN
PRINT '';
PRINT '🔑 CREDENCIALES PARA LOGIN:';
PRINT '   ========================';
PRINT '   Sistema: ${prefix}';
PRINT '   Backend: http://localhost:9090';
PRINT '   Frontend: http://localhost:8080';
PRINT '';
PRINT '   ┌─────────────────────┬──────────────────────┐';
PRINT '   │ Usuario            │ Contraseña           │';
PRINT '   ├─────────────────────┼──────────────────────┤';
PRINT '   │ ${prefix}Admin      │ ${admin_pass}        │';
PRINT '   │ ${prefix}Engineer   │ ${engineer_pass}     │';
PRINT '   │ ${prefix}Driver     │ ${driver_pass}       │';
PRINT '   └─────────────────────┴──────────────────────┘';
PRINT '';
PRINT '⚠️  IMPORTANTE PARA PRODUCCIÓN:';
PRINT '   Cambia a bcrypt ejecutando:';
PRINT '   ./generate_users_universal.sh --bcrypt';
PRINT '   (Requiere backend con bcrypt.compare())';
GO
EOF
    
    echo "$filename"
}

# Generar SQL con BCRYPT (opcional)
generate_bcrypt_sql() {
    local prefix=$1
    local filename="setup_${prefix}_bcrypt_$(date '+%Y%m%d_%H%M%S').sql"
    
    cat > "$filename" << EOF
-- =========================================
-- BCRYPT SETUP (PARA PRODUCCIÓN)
-- Generated: $(date '+%Y-%m-%d %H:%M:%S')
-- System: $OS
-- Prefix: $prefix
-- Hash Type: BCRYPT
-- =========================================
-- NOTA: Los hashes bcrypt deben generarse desde Node.js
-- Ejecuta: node generate_bcrypt_hashes.js
-- =========================================

USE F1GarageManager;
GO

PRINT '⚠️  IMPORTANTE: Este SQL requiere hashes bcrypt generados desde Node.js';
PRINT 'Ejecuta primero: node generate_bcrypt_hashes.js';
GO

-- Aquí irían los INSERT con hashes bcrypt reales
-- Ejemplo:
-- INSERT INTO [USER] (Username, Salt, PasswordHash) VALUES
-- ('${prefix}Admin', 'bcrypt_salt', '\$2a\$10\$hashtoken...');

PRINT '';
PRINT '✅ Para producción, usa texto plano primero y luego migra a bcrypt';
GO
EOF
    
    echo "$filename"
}

# Crear script para generar hashes bcrypt
create_bcrypt_generator() {
    cat > generate_bcrypt_hashes.js << 'EOF'
// generate_bcrypt_hashes.js
// Genera hashes bcrypt para todos los usuarios

const bcrypt = require('bcryptjs');

async function generateHashes() {
    console.log('🔐 GENERANDOR DE HASHES BCRYPT');
    console.log('===============================\n');
    
    const users = [
        { prefix: 'win', type: 'Admin', password: 'winAdmin123*' },
        { prefix: 'win', type: 'Engineer', password: 'winEngineer123*' },
        { prefix: 'win', type: 'Driver', password: 'winDriver123*' },
        { prefix: 'linux', type: 'Admin', password: 'linuxAdmin123*' },
        { prefix: 'linux', type: 'Engineer', password: 'linuxEngineer123*' },
        { prefix: 'linux', type: 'Driver', password: 'linuxDriver123*' },
        { prefix: 'mac', type: 'Admin', password: 'macAdmin123*' },
        { prefix: 'mac', type: 'Engineer', password: 'macEngineer123*' },
        { prefix: 'mac', type: 'Driver', password: 'macDriver123*' }
    ];
    
    console.log('📋 SQL LISTO PARA COPIAR:\n');
    console.log('USE F1GarageManager;');
    console.log('GO\n');
    
    for (const user of users) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(user.password, salt);
        const username = `${user.prefix}${user.type}`;
        
        console.log(`-- ${username}`);
        console.log(`UPDATE [USER] SET`);
        console.log(`    PasswordHash = '${hash}',`);
        console.log(`    Salt = '${salt}'`);
        console.log(`WHERE Username = '${username}';`);
        console.log(`GO\n`);
        
        // Verificar
        const isValid = await bcrypt.compare(user.password, hash);
        console.log(`-- ✅ Verificación: ${isValid ? 'PASS' : 'FAIL'}`);
        console.log(`-- 👤 Usuario: ${username}`);
        console.log(`-- 🔐 Hash (primeros 30 chars): ${hash.substring(0, 30)}...`);
        console.log('');
    }
    
    console.log('✅ Hashes generados. Copia el SQL arriba en SSMS.');
}

generateHashes().catch(console.error);
EOF
    
    echo "generate_bcrypt_hashes.js"
}

# Mostrar instrucciones
show_instructions() {
    local prefix=$1
    local sql_file=$2
    local hash_type=$3
    
    echo ""
    echo "=========================================="
    echo "   ✅ SQL FILE GENERATED - BACKEND V2"
    echo "=========================================="
    echo ""
    echo "📁 File: $sql_file"
    echo "🔧 Hash Type: $hash_type"
    echo "🖥️  OS: $OS"
    echo ""
    echo "📋 ¿QUÉ HACE ESTE SQL?"
    echo "   1. Elimina usuarios existentes del mismo prefijo"
    echo "   2. Crea usuarios con texto plano (compatible)"
    echo "   3. Asigna roles automáticamente"
    echo "   4. Verifica todo el setup"
    echo ""
    echo "🚀 CÓMO USAR:"
    echo "   1. Abrir SSMS"
    echo "   2. File → Open → Seleccionar '$sql_file'"
    echo "   3. Presionar F5 para ejecutar TODO"
    echo "   4. Los usuarios quedan listos para usar"
    echo ""
    echo "🔑 CREDENCIALES:"
    echo "   ┌─────────────────────┬──────────────────────┐"
    echo "   │ Usuario            │ Contraseña           │"
    echo "   ├─────────────────────┼──────────────────────┤"
    echo "   │ ${prefix}Admin      │ ${prefix}Admin123*    │"
    echo "   │ ${prefix}Engineer   │ ${prefix}Engineer123* │"
    echo "   │ ${prefix}Driver     │ ${prefix}Driver123*   │"
    echo "   └─────────────────────┴──────────────────────┘"
    echo ""
    echo "🌍 URLs:"
    echo "   Frontend: http://localhost:8080"
    echo "   Backend:  http://localhost:9090"
    echo ""
    echo "⚠️  IMPORTANTE:"
    echo "   Este setup usa TEXTO PLANO para desarrollo."
    echo "   Para producción, ejecuta con --bcrypt"
    echo ""
    echo "=========================================="
}

# Proceso principal
main() {
    clear
    echo "=========================================="
    echo "   🚀 F1 GARAGE - GENERADOR UNIVERSAL"
    echo "   Backend V2 Compatible"
    echo "=========================================="
    echo ""
    echo "Opciones:"
    echo "  --plain    Texto plano (default, desarrollo)"
    echo "  --bcrypt   Hash bcrypt (producción)"
    echo ""
    
    detect_os
    
    # Procesar argumentos
    local hash_type="plain"
    if [ "$1" == "--bcrypt" ]; then
        hash_type="bcrypt"
    fi
    
    setup_config "$1"
    
    echo ""
    echo "🔍 Generando SQL file..."
    echo ""
    
    # Generar archivo SQL
    if [ "$hash_type" == "bcrypt" ]; then
        sql_file=$(generate_bcrypt_sql "$PREFIX")
        bcrypt_script=$(create_bcrypt_generator)
        echo "📄 También creado: $bcrypt_script"
        echo "   Ejecuta: node $bcrypt_script para generar hashes reales"
    else
        sql_file=$(generate_universal_sql "$PREFIX" "$hash_type")
    fi
    
    # Mostrar instrucciones
    show_instructions "$PREFIX" "$sql_file" "$hash_type"
    
    # Mostrar vista previa
    echo ""
    echo "📜 VISTA PREVIA (primeras 25 líneas):"
    echo "------------------------------------------"
    head -25 "$sql_file"
    echo "------------------------------------------"
    echo "... (archivo completo: $sql_file)"
    echo ""
    
    if [ "$hash_type" == "plain" ]; then
        echo "✅ ¡Listo! Ejecuta el SQL en SSMS y los usuarios funcionarán inmediatamente."
    else
        echo "⚠️  Para bcrypt: Primero genera los hashes, luego actualiza el SQL."
    fi
    
    echo ""
    echo "💡 Tip: Para convertir usuarios existentes a bcrypt después:"
    echo "      ./generate_users_universal.sh --bcrypt"
}

# Ejecutar
main "$@"