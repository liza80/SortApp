-- ================================================
-- GET REAL EXIT DATA FOR DISPLAY
-- ================================================

-- 1. Get ALL exit details from RNFIL546
SELECT TOP 10
    EXIT_ID,
    EXIT_NUMBER,
    EXIT_NAME,
    BRANCH_CODE,  -- If exists
    LINE_CODE,     -- If exists  
    AREA_CODE,     -- If exists
    ADDRESS        -- If exists
FROM [RunDB].[dbo].[RNFIL546]
WHERE EXIT_NUMBER IN (103, 5432, 344, 1929)
ORDER BY EXIT_NUMBER;

-- 2. Get column names to see what's available
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'RNFIL546'
  AND TABLE_SCHEMA = 'dbo';

-- 3. Check what's in the exit you're using
SELECT * 
FROM [RunDB].[dbo].[RNFIL546]
WHERE EXIT_NUMBER = 5432;  -- The exit in your screenshot

-- 4. Check packages in closed containers  
SELECT 
    km.MAARAZ as ContainerNumber,
    km.EXIT_ID,
    se.EXIT_NUMBER,
    se.EXIT_NAME,
    km.EXTERNAL_MAARAZ as PCCBarcode,
    COUNT(sm.SHIPMENT) as PackageCount
FROM [RunDB].[dbo].[RNFIL454] km  -- KOTROT_MARAZIM
LEFT JOIN [RunDB].[dbo].[RNFIL455] sm ON km.MAARAZ = sm.MAARAZ  -- SHOROT_MARAZIM
LEFT JOIN [RunDB].[dbo].[RNFIL546] se ON km.EXIT_ID = se.EXIT_ID
WHERE km.EXTERNAL_MAARAZ LIKE 'PCC%'
  AND km.CLOSED = 1
GROUP BY km.MAARAZ, km.EXIT_ID, se.EXIT_NUMBER, se.EXIT_NAME, km.EXTERNAL_MAARAZ
ORDER BY km.MAARAZ DESC;

-- 5. Find branch/area/line data (might be in another table)
-- Check RNFIL11 (BRANCH table)
SELECT TOP 5 * FROM [RunDB].[dbo].[RNFIL11];

-- Check RNFIL12 (AREA table if exists)  
SELECT TOP 5 * FROM [RunDB].[dbo].[RNFIL12];

-- 6. Get the container you just closed (PCC546)
SELECT 
    km.*,
    se.EXIT_NAME,
    (SELECT COUNT(*) FROM [RunDB].[dbo].[RNFIL455] WHERE MAARAZ = km.MAARAZ) as ActualPackageCount
FROM [RunDB].[dbo].[RNFIL454] km
LEFT JOIN [RunDB].[dbo].[RNFIL546] se ON km.EXIT_ID = se.EXIT_ID  
WHERE km.EXTERNAL_MAARAZ = 'PCC546';