# VACCINE MANAGEMENT SYSTEM - VISUAL FLOW DIAGRAMS

## 📊 SYSTEM FLOW DIAGRAMS

### **1. OVERALL SYSTEM ARCHITECTURE**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          VACCINE MANAGEMENT SYSTEM                          │
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   FRONTEND      │    │    BACKEND      │    │   DATABASE      │         │
│  │   (Vue.js)      │◄──►│   (Node.js)     │◄──►│  (PostgreSQL)   │         │
│  │                 │    │                 │    │                 │         │
│  │ • Admin UI      │    │ • REST API      │    │ • Core Tables   │         │
│  │ • Health Worker │    │ • Controllers   │    │ • Functions     │         │
│  │ • Parent Portal │    │ • Middleware    │    │ • Triggers      │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            USER ROLES                                       │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │    ADMIN    │  │HEALTH WORKER│  │   PARENT   │  │   SYSTEM    │         │
│  │             │  │             │  │            │  │             │         │
│  │ • Full CRUD │  │ • Patient   │  │ • View     │  │ • Automated │         │
│  │ • Reports   │  │   Care      │  │   Only     │  │   Tasks     │         │
│  │ • Settings  │  │ • Read Inv  │  │ • Comm     │  │ • Cron Jobs │         │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 DETAILED BUSINESS FLOWS

### **2. RECEIVING REPORT TO INVENTORY FLOW**
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  RECEIVING  │     │   REPORT   │     │  COMPLETE  │     │ INVENTORY   │
│   REPORT    │────►│   ITEMS    │────►│   REPORT   │────►│  CREATED    │
│   CREATED   │     │   ADDED    │     │            │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  DRAFT      │     │ VALIDATE   │     │CREATE INVEN│     │ RECEIVE     │
│  STATUS     │     │  DATA      │     │TORY RECORDS│     │ TRANSACTION │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                         │
                                                         ▼
                                                ┌─────────────┐
                                                │  STOCK     │
                                                │  LEVELS    │
                                                │  UPDATED   │
                                                └─────────────┘
```

### **3. PATIENT IMMUNIZATION COMPLETE FLOW**
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  PATIENT    │     │ SCHEDULE    │     │ VACCINE     │     │ SCHEDULE    │
│ REGISTRATION│────►│ GENERATED  │────►│ADMINISTERED │────►│  UPDATED    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ CREATE      │     │ AUTOMATIC   │     │ RECORD IN   │     │ RECALC      │
│ PATIENT     │     │ INTERVAL    │     │IMMUNIZATIONS│     │ PATIENT     │
│ PROFILE     │     │ CALCULATION │     │  TABLE      │     │ SCHEDULE    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                         │
                                                         ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ UPDATE      │────►│ ACTIVITY    │────►│ PARENT      │────►│ DASHBOARD   │
│ STATUS      │     │ LOGGED      │     │ NOTIFIED    │     │ UPDATED     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### **4. INVENTORY TRANSACTION FLOW**
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ STOCK       │     │ TRANSACTION │     │ INVENTORY   │     │ HISTORY     │
│ MOVEMENT    │────►│ RECORDED   │────►│ UPDATED     │────►│ RECORDED    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ RECEIVE/    │     │ BALANCE     │     │ STOCK       │     │ AUDIT       │
│ ISSUE/      │     │ CALCULATED  │     │ LEVEL       │     │ TRAIL       │
│ EXPIRED     │     │             │     │ ADJUSTED    │     │ MAINTAINED  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

---

## 🏗️ MODULE INTERACTION DIAGRAM

### **5. BACKEND API MODULES INTERACTION**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND API LAYER                                │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ AUTH        │  │ USER MGMT  │  │ PATIENT     │  │ IMMUNIZATION│         │
│  │ CONTROLLER  │  │ CONTROLLER │  │ CONTROLLER │  │ CONTROLLER  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                │                  │                  │            │
│         └────────────────┼──────────────────┼──────────────────┘            │
│                          │                  │                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ VACCINE     │  │ DASHBOARD   │  │ ACTIVITY    │  │ REPORTING   │         │
│  │ INVENTORY   │  │ CONTROLLER │  │ CONTROLLER  │  │ CONTROLLER  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘         │
│         │                │                  │                  │            │
│         └────────────────┼──────────────────┼──────────────────┘            │
│                          │                  │                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ SMS/COMM    │  │ DEWORMING   │  │ VITAMINA    │  │ VITALS      │         │
│  │ CONTROLLER  │  │ CONTROLLER │  │ CONTROLLER  │  │ CONTROLLER  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATABASE LAYER                                    │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   USERS     │  │  PATIENTS   │  │IMMUNIZATION │  │ INVENTORY   │         │
│  │   TABLES    │  │   TABLES    │  │  TABLES     │  │   TABLES    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ FUNCTIONS   │  │  TRIGGERS   │  │   VIEWS     │  │  HISTORY    │         │
│  │ & PROCEDURES│  │             │  │             │  │   TABLES    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### **6. FRONTEND MODULES INTERACTION**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND UI LAYER                                 │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                          ADMIN DASHBOARD                               │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │ │
│  │  │ DASHBOARD   │  │ USER MGMT   │  │ PATIENT     │  │ INVENTORY   │    │ │
│  │  │ OVERVIEW    │  │             │  │ RECORDS     │  │ MANAGEMENT  │    │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │ │
│  │                                                                        │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │ │
│  │  │ REPORTS     │  │ ACTIVITY    │  │ SETTINGS    │  │ RECEIVING   │    │ │
│  │  │             │  │ LOGS        │  │             │  │ REPORTS     │    │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                       HEALTH WORKER INTERFACE                          │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                     │ │
│  │  │ DASHBOARD   │  │ PATIENT     │  │ INVENTORY   │                     │ │
│  │  │             │  │ CARE        │  │ READ-ONLY  │                     │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                     │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                          PARENT PORTAL                                 │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                     │ │
│  │  │ CHILD       │  │ APPOINTMENT │  │ COMMUNICATION│                    │ │
│  │  │ RECORDS     │  │ VIEWING     │  │             │                    │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                     │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 DATA FLOW DIAGRAMS

### **7. COMPLETE DATA FLOW**
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   USER      │     │   FRONTEND  │     │   BACKEND   │     │  DATABASE   │
│  INTERACTION│────►│  VALIDATION │────►│ PROCESSING  │────►│  STORAGE    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   INPUT     │     │   REQUEST   │     │  BUSINESS   │     │   CRUD      │
│   DATA      │     │   FORMATTING│     │   LOGIC     │     │ OPERATIONS  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                         │
                                                         ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  TRIGGERS   │────►│  FUNCTIONS  │────►│  AUDIT      │────►│  RESPONSE   │
│  EXECUTED   │     │   CALLED    │     │  LOGGING    │     │   SENT      │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### **8. RECEIVING REPORT DATA FLOW**
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ CREATE      │     │ ADD ITEMS   │     │ VALIDATE    │     │ COMPLETE    │
│ REPORT      │────►│ TO REPORT   │────►│  DATA       │────►│  REPORT     │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ REPORT      │     │ REPORT      │     │ BUSINESS    │     │ CALL        │
│ HEADER      │     │ ITEMS       │     │ RULES       │     │ FUNCTIONS   │
│ CREATED     │     │ CREATED     │     │ CHECKED     │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                         │
                                                         ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ INVENTORY   │────►│ TRANSACTIONS│────►│ STOCK       │────►│ STATUS      │
│ RECORDS     │     │ CREATED     │     │ LEVELS      │     │ UPDATED     │
│ CREATED     │     │             │     │ UPDATED     │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

---

## 📊 KEY PROCESSES SUMMARY

### **9. SYSTEM PROCESSES OVERVIEW**
```
1. AUTHENTICATION PROCESS
   User Login → JWT Token → Role Verification → Access Granted

2. RECEIVING REPORT PROCESS
   Create Report → Add Items → Validate → Complete → Inventory Created

3. IMMUNIZATION PROCESS
   Patient Reg → Schedule Gen → Vaccine Admin → Status Update → Audit Log

4. INVENTORY MANAGEMENT
   Receive Stock → Track Levels → Issue Vaccines → Monitor Expiry

5. REPORTING PROCESS
   Data Collection → Aggregation → Report Generation → Export/Display

6. AUDIT PROCESS
   Action Performed → Log Created → History Updated → Trail Maintained
```

### **10. AUTOMATED PROCESSES**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AUTOMATED PROCESSES                                │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │   CRON JOBS     │  │   DATABASE      │  │   TRIGGERS      │            │
│  │                 │  │   FUNCTIONS     │  │                 │            │
│  │ • Expiry Check  │  │ • Status Updates│  │ • Audit Logging │            │
│  │   (7AM, 5PM)    │  │ • Calculations  │  │ • Timestamps    │            │
│  │ • Report Gen    │  │ • Validations   │  │ • History       │            │
│  │ • Cleanup       │  │ • Notifications │  │ • Constraints   │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │   BACKGROUND    │  │   SCHEDULED     │  │   EVENT-DRIVEN  │            │
│  │   TASKS         │  │   TASKS         │  │   PROCESSES     │            │
│  │                 │  │                 │  │                 │            │
│  │ • Bulk Updates  │  │ • Daily Reports │  │ • Real-time     │            │
│  │ • Data Sync     │  │ • Maintenance   │  │   Updates       │            │
│  │ • Notifications │  │ • Backups       │  │ • Validations   │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
└─────────────────────────────────────────────────────────────────────────────┘
```

This visual representation shows how all system components interact to provide a comprehensive vaccine management solution with proper data flow, security, and user experience.