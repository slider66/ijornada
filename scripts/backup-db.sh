#!/bin/bash
# BACKUP AUTOMÁTICO DE BASE DE DATOS
# Este script se ejecuta ANTES de cualquier migración o cambio

set -e  # Salir si hay cualquier error

BACKUP_DIR="backups/database"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Crear directorio de backups si no existe
mkdir -p $BACKUP_DIR

echo "🔒 INICIANDO BACKUP DE SEGURIDAD..."
echo "Fecha: $(date)"
echo "Archivo: $BACKUP_FILE"

# Hacer dump de la base de datos
npx prisma db execute --stdin <<EOF > $BACKUP_FILE
-- BACKUP COMPLETO DE BASE DE DATOS
-- Generado: $(date)

-- Exportar todos los datos
COPY (SELECT row_to_json(t) FROM (SELECT * FROM "User") t) TO STDOUT;
COPY (SELECT row_to_json(t) FROM (SELECT * FROM "ClockIn") t) TO STDOUT;
COPY (SELECT row_to_json(t) FROM (SELECT * FROM "Schedule") t) TO STDOUT;
COPY (SELECT row_to_json(t) FROM (SELECT * FROM "TimeSlot") t) TO STDOUT;
COPY (SELECT row_to_json(t) FROM (SELECT * FROM "Incident") t) TO STDOUT;
COPY (SELECT row_to_json(t) FROM (SELECT * FROM "Holiday") t) TO STDOUT;
COPY (SELECT row_to_json(t) FROM (SELECT * FROM "SystemConfig") t) TO STDOUT;
COPY (SELECT row_to_json(t) FROM (SELECT * FROM "AuditLog") t) TO STDOUT;
COPY (SELECT row_to_json(t) FROM (SELECT * FROM "CompanyInfo") t) TO STDOUT;
EOF

# Usar pg_dump si está disponible (método más confiable)
if command -v pg_dump &> /dev/null; then
    echo "📦 Usando pg_dump para backup completo..."
    pg_dump $DATABASE_URL > "$BACKUP_DIR/pgdump_$TIMESTAMP.sql"
    
    # Comprimir el backup
    gzip "$BACKUP_DIR/pgdump_$TIMESTAMP.sql"
    echo "✅ Backup comprimido: pgdump_$TIMESTAMP.sql.gz"
fi

# Mantener solo los últimos 30 backups
echo "🧹 Limpiando backups antiguos (manteniendo últimos 30)..."
ls -t $BACKUP_DIR/backup_*.sql | tail -n +31 | xargs -r rm
ls -t $BACKUP_DIR/pgdump_*.sql.gz | tail -n +31 | xargs -r rm

echo "✅ BACKUP COMPLETADO EXITOSAMENTE"
echo "📁 Ubicación: $BACKUP_FILE"
echo ""
