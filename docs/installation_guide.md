# Guía de Instalación e Integración de iJornada

Esta guía detalla los pasos necesarios para instalar, configurar y poner en marcha el sistema iJornada en un entorno local o de producción.

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado lo siguiente en tu sistema:

- **Node.js**: Versión 18 o superior.
- **pnpm**: Gestor de paquetes recomendado (versión 9 o superior).
  - Instalación: `npm install -g pnpm`
- **Git**: Para clonar el repositorio.

## 🚀 Instalación Paso a Paso

### 1. Obtener el Código

Clona el repositorio oficial en tu máquina local:

```bash
git clone <URL_DEL_REPOSITORIO>
cd ijornada
```

### 2. Instalar Dependencias

Utilizamos `pnpm` para una gestión eficiente de las dependencias. Ejecuta:

```bash
pnpm install
```

### 3. Configuración del Entorno

Crea un archivo `.env` en la raíz del proyecto. Puedes copiar el archivo de ejemplo si existe, o crear uno nuevo con las siguientes variables:

```env
# URL de conexión a la base de datos (SQLite por defecto para desarrollo)
DATABASE_URL="file:./dev.db"

# Secreto para la autenticación (NextAuth.js)
# Puedes generar uno seguro ejecutando: pnpm dlx auth secret
AUTH_SECRET="tu-secreto-super-seguro"
```

### 4. Base de Datos

Inicializa la base de datos SQLite y aplica las migraciones:

```bash
pnpm dlx prisma migrate dev --name init
```

Esto creará el archivo `dev.db` y configurará las tablas necesarias.

### 5. Creación de Usuario Administrador

Por seguridad, el sistema no permite el registro público de administradores. Para crear tu primer usuario:

1.  Abre Prisma Studio:
    ```bash
    pnpm dlx prisma studio
    ```
2.  Se abrirá una pestaña en tu navegador (generalmente en `http://localhost:5555`).
3.  Selecciona el modelo **User**.
4.  Haz clic en **Add Record** y rellena los campos:
    - `email`: tu@email.com
    - `password`: (Ingresa una contraseña temporal o hash si ya tienes el sistema de hash implementado)
    - `name`: Tu Nombre
    - `role`: **ADMIN** (Importante: debe ser mayúsculas)
5.  Guarda los cambios y cierra Prisma Studio.

## 🏃‍♂️ Ejecución

### Modo Desarrollo

Para iniciar el servidor en modo desarrollo con recarga en caliente:

```bash
pnpm dev
```

Accede a la aplicación en `http://localhost:3000`.

### Modo Producción

Para desplegar en un entorno de producción:

1.  Construye la aplicación:
    ```bash
    pnpm build
    ```
2.  Inicia el servidor:
    ```bash
    pnpm start
    ```

## 🔍 Verificación

Para asegurarte de que todo está correcto:

1.  **Linting**: Ejecuta `pnpm lint` para buscar errores de código.
2.  **Tests**: Ejecuta `pnpm test` (si hay tests configurados) para validar la lógica.

## 🛠️ Solución de Problemas Comunes

- **Error de permisos con pnpm**: Si tienes problemas al instalar, intenta limpiar la caché con `pnpm store prune`.
- **Base de datos bloqueada**: Si usas SQLite, asegúrate de no tener múltiples procesos de Prisma Studio o la app intentando escribir al mismo tiempo en `dev.db`.

---

**Nota**: Mantén tus dependencias actualizadas ejecutando `pnpm up` periódicamente y revisando las auditorías de seguridad con `pnpm audit`.
