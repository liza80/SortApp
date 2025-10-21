# AWS Architecture Documentation - CourierApi

## Overview

This document explains how the CourierApi application uses AWS services and the complete request flow for user authentication.

---

## AWS Services Used

### 1. AWS RDS (Relational Database Service)

- **Instance:** `cht-delivery-dev-db.c2wagahd0aeq.eu-central-1.rds.amazonaws.com`
- **Engine:** SQL Server
- **Database:** OperationDB
- **Region:** eu-central-1 (Frankfurt)
- **Purpose:** Main application database for storing users, shipments, sessions, and logs

### 2. AWS CloudFront (CDN - Content Delivery Network)

#### Distribution 1: OTP Service

- **Domain:** `d3grdst4rg2dj9.cloudfront.net`
- **Distribution ID:** E7FDCAG3B4D6B
- **Description:** `cht-otp-dev-CloudFront`
- **Origin:** `cht-otp-dev-LoadBalancer-1`
- **Purpose:** CDN for OTP (One-Time Password) API service
- **Endpoints:**
  - `POST /OtpApi/SendOtpPinCode` - Send initial OTP
  - `POST /OtpApi/ResendOtpCode` - Resend OTP
  - `POST /OtpApi/VerifyOtpPinCode` - Verify OTP code

#### Distribution 2: Rating Service

- **Domain:** `dntetkm1870hw.cloudfront.net`
- **Distribution ID:** E243PD3HRL4HW1
- **Description:** `cheetah-app-dev-CloudFront`
- **Origin:** `cheetah-appdevLoadBalancer`
- **Purpose:** CDN for Rating/Users API service
- **Endpoints:**
  - `POST /UsersApi/CourierRatings/GetCourierRatingByCourierNumber/{courierNumber}`

### 3. AWS Elastic Load Balancers (ELB)

#### Load Balancer 1: OTP Service

- **Name:** `cht-otp-dev-LoadBalancer-1`
- **Purpose:** Distributes traffic to OTP API servers
- **Source:** CloudFront distribution (d3grdst4rg2dj9.cloudfront.net)

#### Load Balancer 2: Rating Service

- **Name:** `cheetah-appdevLoadBalancer`
- **Purpose:** Distributes traffic to Rating API servers
- **Source:** CloudFront distribution (dntetkm1870hw.cloudfront.net)

#### Load Balancer 3: ERP System

- **Name:** `cht-delivery-dev-ERP-LB-175272948.eu-central-1.elb.amazonaws.com`
- **Purpose:** Distributes traffic to Operational/ERP system
- **Source:** Direct calls from CourierApi

### 4. AWS CodeCommit

- **Repository:** `https://git-codecommit.eu-central-1.amazonaws.com/v1/repos/SortApp`
- **Purpose:** Git repository hosting for source code

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                  Mobile Application                 │
│            (React Native / Expo App)                │
└───────────────────────┬─────────────────────────────┘
                        │ HTTPS
                        ↓
┌─────────────────────────────────────────────────────┐
│              CourierApi Application                 │
│         (C# .NET 6 Web API on IIS/EC2)             │
│                                                      │
│  Components:                                        │
│  - AuthenticationService.cs                         │
│  - UsersService.cs                                  │
│  - ShipmentService.cs                               │
│  - Database: RDS SQL Server                         │
└──────┬──────────────────┬──────────────────┬────────┘
       │                  │                  │
       │                  │                  │
   ┌───▼────┐        ┌───▼────┐        ┌───▼────┐
   │CloudFr │        │CloudFr │        │  ELB   │
   │ OTP    │        │ Rating │        │  ERP   │
   └───┬────┘        └───┬────┘        └───┬────┘
       │                  │                  │
   ┌───▼────┐        ┌───▼────┐        ┌───▼────┐
   │  ELB   │        │  ELB   │        │Backend │
   │  OTP   │        │ Rating │        │  ERP   │
   └───┬────┘        └───┬────┘        └────────┘
       │                  │
   ┌───▼────┐        ┌───▼────┐
   │Backend │        │Backend │
   │OTP API │        │Rating  │
   └────────┘        └────────┘
```

---

## Complete Request Flow: User Login with OTP

### Step 1: Mobile App Initiates Login

```
Mobile App → CourierApi
POST https://your-courier-api.com/api/Authentication/SendOTP
Body: {
  "phoneNumber": "0501234567"
}
```

**Code Location:** `AuthenticationController.cs` - `SendOTP()` method

### Step 2: CourierApi Calls CloudFront OTP Service

```
CourierApi → CloudFront
POST https://d3grdst4rg2dj9.cloudfront.net/OtpApi/SendOtpPinCode
Body: {
  "phoneNumber": "0501234567"
}
```

**Code Location:** `AuthenticationService.cs` - `UseOTPSendService()` method

```csharp
var endpoint = $"{_configuration["OTP:EndPointUrl"]}SendOtpPinCode";
var requestData = new SendOTPRequest('0' + user.UserPhone.ToString());
var res = await _httpHelper.Post(endpoint, requestData, null);
```

### Step 3: CloudFront Forwards to Load Balancer

```
CloudFront → Load Balancer
POST http://cht-otp-dev-LoadBalancer-1/OtpApi/SendOtpPinCode
```

**What CloudFront does:**

- Checks cache (if enabled for this endpoint)
- Terminates SSL/TLS
- Forwards request to origin (Load Balancer)
- Adds headers for monitoring

### Step 4: Load Balancer Distributes to Backend Server

```
Load Balancer → OTP API Server (EC2/ECS instance)
POST http://10.x.x.x:port/OtpApi/SendOtpPinCode
```

**What Load Balancer does:**

- Health check - selects only healthy instances
- Round-robin distribution (or other algorithm)
- Session stickiness (if configured)

### Step 5: OTP API Server Processes Request

```
OTP API Server processes:
1. Validates phone number format
2. Generates random 6-digit PIN code (e.g., 123456)
3. Stores PIN in database/cache with expiration (typically 5 minutes)
4. Calls SMS gateway to send PIN to phone number
5. Returns success response
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "OTP sent successfully"
  },
  "error": null
}
```

### Step 6: Response Flows Back

```
OTP Server → Load Balancer → CloudFront → CourierApi → Mobile App
```

**Complete round-trip typically takes:** 500ms - 2 seconds

---

## User Verification Flow

### Step 1: User Enters OTP Code

```
Mobile App → CourierApi
POST /api/Authentication/VerifyOTP
Body: {
  "phoneNumber": "0501234567",
  "pinCode": 123456
}
```

### Step 2: CourierApi Calls Verification Endpoint

```
CourierApi → CloudFront → Load Balancer → OTP Server
POST https://d3grdst4rg2dj9.cloudfront.net/OtpApi/VerifyOtpPinCode
```

**Code Location:** `AuthenticationService.cs` - `UseOTPVerifyService()` method

### Step 3: OTP Server Validates PIN

```
OTP Server:
1. Checks if PIN exists in database
2. Validates PIN hasn't expired
3. Compares entered PIN with stored PIN
4. Returns success/failure
```

### Step 4: CourierApi Generates JWT Token

**If verification successful:**

```csharp
// In AuthenticationService.cs - VerifyOTP() method
User user = _usersRepository.GetUserByPhoneNumber(int.Parse(verifyOTPRequest.phoneNumber));
Session session = new Session();
session.DriverId = user.UserId;
session.Token = _jwtService.GenerateToken(session);
session.RefreshToken = _jwtService.GenerateRefreshToken();
_sessionRepository.AddOrUpdateSession(session);
```

### Step 5: Return Token to Mobile App

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "abc123...",
    "userId": "12345",
    "message": "success"
  }
}
```

---

## Rating Service Flow

### When Rating is Fetched

```
CourierApi checks if rating is older than 30 days:
```

**Code Location:** `UsersService.cs`

```csharp
if (user.RatingTimestamp == null ||
    DateTime.Parse(user.RatingTimestamp).AddDays(30) < DateTime.Today)
{
    user.DriverRating = GetRatingFromCXByCourierNumber(userID).Result;
    user.RatingTimestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
    _usersRepository.AddOrUpdateUser(user);
}
```

### Request Flow

```
CourierApi → CloudFront (dntetkm1870hw.cloudfront.net)
          → Load Balancer (cheetah-appdevLoadBalancer)
          → Rating API Server
          → Returns rating value (e.g., 4.5)
```

---

## ERP System Flow

### Shipment Operations

```
CourierApi → ELB (cht-delivery-dev-ERP-LB)
          → ERP Backend Server
```

**Endpoints Used:**

- `GET /OperationalApp/Shipment/GetShipmentByNumber/{shipmentID}`
- `POST /OperationalApp/Shipment/UpdateOperations`

**Authentication:** Custom header `X-Token-Verify`

---

## Configuration Files

### appsettings.json

```json
{
  "OTP": {
    "EndPointUrl": "https://d3grdst4rg2dj9.cloudfront.net/OtpApi/"
  },
  "Rating": {
    "EndPointUrl": "https://dntetkm1870hw.cloudfront.net/UsersApi"
  },
  "OperationalApp": {
    "EndPointUrl": "http://cht-delivery-dev-ERP-LB-175272948.eu-central-1.elb.amazonaws.com/",
    "Token": "mSA)#Wg^SpBcmR6j8J42*dbHAJkG5UY7"
  },
  "ConnectionStrings": {
    "DbConnectionString": "Server=tcp:cht-delivery-dev-db.c2wagahd0aeq.eu-central-1.rds.amazonaws.com,1433;Database=OperationDB;..."
  }
}
```

---

## Benefits of This Architecture

### 1. Performance

- **CloudFront caching** reduces response times globally
- **Load balancers** distribute traffic efficiently
- **Edge locations** serve content from nearest location to user

### 2. Reliability

- **Multiple backend servers** behind load balancers
- **Health checks** automatically remove failed instances
- **Auto-scaling** can add servers during high traffic

### 3. Security

- **CloudFront** provides DDoS protection
- **SSL/TLS termination** at CDN edge
- **Private backend servers** not exposed to internet
- **Token-based authentication** for ERP system

### 4. Scalability

- Can add more EC2/ECS instances behind load balancers
- CloudFront handles traffic spikes
- Independent scaling of each service (OTP, Rating, ERP)

### 5. Separation of Concerns

- Each service (OTP, Rating, ERP) can be:
  - Developed independently
  - Deployed independently
  - Scaled independently
  - Maintained by different teams

---

## Cost Considerations

### Monthly AWS Costs (Estimated)

- **RDS SQL Server:** $50-200/month (depending on instance size)
- **CloudFront:** $10-50/month (based on data transfer)
- **Load Balancers:** $20-30/month per LB × 3 = $60-90/month
- **EC2/ECS Instances:** $50-500/month (depending on number and size)
- **Data Transfer:** $10-50/month
- **CodeCommit:** Usually within free tier

**Total Estimated:** $180-890/month depending on traffic and instance sizes

---

## Monitoring Recommendations

### CloudWatch Metrics to Monitor

1. **CloudFront:**

   - Request count
   - Error rate (4xx, 5xx)
   - Cache hit ratio
   - Data transfer

2. **Load Balancers:**

   - Request count
   - Target response time
   - Unhealthy host count
   - HTTP 5xx errors

3. **RDS:**

   - CPU utilization
   - Database connections
   - Read/Write IOPS
   - Storage space

4. **Application Logs:**
   - Serilog logs in SQL Server (Logging table)
   - API response times
   - Failed authentication attempts

---

## Troubleshooting Guide

### OTP Not Received

1. Check CloudFront distribution status (should be "Deployed")
2. Check Load Balancer health checks
3. Verify backend OTP servers are running
4. Check SMS gateway service status
5. Review Serilog logs in database

### Slow Response Times

1. Check CloudFront cache hit ratio (should be >80%)
2. Review Load Balancer metrics for high response times
3. Check EC2/ECS CPU and memory usage
4. Review RDS database performance metrics

### Authentication Failures

1. Check JWT token expiration settings
2. Verify Session table in database
3. Review AuthenticationService logs
4. Confirm OTP API is responding correctly

---

## Related Files

- **Configuration:** `appsettings.json`
- **Authentication Service:** `CourierApi.BL/Services/AuthenticationService.cs`
- **Authentication Controller:** `CourierApi/Controllers/AuthenticationController.cs`
- **Users Service:** `CourierApi.BL/Services/UsersService.cs`
- **HTTP Helper:** `CourierApi.DAL/Utils/HttpHelper.cs`

---

## Last Updated

October 20, 2025
