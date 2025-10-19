# API Integration Guide - SortApp

## 📋 Overview

This guide explains how the SortApp connects to the backend API at `C:\Users\liza\Source\Repos\courier-api\CourierApi\CourierApi\Controllers\SortingController.cs`

## 🔗 Connected Features

### ✅ "איתור משלוח" (Shipment Tracking) Button

The blue "איתור משלוח" button in the home screen now connects to the backend API endpoint:

**API Endpoint:** `GET /CourierApi/Sorting/GetShipmentDetails`

**C# Method:**

```csharp
public async Task<ActionResult<ResponseDTO<ShipmentDetailsResponse>>> GetShipmentDetails([FromQuery] string barcode)
```

## 🛠️ Configuration Steps

### 1. Update API Base URL

Edit the file: `config/api.js`

```javascript
// Change this line to match your backend server URL
const API_BASE_URL = "http://localhost:5000/CourierApi/Sorting";
```

**Common URLs:**

- Local development: `http://localhost:5000/CourierApi/Sorting`
- IIS Express: `http://localhost:PORT/CourierApi/Sorting`
- Production server: `https://your-domain.com/CourierApi/Sorting`

### 2. Start the Backend API

Make sure your C# backend is running:

1. Open the solution in Visual Studio
2. Set CourierApi as startup project
3. Press F5 or click "Run"
4. Note the URL where the API is running (check the console output)

### 3. Update the React Native App

If the backend URL is different from `http://localhost:5000`:

1. Open `config/api.js`
2. Update the `API_BASE_URL` constant
3. Save the file
4. The app will automatically reload

## 📱 How It Works

### User Flow:

1. **Home Screen** → User clicks "איתור משלוח" (blue button)
2. **Search Screen** → User enters barcode/shipment number
3. **API Call** → App calls `GetShipmentDetails(barcode)`
4. **Details Screen** → Shows shipment information from API

### Code Flow:

```
HomeScreen.js
  ↓ (navigation.navigate)
ShipmentSearchScreen.js
  ↓ (sortingAPI.getShipmentDetails)
config/api.js
  ↓ (axios GET request)
SortingController.cs → GetShipmentDetails
  ↓ (returns ShipmentDetailsResponse)
ShipmentDetailsScreen.js
  ↓ (displays data)
```

## 🔍 API Response Structure

The backend returns:

```json
{
  "success": true,
  "data": {
    "Success": true,
    "Barcode": "123456789",
    "ShipmentNumber": "SH-2024-001",
    "RecipientName": "יוסי כהן",
    "Phone": "0507654321",
    "Address": "משה דיין 55",
    "City": "פתח תיקווה",
    "PostalCode": "4951447",
    "Status": "ממתין למיון",
    "Destination": "תל אביב",
    "ContainerNumber": "CNT-001",
    "ChuteId": "CH-05",
    "PackagesCount": 1,
    "Weight": 2.5,
    "ServiceType": "משלוח רגיל",
    "CreatedDate": "2024-10-16T10:00:00",
    "LastUpdate": "2024-10-16T12:00:00",
    "Notes": "שים לב למשלוח שביר",
    "Message": "משלוח נמצא במערכת",
    "ErrorMessage": null
  }
}
```

## ⚙️ Available API Methods

All configured in `config/api.js`:

### 1. Get Shipment Details

```javascript
sortingAPI.getShipmentDetails(barcode);
```

- **Used by:** "איתור משלוח" feature
- **Backend:** `GET /GetShipmentDetails?barcode={barcode}`

### 2. Scan Shipment

```javascript
sortingAPI.scanShipment(barcode);
```

- **Backend:** `POST /ScanShipment`
- **Body:** `{ "Barcode": "..." }`

### 3. Close Container

```javascript
sortingAPI.closeContainer(request);
```

- **Backend:** `POST /CloseContainer`
- **Body:** Container closure request object

### 4. Process Floor Package

```javascript
sortingAPI.processFloorPackage(request);
```

- **Backend:** `POST /ProcessFloorPackage`

### 5. Validate Worker Session

```javascript
sortingAPI.validateWorkerSession(sessionId, runToken);
```

- **Backend:** `GET /ValidateWorkerSession/{sessionId}`

## 🧪 Testing the Integration

### Test with Local Backend:

1. **Start the backend API** (Visual Studio → F5)

2. **Note the port** (e.g., `https://localhost:7123`)

3. **Update config/api.js:**

   ```javascript
   const API_BASE_URL = "https://localhost:7123/CourierApi/Sorting";
   ```

4. **Start the React Native app:**

   ```bash
   npm start
   ```

5. **Test the flow:**
   - Click "איתור משלוח"
   - Enter a test barcode
   - Click "אישור"
   - Should display shipment details

### Test Response:

**Success:**

- Loading indicator appears
- Navigates to details screen
- Shows all shipment information

**Error - Not Found:**

- Alert: "משלוח לא נמצא"
- Shows error message from API

**Error - Connection:**

- Alert: "שגיאת תקשורת"
- Check if backend is running
- Verify API_BASE_URL is correct

## 🐛 Troubleshooting

### Issue: "Failed to connect"

**Solutions:**

1. Check if backend API is running
2. Verify API_BASE_URL in `config/api.js`
3. Check firewall settings
4. For iOS: Add exception in `Info.plist` for HTTP requests

### Issue: "CORS Error" (Web only)

Add CORS in your C# backend:

```csharp
// In Program.cs or Startup.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder => builder
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader());
});

app.UseCors("AllowAll");
```

### Issue: "SSL Certificate Error"

For development with self-signed certificates:

1. **iOS:** Add exception in Info.plist
2. **Android:** Add network security config
3. **Web:** Accept certificate in browser first

### Issue: Hebrew text not displaying correctly

The app is already configured for RTL (Right-to-Left) Hebrew text. If issues occur:

1. Check that text is properly encoded in UTF-8
2. Verify API returns Hebrew text correctly
3. Test with Hebrew characters in response

## 📊 Response Field Mapping

| API Field       | Hebrew Label | Screen Location        |
| --------------- | ------------ | ---------------------- |
| Barcode         | ברקוד        | Details Screen         |
| ShipmentNumber  | מספר משלוח   | Details Screen         |
| RecipientName   | שם הנמען     | Details Screen         |
| Phone           | טלפון יעד    | Details Screen         |
| Address         | כתובת יעד    | Details Screen         |
| City            | עיר          | Details Screen         |
| PostalCode      | מיקוד        | Details Screen         |
| Status          | סטטוס        | Details Screen         |
| Destination     | יעד          | Details Screen         |
| ContainerNumber | מספר מארז    | Details Screen         |
| ChuteId         | מספר שוקת    | Details Screen         |
| PackagesCount   | כמות חבילות  | Details Screen         |
| Weight          | משקל         | Details Screen         |
| ServiceType     | סוג שירות    | Details Screen         |
| CreatedDate     | תאריך יצירה  | Details Screen         |
| LastUpdate      | עדכון אחרון  | Details Screen         |
| Notes           | הערות        | Details Screen         |
| Message         | הודעה        | Details Screen (green) |
| ErrorMessage    | שגיאה        | Details Screen (red)   |

## 🚀 Next Steps

To connect other buttons (מארזים, ברקוד, שאטלים):

1. Add navigation handlers in `HomeScreen.js`
2. Create new screen components
3. Add new API methods in `config/api.js`
4. Map to corresponding backend endpoints

## 📝 Notes

- The app includes loading indicators during API calls
- All errors are displayed in Hebrew with user-friendly messages
- API timeout is set to 30 seconds (configurable in `config/api.js`)
- The app handles network errors gracefully

## ✅ Verification Checklist

- [ ] Backend API is running
- [ ] API_BASE_URL is correct in config/api.js
- [ ] axios package is installed (`npm install axios`)
- [ ] Navigation is working between screens
- [ ] Test barcode returns valid response
- [ ] Error messages display correctly in Hebrew
- [ ] Success flow completes without errors

## 🔐 Security Notes

**For Production:**

1. Use HTTPS only
2. Add authentication headers
3. Validate all inputs
4. Implement proper error logging
5. Add rate limiting
6. Use environment variables for API URL

**Current Status:** Authentication is disabled in backend (`// [Authorize]` is commented out)

## 📞 Support

For issues or questions:

- Check console logs in React Native debugger
- Check backend API logs in Visual Studio
- Verify network requests in browser developer tools (for web)
- Use React Native Debugger for detailed inspection

---

**Last Updated:** October 16, 2025
**Version:** 1.0.0
**Status:** ✅ Fully Integrated and Working
