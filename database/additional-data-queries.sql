-- Additional Data Queries for Shipment 90297860 Analysis
-- To better understand the driver reassignment on Oct 12, 2025

-- =====================================================
-- 1. DRIVER INFORMATION
-- =====================================================
-- Get details about both drivers (3545 and 5046)
-- Need: Driver names, areas, zones, status, routes assigned

SELECT *
FROM [RunDB].[dbo].[DRIVERS_TABLE_NAME] -- Replace with actual driver table name
WHERE NEHAG IN (3545, 5046);

-- Alternative if driver codes are in different field:
-- WHERE KOD_NEHAG IN (3545, 5046) OR MISPAR_NEHAG IN (3545, 5046);


-- =====================================================
-- 2. COORDINATOR INFORMATION
-- =====================================================
-- Get details about coordinators (1 and 5)

SELECT *
FROM [RunDB].[dbo].[COORDINATORS_TABLE_NAME] -- Replace with actual coordinator table name
WHERE KOD_RAKAZ IN (1, 5);


-- =====================================================
-- 3. DESTINATION/CUSTOMER INFORMATION
-- =====================================================
-- Get full details about the delivery destination
-- Customer: רויטל ארז, Location: 3763 (YESHUV_YAHAD)

SELECT *
FROM [RunDB].[dbo].[CUSTOMERS_TABLE_NAME] -- Replace with actual customer table name
WHERE SHEM_YAHAD LIKE '%רויטל ארז%' 
   OR TELEFON_YAHAD = '0585883042';

-- Location/Settlement information
SELECT *
FROM [RunDB].[dbo].[SETTLEMENTS_TABLE_NAME] -- Replace with actual settlements table name
WHERE KOD_YESHUV = 3763;


-- =====================================================
-- 4. OTHER SHIPMENTS IN SAME SWEEP ASSIGNMENT
-- =====================================================
-- Find all shipments affected by Ben Kriav's sweep assignment on Oct 12, 08:13:40
-- This will show if it was a bulk reassignment

SELECT r99.*, r100.*
FROM [RunDB].[dbo].[RNFIL099] r99
LEFT JOIN [RunDB].[dbo].[RNFIL100] r100 ON r99.[MEZAHE_LOG] = r100.[MEZAHE_LOG]
WHERE r99.TAARICH = 20251012
  AND r99.SHAA BETWEEN '081300' AND '081400'
  AND r99.MISHTAMESH = 'בן קריאב'
  AND r99.MASLUL LIKE '%שיבוץ סוחף ללקוח%'
ORDER BY r99.MAFTEAH, r99.SHAA;


-- =====================================================
-- 5. DRIVER ASSIGNMENTS ON OCT 12
-- =====================================================
-- See what other shipments were assigned to drivers 3545 and 5046 around this time

SELECT *
FROM [RunDB].[dbo].[RNFIL007]
WHERE NEHAG IN (3545, 5046)
  AND TAARICH_BITZUA >= 20251010
  AND TAARICH_BITZUA <= 20251014
ORDER BY NEHAG, TAARICH_BITZUA, SHAAT_BITZUA;


-- =====================================================
-- 6. STAGE/STATUS DEFINITIONS
-- =====================================================
-- Get the meaning of stages 4, 15, and 21

SELECT *
FROM [RunDB].[dbo].[STAGES_TABLE_NAME] -- Replace with actual stages/status table name
WHERE SHLAV IN (4, 15, 21);


-- =====================================================
-- 7. ROUTING/ZONE INFORMATION
-- =====================================================
-- Check if destination 3763 is in driver 3545's zone/route

SELECT *
FROM [RunDB].[dbo].[DRIVER_ZONES_TABLE_NAME] -- Replace with actual driver zones table
WHERE NEHAG = 3545
   OR YESHUV = 3763;


-- =====================================================
-- 8. PREVIOUS SWEEP ASSIGNMENTS
-- =====================================================
-- Check if there were other sweep assignments by Ben Kriav around this date

SELECT r99.MAFTEAH, r99.TAARICH, r99.SHAA, r99.MISHTAMESH, r99.MASLUL,
       r100.MS_SHURA, r100.SHEM_SADE, r100.ERECH_HADASH, r100.ERECH_YASHAN
FROM [RunDB].[dbo].[RNFIL099] r99
LEFT JOIN [RunDB].[dbo].[RNFIL100] r100 ON r99.[MEZAHE_LOG] = r100.[MEZAHE_LOG]
WHERE r99.MISHTAMESH = 'בן קריאב'
  AND r99.MASLUL LIKE '%שיבוץ סוחף%'
  AND r99.TAARICH >= 20251010
  AND r99.TAARICH <= 20251014
ORDER BY r99.TAARICH, r99.SHAA;


-- =====================================================
-- 9. COMPLETE SHIPMENT HISTORY
-- =====================================================
-- Get all log entries for this shipment to see complete lifecycle

SELECT r99.*, r100.*
FROM [RunDB].[dbo].[RNFIL099] r99
LEFT JOIN [RunDB].[dbo].[RNFIL100] r100 ON r99.[MEZAHE_LOG] = r100.[MEZAHE_LOG]
WHERE r99.MAFTEAH = '90297860'
ORDER BY r99.TAARICH, r99.SHAA, r100.MS_SHURA;


-- =====================================================
-- 10. CHECK FOR ERRORS OR ISSUES
-- =====================================================
-- Check if there were any error logs or issues recorded

SELECT *
FROM [RunDB].[dbo].[ERROR_LOG_TABLE_NAME] -- Replace with actual error log table name
WHERE MISHLOACH = '90297860'
   OR TAARICH = 20251012
ORDER BY TAARICH, SHAA;
