# Guía de Despliegue Desatendido en Windows 11

Esta guía describe cómo configurar la aplicación **iJornada** para que se ejecute automáticamente al iniciar el sistema Windows y permanezca activa en segundo plano, incluso sin que un usuario inicie sesión o con la pantalla bloqueada.

## 1. Preparación

Antes de configurar el inicio automático, asegúrese de que la aplicación está construida y funciona correctamente.

1.  Abra una terminal (PowerShell o CMD) como Administrador.
2.  Navegue a la carpeta del proyecto:
    ```bash
    cd C:\Proyectos\ijornada
    ```
3.  Construya la aplicación para producción:
    ```bash
    npm run build
    ```
4.  Verifique que inicia correctamente de forma manual:
    ```bash
    npm start
    ```
    (Presione `Ctrl+C` para detenerla una vez verificado).

---

## 2. Instalación Automática (Recomendada)

Hemos incluido un script de gestión (`manage_service.ps1`) que automatiza todo el proceso usando el Programador de Tareas de Windows. Esta es la forma más sencilla de asegurar que la aplicación arranque con el sistema.

### Pasos:

1.  Abra **PowerShell** como Administrador.
2.  Ejecute el script de gestión:
    ```powershell
    cd C:\Proyectos\ijornada\scripts
    .\manage_service.ps1
    ```
3.  Seleccione la opción **1** para instalar el servicio.
4.  ¡Listo! La tarea "iJornada Server" ha sido creada.

Este script configura la tarea para:
*   Iniciarse al arrancar el sistema (sin necesidad de login).
*   Ejecutarse con privilegios altos.
*   Reiniciarse automáticamente si falla.
*   Redirigir la salida a un archivo de log (`server_log.txt`).

---

## 3. Comandos Útiles

Desde el mismo menú del script `manage_service.ps1` puede:
*   **Ver Estado**: Opción 3. Le dirá si la tarea está "Ready" (Lista) o "Running" (Ejecutándose).
*   **Desinstalar**: Opción 2. Elimina la tarea programada.
*   **Prueba Manual**: Opción 4. Inicia el servidor en la consola actual para pruebas rápidas.

---

## 4. Método Manual y PM2 (Alternativas)

Si prefiere otros métodos, consulte las secciones siguientes.

### 4.1 PM2 (Avanzado)

**PM2** es un gestor de procesos de producción para Node.js.

---

## 3. Opción Nativa: Programador de Tareas (Task Scheduler)

Hemos creado un script unificado que facilita la gestión del servicio (instalar, desinstalar, ver estado).

1.  Abra **PowerShell** como Administrador.
2.  Ejecute el script de gestión:
    ```powershell
    cd C:\Proyectos\ijornada\scripts
    .\manage_service.ps1
    ```
3.  Seleccione la opción **1** para instalar el servicio.
4.  ¡Listo! La tarea "iJornada Server" ha sido creada. Se iniciará sola al reiniciar el equipo.

---

### 3.2 Método Manual (Solo si el script falla)

Si prefiere no instalar herramientas globales como PM2 ni usar el script automático, puede usar el Programador de Tareas de Windows manualmente.

### Pasos:

1.  **Crear un script de inicio:**
    Ya existe un script optimizado en `C:\Proyectos\ijornada\scripts\start_server.bat`. Puede usar ese mismo.
    
2.  **Configurar la Tarea:**
    1.  Presione `Win + R`, escriba `taskschd.msc` y presione Enter.
    2.  Haga clic en **"Crear Tarea..."** (Create Task) en el panel derecho.
    3.  **Pestaña General:**
        - Nombre: `iJornada Server`.
        - Seleccione **"Ejecutar tanto si el usuario inició sesión como si no"** (Run whether user is logged on or not).
        - Marque **"Ejecutar con los privilegios más altos"** (Run with highest privileges).
        - Configure "Configurar para" (Configure for): Windows 10/11.
    4.  **Pestaña Desencadenadores (Triggers):**
        - Nuevo... -> Iniciar la tarea: **"Al iniciar el sistema"** (At startup).
    5.  **Pestaña Acciones (Actions):**
        - Nueva... -> Acción: **"Iniciar un programa"**.
        - Programa o script: Seleccione `C:\Proyectos\ijornada\scripts\start_server.bat`.
        - Iniciar en (Start in): `C:\Proyectos\ijornada\scripts` (Opcional, el script maneja la ruta).
    6.  **Pestaña Condiciones (Conditions):**
        - Desmarque "Iniciar la tarea solo si el equipo está conectado a la corriente alterna" si desea que funcione con batería (opcional).
    7.  **Pestaña Configuración (Settings):**
        - Desmarque "Detener la tarea si se ejecuta durante más de..." para asegurar que corra indefinidamente.
    8.  Haga clic en **Aceptar**. Se le pedirán las credenciales del usuario de Windows para guardar la tarea.

---

## 4. Consideraciones Adicionales

### Firewall
Asegúrese de abrir el puerto **3000** (o el puerto que use su aplicación) en el Firewall de Windows para permitir conexiones desde otros equipos en la red.
- Abra "Windows Defender Firewall con seguridad avanzada".
- Reglas de Entrada -> Nueva Regla -> Puerto -> TCP, 3000 -> Permitir la conexión.

### Gestión de Energía
Para un servidor permanente, configure las opciones de energía de Windows para evitar que el equipo entre en **Suspensión** (Sleep) automáticamente.
- Configuración -> Sistema -> Energía y batería -> Pantalla y suspensión -> "Cuando está enchufado, poner el equipo en suspensión después de": **Nunca**.
