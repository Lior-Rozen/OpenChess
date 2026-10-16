const string DevCorsPolicy = "dev";

var builder = WebApplication.CreateBuilder(args);

// The phone app (Expo Go) doesn't need CORS, but the Expo web preview in a browser does.
builder.Services.AddCors(options =>
    options.AddPolicy(DevCorsPolicy, policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseCors(DevCorsPolicy);
}

app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));
app.MapGet("/api/hello", () => Results.Ok(new { message = "hello friend" }));

app.Run();
