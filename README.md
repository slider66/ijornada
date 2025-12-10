# iJornada - Sistema de Gestión de Fichaje Laboral

iJornada es una aplicación moderna y escalable para el control de asistencia y gestión de horarios laborales, diseñada para cumplir con la normativa de registro de jornada. El sistema ofrece una interfaz administrativa para la gestión de empleados y horarios, así como un modo "Kiosco" para el fichaje rápido y sin interacción.

## 🚀 Características Principales

### 🖥️ Panel de Administración (`/admin`)

- **Gestión de Usuarios**: Alta, baja y modificación de empleados.
- **Horarios y Turnos**: Configuración de horarios laborales y turnos rotativos.
- **Incidencias**: Registro y seguimiento de ausencias, vacaciones y bajas médicas.
- **Reportes**: Visualización de registros de fichaje y auditoría.

### 🤖 Modo Kiosco (`/kiosk`)

- **Fichaje Rápido**: Interfaz simplificada para el registro de entrada y salida.
- **Múltiples Métodos de Identificación**: Soporte para PIN, NFC y huella dactilar (según hardware).
- **Feedback Visual y Auditivo**: Confirmación inmediata de acciones mediante señales visuales y sonoras.
- **Reloj Flip**: Visualización atractiva de la hora actual en pantalla completa.

### 🛠️ Tecnología

El proyecto está construido con un stack tecnológico moderno y robusto:

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **Base de Datos**: [PostgreSQL](https://www.postgresql.org/) (vía [Prisma ORM](https://www.prisma.io/))
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/)
- **Componentes UI**: [shadcn/ui](https://ui.shadcn.com/)
- **Autenticación**: [Auth.js (NextAuth)](https://authjs.dev/)
- **Animaciones**: [Framer Motion](https://www.framer.com/motion/)

## ⚙️ Instalación y Configuración

### Prerrequisitos

- Node.js 18+
- pnpm (Recomendado)

### Pasos para iniciar

1.  **Clonar el repositorio**:

    ```bash
    git clone <url-del-repositorio>
    cd ijornada
    ```

2.  **Instalar dependencias**:

    ```bash
    pnpm install
    ```

3.  **Configurar variables de entorno**:
    Crea un archivo `.env` en la raíz del proyecto basándote en el siguiente ejemplo:

    ```env
    DATABASE_URL="postgresql://johndoe:randompassword@localhost:5432/mydb?schema=public"
    AUTH_SECRET="tu-secreto-generado" # Generar con: pnpm dlx auth secret
    ```

4.  **Inicializar la base de datos**:

    ```bash
    pnpm dlx prisma migrate dev --name init
    ```

5.  **Crear usuario inicial**:
    Actualmente no existe un script de seed ni página de registro pública. Para crear el primer usuario administrador, utiliza Prisma Studio:

    ```bash
    pnpm dlx prisma studio
    ```

    Abre la interfaz web, selecciona el modelo `User` y crea un registro con `role: "ADMIN"`.

6.  **Iniciar el servidor de desarrollo**:

    ```bash
    pnpm dev
    ```

    La aplicación estará disponible en `http://localhost:3000`.

## 📂 Estructura del Proyecto

```
/app
  /admin      # Rutas y lógica del panel de administración
  /api        # Endpoints de la API (REST)
  /demo       # Demos de componentes y funcionalidades
  /kiosk      # Interfaz para el modo kiosco
  layout.tsx  # Layout principal
  page.tsx    # Página de inicio (Landing/Login)
/components
  /ui         # Componentes reutilizables (shadcn/ui)
/prisma
  schema.prisma # Definición del esquema de base de datos
/public       # Archivos estáticos
```

## ⚠️ Notas Importantes

### Autenticación

El archivo `auth.ts` contiene una configuración base para **NextAuth** con el proveedor de credenciales. **La lógica de autorización (`authorize`) es actualmente un placeholder** y debe ser implementada para validar las credenciales contra la base de datos (comparando hashes de contraseñas, etc.).

### Base de Datos

El esquema (`prisma/schema.prisma`) define los siguientes modelos principales:

- **User**: Empleados y administradores.
- **ClockIn**: Registros de fichaje (entrada/salida).
- **Incident**: Incidencias (vacaciones, bajas).
- **Schedule**: Horarios asignados.
- **AuditLog**: Registro de acciones del sistema.

## 🔐 Autenticación y Roles

El sistema maneja dos roles principales definidos en el modelo de datos:

- **ADMIN**: Acceso total al panel de administración y configuración.
- **USER**: Acceso limitado, principalmente para el registro de jornada y consulta de historial propio.

## 📝 Scripts Disponibles

- `pnpm dev`: Inicia el entorno de desarrollo.
- `pnpm build`: Compila la aplicación para producción.
- `pnpm start`: Inicia la aplicación en modo producción.
- `pnpm lint`: Ejecuta el linter para verificar la calidad del código.
