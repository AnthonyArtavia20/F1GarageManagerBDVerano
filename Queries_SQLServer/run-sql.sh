#!/bin/bash

SERVER="localhost"
USER="SA"
PASSWORD="Fz9IQQAWEq85"
DATABASE="F1GarageManager"

FILES=(
    "01_Schema_y_Entidades_Fuertes.sql"
    "02_Entidades_Debiles.sql"
    "03_Tablas_Intermedias.sql"
    "05_Stored_Procedures.sql"
    "05-1Stored_ProceduresUserManagement.sql"
    "05-2StoredproceduresCircuits.sql"
    "05-3StoredproceduresSimulations.sql"
    "06_SCRIPTDETESTING.sql"
)

for file in "${FILES[@]}"
do
    echo ">>> $file..."
    sqlcmd -S "$SERVER" -U "$USER" -P "$PASSWORD" -C -N -d "$DATABASE" -i "$file"
    
    if [ $? -eq 0 ]; then
        echo "OK: $file"
    else
        echo "!ERROR: $file"
    fi
    echo ""
done
