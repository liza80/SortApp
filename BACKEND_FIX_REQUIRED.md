# Backend Fix Required - HTTPS Redirection Issue

## 🚨 Problem Found

Your backend `Program.cs` already has CORS configured correctly:

```csharp
app.UseCors(builder => builder
    .AllowAnyOrigin()
    .AllowAnyMethod()
    .AllowAnyHeader());
```

**However**, the issue is caused by **HTTPS redirection**. Your React Native app is making HTTP requests to `http://localhost:5001`, but the backend has `app.UseHttpsRedirection()` enabled, which is trying to redirect to HTTPS and causing an empty response.

## ✅ Solution

You need to temporarily disable HTTPS redirection for development, or configure your app to use HTTPS.

---

## Option 1: Disable HTTPS Redirection (Quick Fix for Development)

Edit `C:\Users\liza\Source\Repos\courier-api\CourierApi\CourierApi\Program.cs`

### Find this line (around line 151):

```csharp
app.UseHttpsRedirection();
```

### Replace it with:

```csharp
// Disable HTTPS redirection for development with React Native
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
```

This will disable HTTPS redirection only in development mode, allowing HTTP requests from your React Native app.

---

## Option 2: Use HTTPS URL in React Native App

If you want to keep HTTPS redirection enabled:

### Step 1: Find the HTTPS port

Check your backend's console output when it starts. You should see something like:

```
Now listening on: https://localhost:7123
Now listening on: http://localhost:5001
```

### Step 2: Update your React Native app

Edit `c:\Users\liza\Source\Repos\SortApp\config\api.js`:

```javascript
// Change from HTTP to HTTPS
const API_BASE_URL = "https://localhost:7123/CourierApi/Sorting";
```

### Step 3: Handle SSL Certificate (for development)

Since the backend uses a self-signed certificate, you may need to:

**For Web/Browser:**

1. Open `https://localhost:7123` in your browser
2. Accept the security warning
3. Then your React Native app should work

**For Mobile (if testing on device):**

- You'll need to configure certificate trust or use HTTP in development

---

## ✅ Recommended Solution

**Use Option 1** (disable HTTPS redirection in development) because:

- ✅ Simplest solution
- ✅ Only affects development environment
- ✅ No need to handle SSL certificates
- ✅ Works immediately with your current React Native setup
- ✅ Production will still use HTTPS (when not in development mode)

---

## Step-by-Step Instructions (Option 1)

1. **Open Visual Studio**

   - Open your backend solution

2. **Open Program.cs**

   - Located at: `C:\Users\liza\Source\Repos\courier-api\CourierApi\CourierApi\Program.cs`

3. **Find line 151** (approximately):

   ```csharp
   app.UseHttpsRedirection();
   ```

4. **Replace it with**:

   ```csharp
   // Disable HTTPS redirection for development with React Native
   if (!app.Environment.IsDevelopment())
   {
       app.UseHttpsRedirection();
   }
   ```

5. **Save the file**

6. **Restart the backend API**

   - Stop the API (click Stop button in Visual Studio)
   - Start it again (press F5)

7. **Test from React Native app**
   - Go to your React Native app
   - Click "איתור משלוח"
   - Enter barcode: `78624165`
   - Click "אישור"
   - **It should now work!** ✅

---

## Why This Works

The error `net::ERR_EMPTY_RESPONSE` occurs because:

1. React Native app makes HTTP request → `http://localhost:5001`
2. Backend receives request
3. `app.UseHttpsRedirection()` tries to redirect to HTTPS
4. Redirect response is sent, but browser/app can't complete the redirect
5. Result: Empty response

By conditionally disabling HTTPS redirection in development:

- HTTP requests work directly
- No redirect needed
- Connection succeeds
- Production still uses HTTPS redirection (when deployed)

---

## Current Backend Configuration (Already Correct)

Your `Program.cs` already has:

✅ **CORS configured correctly:**

```csharp
app.UseCors(builder => builder
    .AllowAnyOrigin()
    .AllowAnyMethod()
    .AllowAnyHeader());
```

✅ **Middleware order is correct:**

```csharp
app.UseCors(...);           // ← CORS first
app.UseHttpsRedirection();  // ← Issue is here
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
```

---

## Testing After Fix

After applying the fix:

1. ✅ Swagger should still work: `http://localhost:5001/swagger`
2. ✅ Direct API calls should work: `http://localhost:5001/CourierApi/Sorting/GetShipmentDetails?barcode=78624165`
3. ✅ React Native app should work: HTTP requests from `localhost:8081` to `localhost:5001`

---

## Production Deployment

When deploying to production:

- Set environment to Production (not Development)
- HTTPS redirection will automatically be enabled
- Use a proper SSL certificate
- Update React Native app to use production HTTPS URL

---

**Last Updated:** October 19, 2025
**Issue:** HTTPS redirection causing ERR_EMPTY_RESPONSE
**Status:** ⚠️ Requires one-line change in Program.cs
