# Frontend Development Note: Database Schema Overview

Hey Frontend Team,

Hope you're all doing great! I've been reviewing the `schema overview.txt` file, and I wanted to jot down some friendly reminders, warnings, suggestions, and recommendations for you as you work on integrating with our database. Keep in mind that this is still a work-in-progress backend, so things might evolve. Let's make sure we're building something solid and user-friendly together!

## Reminders
- **Adhere to Required Fields**: Always check for mandatory fields in forms and API calls. For example, tables like `patients` require fields like `surname`, `firstname`, `date_of_birth`, and `guardian_id`. Don't let users submit incomplete data – validate on the frontend to prevent errors.
- **Soft Deletes**: Many tables (e.g., `patients`, `immunizations`, `inventory`) have `is_deleted` flags. When querying data, remember to filter out deleted records unless you're building an admin view for recovery.
- **Audit Trails**: History tables (e.g., `patients_history`, `immunizations_history`) track changes. If you're displaying edit histories or logs, pull from these to show what changed, when, and by whom.
- **Relationships**: Use foreign keys wisely. For instance, `patients.guardian_id` links to `guardians.guardian_id`. Ensure dropdowns or selections populate correctly to maintain data integrity.
- **Data Types**: Respect the data types – e.g., dates should be in `YYYY-MM-DD` format, numerics for weights/heights, and JSONB for flexible data like `old_value` in `activitylogs`.

## Warnings
- **Incomplete Schema**: This isn't the final database yet. New tables, columns, or views might be added, so design your components to be flexible. Avoid hardcoding assumptions about table structures.
- **Potential Data Inconsistencies**: With ongoing migrations (like the ones in `backend/migrations/`), data might change. Test thoroughly after any backend updates to catch issues like missing foreign keys.
- **Security**: Fields like `user_id`, `created_by`, and `updated_by` are crucial for tracking. Ensure your frontend handles authentication properly and passes the correct user IDs in API requests.
- **Views vs. Tables**: Views like `dashboard_view` or `defaulters_view` are computed – they might not update in real-time. If performance is an issue, consider caching or polling strategies.

## Suggestions
- **Form Validations**: For patient registration, validate that `date_of_birth` makes sense (not in the future), and ensure `guardian_id` exists. Use client-side validation with server-side confirmation.
- **Error Handling**: When APIs fail (e.g., due to missing required fields), show user-friendly messages. For example, if a vaccine inventory is low, alert the user via the `inventorylowstock_view`.
- **UI for Relationships**: In patient details, display guardian info by joining with `guardians`. Make it easy to navigate related data, like viewing immunization history from `immunizationhistory_view`.
- **Offline Mode**: Since there's an `OFFLINE_MODE_TESTING_GUIDE.md`, think about how the frontend handles offline scenarios – maybe cache data from views like `dashboard_view`.

## Recommendations
- **API Design**: Work closely with the backend team to ensure endpoints match the schema. For instance, when fetching patient schedules, use `patientschedule_view` for efficiency.
- **Testing**: Before going live, test with real data. Check edge cases like patients with no guardians or expired inventory (from `inventory.expiration_date`).
- **Scalability**: As the database grows, optimize queries. For example, use pagination for large lists like `activitylogs`.
- **User Experience**: Leverage views for quick insights – e.g., show defaulters from `defaulters_view` on the dashboard. Make sure the UI reflects the schema's structure, like categorizing vaccines by type.
- **Documentation**: Keep notes on how you're handling schema changes. If something breaks after a migration, refer back to files like `DATABASE_MIGRATION_INSTRUCTIONS.md`.

We're all in this together, so let's communicate often! If you have questions or need clarifications, just shout. Let's build an awesome system.

Cheers,  
[Japeth Dee/Backend-Database Team]