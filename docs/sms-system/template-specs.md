# SMS Template Specifications

## Official Template Format

### Trigger Schedule
- **1 Week Before** - Sent 7 days before scheduled vaccination
- **3 Days Before** - Sent 3 days before scheduled vaccination  
- **1 Day Before** - Sent 1 day before scheduled vaccination (tomorrow)

### Time Triggers
- **Day Greeting**: 6:00 AM - 5:59 PM → "Good Day"
- **Evening Greeting**: 6:00 PM - 5:59 AM → "Good Evening"

---

## Template Structure

### 1 Week Before Template
```
Good {greeting_time}, {guardian_title}. {guardian_last_name}.
Your child, {patient_name}, is scheduled for vaccination on {appointment_date}
for {vaccine_name} Dose {dose_number}.
```

**Example Output (sent at 10:00 AM):**
```
Good Day, Mr. Aspa.
Your child, Clark, is scheduled for vaccination on May 24, 2025
for BCG Dose 1.
```

---

### 3 Days Before Template
```
Good {greeting_time}, {guardian_title}. {guardian_last_name}.
Your child, {patient_name}, is scheduled for vaccination on {appointment_date}
for {vaccine_name} Dose {dose_number}.
```

**Example Output (sent at 10:00 AM):**
```
Good Day, Mr. Aspa.
Your child, Clark, is scheduled for vaccination on May 24, 2025
for BCG Dose 1.
```

---

### 1 Day Before Template (Tomorrow)
```
Good {greeting_time}, {guardian_title}. {guardian_last_name}.
Your child, {patient_name}, is scheduled for vaccination tomorrow, {appointment_date}
for {vaccine_name} Dose {dose_number}.
```

**Example Output (sent at 10:00 AM):**
```
Good Day, Mr. Aspa.
Your child, Clark, is scheduled for vaccination tomorrow, May 24, 2025
for BCG Dose 1.
```

---

## Variable Mapping

### Required Variables for All Templates

| Variable | Description | Example |
|----------|-------------|---------|
| `{greeting_time}` | Auto-calculated: "Day" or "Evening" | "Day" |
| `{guardian_title}` | Auto-calculated: "Mr." or "Ms." | "Mr." |
| `{guardian_last_name}` | Guardian's last name | "Aspa" |
| `{patient_name}` | Patient's first name | "Clark" |
| `{appointment_date}` | Full date format | "May 24, 2025" |
| `{vaccine_name}` | Vaccine name (all caps) | "BCG" |
| `{dose_number}` | Dose number: 1, 2, or 3 | "1" |

### Auto-Calculated Variables

**Greeting Time Logic:**
```javascript
currentHour >= 6 && currentHour < 18 ? "Day" : "Evening"
```

**Guardian Title Logic:**
```javascript
guardianGender === "female" ? "Ms." : "Mr."
```

---

## Complete Examples

### Example 1: Male Guardian, Morning Send
**Variables:**
```json
{
  "guardianLastName": "Aspa",
  "guardianGender": "male",
  "patientName": "Clark",
  "vaccineName": "BCG",
  "doseNumber": "1",
  "appointmentDate": "May 24, 2025",
  "currentHour": 10
}
```

**Output:**
```
Good Day, Mr. Aspa.
Your child, Clark, is scheduled for vaccination on May 24, 2025
for BCG Dose 1.
```

### Example 2: Female Guardian, Evening Send
**Variables:**
```json
{
  "guardianLastName": "Santos",
  "guardianGender": "female",
  "patientName": "Maria",
  "vaccineName": "Hepatitis B",
  "doseNumber": "2",
  "appointmentDate": "June 15, 2025",
  "currentHour": 19
}
```

**Output:**
```
Good Evening, Ms. Santos.
Your child, Maria, is scheduled for vaccination on June 15, 2025
for Hepatitis B Dose 2.
```

### Example 3: 1 Day Before (Tomorrow)
**Variables:**
```json
{
  "guardianLastName": "Reyes",
  "guardianGender": "male",
  "patientName": "Juan",
  "vaccineName": "Polio",
  "doseNumber": "3",
  "appointmentDate": "November 5, 2025",
  "currentHour": 14
}
```

**Output:**
```
Good Day, Mr. Reyes.
Your child, Juan, is scheduled for vaccination tomorrow, November 5, 2025
for Polio Dose 3.
```

---

## Common Vaccines & Doses

| Vaccine | Typical Doses |
|---------|---------------|
| BCG | 1 |
| Hepatitis B | 1, 2, 3 |
| Pentavalent (DPT-Hib-HepB) | 1, 2, 3 |
| Oral Polio Vaccine (OPV) | 1, 2, 3 |
| Inactivated Polio Vaccine (IPV) | 1, 2 |
| Pneumococcal Conjugate Vaccine (PCV) | 1, 2, 3 |
| Measles-Mumps-Rubella (MMR) | 1, 2 |

---

## API Usage

### Send SMS Using Template

```bash
POST /api/sms
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "phoneNumber": "09171234567",
  "templateId": 1,
  "variables": {
    "guardianLastName": "Aspa",
    "guardianGender": "male",
    "patientName": "Clark",
    "vaccineName": "BCG",
    "doseNumber": "1",
    "appointmentDate": "May 24, 2025"
  },
  "type": "1-week",
  "guardianId": 5,
  "patientId": 12
}
```

### Preview Template Before Sending

```bash
POST /api/sms/templates/preview
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "templateId": 1,
  "variables": {
    "guardianLastName": "Aspa",
    "guardianGender": "male",
    "patientName": "Clark",
    "vaccineName": "BCG",
    "doseNumber": "1",
    "appointmentDate": "May 24, 2025",
    "currentHour": 10
  }
}
```

---

## Database Template Records

After running the migration, you'll have these templates:

| ID | Name | Trigger Type | Time Range |
|----|------|--------------|------------|
| 1 | 1 Week Before Reminder | 1-week | 06:00-17:59 |
| 2 | 3 Days Before Reminder | 3-days | 06:00-17:59 |
| 3 | 1 Day Before Reminder | 1-day | 06:00-17:59 |
| 4 | Manual Appointment Notice | manual | NULL |

---

## Notes

1. **Date Format**: Use "Month DD, YYYY" format (e.g., "May 24, 2025")
2. **Vaccine Names**: Use standard names (BCG, Hepatitis B, etc.)
3. **Dose Numbers**: Always use 1, 2, or 3 as strings
4. **Phone Format**: System auto-converts to +63 format
5. **Greeting Auto-Detection**: Based on server time when sent
6. **Title Auto-Detection**: Based on guardian gender in database

---

## Testing Checklist

- [ ] Test "Good Day" greeting (send between 6 AM - 5:59 PM)
- [ ] Test "Good Evening" greeting (send between 6 PM - 5:59 AM)
- [ ] Test "Mr." title (male guardian)
- [ ] Test "Ms." title (female guardian)
- [ ] Test 1-week template
- [ ] Test 3-days template
- [ ] Test 1-day template (includes "tomorrow")
- [ ] Test all three dose numbers (1, 2, 3)
- [ ] Test various vaccine names
- [ ] Verify proper date formatting
