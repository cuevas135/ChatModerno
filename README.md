# 💬 ChatModerno — ASP.NET Core 9 + SignalR

ChatModerno es una aplicación de chat en tiempo real construida con ASP.NET Core 9, C# moderno y SignalR.
Permite crear salas dinámicas, mostrar historial de mensajes, visualizar cuándo un usuario está escribiendo (typing indicator) y manejar comunicación en vivo mediante una interfaz web simple basada en HTML + JavaScript puro.


## 🚀 Características

    ✅ Framework: ASP.NET Core 9.0
    💬 Comunicación en tiempo real con SignalR
    🧠 Almacenamiento de historial en memoria (ChatRoomStore)
    🧍‍♂️ Sistema de salas dinámicas (join / leave / cambio de sala)
    ✍️ Indicador de escritura (user typing)
    📱 Interfaz web minimalista (HTML + JS sin frameworks)
    ⚙️ Arquitectura limpia: Hubs, Models y Services separados
    🔒 CORS habilitado (ideal para pruebas y desarrollo)
    🌙 Preparado para extender con base de datos, Redis o autenticación


## 🧩 Estructura del proyecto

```
ChatSalaModern/
├── Hubs/
│   └── ChatHub.cs
├── Models/
│   └── ChatMessage.cs
├── Services/
│   └── ChatRoomStore.cs
├── wwwroot/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── config.js
│       ├── state.js
│       ├── utils.js
│       ├── ui.js
│       ├── theme.js
│       └── signalr.js
├── Program.cs
├── ChatSalaModern.csproj
└── README.md
```

## 🧠 Cómo funciona

    * Program.cs
        Configura SignalR, CORS, archivos estáticos y el fallback para index.html.
    * ChatHub.cs
        Contiene los métodos del Hub que gestionan:
            * Envío y recepción de mensajes
            * Unión y salida de salas
            * Indicador de escritura
            * Eventos en tiempo real
    * ChatRoomStore.cs
        Almacena en memoria el historial reciente de mensajes por sala.
    * Frontend (wwwroot)
        * index.html: interfaz principal del chat
        * signalr.js: conexión con el Hub
        * ui.js: renderizado de mensajes y estados
        * state.js: estado global del cliente
        * config.js: configuración centralizada
        * theme.js: manejo de tema claro / oscuro

## 🧰 Tecnologías utilizadas

| Tipo          | Tecnología                  |
| ------------- | --------------------------- |
| Backend       | ASP.NET Core 9.0            |
| Comunicación  | SignalR                     |
| Lenguaje      | C# 12                       |
| Frontend      | HTML5, CSS3, JavaScript ES6 |
| Librerías CDN | @microsoft/signalr          |
| Hosting local | Kestrel                     |

## 🚀 Deploy a Azure App Service (Windows)

Este proyecto fue desplegado usando Azure App Service en Windows con .NET 9 en un plan 32 bits. A continuación te detallo los pasos seguidos para que puedas replicarlo.

1. Preparación del proyecto
Asegúrate de que el proyecto esté correctamente configurado para self-contained en win-x86. Esto asegura que el runtime de .NET 9 venga dentro del proyecto y sea compatible con el plan 32 bits de Azure.

En tu archivo ChatSalaModern.csproj, asegúrate de que esté configurado de esta manera:
```
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <LangVersion>latest</LangVersion>

    <RuntimeIdentifier>win-x86</RuntimeIdentifier> <!-- Especificar 32 bits -->
    <SelfContained>true</SelfContained>  <!-- Incluir el runtime con la app -->
  </PropertyGroup>
</Project>
```

2. Publicar correctamente en 32 bits
Asegúrate de que el comando de publicación en GitHub Actions esté configurado para win-x86:

```
- name: Publish (Self-contained win-x86)
  run: dotnet publish ./ChatSalaModern.csproj -c Release -r win-x86 --self-contained true -o publish
```
Este comando genera los archivos self-contained (incluyendo el runtime) y los coloca en la carpeta publish.

3. Configuración de Web.config
Asegúrate de que el archivo web.config esté en la raíz del proyecto y tenga el siguiente contenido para que Azure pueda ejecutar correctamente tu aplicación:

```
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="aspNetCore"
           path="*"
           verb="*"
           modules="AspNetCoreModuleV2"
           resourceType="Unspecified" />
    </handlers>

    <aspNetCore
      processPath=".\ChatSalaModern.exe"
      arguments=""
      stdoutLogEnabled="true"
      stdoutLogFile=".\logs\stdout"
      hostingModel="outofprocess" />
  </system.webServer>
</configuration>
```
Esto le indica a Azure cómo ejecutar la aplicación self-contained.

4. GitHub Actions para despliegue automático
La configuración de GitHub Actions te permite automatizar el proceso de despliegue cada vez que haces un git push a la rama main. El flujo de trabajo incluye los pasos para:
    [^1]: Restaurar las dependencias
    2. Limpiar cualquier build previo
    3. Publicar el proyecto
    4. Desplegar a Azure usando el perfil de publicación guardado en los secretos de GitHub

El archivo .github/workflows/azure-deploy.yml se ve de esta manera:
```
name: Deploy ModernChat to Azure (Windows)

on:
  push:
    branches: [ "main" ]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: windows-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup .NET 9
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: "9.0.x"

      - name: Restore dependencies
        run: dotnet restore

      - name: Clean previous builds
        run: dotnet clean

      - name: Publish (Self-contained win-x86)
        run: dotnet publish ./ChatSalaModern.csproj -c Release -r win-x86 --self-contained true -o publish

      - name: Inspect publish output
        run: dir publish

      - name: Deploy to Azure Web App
        uses: azure/webapps-deploy@v3
        with:
          app-name: "modernchat"
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: publish
```

5. Configuración de Azure App Service
    * En el portal de Azure, crea una App Service con un plan Windows.
    * Asegúrate de que la plataforma esté configurada en 32 bits (esto es crucial).
    * Activa WebSockets en General settings para habilitar el funcionamiento de SignalR. 
    * Configura el Application Logging en Filesystem con el nivel de Information para depurar    cualquier error.

6. Solución de problemas comunes
 * 500.32 (ANCM Failed to Load dll): Este error es causado por una incompatibilidad entre la arquitectura de tu aplicación (x64) y la configuración de tu App Service (32-bit). Para solucionarlo, asegúrate de publicar en win-x86 y de configurar correctamente el web.config.
 * Index no carga: Verifica que el archivo index.html esté correctamente dentro de la carpeta wwwroot y que la configuración de fallback sea correcta.

7. Validaciones y Logs
 * Activa stdout logs en Azure para recibir información detallada sobre el estado de la aplicación. Puedes revisar estos logs en el Log stream.
 * Si la app no carga, asegúrate de que el index.html esté presente y correctamente servido por el servidor.