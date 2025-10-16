-- Diagnostic query to check all possible driver sources for a shipment
DECLARE @MS_SHURA INT = 90514169;
DECLARE @LAKOAH INT = 27811;

-- Check all possible driver sources for this shipment
SELECT 
    'Shipment Info' COLLATE DATABASE_DEFAULT AS Info_Type,
    m.MS_SHURA AS Shipment_ID,
    m.LAKOAH AS Customer_ID,
    m.NEHAG AS Driver_ID,
    m.SHLAV_SHLIHUT AS Stage_ID,
    m.TAARICH_BITZUA AS Execution_Date,
    m.MESIRA_YSUF_HOFSHI COLLATE DATABASE_DEFAULT AS Mode,
    m.NEKUDAT_HALUKA_MAKOR AS Pickup_Point,
    m.NEKUDAT_HALUKA_YAHAD AS Destination_Point
FROM RNFIL007 m
WHERE m.MS_SHURA = @MS_SHURA

UNION ALL

-- Check RNFIL258 (Existing Sweeping Driver)
SELECT 
    'RNFIL258 - Sweeping Driver' COLLATE DATABASE_DEFAULT AS Info_Type,
    @MS_SHURA AS Shipment_ID,
    s258.LAKOAH AS Customer_ID,
    s258.NEHAG AS Driver_ID,
    NULL AS Stage_ID,
    s258.TAARICH AS Execution_Date,
    CAST(NULL AS NVARCHAR(50)) COLLATE DATABASE_DEFAULT AS Mode,
    NULL AS Pickup_Point,
    NULL AS Destination_Point
FROM RNFIL258 s258
WHERE s258.LAKOAH = @LAKOAH
    AND s258.TAARICH >= DATEADD(DAY, -3, GETDATE())
    AND s258.NEHAG > 0

UNION ALL

-- Check RNFIL329 (Pickup Line Driver)
SELECT 
    'RNFIL329 - Pickup Line Driver' COLLATE DATABASE_DEFAULT AS Info_Type,
    @MS_SHURA AS Shipment_ID,
    l330.LAKOAH AS Customer_ID,
    k329.NEHAG_DEF AS Driver_ID,
    NULL AS Stage_ID,
    NULL AS Execution_Date,
    CAST(NULL AS NVARCHAR(50)) COLLATE DATABASE_DEFAULT AS Mode,
    l330.KOD_KAV AS Pickup_Point,
    NULL AS Destination_Point
FROM RNFIL330 l330
INNER JOIN RNFIL329 k329 ON k329.KOD_KAV_YSUF = l330.KOD_KAV
WHERE l330.LAKOAH = @LAKOAH
    AND l330.PAIL = 1
    AND k329.NEHAG_DEF > 0

UNION ALL

-- Check stage definition
SELECT 
    'RNFIL010 - Stage Info' COLLATE DATABASE_DEFAULT AS Info_Type,
    @MS_SHURA AS Shipment_ID,
    NULL AS Customer_ID,
    NULL AS Driver_ID,
    s10.KOD_SHLAV AS Stage_ID,
    NULL AS Execution_Date,
    CAST(NULL AS NVARCHAR(50)) COLLATE DATABASE_DEFAULT AS Mode,
    s10.KASHUR_LE_1249 AS Pickup_Point,
    NULL AS Destination_Point
FROM RNFIL007 m
INNER JOIN RNFIL010 s10 ON s10.KOD_SHLAV = m.SHLAV_SHLIHUT
WHERE m.MS_SHURA = @MS_SHURA

UNION ALL

-- Check customer exclusions
SELECT 
    'RNFIL292 - Customer Exclusions' COLLATE DATABASE_DEFAULT AS Info_Type,
    @MS_SHURA AS Shipment_ID,
    a292.LAKOAH AS Customer_ID,
    NULL AS Driver_ID,
    a292.KOD_APION AS Stage_ID,
    NULL AS Execution_Date,
    CAST(NULL AS NVARCHAR(50)) COLLATE DATABASE_DEFAULT AS Mode,
    NULL AS Pickup_Point,
    a292.LOGI AS Destination_Point
FROM RNFIL292 a292
WHERE a292.LAKOAH = @LAKOAH
    AND a292.KOD_APION IN (101, 102);
