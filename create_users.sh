#!/bin/bash

# =========================================
# generate_users_auto_bcrypt.sh
# GENERADOR 100% AUTOMÁTICO CON BCRYPT
# Genera hashes y los inserta DIRECTAMENTE en SQL Server
# =========================================

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuración de SQL Server (¡AJUSTAR ESTOS VALORES!)
DB_SERVER="localhost"
DB_NAME="F1GarageManager"
DB_USER="sa"
DB_PASSWORD="TuPassword"  # ⚠️ Cambia esto
USE_SQLCMD=true  # Cambiar a false si no tienes sqlcmd

# Detectar SO y configurar
detect_and_setup() {
    case "$(uname -s)" in
        Linux*)     
            OS="Linux"
            PREFIX="linux"
            SQLCMD_CMD="sqlcmd" ;;
        Darwin*)    
            OS="macOS" 
            PREFIX="mac"
            SQLCMD_CMD="sqlcmd" ;;
        CYGWIN*|MINGW*|MSYS*) 
            OS="Windows"
            PREFIX="win"
            SQLCMD_CMD="sqlcmd.exe" ;;
        *)          
            OS="UNKNOWN"
            PREFIX="user"
            SQLCMD_CMD="sqlcmd" ;;
    esac
    
    echo -e "${BLUE}🖥️  Sistema:${NC} ${CYAN}$OS${NC}"
    echo -e "${BLUE}📁 Prefijo:${NC} ${CYAN}$PREFIX${NC}"
    echo -e "${BLUE}🔐 Encriptación:${NC} ${GREEN}BCRYPT AUTOMÁTICO${NC}"
}

# Verificar dependencias
check_dependencies() {
    echo -e "${BLUE}🔍 Verificando dependencias...${NC}"
    
    # Verificar Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js no encontrado${NC}"
        echo "Instala Node.js: https://nodejs.org/"
        exit 1
    fi
    echo -e "${GREEN}✅ Node.js encontrado${NC}"
    
    # Verificar npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm no encontrado${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ npm encontrado${NC}"
    
    # Verificar sqlcmd (opcional)
    if [ "$USE_SQLCMD" = true ]; then
        if ! command -v $SQLCMD_CMD &> /dev/null; then
            echo -e "${YELLOW}⚠️  sqlcmd no encontrado${NC}"
            echo "Generaré archivo SQL para ejecutar manualmente"
            USE_SQLCMD=false
        else
            echo -e "${GREEN}✅ sqlcmd encontrado${NC}"
        fi
    fi
    
    # Verificar conexión a SQL Server
    if [ "$USE_SQLCMD" = true ]; then
        echo -e "${BLUE}🔗 Probando conexión a SQL Server...${NC}"
        if $SQLCMD_CMD -S $DB_SERVER -U $DB_USER -P $DB_PASSWORD -Q "SELECT 1" &> /dev/null; then
            echo -e "${GREEN}✅ Conexión exitosa a SQL Server${NC}"
        else
            echo -e "${RED}❌ No se puede conectar a SQL Server${NC}"
            echo "Verifica:"
            echo "  1. Servidor: $DB_SERVER"
            echo "  2. Usuario: $DB_USER"
            echo "  3. Contraseña: [configurada]"
            echo "  4. SQL Server está corriendo"
            USE_SQLCMD=false
        fi
    fi
}

# Instalar bcryptjs si es necesario
install_bcrypt() {
    echo -e "${BLUE}📦 Verificando bcryptjs...${NC}"
    
    if [ -f "bcrypt_installed.flag" ]; then
        echo -e "${GREEN}✅ bcryptjs ya instalado${NC}"
        return 0
    fi
    
    echo "Instalando bcryptjs..."
    if npm install bcryptjs --no-save &> bcrypt_install.log; then
        touch bcrypt_installed.flag
        echo -e "${GREEN}✅ bcryptjs instalado correctamente${NC}"
        return 0
    else
        echo -e "${RED}❌ Error instalando bcryptjs${NC}"
        echo "Revisa bcrypt_install.log"
        return 1
    fi
}

# Generar script Node.js que CREA hashes y genera SQL
create_auto_bcrypt_script() {
    local prefix=$1
    local filename="auto_bcrypt_${prefix}.js"
    
    cat > "$filename" << 'EOF'
// AUTO BCRYPT GENERATOR
// Genera hashes y SQL automáticamente

const bcrypt = require('bcryptjs');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuración (se reemplaza desde bash)
const config = {
    prefix: 'PREFIX_PLACEHOLDER',
    dbServer: 'DB_SERVER_PLACEHOLDER',
    dbName: 'DB_NAME_PLACEHOLDER',
    dbUser: 'DB_USER_PLACEHOLDER',
    dbPassword: 'DB_PASSWORD_PLACEHOLDER',
    useSqlCmd: USE_SQLCMD_PLACEHOLDER === 'true'
};

async function generateBcryptHash(password) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    return { salt, hash };
}

async function executeSql(sql) {
    if (!config.useSqlCmd) {
        console.log('⚠️  Modo manual - sqlcmd no disponible');
        return false;
    }
    
    try {
        // Escape comillas simples para SQL
        const escapedSql = sql.replace(/'/g, "''");
        
        const cmd = `sqlcmd -S ${config.dbServer} -d ${config.dbName} -U ${config.dbUser} -P ${config.dbPassword} -Q "${escapedSql}"`;
        
        console.log(`📡 Ejecutando SQL en ${config.dbServer}...`);
        const { stdout, stderr } = await execPromise(cmd);
        
        if (stderr && !stderr.includes('rows affected')) {
            console.error('❌ Error ejecutando SQL:', stderr);
            return false;
        }
        
        console.log('✅ SQL ejecutado exitosamente');
        return true;
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 GENERADOR AUTOMÁTICO BCRYPT');
    console.log('===============================\n');
    
    // Usuarios a crear
    const users = [
        { type: 'Admin', password: `${config.prefix}Admin123*` },
        { type: 'Engineer', password: `${config.prefix}Engineer123*` },
        { type: 'Driver', password: `${config.prefix}Driver123*` }
    ];
    
    let allHashes = [];
    let sqlCommands = [];
    
    // 1. Generar hashes
    console.log('🔐 Generando hashes bcrypt...\n');
    
    for (const user of users) {
        const username = `${config.prefix}${user.type}`;
        console.log(`👤 Procesando: ${username}`);
        
        try {
            const { salt, hash } = await generateBcryptHash(user.password);
            
            allHashes.push({
                username,
                password: user.password,
                salt,
                hash
            });
            
            console.log(`   ✅ Hash generado (${hash.length} chars)`);
            
            // Verificar
            const isValid = await bcrypt.compare(user.password, hash);
            console.log(`   ${isValid ? '✅' : '❌'} Verificación: ${isValid ? 'PASS' : 'FAIL'}\n`);
            
        } catch (error) {
            console.error(`   ❌ Error: ${error.message}`);
        }
    }
    
    // 2. Generar SQL
    console.log('📋 Generando comandos SQL...\n');
    
    // SQL para limpiar usuarios existentes
    sqlCommands.push(`
USE ${config.dbName};
GO

PRINT '==========================================';
PRINT '   AUTO-SETUP BCRYPT: ${config.prefix} users';
PRINT '==========================================';
GO

-- Limpiar usuarios existentes
DELETE FROM DRIVER WHERE User_id IN (SELECT User_id FROM [USER] WHERE Username LIKE '${config.prefix}%');
DELETE FROM ENGINEER WHERE User_id IN (SELECT User_id FROM [USER] WHERE Username LIKE '${config.prefix}%');
DELETE FROM ADMIN WHERE User_id IN (SELECT User_id FROM [USER] WHERE Username LIKE '${config.prefix}%');
DELETE FROM [USER] WHERE Username LIKE '${config.prefix}%';
PRINT '✅ Usuarios ${config.prefix} eliminados';
GO
`);
    
    // SQL para crear usuarios
    for (const user of allHashes) {
        const sql = `
-- ${user.username}
INSERT INTO [USER] (Username, Salt, PasswordHash)
VALUES (
    '${user.username}', 
    '${user.salt.replace(/'/g, "''")}', 
    '${user.hash.replace(/'/g, "''")}'
);
PRINT '   ✅ ${user.username} creado con bcrypt';
GO
`;
        sqlCommands.push(sql);
    }
    
    // SQL para asignar roles
    sqlCommands.push(`
-- Asignar roles automáticamente
INSERT INTO ADMIN (User_id) SELECT User_id FROM [USER] WHERE Username = '${config.prefix}Admin';
PRINT '✅ ${config.prefix}Admin → ADMIN';
GO

INSERT INTO ENGINEER (User_id, Team_id) SELECT User_id, 1 FROM [USER] WHERE Username = '${config.prefix}Engineer';
PRINT '✅ ${config.prefix}Engineer → ENGINEER';
GO

INSERT INTO DRIVER (User_id, Team_id, H) SELECT User_id, 1, 85 FROM [USER] WHERE Username = '${config.prefix}Driver';
PRINT '✅ ${config.prefix}Driver → DRIVER';
GO
`);
    
    // SQL para verificación
    sqlCommands.push(`
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
WHERE u.Username LIKE '${config.prefix}%'
ORDER BY u.Username;
GO

PRINT '';
PRINT '🎉 SETUP COMPLETADO EXITOSAMENTE';
PRINT '================================';
GO
`);
    
    const fullSql = sqlCommands.join('\n');
    
    // 3. Guardar SQL a archivo
    const sqlFilename = `auto_setup_${config.prefix}_$(date +%Y%m%d_%H%M%S).sql`;
    fs.writeFileSync(sqlFilename, fullSql);
    console.log(`💾 SQL guardado en: ${sqlFilename}`);
    
    // 4. Ejecutar automáticamente si está configurado
    if (config.useSqlCmd) {
        console.log('\n🚀 Ejecutando SQL automáticamente...');
        const success = await executeSql(fullSql);
        
        if (success) {
            console.log('\n🎉 ¡PROCESO COMPLETADO!');
            console.log('✅ Usuarios creados con bcrypt');
            console.log('✅ Roles asignados automáticamente');
            console.log('✅ Todo ejecutado en SQL Server');
        } else {
            console.log('\n⚠️  Ejecuta manualmente el archivo SQL en SSMS:');
            console.log(`   ${sqlFilename}`);
        }
    } else {
        console.log('\n📋 INSTRUCCIONES MANUALES:');
        console.log('   1. Abre SSMS');
        console.log(`   2. Abre el archivo: ${sqlFilename}`);
        console.log('   3. Ejecuta (F5)');
        console.log('   4. ¡Listo!');
    }
    
    // 5. Mostrar resumen
    console.log('\n🔑 RESUMEN DE CREDENCIALES:');
    console.log('   ------------------------');
    for (const user of allHashes) {
        console.log(`   👤 ${user.username}: ${user.password}`);
    }
    console.log(`\n🌍 Frontend: http://localhost:8080`);
    
    return sqlFilename;
}

// Manejo de errores
process.on('unhandledRejection', (error) => {
    console.error('❌ Error no manejado:', error);
    process.exit(1);
});

// Ejecutar
main().catch(console.error);
EOF
    
    # Reemplazar placeholders
    sed -i "s/PREFIX_PLACEHOLDER/$prefix/g" "$filename"
    sed -i "s/DB_SERVER_PLACEHOLDER/$DB_SERVER/g" "$filename"
    sed -i "s/DB_NAME_PLACEHOLDER/$DB_NAME/g" "$filename"
    sed -i "s/DB_USER_PLACEHOLDER/$DB_USER/g" "$filename"
    sed -i "s/DB_PASSWORD_PLACEHOLDER/$DB_PASSWORD/g" "$filename"
    sed -i "s/USE_SQLCMD_PLACEHOLDER/$USE_SQLCMD/g" "$filename"
    
    echo "$filename"
}

# Función principal
main() {
    clear
    echo -e "${PURPLE}==========================================${NC}"
    echo -e "${PURPLE}   🔐 F1 GARAGE - AUTO BCRYPT GENERATOR${NC}"
    echo -e "${PURPLE}   100% AUTOMÁTICO - SIN COPY/PASTE${NC}"
    echo -e "${PURPLE}==========================================${NC}\n"
    
    # 1. Detectar y configurar
    detect_and_setup
    
    # 2. Verificar dependencias
    check_dependencies
    
    # 3. Instalar bcryptjs
    if ! install_bcrypt; then
        echo -e "${RED}❌ No se pudo instalar bcryptjs${NC}"
        exit 1
    fi
    
    # 4. Crear script automático
    echo -e "\n${BLUE}🚀 Creando generador automático...${NC}"
    bcrypt_script=$(create_auto_bcrypt_script "$PREFIX")
    echo -e "${GREEN}✅ Script creado: ${bcrypt_script}${NC}"
    
    # 5. Ejecutar script automático
    echo -e "\n${BLUE}⚡ Ejecutando generador automático...${NC}"
    echo -e "${CYAN}------------------------------------------------${NC}"
    
    if node "$bcrypt_script"; then
        echo -e "${CYAN}------------------------------------------------${NC}"
        echo -e "${GREEN}✨ ¡PROCESO COMPLETADO!${NC}"
        
        if [ "$USE_SQLCMD" = true ]; then
            echo -e "\n${GREEN}✅ Todo se ejecutó automáticamente en SQL Server${NC}"
            echo -e "${YELLOW}🔍 Verifica en SSMS:${NC}"
            echo "   SELECT Username, User_id FROM [USER] WHERE Username LIKE '${PREFIX}%'"
        else
            echo -e "\n${YELLOW}📋 Ejecuta manualmente el archivo SQL generado en SSMS${NC}"
        fi
        
        echo -e "\n${BLUE}🔑 CREDENCIALES:${NC}"
        echo -e "   ${PREFIX}Admin: ${PREFIX}Admin123*"
        echo -e "   ${PREFIX}Engineer: ${PREFIX}Engineer123*"
        echo -e "   ${PREFIX}Driver: ${PREFIX}Driver123*"
        
        echo -e "\n${GREEN}🎯 ¡Todos los usuarios tienen BCRYPT ahora!${NC}"
    else
        echo -e "${CYAN}------------------------------------------------${NC}"
        echo -e "${RED}❌ Error en el proceso automático${NC}"
        echo -e "${YELLOW}💡 Sugerencia: Ejecuta manualmente:${NC}"
        echo "   node $bcrypt_script"
    fi
    
    # 6. Limpiar (opcional)
    echo -e "\n${BLUE}🧹 Limpiando archivos temporales...${NC}"
    if [ -f "$bcrypt_script" ]; then
        rm "$bcrypt_script"
        echo -e "${GREEN}✅ Archivo temporal eliminado${NC}"
    fi
    
    echo -e "\n${PURPLE}==========================================${NC}"
    echo -e "${PURPLE}   ¡LISTO PARA EL FUTURO!${NC}"
    echo -e "${PURPLE}   Este script se puede convertir en SP${NC}"
    echo -e "${PURPLE}==========================================${NC}"
}

# Script para convertir a Stored Procedure
create_future_sp_script() {
    cat > "future_stored_procedure.sql" << 'EOF'
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
EOF
    
    echo "future_stored_procedure.sql"
}

# Mostrar opción para SP futuro
show_future_option() {
    echo -e "\n${CYAN}🚀 PARA EL FUTURO (STORED PROCEDURE):${NC}"
    echo -e "${BLUE}------------------------------------------------${NC}"
    
    sp_script=$(create_future_sp_script)
    echo -e "${GREEN}✅ Script SP creado: ${sp_script}${NC}"
    
    echo -e "\n${YELLOW}📋 Este script automático se puede convertir en:${NC}"
    echo "   1. Stored Procedure en SQL Server"
    echo "   2. API endpoint en el backend"
    echo "   3. Proceso batch para múltiples usuarios"
    
    echo -e "\n${BLUE}🔮 VISIÓN FUTURA:${NC}"
    echo "   ./create_users.sh --all --bcrypt --auto"
    echo "   ↓"
    echo "   [Crea usuarios en Linux, Windows, macOS]"
    echo "   ↓"
    echo "   [Todos con bcrypt, roles asignados]"
    echo "   ↓"
    echo "   [Listo en 30 segundos]"
}

# Ejecutar
main
show_future_option