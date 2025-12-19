# 🔒 PROTOCOLO DE SEGURIDAD DE BASE DE DATOS

## REGLA ABSOLUTA

**NUNCA, BAJO NINGUNA CIRCUNSTANCIA, SE PUEDEN PERDER DATOS DE LA BASE DE DATOS**

Esta regla tiene prioridad sobre cualquier otra consideración técnica o de desarrollo.

## Protecciones Implementadas

### 1. Backup Automático Antes de Migraciones

**Script:** `scripts/backup-db.ts`

Se ejecuta AUTOMÁTICAMENTE antes de cualquier migración:
```bash
npm run backup        # Crea backup completo en JSON
npm run migrate:safe  # Migración CON backup automático
```

### 2. Comandos Seguros en package.json

```json
{
  "scripts": {
    "backup": "tsx scripts/backup-db.ts",
    "migrate:safe": "npm run backup && npx prisma migrate dev",
    "migrate:create": "npx prisma migrate dev --create-only"
  }
}
```

**USAR SIEMPRE:** `npm run migrate:safe`
**NUNCA USAR:** `npx prisma migrate dev` directamente

### 3. Validación Pre-Migración

Antes de aplicar cualquier migración:
1. ✅ Backup automático se ejecuta
2. ✅ Se verifica que el backup sea válido
3. ✅ Se crea punto de restauración
4. ✅ Solo entonces se aplica la migración

### 4. Sistema de Restauración

**Script:** `scripts/restore-db.ts`

Para restaurar desde backup:
```bash
npm run restore backups/database/backup_TIMESTAMP.json
```

## Procedimiento de Migraciones Seguras

### PASO 1: Crear Migración (SIN ejecutar)
```bash
npm run migrate:create
# Esto crea el archivo de migración pero NO lo ejecuta
```

### PASO 2: Revisar Migración
- Abrir archivo en `prisma/migrations/[timestamp]_[name]/migration.sql`
- Verificar que NO contiene DROP, DELETE o TRUNCATE no deseados

### PASO 3: Ejecutar con Backup Automático
```bash
npm run migrate:safe
# Esto:
# 1. Hace backup completo
# 2. Ejecuta la migración
# 3. Verifica que todo funcione
```

### PASO 4: Verificar
```bash
npm run check-db
# Verifica que los datos estén intactos
```

## Backups Programados

### Backup Diario Automático

Configurar en cron (Linux/Mac) o Task Scheduler (Windows):

**Linux/Mac:**
```bash
# Editar crontab
crontab -e

# Agregar línea para backup diario a las 2 AM
0 2 * * * cd /ruta/a/ijornada && npm run backup
```

**Windows:**
Crear tarea programada que ejecute:
```powershell
cd c:\Proyectos\ijornada
npm run backup
```

## Recuperación de Desastres

Si algo sale mal:

1. **Detener todo immediatamente**
2. **NO ejecutar más comandos**
3. **Localizar último backup**:
   ```bash
   ls -la backups/database/
   ```
4. **Restaurar**:
   ```bash
   npm run restore backups/database/backup_[TIMESTAMP].json
   ```

## Comandos PROHIBIDOS

❌ **NUNCA EJECUTAR:**
```bash
npx prisma migrate dev --force-reset
npx prisma migrate reset
npx prisma db push --force-reset
npx prisma db push --accept-data-loss
```

✅ **SIEMPRE USAR:**
```bash
npm run migrate:safe
npm run migrate:create
npm run backup
```

## Responsabilidades

### Del Asistente (AI)
- ✅ SIEMPRE crear backup antes de cualquier cambio
- ✅ NUNCA aceptar prompts de "reset" o "data loss"
- ✅ SIEMPRE usar comandos seguros
- ✅ Documentar cada cambio en base de datos

### Del Usuario
- ✅ Revisar migraciones antes de aplicar
- ✅ Mantener backups externos (cloud, disco externo)
- ✅ Verificar que backups automáticos funcionen

## Auditoría

Todos los cambios en base de datos se registran en:
- Tabla `AuditLog` (en la base de datos)
- Archivos de backup con timestamp
- Git commits con tag `[DB]`

## Contacto de Emergencia

En caso de pérdida de datos:
1. **NO ENTRAR EN PÁNICO**
2. **Verificar backups/** inmediatamente
3. **Ejecutar restauración**
4. **Reportar incidente**

---

**RECORDATORIO FINAL:**

Los datos de jornada laboral son **LEGALMENTE REQUERIDOS** y su pérdida puede resultar en:
- 💰 Multas millonarias
- ⚖️ Problemas legales
- 📉 Pérdida de confianza

**POR ESO: BACKUP ANTES DE TODO**
