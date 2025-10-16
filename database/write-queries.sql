-- ============================================
-- WRITE QUERIES FOR SHIPMENT & DRIVER SYSTEM
-- ============================================
-- Created: 2025-01-13
-- Database: RunDB
-- Tables: RNFIL007, RNFIL010, RNFIL258, RNFIL329, RNFIL330, RNFIL292
-- ============================================

-- ============================================
-- RNFIL007 - SHIPMENTS TABLE
-- ============================================

-- INSERT: Create new shipment
INSERT INTO RNFIL007 (
    MS_SHLICHOT,
    LAKOACH,
    NAG,
    SHLAV_SHLIHUT,
    NKODAT_HLOKA_MAKOR,
    NKODAT_HLOKA_YAAD,
    TAARICH_BITZOOA,
    SHLIHUT_HOVLA_ASAA,
    MSIRA_ISOF_HOFSHI
)
VALUES (
    @MS_SHLICHOT,           -- Shipment number
    @LAKOACH,               -- Customer ID
    0,                      -- Driver (initially unassigned)
    @SHLAV_SHLIHUT,         -- Stage
    0,                      -- Source point (initially unassigned)
    0,                      -- Destination point (initially unassigned)
    CONVERT(DATE, GETDATE()), -- Execution date (today)
    N'הובלה',               -- Transport type
    N'מסירה'                -- Delivery type
);

-- UPDATE: Assign driver to shipment
UPDATE RNFIL007
SET 
    NAG = @NAG,                              -- Driver ID
    NKODAT_HLOKA_MAKOR = @NKODAT_HLOKA_MAKOR -- Source point
WHERE 
    MS_SHLICHOT = @MS_SHLICHOT
    AND LAKOACH = @LAKOACH
    AND NAG = 0;                             -- Only unassigned shipments

-- UPDATE: Assign pickup point to shipment
UPDATE RNFIL007
SET 
    NKODAT_HLOKA_MAKOR = @NKODAT_HLOKA_MAKOR
WHERE 
    MS_SHLICHOT = @MS_SHLICHOT
    AND LAKOACH = @LAKOACH
    AND NKODAT_HLOKA_MAKOR = 0;

-- UPDATE: Assign destination point to shipment
UPDATE RNFIL007
SET 
    NKODAT_HLOKA_YAAD = @NKODAT_HLOKA_YAAD
WHERE 
    MS_SHLICHOT = @MS_SHLICHOT
    AND LAKOACH = @LAKOACH
    AND NKODAT_HLOKA_YAAD = 0;

-- UPDATE: Change shipment stage
UPDATE RNFIL007
SET 
    SHLAV_SHLIHUT = @NEW_SHLAV_SHLIHUT
WHERE 
    MS_SHLICHOT = @MS_SHLICHOT
    AND LAKOACH = @LAKOACH;

-- DELETE: Remove shipment (with safety check)
DELETE FROM RNFIL007
WHERE 
    MS_SHLICHOT = @MS_SHLICHOT
    AND LAKOACH = @LAKOACH
    AND TAARICH_BITZOOA < CONVERT(DATE, GETDATE()); -- Only past shipments


-- ============================================
-- RNFIL258 - SWEEPING DRIVER ASSIGNMENTS
-- ============================================

-- INSERT: Assign sweeping driver for today
INSERT INTO RNFIL258 (
    TAARICH,
    LAKOAH,
    NEHAG,
    NIKRA_MOBIL,
    DAVEAH_YSUF,
    TAARICH1,
    SHAA,
    DCHYA,
    KOD_SIBAT_DCHYA
)
VALUES (
    CONVERT(DATE, GETDATE()), -- Date
    @LAKOAH,                  -- Customer
    @NAG,                     -- Driver (NAG > 0)
    0,                        -- Mobile call flag
    0,                        -- Additional report flag
    GETDATE(),                -- Timestamp
    CONVERT(TIME, GETDATE()), -- Time
    0,                        -- Delay flag
    0                         -- Delay reason code
);

-- UPDATE: Change sweeping driver for today
UPDATE RNFIL258
SET 
    NEHAG = @NEW_NAG,
    TAARICH1 = GETDATE(),
    SHAA = CONVERT(TIME, GETDATE())
WHERE 
    TAARICH = CONVERT(DATE, GETDATE())
    AND LAKOAH = @LAKOAH;

-- UPDATE: Mark driver as delayed
UPDATE RNFIL258
SET 
    DCHYA = 1,
    KOD_SIBAT_DCHYA = @KOD_SIBAT_DCHYA,
    TAARICH1 = GETDATE()
WHERE 
    TAARICH = CONVERT(DATE, GETDATE())
    AND LAKOAH = @LAKOAH
    AND NEHAG = @NAG;

-- DELETE: Remove sweeping driver assignment
DELETE FROM RNFIL258
WHERE 
    TAARICH = CONVERT(DATE, GETDATE())
    AND LAKOAH = @LAKOAH
    AND NEHAG = @NAG;


-- ============================================
-- RNFIL010 - STAGES TABLE
-- ============================================

-- INSERT: Create new stage
INSERT INTO RNFIL010 (
    KOD_SHLAV,
    TEUR_SHLAV,
    AHUZ_MIMESHEJ,
    MAX_ZMAN,
    TZEVA,
    HATZEG_LANEHAG,
    KASHUR_LE_1249,
    KSHOR_L_1249,
    TZEVA_TEUR_MISHLOACH,
    TZEVA_MAKOR_BERAKAZ_AHER,
    SIUM_TIFULI,
    TZEVA_YAHAD_BERAKAZ_AHER,
    HATZEG_YAHAD_BEWAP,
    HATZEG_LENEKUDAT_HALUKA,
    NIMTZA_BENEKUDAT_HALUKA,
    AFSHER_HALON_ZMAN,
    INCLUDE_IN_QUOTAS,
    MEUKAV_MECHES,
    RELEASE_MECHES,
    HIDE
)
VALUES (
    @KOD_SHLAV,              -- Stage code
    @TEUR_SHLAV,             -- Stage description
    @AHUZ_MIMESHEJ,          -- Percentage from dispatch
    @MAX_ZMAN,               -- Maximum time
    @TZEVA,                  -- Color
    @HATZEG_LANEHAG,         -- Display to driver
    @KASHUR_LE_1249,         -- Related to 1249
    @KSHOR_L_1249,           -- Connection to 1249 (2=destination, other=pickup)
    @TZEVA_TEUR_MISHLOACH,   -- Shipment description color
    @TZEVA_MAKOR_BERAKAZ_AHER, -- Source color in other center
    @SIUM_TIFULI,            -- Operational completion
    @TZEVA_YAHAD_BERAKAZ_AHER, -- Together color in other center
    @HATZEG_YAHAD_BEWAP,     -- Display together in WAP
    @HATZEG_LENEKUDAT_HALUKA, -- Display to distribution point
    @NIMTZA_BENEKUDAT_HALUKA, -- Located at distribution point
    @AFSHER_HALON_ZMAN,      -- Allow time window
    @INCLUDE_IN_QUOTAS,      -- Include in quotas
    @MEUKAV_MECHES,          -- Delayed from computer
    @RELEASE_MECHES,         -- Release from computer
    @HIDE                    -- Hide
);

-- UPDATE: Modify stage properties
UPDATE RNFIL010
SET 
    TEUR_SHLAV = @TEUR_SHLAV,
    TZEVA = @TZEVA,
    HATZEG_LANEHAG = @HATZEG_LANEHAG,
    KSHOR_L_1249 = @KSHOR_L_1249
WHERE 
    KOD_SHLAV = @KOD_SHLAV;

-- UPDATE: Hide/Unhide stage
UPDATE RNFIL010
SET 
    HIDE = @HIDE
WHERE 
    KOD_SHLAV = @KOD_SHLAV;

-- DELETE: Remove stage (with safety check)
DELETE FROM RNFIL010
WHERE 
    KOD_SHLAV = @KOD_SHLAV
    AND NOT EXISTS (
        SELECT 1 FROM RNFIL007 WHERE SHLAV_SHLIHUT = @KOD_SHLAV
    );


-- ============================================
-- RNFIL330 - PICKUP LINES TABLE
-- ============================================

-- INSERT: Create pickup line
INSERT INTO RNFIL330 (
    KOD_KO,
    LAKOACH,
    PIL
)
VALUES (
    @KOD_KO,    -- Line code (>= 1)
    @LAKOACH,   -- Customer
    1           -- Active flag
);

-- UPDATE: Activate pickup line
UPDATE RNFIL330
SET 
    PIL = 1
WHERE 
    KOD_KO = @KOD_KO
    AND LAKOACH = @LAKOACH;

-- UPDATE: Deactivate pickup line
UPDATE RNFIL330
SET 
    PIL = 0
WHERE 
    KOD_KO = @KOD_KO
    AND LAKOACH = @LAKOACH;

-- DELETE: Remove pickup line
DELETE FROM RNFIL330
WHERE 
    KOD_KO = @KOD_KO
    AND LAKOACH = @LAKOACH
    AND PIL = 0; -- Only deactivated lines


-- ============================================
-- RNFIL329 - DRIVER ASSIGNMENTS BY LINE
-- ============================================

-- INSERT: Assign driver to pickup line
INSERT INTO RNFIL329 (
    KOD_KO_ISOF,
    NAG_BM,
    TEUR
)
VALUES (
    @KOD_KO_ISOF,  -- Line code
    @NAG_BM,       -- Driver (must be > 0)
    @TEUR          -- Description
);

-- UPDATE: Change driver for pickup line
UPDATE RNFIL329
SET 
    NAG_BM = @NEW_NAG_BM,
    TEUR = @TEUR
WHERE 
    KOD_KO_ISOF = @KOD_KO_ISOF
    AND NAG_BM > 0;

-- UPDATE: Remove driver from pickup line
UPDATE RNFIL329
SET 
    NAG_BM = 0,
    TEUR = NULL
WHERE 
    KOD_KO_ISOF = @KOD_KO_ISOF;

-- DELETE: Remove line-driver assignment
DELETE FROM RNFIL329
WHERE 
    KOD_KO_ISOF = @KOD_KO_ISOF
    AND NAG_BM = 0;


-- ============================================
-- RNFIL292 - CONFIGURATION/FEATURES TABLE
-- ============================================

-- INSERT: Add configuration entry
INSERT INTO RNFIL292 (
    KOD_APION,
    LAKOACH,
    NUMERI,
    NUMERI_2,
    LOGI,
    MAHROZET,
    HESBER,
    NUMERI_3,
    SIDURI
)
VALUES (
    @KOD_APION,   -- Feature code (101, 102, etc.)
    @LAKOACH,     -- Customer
    @NUMERI,      -- Numeric value 1
    @NUMERI_2,    -- Numeric value 2
    @LOGI,        -- Logical/Boolean value
    @MAHROZET,    -- String value
    @HESBER,      -- Description/Explanation
    @NUMERI_3,    -- Numeric value 3
    @SIDURI       -- Serial/Order
);

-- UPDATE: Modify configuration
UPDATE RNFIL292
SET 
    LOGI = @LOGI,
    NUMERI = @NUMERI,
    HESBER = @HESBER
WHERE 
    KOD_APION = @KOD_APION
    AND LAKOACH = @LAKOACH;

-- UPDATE: Enable feature (Code 101 or 102)
UPDATE RNFIL292
SET 
    LOGI = 1
WHERE 
    KOD_APION = @KOD_APION
    AND LAKOACH = @LAKOACH;

-- UPDATE: Disable feature (Code 101 or 102)
UPDATE RNFIL292
SET 
    LOGI = 0
WHERE 
    KOD_APION = @KOD_APION
    AND LAKOACH = @LAKOACH;

-- DELETE: Remove configuration entry
DELETE FROM RNFIL292
WHERE 
    KOD_APION = @KOD_APION
    AND LAKOACH = @LAKOACH;


-- ============================================
-- COMPLEX OPERATIONS
-- ============================================

-- BULK UPDATE: Assign drivers from pickup lines to shipments
-- This performs the core business logic shown in the original SELECT query
UPDATE m
SET 
    m.NAG = k329.NAG_BM,
    m.NKODAT_HLOKA_MAKOR = CASE 
        WHEN s10.KSHOR_L_1249 != 2 THEN l330.KOD_KO 
        ELSE m.NKODAT_HLOKA_MAKOR 
    END,
    m.NKODAT_HLOKA_YAAD = CASE 
        WHEN s10.KSHOR_L_1249 = 2 THEN l330.KOD_KO 
        ELSE m.NKODAT_HLOKA_YAAD 
    END
FROM RNFIL007 m
INNER JOIN RNFIL010 s10 ON s10.KOD_SHLAV = m.SHLAV_SHLIHUT
INNER JOIN RNFIL330 l330 ON l330.LAKOACH = m.LAKOACH 
    AND l330.PIL = 1 
    AND l330.KOD_KO >= 1
INNER JOIN RNFIL329 k329 ON k329.KOD_KO_ISOF = l330.KOD_KO 
    AND k329.NAG_BM > 0
LEFT JOIN RNFIL258 s258 ON s258.LAKOACH = m.LAKOACH 
    AND s258.TARIKH = CONVERT(DATE, GETDATE())
    AND s258.NAG > 0
LEFT JOIN RNFIL292 a292_1 ON a292_1.KOD_APION = 101 
    AND a292_1.LAKOACH = m.LAKOACH
LEFT JOIN RNFIL292 a292_2 ON a292_2.KOD_APION = 102 
    AND a292_2.LAKOACH = m.LAKOACH
WHERE 
    m.TAARICH_BITZOOA = CONVERT(DATE, GETDATE())
    AND m.SHLIHUT_HOVLA_ASAA = N'הובלה'
    AND m.NAG = 0
    AND m.MSIRA_ISOF_HOFSHI = N'מסירה'
    AND ISNULL(a292_1.LOGI, 0) = 0
    AND ISNULL(a292_2.LOGI, 0) = 0
    AND s258.NAG IS NULL
    AND (
        (s10.KSHOR_L_1249 = 2 AND m.NKODAT_HLOKA_YAAD = 0) OR
        (s10.KSHOR_L_1249 != 2 AND m.NKODAT_HLOKA_MAKOR = 0)
    );

-- TRANSACTION: Complete driver assignment process
BEGIN TRANSACTION;

    -- Step 1: Update shipment with driver
    UPDATE RNFIL007
    SET NAG = @NAG
    WHERE MS_SHLICHOT = @MS_SHLICHOT 
        AND LAKOACH = @LAKOACH;

    -- Step 2: Log the assignment (if logging table exists)
    -- INSERT INTO ShipmentLog (MS_SHLICHOT, LAKOACH, NAG, TAARICH, ACTION)
    -- VALUES (@MS_SHLICHOT, @LAKOACH, @NAG, GETDATE(), 'DRIVER_ASSIGNED');

    -- Step 3: Verify assignment was successful
    IF @@ROWCOUNT = 0
    BEGIN
        ROLLBACK TRANSACTION;
        RAISERROR('Driver assignment failed', 16, 1);
    END
    ELSE
    BEGIN
        COMMIT TRANSACTION;
    END

-- ============================================
-- CLEANUP & MAINTENANCE QUERIES
-- ============================================

-- DELETE: Clean up old sweeping driver assignments (older than 30 days)
DELETE FROM RNFIL258
WHERE TAARICH < DATEADD(DAY, -30, GETDATE());

-- DELETE: Remove unassigned driver entries
DELETE FROM RNFIL329
WHERE NAG_BM = 0 OR NAG_BM IS NULL;

-- UPDATE: Reset daily shipments (use with caution!)
-- UPDATE RNFIL007
-- SET NAG = 0
-- WHERE TAARICH_BITZOOA = CONVERT(DATE, GETDATE());

-- ============================================
-- END OF WRITE QUERIES
-- ============================================
