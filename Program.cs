using ChatSalaModern.Hubs;
using ChatSalaModern.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSignalR();
builder.Services.AddCors(o =>
{
    o.AddDefaultPolicy(p =>
        p.AllowAnyHeader().AllowAnyMethod().AllowCredentials().SetIsOriginAllowed(_ => true));
});


// ✅ Store PRO
builder.Services.AddSingleton(_ => new ChatRoomStorePro(
    maxPerRoom: 200,
    roomTtl: TimeSpan.FromHours(12)
));

// ✅ Worker de limpieza
builder.Services.AddHostedService<RoomCleanupWorker>();

builder.Services.AddSingleton<ChatAbuseGuard>();

var app = builder.Build();

app.UseCors();
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapHub<ChatHub>("/chat");
app.MapFallbackToFile("index.html"); // sirve el index

app.Run();
