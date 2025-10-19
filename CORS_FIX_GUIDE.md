# CORS Fix Guide for Backend API

## 🚨 Problem

The React Native app cannot connect to the backend API due to CORS (Cross-Origin Resource Sharing) restrictions. The browser blocks requests from `localhost:8081` (React Native app) to `localhost:5001` (backend API).

## ✅ Solution

Add CORS configuration to your C# backend API.

---

## Step-by-Step Instructions

### 1. Open Your Backend Project

Open the `CourierApi` solution in Visual Studio (the C# backend project at `C:\Users\liza\Source\Repos\courier-api\`)

### 2. Locate Program.cs

Find the `Program.cs` file in your CourierApi project (it's usually in the root of the project)

### 3. Add CORS Configuration

Add the following code to `Program.cs`:

#### **Option A: Before `builder.Build()` - Add CORS Service**

Find the line with `var builder = WebApplication.CreateBuilder(args);` and add this code **BEFORE** `var app = builder.Build();`:

```csharp
// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactNativeApp",
        policy =>
        {
            policy.WithOrigins(
                    "http://localhost:8081",  // React Native dev server
                    "http://localhost:19006", // Expo web
                    "http://localhost:19000"  // Expo
                )
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        });
});
```

#### **Option B: After `app = builder.Build()` - Use CORS**

Find the line `var app = builder.Build();` and add this code **AFTER** it (but **BEFORE** `app.Run();`):

```csharp
// Enable CORS
app.UseCors("AllowReactNativeApp");
```

---

## Complete Example

Your `Program.cs` should look something like this:

```csharp
var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ⭐ ADD THIS: CORS Configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactNativeApp",
        policy =>
        {
            policy.WithOrigins(
                    "http://localhost:8081",  // React Native dev server
                    "http://localhost:19006", // Expo web
                    "http://localhost:19000"  // Expo
                )
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// ⭐ ADD THIS: Enable CORS
app.UseCors("AllowReactNativeApp");

app.UseAuthorization();

app.MapControllers();

app.Run();
```

---

## Important Notes

### ⚠️ Order Matters!

Place `app.UseCors()` **BEFORE** these middleware components:

- `app.UseAuthorization()`
- `app.MapControllers()`

But **AFTER**:

- `app.UseHttpsRedirection()`
- `app.UseRouting()` (if present)

### 🔐 For Production

For production environments, replace the wildcard origins with your actual domain:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("ProductionPolicy",
        policy =>
        {
            policy.WithOrigins("https://your-production-domain.com")
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        });
});
```

---

## Testing the Fix

### 1. Save Program.cs

Save the file after adding the CORS configuration.

### 2. Restart the Backend

- Stop the backend API (click Stop in Visual Studio)
- Start it again (press F5)
- Wait for it to fully start

### 3. Test from React Native App

- Go back to your React Native app
- Click "איתור משלוח" (Shipment Tracking)
- Enter barcode: `78624165`
- Click "אישור" (Confirm)
- **It should now work!** ✅

---

## Alternative: Allow All Origins (Development Only)

If you want to quickly test and allow all origins (⚠️ **NOT recommended for production**):

```csharp
// Development only - allows all origins
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy =>
        {
            policy.AllowAnyOrigin()
                .AllowAnyMethod()
                .AllowAnyHeader();
        });
});

// Then use it:
app.UseCors("AllowAll");
```

---

## Troubleshooting

### Issue: Still getting CORS errors

**Solutions:**

1. Make sure you restarted the backend API
2. Check the order of middleware - `UseCors` must come before `UseAuthorization`
3. Clear browser cache
4. Check browser console for specific CORS error messages

### Issue: "The policy already exists"

If you get this error, you may have duplicate CORS configurations. Remove any existing `AddCors` or `UseCors` calls.

### Issue: Works in Swagger but not in app

This confirms it's a CORS issue. Make sure you:

1. Added the CORS service configuration
2. Called `app.UseCors()` in the correct order
3. Restarted the backend

---

## Need Help?

If you're still having issues:

1. **Check the Visual Studio Output window** for any errors or warnings
2. **Check the browser console** in your React Native app for CORS error details
3. **Verify the port numbers** match (React Native on 8081, API on 5001)

---

**Last Updated:** October 19, 2025
**Issue:** CORS blocking requests from React Native app to backend API
**Status:** ⚠️ Requires backend code changes
