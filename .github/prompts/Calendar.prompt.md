---
name: Calendar Logic & UI Refactor
description: Use this prompt when refactoring the calendar UI, appointment concurrency logic, and scheduling constraints for Admin and BHW modules.
---

Act as a senior full-stack developer. Your task is to refactor the scheduling logic and calendar UI based on the following strict requirements. Please review the currently open calendar, appointment, and UI component files before generating code.

## 1. Time, Window & Strict Weekend Constraints
* **Operating Days:** Monday to Friday ONLY. 
* **Weekend Closure:** Saturdays and Sundays are strictly closed. 
* **UI Enforcement:** Ensure the calendar UI visually disables, grays out, or completely hides weekend columns. Prevent any click, drag-and-drop, or scheduling interactions on Saturdays and Sundays.
* **Logic/Validation Enforcement:** Implement strict validation in the scheduling logic (including the Quick Reschedule feature) to instantly reject any appointment creation or movement that falls on a weekend.
* **Clinic Hours:** 7:00 AM – 5:00 PM.
* **Active Scheduling Window:** 7:30 AM – 4:30 PM (leaving a 30-minute buffer at the start and end of the day for setup/closure).
* **UI Update:** Remove the visual AM/PM divider from the scheduling calendar. Ensure appointments are displayed strictly sequentially.

## 2. Automated Scheduler & Concurrency
* **Duration:** 1 hour per appointment block (e.g., 7:30 AM - 8:30 AM).
* **Capacity:** Exactly **3 simultaneous vaccination schedules** per 1-hour block. 
* **Progression:** Patients A, B, and C fill the 7:30 AM block. Patients D, E, and F fill the 8:30 AM block, continuing until the 4:30 PM cutoff.

## 3. Buffer & Rescheduling Features
* **Daily Buffer:** Create a logic mechanism to hold one "vacant schedule" slot every day specifically reserved for catering to missed appointments and reschedules.
* **Quick Reschedule Button:** Add this to the Patient Records module. 
* **Conflict Management:** The Quick Reschedule logic must verify that the target time block has less than 3 active appointments before allowing the move.

## 4. Visual Heatmap Indicators
* **Calendar Module:** Implement a dynamic color indicator on the calendar days that changes depending on the total number of patients scheduled for that day.
* **Edit View:** Apply this exact same color indicator logic to the "Edit Patient Scheduled Vaccinations" view.

## 5. Role Synchronization
* **BHW Module:** Ensure all calendar layouts, time constraints, concurrency logic, and color indicators are fully implemented in the Barangay Health Worker (BHW) Calendar module to ensure feature parity with the Admin module.