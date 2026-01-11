# Container Closure Data Display Flow

## Overview

After closing a container in the EventClosureScreen, the data from the API response is displayed in two main locations:

## 1. Container Summary View (Main Screen)

Located in **EventClosureScreen.tsx** (lines 295-346)

When a container is successfully closed, the screen switches to a summary view displaying:

### Displayed Fields:

- **Container Barcode** (line 299-302): Shows the closed container's barcode
- **Exit Number** (line 307-310): Shows the distribution point/exit number
- **Location Details Section** (lines 313-345): Only shown if real data is available from backend

### Location Details Include:

- **Distribution Point Name** (line 316-318 or fallback to exit number 320-322)
- **Branch Code Badge** (lines 327-331): Shows "סניף {branchCode}"
- **Area Code Badge** (lines 332-336): Shows "אזור הפצה {areaCode}"
- **Line Code Badge** (lines 337-341): Shows "קו {lineCode}"

## 2. Success Modal Popup

Located in **EventClosureScreen.tsx** (lines 408-488)

The success modal displays immediately after container closure with:

### Modal Content:

- **Title** (line 426): "סגירת מארזים" (Container Closure)
- **Package Count** (lines 428-430): Shows number of packages with box emoji
- **Success Checkmark** (lines 432-434): Large yellow checkmark
- **Container ID** (lines 436-438): "מארז {successPackageId}"
- **Success Message** (lines 439-441): "נסגר בהצלחה!" (Closed Successfully!)

### Distribution Information in Modal (lines 444-476):

Only displayed if real data is available:

- **Distribution Point Name & Number** (lines 447-450)
- **Location Badges**:
  - Line Code (lines 456-460)
  - Area Code (lines 461-465)
  - Branch Code (lines 466-470)

## Data Flow Process

### Step 1: API Call (lines 93-109)

```javascript
const response = await sortingAPI.closeContainer(request);
```

### Step 2: Response Processing (lines 111-182)

The response data is extracted and stored in state variables:

- `packageCount`: Number of packages in container
- `distributionPointNumber`: Distribution point ID
- `distributionPointName`: Distribution point name
- `lineCode`: Distribution line code
- `branchCode`: Branch code
- `areaCode`: Area/point code

### Step 3: Additional Data Fetch (lines 143-182)

Calls `operationalAppAPI.getShipmentByNumber()` to get additional distribution details

### Step 4: Display Update (lines 184-206)

Creates `ContainerDetails` object and sets:

- `setCurrentContainerDetails(containerDetails)` - Updates main view
- `setShowContainerSummary(true)` - Shows summary instead of input form
- `setShowSuccessModal(true)` - Shows success popup

## Important Notes

### Data Display Policy

**NO MOCK DATA** - The screen only displays real data from the backend (see comments on lines 120, 133, 184-193):

- If backend doesn't provide a field, it's not displayed
- No fallback/mock values are used
- Empty fields are simply hidden from view

### Data Reset

When the success modal is closed (lines 213-226):

- Container summary view is reset
- All data fields are cleared
- Input form is shown again for next container

## Screen States

1. **Input State**: Shows two input fields for barcode scanning
2. **Summary State**: After successful closure, shows container details
3. **Modal State**: Success popup overlay with closure confirmation

The data persists in the summary view until the user closes the success modal, at which point everything resets for the next container closure operation.
