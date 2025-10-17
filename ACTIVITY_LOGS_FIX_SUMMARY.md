# Activity Logs "Unknown User" Fix

## Problem
The Activity Logs page was showing "Unknown" for the user role column because:
1. The `activitylogs_view` database view did not include the `user_role` column
2. The backend was only fetching data from the view without joining to get user roles
3. The frontend expected `user_role` but it was missing from the API response

## Root Cause
The database view `activitylogs_view` was created with only these fields:
- log_id, user_id, action_type, entity_type, entity_id
- description, old_value, new_value, timestamp
- user_fullname (from LEFT JOIN with users table)

**Missing**: `user_role`, `username` from the users table

## Solution

### 1. Database View Update
**File**: `db/2025-10-15_add_user_role_to_activitylogs_view.sql`

Updated the `activitylogs_view` to include:
```sql
CREATE OR REPLACE VIEW activitylogs_view AS
SELECT
  a.log_id,
  a.user_id,
  a.action_type,
  a.entity_type,
  a.entity_id,
  a.description,
  a.old_value,
  a.new_value,
  timezone('Asia/Manila', a."timestamp"::timestamptz) AS "timestamp",
  COALESCE(u.full_name, 'System') AS user_fullname,
  u.username,
  u.role AS user_role  -- Added this field
FROM activitylogs a
LEFT JOIN users u ON u.user_id = a.user_id;
```

### 2. Backend Controller Update
**File**: `backend/controllers/activityController.js`

Enhanced to accept additional query parameters:
- `search` - Search across user names, actions, descriptions
- `date_range` - today, week, month, custom, all
- `user_role` - Filter by admin, health_worker, parent
- `from_date` / `to_date` - Custom date range

### 3. Backend Model Update
**File**: `backend/models/activityModel.js`

Simplified the model to directly use the `user_role` from the view:
- Removed the need for a separate query to fetch user roles
- Added proper filtering for user role, date ranges, and search
- Enhanced error handling and logging

### 4. Frontend Display
**File**: `frontend/src/views/admin/activity-logs/ActivityLogs.vue`

The frontend already had proper helper functions to display roles:
- `formatUserRole()` - Formats role names (Admin, Health Staff, Parent)
- `getRoleIcon()` - Shows role-specific icons (shield, hospital, heart)
- `getRoleColor()` - Color-codes roles (red, blue, green)
- `getRoleBadgeClass()` - Applies Bootstrap badge styles

## Migration Steps

### Step 1: Run the Database Migration
Execute the SQL migration file in your Supabase SQL editor:
```bash
# File: db/2025-10-15_add_user_role_to_activitylogs_view.sql
```

### Step 2: Restart Backend Server
The backend changes are already in place. Simply restart the server:
```bash
cd backend
npm restart
```

### Step 3: Test the Activity Logs Page
1. Navigate to Admin → Activity Logs
2. Verify that user roles now display correctly with icons and badges:
   - 🛡️ Admin (Red badge)
   - 🏥 Health Staff (Blue badge)
   - ❤️ Parent (Green badge)
3. Test the filters:
   - Date Range (Today, This Week, This Month, Custom)
   - Action Type (Login, Logout, Create, Update, Delete, View)
   - User Role (Admin, Health Worker, Parent)
   - Search functionality

## Technical Details

### Database Schema
- **Table**: `activitylogs` - Stores all activity log entries
- **Table**: `users` - Contains user information including `full_name`, `username`, `role`
- **View**: `activitylogs_view` - Joins activitylogs with users to provide enriched data

### API Endpoint
- **URL**: `GET /api/activity-logs`
- **Query Parameters**:
  - `page` - Page number (default: 1)
  - `limit` - Items per page (default: 10, max: 100)
  - `search` - Search term
  - `date_range` - today | week | month | custom | all
  - `action_type` - login | logout | create | update | delete | view
  - `user_role` - admin | health_worker | parent
  - `from_date` - Start date (ISO format)
  - `to_date` - End date (ISO format)

### Response Format
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "log_id": 123,
        "user_id": 5,
        "user_fullname": "John Doe",
        "username": "johndoe",
        "user_role": "admin",
        "action_type": "update",
        "description": "Updated patient record",
        "timestamp": "2025-10-15T14:30:00+08:00",
        "display_user_name": "John Doe",
        "display_action": "Updated patient record"
      }
    ],
    "totalCount": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

## Files Modified
1. ✅ `db/2025-10-15_add_user_role_to_activitylogs_view.sql` - NEW migration file
2. ✅ `db/cleaned_views.sql` - Updated view definition
3. ✅ `backend/controllers/activityController.js` - Enhanced filtering
4. ✅ `backend/models/activityModel.js` - Simplified and optimized query
5. ✅ `frontend/src/views/admin/activity-logs/ActivityLogs.vue` - Already had proper display logic

## Testing Checklist
- [ ] Run database migration
- [ ] Restart backend server
- [ ] Check Activity Logs page loads without errors
- [ ] Verify user roles display with correct icons and badges
- [ ] Test date range filters
- [ ] Test user role filter
- [ ] Test action type filter
- [ ] Test search functionality
- [ ] Test pagination
- [ ] Test "View Details" modal shows complete information
- [ ] Test export functionality
- [ ] Test clear old logs functionality

## Notes
- The view uses `LEFT JOIN` so system-generated logs (where `user_id` IS NULL) will show "System" as the user
- The `timezone('Asia/Manila', ...)` function ensures all timestamps are in Philippine time
- Role filtering is done at the database level for better performance
- Search is case-insensitive using `ilike` operator
