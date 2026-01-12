-- ================================================
-- DATABASE VALIDATION QUERIES FOR SORTAPP
-- ================================================
-- Run these queries to verify data correctness in your RunDB database
-- Author: Generated for validation purposes
-- Date: January 2025
-- ================================================

USE [RunDB];
GO

-- ================================================
-- 1. VALIDATE CONTAINER DATA (RNFIL454 - KOTROT_MARAZIM)
-- ================================================

-- 1.1 Check for orphaned containers (containers without any packages)
PRINT '=== CHECKING FOR EMPTY CONTAINERS ==='
SELECT 
    km.MAARAZ as ContainerNumber,
    km.EXTERNAL_MAARAZ as PCCBarcode,
    km.EXIT_ID,
    km.CLOSED as IsClosed,
    km.CLOSING_DATE,
    (SELECT COUNT(*) FROM [RNFIL455] sm WHERE sm.MAARAZ = km.MAARAZ) as PackageCount
FROM [RNFIL454] km
WHERE NOT EXISTS (
    SELECT 1 FROM [RNFIL455] sm WHERE sm.MAARAZ = km.MAARAZ
)
AND km.CLOSED = 1
ORDER BY km.CLOSING_DATE DESC;

-- 1.2 Check for containers with invalid exit IDs
PRINT '=== CHECKING FOR CONTAINERS WITH INVALID EXIT IDS ==='
SELECT 
    km.MAARAZ as ContainerNumber,
    km.EXTERNAL_MAARAZ as PCCBarcode,
    km.EXIT_ID,
    km.CLOSED
FROM [RNFIL454] km
WHERE NOT EXISTS (
    SELECT 1 FROM [RNFIL546] se WHERE se.EXIT_ID = km.EXIT_ID
)
AND km.EXIT_ID IS NOT NULL
AND km.EXIT_ID > 0;

-- 1.3 Check for duplicate PCC barcodes
PRINT '=== CHECKING FOR DUPLICATE PCC BARCODES ==='
SELECT 
    EXTERNAL_MAARAZ as PCCBarcode,
    COUNT(*) as DuplicateCount,
    STRING_AGG(CAST(MAARAZ as VARCHAR), ', ') as ContainerNumbers,
    STRING_AGG(CASE WHEN CLOSED = 1 THEN 'Closed' ELSE 'Open' END, ', ') as Status
FROM [RNFIL454]
WHERE EXTERNAL_MAARAZ IS NOT NULL 
    AND EXTERNAL_MAARAZ != ''
    AND EXTERNAL_MAARAZ LIKE 'PCC%'
GROUP BY EXTERNAL_MAARAZ
HAVING COUNT(*) > 1
ORDER BY DuplicateCount DESC;

-- 1.4 Check for open containers older than 7 days
PRINT '=== CHECKING FOR OLD OPEN CONTAINERS ==='
SELECT 
    km.MAARAZ as ContainerNumber,
    km.EXTERNAL_MAARAZ as PCCBarcode,
    km.EXIT_ID,
    se.EXIT_NUMBER,
    se.EXIT_NAME,
    km.OPENING_DATE,
    DATEDIFF(day, km.OPENING_DATE, GETDATE()) as DaysOpen,
    (SELECT COUNT(*) FROM [RNFIL455] WHERE MAARAZ = km.MAARAZ) as PackageCount
FROM [RNFIL454] km
LEFT JOIN [RNFIL546] se ON km.EXIT_ID = se.EXIT_ID
WHERE km.CLOSED = 0 
    AND km.OPENING_DATE < DATEADD(day, -7, GETDATE())
ORDER BY km.OPENING_DATE;

-- ================================================
-- 2. VALIDATE SHIPMENT DATA (RNFIL455 - SHOROT_MARAZIM)
-- ================================================

-- 2.1 Check for shipments not linked to any container
PRINT '=== CHECKING FOR ORPHANED SHIPMENTS ==='
SELECT 
    SHIPMENT,
    MAARAZ,
    SCAN_DATE
FROM [RNFIL455]
WHERE MAARAZ IS NULL OR MAARAZ = 0
ORDER BY SCAN_DATE DESC;

-- 2.2 Check for shipments in multiple containers
PRINT '=== CHECKING FOR SHIPMENTS IN MULTIPLE CONTAINERS ==='
SELECT 
    SHIPMENT,
    COUNT(DISTINCT MAARAZ) as ContainerCount,
    STRING_AGG(CAST(MAARAZ as VARCHAR), ', ') as Containers
FROM [RNFIL455]
WHERE MAARAZ IS NOT NULL AND MAARAZ > 0
GROUP BY SHIPMENT
HAVING COUNT(DISTINCT MAARAZ) > 1
ORDER BY ContainerCount DESC;

-- 2.3 Verify shipment counts per container
PRINT '=== CONTAINER SHIPMENT COUNT VALIDATION ==='
SELECT 
    km.MAARAZ as ContainerNumber,
    km.EXTERNAL_MAARAZ as PCCBarcode,
    km.EXIT_ID,
    se.EXIT_NUMBER,
    se.EXIT_NAME,
    km.CLOSED as IsClosed,
    COUNT(sm.SHIPMENT) as ActualPackageCount,
    km.PACKAGE_COUNT as RecordedPackageCount,
    CASE 
        WHEN COUNT(sm.SHIPMENT) != km.PACKAGE_COUNT 
        THEN 'MISMATCH: Expected ' + CAST(km.PACKAGE_COUNT as VARCHAR) + ' but found ' + CAST(COUNT(sm.SHIPMENT) as VARCHAR)
        ELSE 'OK'
    END as ValidationStatus
FROM [RNFIL454] km
LEFT JOIN [RNFIL455] sm ON km.MAARAZ = sm.MAARAZ
LEFT JOIN [RNFIL546] se ON km.EXIT_ID = se.EXIT_ID
WHERE km.CLOSED = 1
GROUP BY km.MAARAZ, km.EXTERNAL_MAARAZ, km.EXIT_ID, se.EXIT_NUMBER, se.EXIT_NAME, km.CLOSED, km.PACKAGE_COUNT
HAVING COUNT(sm.SHIPMENT) != km.PACKAGE_COUNT OR km.PACKAGE_COUNT IS NULL
ORDER BY km.MAARAZ DESC;

-- ================================================
-- 3. VALIDATE EXIT DATA (RNFIL546 - EXITS)
-- ================================================

-- 3.1 Check for exits without names
PRINT '=== CHECKING FOR EXITS WITHOUT NAMES ==='
SELECT 
    EXIT_ID,
    EXIT_NUMBER,
    EXIT_NAME,
    BRANCH_CODE,
    ADDRESS
FROM [RNFIL546]
WHERE EXIT_NAME IS NULL OR EXIT_NAME = ''
ORDER BY EXIT_NUMBER;

-- 3.2 Check for duplicate exit numbers
PRINT '=== CHECKING FOR DUPLICATE EXIT NUMBERS ==='
SELECT 
    EXIT_NUMBER,
    COUNT(*) as DuplicateCount,
    STRING_AGG(CAST(EXIT_ID as VARCHAR), ', ') as ExitIDs,
    STRING_AGG(EXIT_NAME, ', ') as ExitNames
FROM [RNFIL546]
WHERE EXIT_NUMBER IS NOT NULL
GROUP BY EXIT_NUMBER
HAVING COUNT(*) > 1
ORDER BY DuplicateCount DESC;

-- ================================================
-- 4. SPECIFIC CONTAINER VALIDATION
-- ================================================

-- 4.1 Validate specific container (replace PCC546 with your container)
PRINT '=== VALIDATING SPECIFIC CONTAINER: PCC546 ==='
DECLARE @ContainerBarcode VARCHAR(50) = 'PCC546';  -- Change this to validate different containers

SELECT 
    'Container Info' as DataType,
    km.MAARAZ as ContainerNumber,
    km.EXTERNAL_MAARAZ as PCCBarcode,
    km.EXIT_ID,
    se.EXIT_NUMBER,
    se.EXIT_NAME,
    km.CLOSED as IsClosed,
    km.OPENING_DATE,
    km.CLOSING_DATE,
    km.PACKAGE_COUNT as RecordedCount
FROM [RNFIL454] km
LEFT JOIN [RNFIL546] se ON km.EXIT_ID = se.EXIT_ID
WHERE km.EXTERNAL_MAARAZ = @ContainerBarcode;

-- Show all packages in this container
SELECT 
    'Package Details' as DataType,
    sm.SHIPMENT as ShipmentNumber,
    sm.SCAN_DATE,
    sm.SCANNER_ID
FROM [RNFIL455] sm
INNER JOIN [RNFIL454] km ON sm.MAARAZ = km.MAARAZ
WHERE km.EXTERNAL_MAARAZ = @ContainerBarcode
ORDER BY sm.SCAN_DATE;

-- ================================================
-- 5. DATA CONSISTENCY CHECKS
-- ================================================

-- 5.1 Check for containers closed without closing date
PRINT '=== CHECKING FOR CLOSED CONTAINERS WITHOUT CLOSING DATE ==='
SELECT 
    MAARAZ,
    EXTERNAL_MAARAZ,
    CLOSED,
    CLOSING_DATE
FROM [RNFIL454]
WHERE CLOSED = 1 AND (CLOSING_DATE IS NULL OR CLOSING_DATE = '')
ORDER BY MAARAZ DESC;

-- 5.2 Check for data anomalies in recent operations (last 24 hours)
PRINT '=== RECENT OPERATION VALIDATION (LAST 24 HOURS) ==='
SELECT 
    km.MAARAZ as ContainerNumber,
    km.EXTERNAL_MAARAZ as PCCBarcode,
    km.EXIT_ID,
    se.EXIT_NUMBER,
    se.EXIT_NAME,
    km.CLOSED as IsClosed,
    km.CLOSING_DATE,
    COUNT(sm.SHIPMENT) as PackageCount,
    MAX(sm.SCAN_DATE) as LastScanDate
FROM [RNFIL454] km
LEFT JOIN [RNFIL455] sm ON km.MAARAZ = sm.MAARAZ
LEFT JOIN [RNFIL546] se ON km.EXIT_ID = se.EXIT_ID
WHERE km.CLOSING_DATE >= DATEADD(hour, -24, GETDATE())
   OR km.OPENING_DATE >= DATEADD(hour, -24, GETDATE())
   OR sm.SCAN_DATE >= DATEADD(hour, -24, GETDATE())
GROUP BY km.MAARAZ, km.EXTERNAL_MAARAZ, km.EXIT_ID, se.EXIT_NUMBER, 
         se.EXIT_NAME, km.CLOSED, km.CLOSING_DATE
ORDER BY km.CLOSING_DATE DESC;

-- ================================================
-- 6. SUMMARY STATISTICS
-- ================================================

PRINT '=== DATABASE SUMMARY STATISTICS ==='

-- Overall container statistics
SELECT 
    'Container Statistics' as Category,
    COUNT(*) as TotalContainers,
    SUM(CASE WHEN CLOSED = 1 THEN 1 ELSE 0 END) as ClosedContainers,
    SUM(CASE WHEN CLOSED = 0 THEN 1 ELSE 0 END) as OpenContainers,
    SUM(CASE WHEN EXTERNAL_MAARAZ LIKE 'PCC%' THEN 1 ELSE 0 END) as PCCContainers
FROM [RNFIL454];

-- Shipment statistics
SELECT 
    'Shipment Statistics' as Category,
    COUNT(DISTINCT SHIPMENT) as TotalUniqueShipments,
    COUNT(*) as TotalShipmentRecords,
    COUNT(DISTINCT MAARAZ) as ContainersWithShipments
FROM [RNFIL455];

-- Exit statistics
SELECT 
    'Exit Statistics' as Category,
    COUNT(*) as TotalExits,
    COUNT(DISTINCT EXIT_NUMBER) as UniqueExitNumbers,
    COUNT(DISTINCT BRANCH_CODE) as UniqueBranches
FROM [RNFIL546];

-- Today's activity
SELECT 
    'Todays Activity' as Category,
    COUNT(DISTINCT km.MAARAZ) as ContainersProcessedToday,
    COUNT(DISTINCT sm.SHIPMENT) as ShipmentsScannedToday
FROM [RNFIL454] km
LEFT JOIN [RNFIL455] sm ON km.MAARAZ = sm.MAARAZ
WHERE CAST(km.OPENING_DATE as DATE) = CAST(GETDATE() as DATE)
   OR CAST(km.CLOSING_DATE as DATE) = CAST(GETDATE() as DATE)
   OR CAST(sm.SCAN_DATE as DATE) = CAST(GETDATE() as DATE);

-- ================================================
-- 7. ALERTS - CRITICAL ISSUES THAT NEED ATTENTION
-- ================================================

PRINT '=== CRITICAL ALERTS ==='

-- Alert for any critical data issues
SELECT 
    'ALERT' as Severity,
    'Empty Closed Container' as Issue,
    'Container ' + CAST(MAARAZ as VARCHAR) + ' (' + EXTERNAL_MAARAZ + ') is closed but has no packages' as Description,
    CLOSING_DATE as OccurredAt
FROM [RNFIL454] km
WHERE CLOSED = 1 
  AND NOT EXISTS (SELECT 1 FROM [RNFIL455] WHERE MAARAZ = km.MAARAZ)
  AND CLOSING_DATE >= DATEADD(day, -7, GETDATE())

UNION ALL

SELECT 
    'ALERT' as Severity,
    'Package Count Mismatch' as Issue,
    'Container ' + CAST(km.MAARAZ as VARCHAR) + ' shows ' + CAST(km.PACKAGE_COUNT as VARCHAR) + 
    ' packages but actually has ' + CAST(COUNT(sm.SHIPMENT) as VARCHAR) as Description,
    km.CLOSING_DATE as OccurredAt
FROM [RNFIL454] km
LEFT JOIN [RNFIL455] sm ON km.MAARAZ = sm.MAARAZ
WHERE km.CLOSED = 1
  AND km.CLOSING_DATE >= DATEADD(day, -7, GETDATE())
GROUP BY km.MAARAZ, km.PACKAGE_COUNT, km.CLOSING_DATE
HAVING COUNT(sm.SHIPMENT) != km.PACKAGE_COUNT

ORDER BY OccurredAt DESC;

PRINT '=== VALIDATION COMPLETE ===';
PRINT 'Review the results above for any data inconsistencies or issues.';
