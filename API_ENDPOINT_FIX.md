# API Endpoint Fix - Phase 1 Pages

## Issue
All newly created Phase 1 pages were calling `/api/inventory/:id` endpoints, but the backend routes are actually mounted at `/api/vaccines/inventory/:id`.

## Root Cause
Backend routes in `backend/routes/vaccineRoutes.js` are structured as:
- `/api/vaccines/inventory` - List inventory
- `/api/vaccines/inventory/:id` - Get/Update/Delete inventory item
- `/api/vaccines/inventory/:id/adjust` - Adjust stock
- `/api/vaccines/transactions?inventory_id=:id` - Get transaction history

## Files Fixed

### 1. **ViewInventory.vue**
- **Before:** `api.get('/inventory/${id}')`
- **After:** `api.get('/vaccines/inventory/${id}')`

### 2. **EditStock.vue** (2 fixes)
- **Before:** `api.get('/inventory/${id}')` and `api.put('/inventory/${id}')`
- **After:** `api.get('/vaccines/inventory/${id}')` and `api.put('/vaccines/inventory/${id}')`

### 3. **AddStock.vue**
- **Before:** `api.post('/inventory')`
- **After:** `api.post('/vaccines/inventory')`

### 4. **AdjustStock.vue** (2 fixes)
- **Before:** `api.get('/inventory/${id}')` and `api.post('/inventory/${id}/adjust')`
- **After:** `api.get('/vaccines/inventory/${id}')` and `api.post('/vaccines/inventory/${id}/adjust')`

### 5. **InventoryHistory.vue** (2 fixes)
- **Before:** `api.get('/inventory/${id}')` and `api.get('/inventory/${id}/history')`
- **After:** `api.get('/vaccines/inventory/${id}')` and `api.get('/vaccines/transactions', { params: { inventory_id: id } })`

## Backend Route Structure (Reference)

```javascript
// Vaccine Type Management
GET    /api/vaccines           - List all vaccine types
POST   /api/vaccines           - Add vaccine type
GET    /api/vaccines/:id       - Get vaccine type
PUT    /api/vaccines/:id       - Update vaccine type
DELETE /api/vaccines/:id       - Delete vaccine type

// Inventory Management
GET    /api/vaccines/inventory         - List all inventory
POST   /api/vaccines/inventory         - Add stock
GET    /api/vaccines/inventory/:id     - Get inventory item
PUT    /api/vaccines/inventory/:id     - Update inventory item
DELETE /api/vaccines/inventory/:id     - Delete inventory item
POST   /api/vaccines/inventory/:id/adjust - Adjust stock quantity

// Transaction History
GET    /api/vaccines/transactions      - Get transactions (query: inventory_id, vaccine_id, etc.)
```

## Status
✅ All API endpoints corrected  
✅ Ready for testing

## Testing Steps
1. Start backend server: `cd backend && npm start`
2. Start frontend server: `cd frontend && npm run dev`
3. Navigate to `/admin/vaccines`
4. Click on any inventory item's "View" button
5. Verify data loads correctly (should show inventory details)
6. Test other pages: Edit Stock, Adjust Stock, History

## Notes
- The transaction history endpoint uses query parameters (`?inventory_id=X`) instead of a path parameter
- All endpoints require authentication (Bearer token in headers)
- Admin role required for most inventory operations
