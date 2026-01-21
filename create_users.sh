#!/bin/bash

# =========================================
# create_users_universal.sh
# Script Bash UNIVERSAL para Windows (Git Bash/WSL) y Linux/macOS
# =========================================

# Detectar sistema operativo
detect_os() {
    case "$(uname -s)" in
        Linux*)     OS="Linux" ;;
        Darwin*)    OS="macOS" ;;
        CYGWIN*)    OS="Cygwin" ;;
        MINGW*)     OS="GitBash" ;;
        MSYS*)      OS="MSYS" ;;
        *)          OS="UNKNOWN" ;;
    esac
    echo "🖥️  Sistema detectado: $OS"
}

# Colores para output
setup_colors() {
    if [[ -t 2 ]] && [[ -z "${NO_COLOR-}" ]] && [[ "${TERM-}" != "dumb" ]]; then
        RED='\033[0;31m'
        GREEN='\033[0;32m'
        YELLOW='\033[1;33m'
        CYAN='\033[0;36m'
        BLUE='\033[0;34m'
        MAGENTA='\033[0;35m'
        WHITE='\033[1;37m'
        NC='\033[0m' # No Color
        BOLD='\033[1m'
    else
        RED=''; GREEN=''; YELLOW=''; CYAN=''; BLUE=''; MAGENTA=''; WHITE=''; NC=''; BOLD=''
    fi
}

# Configuración
setup_config() {
    API_URL="http://localhost:9090"
    
    # Usar nombres diferentes por sistema para evitar conflictos
    case "$OS" in
        GitBash|Cygwin|MSYS)
            # Windows con Git Bash
            USER_PREFIX="win"
            echo "📁 Usando prefijo 'win' para usuarios"
            ;;
        Linux|macOS)
            # Linux/macOS
            USER_PREFIX="linux"
            echo "📁 Usando prefijo 'linux' para usuarios"
            ;;
        *)
            # Sistema desconocido
            USER_PREFIX="user"
            echo "📁 Usando prefijo 'user' para usuarios"
            ;;
    esac
    
    USERS=(
        "${USER_PREFIX}Admin:${USER_PREFIX}Admin123*:admin"
        "${USER_PREFIX}Engineer:${USER_PREFIX}Engineer123*:engineer"
        "${USER_PREFIX}Driver:${USER_PREFIX}Driver123*:driver"
    )
}

# Verificar dependencias
check_dependencies() {
    local missing=0
    
    echo -e "${CYAN}🔍 Verificando dependencias...${NC}"
    
    # Verificar curl
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}❌ curl no encontrado${NC}"
        echo "   Instala con:"
        case "$OS" in
            GitBash|Cygwin|MSYS) echo "   Descarga Git Bash que incluye curl" ;;
            Linux) echo "   sudo apt install curl (Debian/Ubuntu)" ;;
            macOS) echo "   brew install curl" ;;
        esac
        missing=1
    else
        echo -e "${GREEN}✅ curl encontrado${NC}"
    fi
    
    # Verificar backend funcionando
    echo -e "${CYAN}🔍 Verificando conexión al backend...${NC}"
    if curl -s --head --request GET "$API_URL" | grep "HTTP" > /dev/null; then
        echo -e "${GREEN}✅ Backend conectado en $API_URL${NC}"
    else
        echo -e "${YELLOW}⚠  No se pudo conectar a $API_URL${NC}"
        echo "   Asegúrate de que el backend esté ejecutándose"
        echo "   cd Backend && npm start"
        missing=1
    fi
    
    return $missing
}

# Crear usuario via API
create_user() {
    local username=$1
    local password=$2
    
    echo -e "${CYAN}📝 Creando usuario: ${BOLD}$username${NC}${CYAN}...${NC}"
    
    # Crear JSON body
    local json_body="{\"username\":\"$username\",\"password\":\"$password\"}"
    
    # Enviar request con timeout
    local response
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "$json_body" \
        --connect-timeout 10 \
        --max-time 15 \
        2>/dev/null || echo "CURL_ERROR")
    
    if [ "$response" = "CURL_ERROR" ]; then
        echo -e "${RED}❌ Error de conexión con el backend${NC}"
        return 1
    fi
    
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ]; then
        if echo "$body" | grep -q '"success":true'; then
            echo -e "${GREEN}✅ $username creado exitosamente${NC}"
            return 0
        else
            local message=$(echo "$body" | grep -o '"message":"[^"]*"' | head -1 | cut -d'"' -f4)
            echo -e "${YELLOW}⚠  $username ya existe: $message${NC}"
            return 2  # Usuario ya existe
        fi
    else
        echo -e "${RED}❌ Error HTTP $http_code creando $username${NC}"
        return 1
    fi
}

# Generar reporte SQL
generate_sql_report() {
    echo -e "\n${CYAN}📄 ${BOLD}SQL PARA ASIGNAR ROLES${NC}${CYAN}:${NC}"
    echo -e "${BLUE}==========================================${NC}"
    
    local user_list=""
    for user_info in "${USERS[@]}"; do
        IFS=':' read -r username _ _ <<< "$user_info"
        user_list="$user_list'$username', "
    done
    user_list="${user_list%, }"
    
    cat << EOF
-- =========================================
-- SQL GENERADO: $(date '+%Y-%m-%d %H:%M:%S')
-- Sistema: $OS
-- =========================================

USE F1GarageManager;
GO

-- 1. OBTENER IDs DE LOS USUARIOS
SELECT User_id, Username FROM [USER] 
WHERE Username IN ($user_list)
ORDER BY Username;
GO

-- 2. COPIAR LOS IDs Y EJECUTAR ESTOS COMANDOS:
--    (Reemplaza X, Y, Z con los IDs reales)
/*
-- Asignar como ADMIN
INSERT INTO ADMIN (User_id) VALUES (X);

-- Asignar como ENGINEER (Mercedes - Team_id 1)
INSERT INTO ENGINEER (User_id, Team_id) VALUES (Y, 1);

-- Asignar como DRIVER (Mercedes - Team_id 1)
INSERT INTO DRIVER (User_id, Team_id, H) VALUES (Z, 1, 85);
*/
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
WHERE u.Username IN ($user_list);
GO
EOF
}

# Guardar SQL en archivo
save_sql_to_file() {
    local filename="assign_roles_${USER_PREFIX}_$(date '+%Y%m%d_%H%M%S').sql"
    generate_sql_report > "$filename"
    echo -e "\n💾 ${GREEN}SQL guardado en: ${BOLD}$filename${NC}"
    
    # Mostrar comando para ejecutar
    case "$OS" in
        GitBash|Cygwin|MSYS)
            echo -e "📋 ${YELLOW}Para ejecutar en SSMS:${NC}"
            echo "   Abre SSMS → Archivo → Abrir → selecciona '$filename'"
            ;;
        Linux|macOS)
            echo -e "📋 ${YELLOW}Para ejecutar con sqlcmd:${NC}"
            echo "   sqlcmd -S . -d F1GarageManager -i $filename"
            ;;
    esac
}

# Mostrar resumen
show_summary() {
    echo -e "\n${CYAN}📊 ${BOLD}RESUMEN DE USUARIOS${NC}${CYAN}:${NC}"
    echo -e "${BLUE}==========================================${NC}"
    
    echo -e "\n${YELLOW}🔑 ${BOLD}CREDENCIALES PARA LOGIN:${NC}"
    echo "┌────────────────┬──────────────────────┬────────────┐"
    printf "│ %-14s │ %-20s │ %-10s │\n" "Usuario" "Contraseña" "Rol"
    echo "├────────────────┼──────────────────────┼────────────┤"
    
    for user_info in "${USERS[@]}"; do
        IFS=':' read -r username password role <<< "$user_info"
        printf "│ ${GREEN}%-14s${NC} │ ${YELLOW}%-20s${NC} │ ${CYAN}%-10s${NC} │\n" "$username" "$password" "$role"
    done
    echo "└────────────────┴──────────────────────┴────────────┘"
    
    echo -e "\n${MAGENTA}🚀 ${BOLD}PARA PROBAR EL LOGIN:${NC}"
    for user_info in "${USERS[@]}"; do
        IFS=':' read -r username password _ <<< "$user_info"
        echo -e "   ${WHITE}curl -c cookies_$username.txt -X POST $API_URL/api/auth/login \\"
        echo -e "     -H \"Content-Type: application/json\" \\"
        echo -e "     -d '{\"username\":\"$username\",\"password\":\"$password\"}'${NC}"
    done
}

# Proceso principal
main() {
    clear
    echo -e "${BLUE}==========================================${NC}"
    echo -e "${CYAN}   🚀 ${BOLD}F1 GARAGE - CREADOR UNIVERSAL${NC}${CYAN}    ${NC}"
    echo -e "${BLUE}==========================================${NC}"
    
    # Inicializar
    detect_os
    setup_colors
    setup_config
    
    echo -e "${WHITE}🔗 Backend URL: $API_URL${NC}"
    echo -e "${WHITE}📅 Fecha: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo -e "${BLUE}==========================================${NC}\n"
    
    # Verificar dependencias
    if ! check_dependencies; then
        echo -e "\n${RED}❌ Faltan dependencias. Por favor instálalas primero.${NC}"
        return 1
    fi
    
    echo -e "\n${GREEN}✅ Todas las dependencias verificadas${NC}"
    
    # Crear usuarios
    echo -e "\n${CYAN}🚀 ${BOLD}Creando usuarios...${NC}"
    echo -e "${BLUE}──────────────────────────────────────────${NC}"
    
    local created=0
    local errors=0
    local existing=0
    
    for user_info in "${USERS[@]}"; do
        IFS=':' read -r username password _ <<< "$user_info"
        
        create_user "$username" "$password"
        local result=$?
        
        case $result in
            0) ((created++)) ;;
            1) ((errors++)) ;;
            2) ((existing++)) ;;
        esac
        
        sleep 1  # Pausa entre requests
    done
    
    # Resultados
    echo -e "\n${BLUE}──────────────────────────────────────────${NC}"
    echo -e "${CYAN}📈 ${BOLD}ESTADÍSTICAS:${NC}"
    echo -e "   ${GREEN}✅ Creados: $created${NC}"
    echo -e "   ${YELLOW}⚠  Ya existían: $existing${NC}"
    echo -e "   ${RED}❌ Errores: $errors${NC}"
    
    # Generar reportes
    if [ $created -gt 0 ] || [ $existing -gt 0 ]; then
        show_summary
        save_sql_to_file
    else
        echo -e "\n${RED}❌ No se crearon usuarios. Revisa el backend.${NC}"
    fi
    
    echo -e "\n${BLUE}==========================================${NC}"
    echo -e "${GREEN}   🎉 ${BOLD}PROCESO COMPLETADO${NC}${GREEN}              ${NC}"
    echo -e "${BLUE}==========================================${NC}\n"
}

# Ejecutar
main "$@"