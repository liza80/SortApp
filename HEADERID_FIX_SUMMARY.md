# HeaderId Issue - Complete Analysis

## Problem

Frontend is sending `HeaderId: 0` when calling AddPackageToContainer, which causes "לא נמצא משלוח" error.

## Root Cause Chain

### 1. RunCom.WebAPI CreateContainer

✅ **WORKING** - Sets `response.HeaderId = (int)newMaarazId` from OsptKotrtMarz

### 2. OperationalApp SortingService.cs (line 407)

❌ **BROKEN** - Looking for lowercase "headerId" but RunCom returns uppercase "HeaderId"

```csharp
int headerId = runResponse.ContainsKey("headerId") ? runResponse["headerId"].GetInt32() : 0;
```

Result: Gets 0 instead of actual HeaderId

### 3. CourierApi receives HeaderId: 0

✅ Correctly forwards what it receives from OperationalApp

### 4. Frontend receives HeaderId: 0

✅ Correctly stores and uses what it receives

## The Fix Required

In **OperationalApp/OperationalApp.BL/Services/SortingService.cs** line 407, change from:

```csharp
int headerId = runResponse.ContainsKey("headerId") ? runResponse["headerId"].GetInt32() : 0;
```

To:

```csharp
// Check both lowercase and uppercase for compatibility
int headerId = 0;
if (runResponse.ContainsKey("headerId"))
{
    headerId = runResponse["headerId"].GetInt32();
}
else if (runResponse.ContainsKey("HeaderId"))
{
    headerId = runResponse["HeaderId"].GetInt32();
}
else if (runResponse.ContainsKey("containerNumber"))
{
    // Fallback to containerNumber if HeaderId is not found
    headerId = runResponse["containerNumber"].GetInt32();
}
```

## Alternative Quick Fix

If you can't modify OperationalApp immediately, you can modify RunCom.WebAPI to return both casing:

In **RunCom.WebAPI/Controllers/SortingController.cs** CreateContainer method, ensure the response includes both:

```csharp
response.HeaderId = (int)newMaarazId;
response.headerId = (int)newMaarazId; // Add lowercase version
```

But this is not recommended as it's a workaround rather than fixing the actual issue.

## Summary

- **Issue**: Case sensitivity mismatch between RunCom.WebAPI (returns "HeaderId") and OperationalApp (expects "headerId")
- **Impact**: HeaderId is always 0, causing AddPackageToContainer to fail
- **Solution**: Fix OperationalApp's SortingService.cs line 407 to handle both cases
