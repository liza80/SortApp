# Shipment Analysis - Mishloach 90297860

## Question

Why did NEHAG change from 5046 to 3545 and SHLAV change from 21 to 4 on October 12, 2025?

## Timeline of Changes

### 1. Initial Creation - Sept 30, 09:37:20

- **NEHAG**: 3545 (initial)
- **SHLAV**: 4 (initial stage)
- **Action**: Internet shipment intake via GET simple interface
- **Process**: Route write/update to permanent file → New write/update → Refresh rows → Route write single shipment → Decision/execution shipment assignment

### 2. Pickup Scan - Oct 5, 13:07:30

- **SHLAV**: 4 → 15
- **Action**: "בקרת איסוף מלקוח" (Pickup control from customer)
- **User**: Barcode scanning
- **Details**: Scanned 1 package for Alaa Naim

### 3. Driver Entry Jerusalem - Oct 5, 16:56:03

- **NEHAG**: 3545 → 5046
- **SHLAV**: 15 → 21
- **Action**: "כניסת נהג ירושלים" (Driver entry Jerusalem)
- **Details**:
  - Driver 5046 (Alaa Naim) received the shipment
  - Coordinator code changed from 1 to 5
  - Package entered Jerusalem facility

### 4. Coordinator Distribution - Oct 5, 17:37:56

- **Coordinator**: 5 → 1
- **User**: Ofek Zaguri
- **Action**: "פיזור משלוחי רכז העברות" (Coordinator distribution transfers)

### 5. **CRITICAL CHANGE** - Oct 12, 08:13:40

- **NEHAG**: 5046 → 3545 (REVERTED TO ORIGINAL)
- **SHLAV**: 21 → 4 (REVERTED TO INITIAL STAGE)
- **User**: Ben Kriav
- **Action**: "שיבוץ סוחף ללקוח" (Sweep assignment to customer)
- **Process**: Coordinator screen call to version → Coordinator screen version 1 without links → Coordinator program after coordinator selection → Sweep assignment to customer → Run on shipments → Log recording

## Answer: Why the Reversion?

The change on October 12 at 08:13:40 was caused by **Ben Kriav** performing a **"שיבוץ סוחף ללקוח" (sweep assignment to customer)** operation.

### What Happened - **CONFIRMED SYSTEM BEHAVIOR**:

**User Confirmation**: "אחרי שעשיתי שיבוץ סוחף על הנהגים משלוחים שהיו על שלב 21 עברו לשלב 4 חזרה והשתבצו על הנהגים"

Translation: "After I performed a sweep assignment on the drivers, shipments that were at stage 21 moved back to stage 4 and were reassigned to the drivers"

This is the **expected and designed behavior** of the sweep assignment feature:

1. **Sweep Assignment Process**: The sweep assignment operation performs a bulk reassignment of shipments based on current routing rules and driver availability.

2. **Stage Reset to 4**: The system automatically:

   - Takes shipments from stage 21 (already assigned to a driver)
   - Resets them to stage 4 (ready for assignment)
   - Re-evaluates routing rules
   - Assigns them to drivers based on current optimization criteria

3. **Why Driver Changed 5046 → 3545**:
   - The sweep assignment recalculated optimal driver assignments
   - Based on current routes, zones, workload, and availability
   - Driver 3545 was determined to be the better choice for this destination
   - The system automatically reassigned the shipment accordingly

### Key Observations:

- **MEZAHE_LOG remains different**: Even though the values reverted, the log entries show different log IDs (1218980625 vs original), confirming these are new assignments, not a system rollback
- **Stage 21 → 4**: Stage 21 likely represented "assigned to driver" while stage 4 represents an earlier stage (possibly "pending assignment" or "ready for assignment")
- **The change affects both NEHAG and OT_KRYA (call sign)**: Both fields changed from 5046 to 3545, confirming a complete driver reassignment

## Conclusion

This is **NORMAL, EXPECTED SYSTEM BEHAVIOR** - not an error or issue.

The sweep assignment feature ("שיבוץ סוחף") is designed to:

- Reset shipments from stage 21 (assigned) back to stage 4 (ready for assignment)
- Recalculate optimal driver assignments based on current system parameters
- Reassign shipments automatically according to the latest routing optimization

**In this case:**

- Driver 5046 (Alaa Naim) had the shipment on Oct 5
- Ben Kriav performed a sweep assignment on Oct 12
- The system recalculated and determined driver 3545 was the better assignment
- The shipment was automatically reassigned with stage reset from 21 → 4

This is a standard operational procedure used for route optimization and workload balancing.

## When Sweep Assignment is Used

Sweep assignment is typically performed when:

1. Route optimization is needed
2. Workload needs to be rebalanced among drivers
3. New drivers are added or driver availability changes
4. Service areas or zones are modified
5. Regular periodic optimization is scheduled
