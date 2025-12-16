# 💬 ChatModerno — ASP.NET Core 9 + SignalR

**ChatModerno** es una aplicación de chat en tiempo real construida con **.NET 9**, **C# moderno** y **SignalR**.  
Permite crear salas dinámicas, mostrar historial, ver usuarios escribiendo (“typing indicator”) y manejar mensajes en vivo con una interfaz simple en HTML + JavaScript.


## 🚀 Características

- ✅ Framework: **.NET 9.0**
- 💬 Comunicación en tiempo real con **SignalR**
- 🧠 Almacenamiento de historial en memoria (ChatRoomStore)
- 🧍‍♂️ Sistema de salas dinámicas (join / leave / switch)
- ✍️ Indicador de escritura (“user typing”)
- 📱 Interfaz web minimalista (HTML + JS puro)
- ⚙️ Arquitectura limpia: modelos, servicios y hub separados
- 🔒 CORS habilitado (para pruebas desde cualquier origen)
- 🌙 Listo para extender con base de datos o autenticación


## 🧩 Estructura del proyecto

```
ChatModerno/
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
│       ├── utils.js
│       ├── ui.js
│       ├── theme.js
│       └── signalr.js
|       └── state.js
|       └── config.js
├── Program.cs
├── ChatModerno.csproj
└── README.md
```

## 🧠 Cómo funciona

- Program.cs configura SignalR, CORS y los archivos estáticos.
- ChatHub.cs define los métodos que envían y reciben mensajes entre usuarios.
- ChatRoomStore.cs guarda los mensajes recientes de cada sala (en memoria).
- index.html se conecta al Hub, muestra mensajes y detecta escritura en tiempo real.

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


Esto le indica a Azure cómo ejecutar la aplicación self-contained.
