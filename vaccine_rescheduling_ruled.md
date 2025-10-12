# 🧩 Vaccine Rescheduling Rules – Technical Specification

This document defines the complete logic and constraints governing **vaccine rescheduling**.  
It is divided into two main sections:

1. **Common-Level Scheduling Rules** – baseline logic used in most normal scenarios.  
2. **Next-Level Scheduling Rules** – advanced logic for complex or edge-case situations.

---

## ⚙️ COMMON-LEVEL SCHEDULING RULES

When rescheduling any vaccine, the system must always respect:

- **min_interval_days** – minimum allowed days between doses of the same vaccine.
- **max_interval_days** – maximum allowed days between doses of the same vaccine.
- **min_interval_other_vax** – minimum spacing required between different vaccines.
- **concurrent_allowed** – indicates whether the vaccine can be taken on the same day with others that are also concurrent-allowed.
- **requires_previous** – determines whether a previous dose must exist before this one can be scheduled.
- **skippable** – indicates if a dose can be skipped without breaking the series.

### 🔄 Rescheduling Validation Flow

When attempting to reschedule a vaccine, the following checks must be applied **in order**:

1. **Same Vaccine Intervals**
   - Check that the new date maintains `>= min_interval_days` and `<= max_interval_days` from both previous and next doses (if applicable).

2. **Cross-Vaccine Intervals**
   - Ensure the new date is `>= min_interval_other_vax` from all *other* vaccines.

3. **Concurrent Allowed Check**
   - If `concurrent_allowed = true`, the vaccine can share the same scheduled date with others that also have `concurrent_allowed = true`.

4. **Cascade Harmony**
   - If rescheduling affects other doses or vaccines, recursively re-check all rules until every affected item is valid.

---

### 📘 Common Scenarios

1. **Normal Valid Reschedule**
   - Rescheduling is valid if:
     - It adheres to all `min_interval_days`, `max_interval_days`, and `min_interval_other_vax`.
     - Concurrent rules are satisfied.

2. **Reschedule With Shared DAD (DueAfterDays)**
   - If vaccines share the same DAD (initially scheduled on the same date):
     - If new date is still `>= min_interval_other_vax`, reschedule is valid independently.
     - If new date becomes `< min_interval_other_vax`, all vaccines sharing that same DAD must also be rescheduled together.

3. **Cascade Reschedule for Next Dose**
   - If rescheduling a dose violates `min_interval_days` with the next dose (but not previous):
     - The next dose must also be rescheduled to maintain the interval.
     - All affected schedules must then re-check the rescheduling rules recursively.

4. **Cascade Reschedule With Shared DAD Next Dose**
   - If the violated next dose also has vaccines with the same DAD:
     - Reschedule the next dose **and** all other vaccines sharing its DAD.
   - Exception:  
     - If the new date coincides with the next dose’s DAD group and still satisfies `min_interval_other_vax`, only the next dose needs to move.

5. **Max Interval Violation**
   - If only `max_interval_days` is violated:
     - Automatically adjust to comply.
     - Then re-check all rules to ensure no new violations.

6. **Concurrent Violation**
   - If rescheduling violates `concurrent_allowed`:
     - Adjust date so that it no longer coincides with incompatible vaccines.

7. **Skippable and Requires Previous**
   - Always consider these attributes:
     - `requires_previous` ensures dependency validity.
     - `skippable` allows continuing the series even if some doses are missed.

---

## 🚀 NEXT-LEVEL SCHEDULING RULES

These rules extend the base logic to handle complex or edge-case situations.  
They are meant for advanced “cascade-safe” and medically accurate scheduling.

---

### 1. Cross-Vaccine Dependencies
If a vaccine has `requires_other_vaccine_before` or `requires_other_vaccine_after`, treat those related vaccines as “previous” or “next” doses for interval validation.

**Example:**  
If MMR requires Varicella to be given after a set interval, rescheduling Varicella must respect those cross-series rules.

---

### 2. Handling Skippable Doses
When a dose is marked as `skippable`, use the most recent valid administered or scheduled dose as the new reference for interval checks.

**Example:**  
If Dose 2 was skipped, Dose 3’s intervals should be based on Dose 1.

---

### 3. Max Interval Cascade (Backward Adjustments)
If a forward reschedule causes a previous dose to exceed `max_interval_days`, perform a backward cascade—adjusting earlier doses if possible—while maintaining their own validity.

---

### 4. Batch or Group Rescheduling
When rescheduling multiple vaccines together (e.g., moving an appointment day), simulate all date changes as a batch and verify that all `min_interval_other_vax` rules hold true between every combination.

---

### 5. Concurrent Allowed but Site-Specific Constraints
Even if `concurrent_allowed = true`, validate that site or resource constraints (e.g., injection site, staff availability) allow concurrent scheduling.

---

### 6. Time-of-Day or Timezone Edge Cases
Always calculate intervals using absolute time (in 24-hour units), not just calendar date differences, to avoid sub-day violations.

---

### 7. Admin Override Handling
If an administrator manually overrides rules:
- Still run all validations.
- Allow the change but log or flag any violations (e.g., “override: interval short by 1 day”).

---

### 8. End-of-Series Doses
For final doses in a series, only check against the previous dose — skip all “next dose” validations.

---

### 9. Future Auto-Generated Doses
If future doses are auto-generated based on `DueAfterDays`, recalculate them whenever a dose is rescheduled to preserve correct intervals.

---

### 10. Cross-Series Interval Conflicts
If two vaccine series interact medically (e.g., both live-virus vaccines), apply combined spacing rules to avoid immune interference.

---

### 11. Mixed Interval Violations
When only one of several interval rules is violated, attempt auto-correction (±1 day) before cascading further. If unresolvable, flag as “manual review required.”

---

### 12. Minimum Age or Eligibility Adjustments
If a reschedule moves a dose outside its eligible age window, reject or flag it even if interval constraints are satisfied.

---

### 13. Multi-Patient or Family Scheduling Conflicts
When rescheduling shared appointment slots (e.g., siblings), validate each patient’s vaccine set individually after the group shift.

---

### 14. Holiday / Non-Working Day Adjustments
If a calculated reschedule date lands on a non-working or blocked day, auto-adjust to the next valid date and revalidate all intervals.

---

### 15. Reschedule Ripple Detection
Detect when one vaccine reschedule causes cascading shifts across unrelated vaccines.  
Simulate and revalidate all impacted schedules recursively until no violations remain.

---

### 16. Rule Conflict Priority System
If multiple rules conflict, enforce them by the following priority:

1. Safety (`min_interval_days` / `max_interval_days`)  
2. Dependency (`requires_previous` / `requires_other_vaccine_*`)  
3. Cross-vaccine spacing (`min_interval_other_vax`)  
4. Concurrent allowance  
5. Operational convenience (clinic hours, batching)

Lower-priority violations may be allowed with warnings.

---

## ✅ Final Notes

- Always re-run **all validations** after any change to a schedule.
- All adjustments (manual or automatic) must maintain data consistency across doses, vaccines, and patients.
- Rescheduling logic should aim for **harmonization** — all schedules in sync without any rule violation.

---

**Document Version:** v1.0  
**Maintainer:** *[Japeth Diez Aguelo / Clutch Boiz Thesis Group]*  
**Last Updated:** *[2025-10-10]*  
