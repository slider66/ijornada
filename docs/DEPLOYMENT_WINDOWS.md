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

## 2. Opción Recomendada: Usando PM2

**PM2** es un gestor de procesos de producción para Node.js. Es la opción más robusta porque maneja reinicios automáticos si la aplicación falla y gestión de logs.

### Pasos:

1.  **Instalar PM2 y el complemento de inicio para Windows:**
    Ejecute en la terminal (como Administrador):
    ```bash
    npm install -g pm2 pm2-windows-startup
    ```

2.  **Instalar el servicio de inicio:**
    ```bash
    pm2-startup install
    ```
    *Nota: Esto registrará PM2 como un servicio de Windows.*

3.  **Iniciar la aplicación con PM2:**
    ```bash
    pm2 start npm --name "ijornada-server" -- start
    ```

4.  **Guardar la configuración:**
    Para asegurar que esta aplicación específica se inicie cuando PM2 arranque:
    ```bash
    pm2 save
    ```

### Comandos útiles de PM2:
- Ver estado: `pm2 status`
- Ver logs: `pm2 logs ijornada-server`
- Detener: `pm2 stop ijornada-server`
- Reiniciar: `pm2 restart ijornada-server`

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
