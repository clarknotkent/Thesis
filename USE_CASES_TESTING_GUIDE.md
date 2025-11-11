# ImmunizeMe System - User Testing Scenarios

## Overview
This document lists all user testing scenarios organized by user role. Each scenario includes the steps to test specific functionality across all user interfaces.

## User Roles
- **Admin**: Full system access
- **Health Worker (BHS)**: Limited access with role-based restrictions
- **Parent**: Read-only access to their children's records

---

## ADMIN USER SCENARIOS

### 1. User Management
#### Add New User
- Navigate to Admin → Users → Add User
- Fill in user details (name, email/username, role)
- Test smart identifier detection (email vs username)
- Verify user creation and login

#### Edit Existing User
- Navigate to Admin → Users → User Accounts
- Select a user to edit
- Modify user information
- Save changes and verify updates

#### View User Details
- Navigate to Admin → Users → User Accounts
- Click on a user to view full details
- Verify all user information displays correctly

### 2. Patient Management
#### Add New Patient
- Navigate to Admin → Patients → Add Patient
- Fill in patient demographics
- Add guardian information
- Save and verify patient creation

#### Edit Patient Information
- Navigate to Admin → Patients → View Patients
- Select patient to edit
- Modify patient details
- Save changes and verify updates

#### View Patient Records
- Navigate to Admin → Patients → View Patient
- Review patient demographics, vaccination history, visits
- Test all tabs (Info, Vaccinations, Visits, Vitals)

#### Add Vaccination Record
- Navigate to Admin → Patients → Edit Vaccination Records
- Select patient and vaccine
- Fill in vaccination details (date, batch, administered by)
- Save and verify record creation

#### Reschedule Vaccination
- Navigate to Admin → Patients → Scheduled Vaccinations
- Select a scheduled vaccination
- Choose new date and confirm reschedule
- Verify related vaccinations are adjusted automatically
- Check that SMS notifications are sent for rescheduled appointments

#### Manual Reschedule with Cascade
- Navigate to Admin → Patients → Scheduled Vaccinations
- Select vaccination to reschedule
- Choose cascade option to adjust related vaccinations
- Confirm reschedule and verify all dependent schedules update

### 3. Inventory Management
#### View Vaccine Inventory
- Navigate to Admin → Inventory → Vaccine Inventory
- Review current stock levels
- Check expiration dates

#### Add Receiving Report
- Navigate to Admin → Inventory → Receiving Reports
- Create new receiving report
- Add vaccine batches with quantities
- Save and verify inventory updates

#### View Receiving Reports
- Navigate to Admin → Inventory → Receiving Reports
- Review all receiving reports
- Check report details and status

### 4. Reports & Analytics
#### View Dashboard
- Navigate to Admin → Dashboard
- Review system statistics and charts
- Test date range filters

#### Generate Reports
- Navigate to Admin → Reports
- Select report type (vaccination coverage, inventory, etc.)
- Generate and review reports

### 5. SMS & Notifications
#### Send SMS Notifications
- Navigate to Admin → SMS → Send SMS
- Select recipients and message template
- Send notification and verify delivery

#### View Message History
- Navigate to Admin → SMS → Message History
- Review sent messages and status

#### Manage Notifications
- Navigate to Admin → Notifications → Add Notification
- Create system notifications
- View notification history

---

## HEALTH WORKER (BHS) SCENARIOS

### 1. Patient Management (Limited Access)
#### Add New Patient
- Navigate to Health Worker → Patients → Add Patient
- Fill in patient information (BHS scope)
- Verify patient creation

#### View Patient List
- Navigate to Health Worker → Patients → Patient List
- Review assigned patients
- Test search and filter functionality

#### View Patient Details
- Navigate to Health Worker → Patients → Patient Details
- Review patient information and history
- Test all available tabs

### 2. Vaccination Records (With Restrictions)
#### Add Vaccination Record
- Navigate to Health Worker → Patients → Add Immunization Record
- Select patient and vaccine
- Fill in vaccination details
- Save and verify record creation

#### View Vaccination History
- Navigate to Health Worker → Patients → Vaccination History
- Review patient's vaccination records
- Test filtering by vaccine type

#### Edit Vaccination Record (Facility Only)
- Navigate to Health Worker → Patients → Edit Vaccination Record
- Attempt to edit in-facility records (should be restricted)
- Verify restriction message displays
- Test editing out-of-facility records (should work)

#### Reschedule Vaccination Appointments
- Navigate to Health Worker → Patients → Patient Details
- Select a scheduled vaccination
- Choose new appointment date
- Confirm reschedule and verify SMS notification is sent
- Check that appointment status shows as "rescheduled"

### 3. Visit Management
#### Add Patient Visit
- Navigate to Health Worker → Patients → Add Visit
- Record visit details and vitals
- Save visit information

#### Edit Visit Information
- Navigate to Health Worker → Patients → Edit Visit
- Modify visit details
- Save changes

#### View Visit Summary
- Navigate to Health Worker → Patients → Visit Summary
- Review visit history and details

### 4. Inventory Viewing
#### View Vaccine Inventory
- Navigate to Health Worker → Inventory → Vaccine Inventory
- Review available vaccines (read-only)
- Check stock levels

### 5. Notifications & SMS
#### View Notifications
- Navigate to Health Worker → Notifications
- Review system notifications
- Mark notifications as read

#### Send SMS (If Permitted)
- Navigate to Health Worker → SMS
- Test SMS sending capabilities (if available)

---

## PARENT USER SCENARIOS

### 1. Account Access
#### Login to Parent Account
- Use parent credentials to login
- Verify dashboard access

### 2. Child Records Viewing
#### View Child Information
- Navigate to Parent → Records → Child Information
- Review child's basic details
- View vaccination schedule

#### View Vaccination History
- Navigate to Parent → Records → Vaccination History
- Review completed vaccinations
- Check upcoming vaccinations
- Verify rescheduled appointments show correct status

#### Request Reschedule (Contact Health Center)
- Navigate to Parent → Schedule → Child Schedule
- Click "Reschedule" button on upcoming appointment
- Verify message displays instructing to contact health center
- Check that rescheduled appointments show "rescheduled" status

#### View Visit History
- Navigate to Parent → Records → Visit History
- Review medical visits and notes

### 3. Notifications
#### View Notifications
- Navigate to Parent → Notifications
- Review system notifications
- Check vaccination reminders

---

## CROSS-ROLE TESTING SCENARIOS

### 1. Authentication & Authorization
#### Login with Different Roles
- Test login with Admin, Health Worker, and Parent accounts
- Verify role-based menu access
- Test logout functionality

#### Password Management
- Test password change functionality
- Verify password requirements
- Test password reset (if available)

### 2. Data Consistency
#### Verify Data Across Roles
- Create patient as Admin
- View same patient as Health Worker
- View child's records as Parent
- Ensure data consistency across all interfaces

### 3. Real-time Updates
#### Test Live Data Updates
- Make changes in one interface
- Verify updates appear in other interfaces
- Test notification delivery

#### Test Reschedule Notifications
- Admin reschedules vaccination appointment
- Verify Health Worker sees updated schedule
- Verify Parent receives SMS notification about reschedule
- Check that all interfaces show "rescheduled" status

### 4. Offline Functionality (If Available)
#### Test Offline Mode
- Go offline and test cached data access
- Make changes offline
- Test sync when back online

---

## SYSTEM-WIDE SCENARIOS

### 1. Search & Filtering
#### Global Search
- Test search functionality across all modules
- Search by patient name, ID, vaccine type
- Verify search results accuracy

#### Advanced Filtering
- Test date range filters
- Filter by status, type, location
- Verify filter combinations work

### 2. Data Export
#### Export Reports
- Generate and export vaccination reports
- Export patient lists
- Test different export formats (PDF, Excel)

### 3. System Performance
#### Load Testing
- Test with multiple concurrent users
- Verify system responsiveness
- Check memory usage during heavy operations

### 4. Error Handling
#### Test Error Scenarios
- Try invalid data entry
- Test network disconnection
- Verify error messages and recovery

---

## TESTING CHECKLIST

- [ ] All user roles can login successfully
- [ ] Role-based access controls work correctly
- [ ] Data entry validation functions properly
- [ ] Search and filter features work across all modules
- [ ] Reports generate and export correctly
- [ ] SMS notifications send and deliver
- [ ] Vaccination rescheduling works for Admin and Health Workers
- [ ] Rescheduled appointments show correct status across all interfaces
- [ ] SMS notifications are sent for rescheduled appointments
- [ ] Cascade rescheduling adjusts related vaccinations properly
- [ ] Parents can view rescheduled appointment status
- [ ] Offline functionality works (if implemented)
- [ ] Real-time updates sync across interfaces
- [ ] Error handling provides clear feedback
- [ ] System performance remains acceptable under load

---

*Last Updated: November 10, 2025 (Added Rescheduling Scenarios)*</content>
