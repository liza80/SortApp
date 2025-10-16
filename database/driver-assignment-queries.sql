-- ============================================
-- DRIVER ASSIGNMENT FROM PICKUP LINE QUERIES
-- ============================================
-- Created: 2025-01-13
-- Database: RunDB
-- Purpose: Assign drivers from pickup lines (RNFIL329) to unassigned shipments
-- ============================================

-- ============================================
-- MAIN BULK UPDATE: Assign Drivers to Shipments
-- ============================================
-- This query assigns drivers from pickup lines to shipments that meet specific criteria:
-- - Shipment is for today
-- - No driver assigned yet (NAG = 0)
-- - Transport type is 'הובלה'
-- - Delivery type is 'מסירה'
-- - No sweeping driver exists for the customer
-- - Feature codes 101 and 102 are disabled
-- - Either pickup or destination point is missing

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


-- ============================================
-- VARIATION 1: Update Only Driver (No Points)
-- ============================================
-- Assigns only the driver without updating pickup/destination points

UPDATE m
SET m.NAG = k329.NAG_BM
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


-- ============================================
-- VARIATION 2: Update for Specific Customer
-- ============================================
-- Assigns drivers for a specific customer only

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
    m.LAKOACH = @LAKOACH                      -- Specific customer parameter
    AND m.TAARICH_BITZOOA = CONVERT(DATE, GETDATE())
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


-- ============================================
-- VARIATION 3: Update for Specific Date Range
-- ============================================
-- Assigns drivers for shipments within a date range

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
    AND s258.TARIKH = m.TAARICH_BITZOOA
    AND s258.NAG > 0
LEFT JOIN RNFIL292 a292_1 ON a292_1.KOD_APION = 101 
    AND a292_1.LAKOACH = m.LAKOACH
LEFT JOIN RNFIL292 a292_2 ON a292_2.KOD_APION = 102 
    AND a292_2.LAKOACH = m.LAKOACH
WHERE 
    m.TAARICH_BITZOOA BETWEEN @START_DATE AND @END_DATE
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


-- ============================================
-- VARIATION 4: Preview Before Update (SELECT)
-- ============================================
-- Shows what would be updated before executing the update

SELECT 
    m.MS_SHLICHOT,
    m.LAKOACH,
    m.NAG AS 'CURRENT_DRIVER',
    k329.NAG_BM AS 'NEW_DRIVER',
    m.NKODAT_HLOKA_MAKOR AS 'CURRENT_PICKUP_POINT',
    CASE 
        WHEN s10.KSHOR_L_1249 != 2 THEN l330.KOD_KO 
        ELSE m.NKODAT_HLOKA_MAKOR 
    END AS 'NEW_PICKUP_POINT',
    m.NKODAT_HLOKA_YAAD AS 'CURRENT_DEST_POINT',
    CASE 
        WHEN s10.KSHOR_L_1249 = 2 THEN l330.KOD_KO 
        ELSE m.NKODAT_HLOKA_YAAD 
    END AS 'NEW_DEST_POINT',
    m.SHLAV_SHLIHUT,
    s10.KSHOR_L_1249,
    l330.KOD_KO AS 'PICKUP_LINE'
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
    )
ORDER BY m.MS_SHLICHOT;


-- ============================================
-- TRANSACTION WRAPPER: Safe Driver Assignment
-- ============================================
-- Wraps the update in a transaction with rollback capability

BEGIN TRANSACTION;

DECLARE @RowsAffected INT;

-- Perform the update
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

SET @RowsAffected = @@ROWCOUNT;

-- Verify and commit/rollback
IF @RowsAffected > 0
BEGIN
    PRINT CONCAT('Successfully assigned drivers to ', @RowsAffected, ' shipments');
    COMMIT TRANSACTION;
END
ELSE
BEGIN
    PRINT 'No shipments matched the criteria for driver assignment';
    ROLLBACK TRANSACTION;
END


-- ============================================
-- STORED PROCEDURE: Automated Driver Assignment
-- ============================================
-- Creates a reusable stored procedure for driver assignment

CREATE OR ALTER PROCEDURE sp_AssignDriversFromPickupLines
    @CustomerID INT = NULL,              -- Optional: specific customer
    @ExecutionDate DATE = NULL,          -- Optional: specific date (default: today)
    @DryRun BIT = 0                      -- 1 = Preview only, 0 = Execute update
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Default to today if no date specified
    IF @ExecutionDate IS NULL
        SET @ExecutionDate = CONVERT(DATE, GETDATE());
    
    -- Preview mode
    IF @DryRun = 1
    BEGIN
        SELECT 
            m.MS_SHLICHOT,
            m.LAKOACH,
            m.NAG AS 'CURRENT_DRIVER',
            k329.NAG_BM AS 'NEW_DRIVER',
            m.NKODAT_HLOKA_MAKOR AS 'CURRENT_PICKUP',
            CASE WHEN s10.KSHOR_L_1249 != 2 THEN l330.KOD_KO ELSE m.NKODAT_HLOKA_MAKOR END AS 'NEW_PICKUP',
            m.NKODAT_HLOKA_YAAD AS 'CURRENT_DEST',
            CASE WHEN s10.KSHOR_L_1249 = 2 THEN l330.KOD_KO ELSE m.NKODAT_HLOKA_YAAD END AS 'NEW_DEST'
        FROM RNFIL007 m
        INNER JOIN RNFIL010 s10 ON s10.KOD_SHLAV = m.SHLAV_SHLIHUT
        INNER JOIN RNFIL330 l330 ON l330.LAKOACH = m.LAKOACH AND l330.PIL = 1 AND l330.KOD_KO >= 1
        INNER JOIN RNFIL329 k329 ON k329.KOD_KO_ISOF = l330.KOD_KO AND k329.NAG_BM > 0
        LEFT JOIN RNFIL258 s258 ON s258.LAKOACH = m.LAKOACH AND s258.TARIKH = @ExecutionDate AND s258.NAG > 0
        LEFT JOIN RNFIL292 a292_1 ON a292_1.KOD_APION = 101 AND a292_1.LAKOACH = m.LAKOACH
        LEFT JOIN RNFIL292 a292_2 ON a292_2.KOD_APION = 102 AND a292_2.LAKOACH = m.LAKOACH
        WHERE 
            m.TAARICH_BITZOOA = @ExecutionDate
            AND (@CustomerID IS NULL OR m.LAKOACH = @CustomerID)
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
        RETURN;
    END
    
    -- Execute mode
    BEGIN TRANSACTION;
    
    UPDATE m
    SET 
        m.NAG = k329.NAG_BM,
        m.NKODAT_HLOKA_MAKOR = CASE WHEN s10.KSHOR_L_1249 != 2 THEN l330.KOD_KO ELSE m.NKODAT_HLOKA_MAKOR END,
        m.NKODAT_HLOKA_YAAD = CASE WHEN s10.KSHOR_L_1249 = 2 THEN l330.KOD_KO ELSE m.NKODAT_HLOKA_YAAD END
    FROM RNFIL007 m
    INNER JOIN RNFIL010 s10 ON s10.KOD_SHLAV = m.SHLAV_SHLIHUT
    INNER JOIN RNFIL330 l330 ON l330.LAKOACH = m.LAKOACH AND l330.PIL = 1 AND l330.KOD_KO >= 1
    INNER JOIN RNFIL329 k329 ON k329.KOD_KO_ISOF = l330.KOD_KO AND k329.NAG_BM > 0
    LEFT JOIN RNFIL258 s258 ON s258.LAKOACH = m.LAKOACH AND s258.TARIKH = @ExecutionDate AND s258.NAG > 0
    LEFT JOIN RNFIL292 a292_1 ON a292_1.KOD_APION = 101 AND a292_1.LAKOACH = m.LAKOACH
    LEFT JOIN RNFIL292 a292_2 ON a292_2.KOD_APION = 102 AND a292_2.LAKOACH = m.LAKOACH
    WHERE 
        m.TAARICH_BITZOOA = @ExecutionDate
        AND (@CustomerID IS NULL OR m.LAKOACH = @CustomerID)
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
    
    DECLARE @RowsAffected INT = @@ROWCOUNT;
    
    IF @RowsAffected > 0
    BEGIN
        COMMIT TRANSACTION;
        SELECT @RowsAffected AS 'ShipmentsUpdated';
    END
    ELSE
    BEGIN
        ROLLBACK TRANSACTION;
        SELECT 0 AS 'ShipmentsUpdated';
    END
END;
GO

-- Usage examples for the stored procedure:
-- EXEC sp_AssignDriversFromPickupLines @DryRun = 1;                    -- Preview all for today
-- EXEC sp_AssignDriversFromPickupLines;                                -- Execute all for today
-- EXEC sp_AssignDriversFromPickupLines @CustomerID = 12345;            -- Execute for specific customer
-- EXEC sp_AssignDriversFromPickupLines @ExecutionDate = '2025-01-15';  -- Execute for specific date

-- ============================================
-- END OF DRIVER ASSIGNMENT QUERIES
-- ============================================
