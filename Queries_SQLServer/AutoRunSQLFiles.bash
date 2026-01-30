#!/bin/bash

# ============================================================================
# Script para ejecutar todos los scripts SQL de F1 Garage Manager
# ============================================================================

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración de la base de datos
DB_SERVER="DESKTOP-8PT02KJ\\SQLEXPRESS"
DB_NAME="F1GarageManager"

# Usuario y contraseña ()
DB_USER="admin" - #change this with yours
DB_PASSWORD="admin"  #change this with yours

# Si usas Windows Authentication, usa esto:
USE_WINDOWS_AUTH=true

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}  F1 GARAGE MANAGER - EJECUCIÓN DE SCRIPTS SQL${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo -e "${YELLOW}Servidor:${NC} $DB_SERVER"
echo -e "${YELLOW}Base de datos:${NC} $DB_NAME"
echo ""

# Array con los archivos SQL en orden
SQL_FILES=(
    "01_Schema_y_Entidades_Fuertes.sql"
    "02_Entidades_Debiles.sql"
    "03_Tablas_Intermedias.sql"
    "04_Alterns.sql"
    "05-1Stored_ProceduresUserManagement.sql"
    "05-2StoredproceduresCircuits.sql"
    "05-3StoredproceduresSimulations.sql"
    "05_Stored_Procedures.sql"
    "06_SCRIPTDETESTING.sql"
)

# Función para ejecutar un archivo SQL
ejecutar_sql() {
    local archivo=$1
    local numero=$2
    local total=$3
    
    echo -e "${BLUE}────────────────────────────────────────────────────────────────────────────${NC}"
    echo -e "${YELLOW}[$numero/$total] Ejecutando:${NC} $archivo"
    echo -e "${BLUE}────────────────────────────────────────────────────────────────────────────${NC}"
    
    if [ ! -f "$archivo" ]; then
        echo -e "${RED}❌ ERROR: Archivo no encontrado: $archivo${NC}"
        return 1
    fi
    
    # Ejecutar el archivo SQL usando sqlcmd
    if [ "$USE_WINDOWS_AUTH" = true ]; then
        # Windows Authentication
        sqlcmd -S "$DB_SERVER" -E -i "$archivo" -b
    else
        # SQL Server Authentication
        sqlcmd -S "$DB_SERVER" -U "$DB_USER" -P "$DB_PASSWORD" -i "$archivo" -b
    fi
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ Éxito: $archivo ejecutado correctamente${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}❌ ERROR al ejecutar $archivo (código: $exit_code)${NC}"
        echo ""
        return 1
    fi
}

# Preguntar confirmación
echo -e "${YELLOW}⚠️  ADVERTENCIA:${NC}"
echo -e "   Este script ejecutará todos los scripts SQL en orden."
echo -e "   ${RED}Esto ELIMINARÁ y RECREARÁ la base de datos F1GarageManager.${NC}"
echo ""
read -p "¿Deseas continuar? (s/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
    echo -e "${YELLOW}Operación cancelada por el usuario.${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}Iniciando ejecución de scripts...${NC}"
echo ""

# Contador
total_files=${#SQL_FILES[@]}
current=0
errores=0

# Ejecutar cada archivo
for archivo in "${SQL_FILES[@]}"; do
    ((current++))
    
    if ! ejecutar_sql "$archivo" "$current" "$total_files"; then
        ((errores++))
        echo -e "${RED}⚠️  Error en $archivo - continuando con el siguiente...${NC}"
        echo ""
    fi
    
    # Pequeña pausa entre scripts
    sleep 1
done

# Resumen final
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}  RESUMEN DE EJECUCIÓN${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo -e "${YELLOW}Scripts ejecutados:${NC} $total_files"
echo -e "${GREEN}Exitosos:${NC} $((total_files - errores))"

if [ $errores -eq 0 ]; then
    echo -e "${RED}Con errores:${NC} $errores"
    echo ""
    echo -e "${GREEN}✅ ¡Todos los scripts se ejecutaron correctamente!${NC}"
    echo ""
    echo -e "${YELLOW}Próximos pasos:${NC}"
    echo "  1. Verifica la base de datos en SQL Server Management Studio"
    echo "  2. Reinicia tu backend de Node.js"
    echo "  3. Recarga el frontend"
    echo ""
else
    echo -e "${RED}Con errores:${NC} $errores"
    echo ""
    echo -e "${RED}❌ Algunos scripts fallaron. Revisa los mensajes de error arriba.${NC}"
    echo ""
fi

echo -e "${BLUE}============================================================================${NC}"