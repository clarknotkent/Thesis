# Admin Views Structure

This directory contains all admin-related views organized by feature modules for better scalability and maintainability.

## Directory Structure

```
admin/
├── activity-logs/          # Activity logging and audit trails
│   ├── ActivityLogs.vue
│   └── index.js
├── dashboard/              # Main admin dashboard
│   ├── Dashboard.vue
│   └── index.js
├── inventory/              # Vaccine inventory management
│   ├── VaccineInventory.vue
│   └── index.js
├── notifications/          # Notification management
│   ├── NotificationsInbox.vue
│   ├── AddNotifications.vue
│   ├── CreateNotification.vue
│   └── index.js
├── patient-records/        # Patient information management
│   ├── PatientRecords.vue
│   └── index.js
├── profile/                # User profile management
│   ├── Profile.vue
│   └── index.js
├── reports-analytics/      # Reports and analytics
│   ├── Reports.vue
│   ├── ReceivingReports.vue
│   └── index.js
├── settings/               # System settings
│   ├── Settings.vue
│   └── index.js
├── sms/                    # SMS logs and management
│   ├── SMSLogs.vue
│   └── index.js
├── user-accounts/          # User account management
│   ├── UserAccounts.vue
│   └── index.js
└── index.js                # Main entry point for all admin views
```

## Usage

### Import from module (Recommended)
```javascript
import { Dashboard } from '@/views/admin'
import { PatientRecords } from '@/views/admin'
import { NotificationsInbox, AddNotifications } from '@/views/admin'
```

### Import directly from folder
```javascript
import Dashboard from '@/views/admin/dashboard/Dashboard.vue'
import { PatientRecords } from '@/views/admin/patient-records'
```

## Adding New Features

### To add a new component to an existing module:

1. Add your component to the appropriate folder
2. Export it in the folder's `index.js`
3. Update the main `admin/index.js` if needed

Example - Adding a new notification type:
```javascript
// notifications/NotificationTemplates.vue (create new file)
// notifications/index.js (update)
export { default as NotificationTemplates } from './NotificationTemplates.vue'

// admin/index.js (update)
export { NotificationsInbox, AddNotifications, NotificationTemplates } from './notifications'
```

### To add a new module:

1. Create a new folder in `admin/`
2. Add your component(s)
3. Create an `index.js` file exporting your components
4. Update the main `admin/index.js` to export from your module

Example - Adding a feedback module:
```bash
admin/feedback/
├── Feedback.vue
└── index.js
```

```javascript
// feedback/index.js
export { default as Feedback } from './Feedback.vue'

// admin/index.js
export { Feedback } from './feedback'
```

## Benefits of This Structure

✅ **Scalability**: Easy to add new features within modules
✅ **Maintainability**: Clear organization by feature domain
✅ **Reusability**: Components can share module-specific utilities
✅ **Team Collaboration**: Developers can work on different modules independently
✅ **Code Splitting**: Better for lazy loading and performance optimization
✅ **Testing**: Easier to write module-specific tests

## Module Descriptions

- **activity-logs**: Track and display system activity, user actions, and audit trails
- **dashboard**: Overview metrics, charts, and quick access to key features
- **inventory**: Manage vaccine stock, expiration dates, and inventory levels
- **notifications**: Send and manage notifications (in-app, email, SMS)
- **patient-records**: View, create, update patient information and vaccination history
- **profile**: User profile settings and personal information
- **reports-analytics**: Generate and view various reports and analytics
- **settings**: System-wide configuration and preferences
- **sms**: View SMS logs, delivery status, and SMS-related operations
- **user-accounts**: Manage system users, roles, and permissions
