# 💬 ChatModerno — ASP.NET Core 9 + SignalR

**ChatModerno** es una aplicación de chat en tiempo real construida con **.NET 9**, **C# moderno** y **SignalR**.  
Permite crear salas dinámicas, mostrar historial, ver usuarios escribiendo (“typing indicator”) y manejar mensajes en vivo con una interfaz simple en HTML + JavaScript.

---

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

ChatModerno/
├── Hubs/
│ └── ChatHub.cs
├── Models/
│ └── ChatMessage.cs
├── Services/
│ └── ChatRoomStore.cs
├── wwwroot/
│ └── index.html
├── Program.cs
├── ChatModerno.csproj
└── README.md

## 🧠 Cómo funciona

- Program.cs configura SignalR, CORS y los archivos estáticos.
- ChatHub.cs define los métodos que envían y reciben mensajes entre usuarios.
- ChatRoomStore.cs guarda los mensajes recientes de cada sala (en memoria).
- index.html se conecta al Hub, muestra mensajes y detecta escritura en tiempo real.

## 🧰 Tecnologías utilizadas

- Tipo	Tecnología
- Backend	ASP.NET Core 9.0
- Comunicación	SignalR
- Lenguaje	C# 12
- Frontend	HTML5, CSS3, JavaScript ES6
- Librerías CDN	@microsoft/signalr
- Hosting local	Kestrel