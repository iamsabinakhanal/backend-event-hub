# Event Hub Backend API - Postman Endpoints

## Base URL
```
http://localhost:8000
```

Replace `8000` with your configured PORT if different (e.g., `http://localhost:5050`).

---

## 🔐 Authentication Endpoints

### 1. Register User
- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/auth/register`
- **Body (JSON):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "1234567890"
}
```

### 2. Login User
- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/auth/login`
- **Body (JSON):**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
- **Response:** Returns `token` - save this for authentication

### 3. Login Admin
- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/auth/login`
- **Body (JSON):**
```json
{
  "email": "admin@gmail.com",
  "password": "admin123"
}
```

---

## 🎯 Services Endpoints

### 1. Get All Services
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/services`
- **Auth:** None required
- **Description:** Get all available services with image, description, and price

### 2. Get Service by ID
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/services/:id`
- **Auth:** None required
- **Example:** `{{baseUrl}}/api/services/65f1a2b3c4d5e6f7g8h9i0j1`

### 3. Create New Service (Admin Only)
- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/services`
- **Auth:** Bearer Token (Admin)
- **Headers:**
  - `Authorization: Bearer YOUR_ADMIN_TOKEN`
- **Body (form-data):**
  - `name`: Wedding Photography (text)
  - `description`: Professional wedding photography service with 8 hours coverage (text)
  - `price`: 5000 (text)
  - `category`: Photography (text)
  - `duration`: 480 (text, optional - in minutes)
  - `features`: High-resolution images,Online gallery,Photo editing (text, optional - comma-separated)
  - `image`: [Select File] (file, optional)

### 4. Update Service (Admin Only)
- **Method:** `PUT`
- **URL:** `{{baseUrl}}/api/services/:id`
- **Auth:** Bearer Token (Admin)
- **Headers:**
  - `Authorization: Bearer YOUR_ADMIN_TOKEN`
- **Body (form-data):**
  - `name`: Wedding Photography Deluxe (text, optional)
  - `description`: Updated description (text, optional)
  - `price`: 6000 (text, optional)
  - `category`: Photography (text, optional)
  - `duration`: 600 (text, optional)
  - `features`: Updated features (text, optional)
  - `image`: [Select File] (file, optional)

### 5. Delete Service (Admin Only)
- **Method:** `DELETE`
- **URL:** `{{baseUrl}}/api/services/:id`
- **Auth:** Bearer Token (Admin)
- **Headers:**
  - `Authorization: Bearer YOUR_ADMIN_TOKEN`

### 6. Get Services by Category
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/services/category/:category`
- **Auth:** None required
- **Example:** `{{baseUrl}}/api/services/category/Photography`

### 7. Search Services
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/services/search?q=wedding&minPrice=1000&maxPrice=10000&category=Photography`
- **Auth:** None required
- **Query Parameters:**
  - `q`: Search query (required)
  - `minPrice`: Minimum price (optional)
  - `maxPrice`: Maximum price (optional)
  - `category`: Category filter (optional)

### 8. Get All Bookings for a Service (Admin Only)
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/services/:id/bookings`
- **Auth:** Bearer Token (Admin)
- **Headers:**
  - `Authorization: Bearer YOUR_ADMIN_TOKEN`
- **Description:** Get all bookings made for a specific service

---

## 📅 Booking Endpoints

### 1. Get All Bookings
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/bookings`
- **Auth:** Bearer Token
- **Headers:**
  - `Authorization: Bearer YOUR_TOKEN`
- **Description:** 
  - Regular users: Returns only their own bookings
  - Admin: Returns all bookings

### 2. Get Booking by ID
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/bookings/:id`
- **Auth:** Bearer Token
- **Headers:**
  - `Authorization: Bearer YOUR_TOKEN`

### 3. Create New Booking
- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/bookings`
- **Auth:** Bearer Token (User must be logged in)
- **Headers:**
  - `Authorization: Bearer YOUR_TOKEN`
- **Body (JSON):**
```json
{
  "service_id": "65f1a2b3c4d5e6f7g8h9i0j1",
  "event_date": "2026-03-15T10:00:00.000Z",
  "guest_count": 150,
  "special_requests": "Need extra decoration for outdoor setup",
  "total_price": 5000
}
```

### 4. Update Booking
- **Method:** `PUT`
- **URL:** `{{baseUrl}}/api/bookings/:id`
- **Auth:** Bearer Token
- **Headers:**
  - `Authorization: Bearer YOUR_TOKEN`
- **Body (JSON):**
```json
{
  "event_date": "2026-03-20T10:00:00.000Z",
  "guest_count": 200,
  "special_requests": "Updated requirements",
  "total_price": 6000
}
```

### 5. Cancel/Delete Booking
- **Method:** `DELETE`
- **URL:** `{{baseUrl}}/api/bookings/:id`
- **Auth:** Bearer Token
- **Headers:**
  - `Authorization: Bearer YOUR_TOKEN`

### 6. Get Booking Status
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/bookings/:id/status`
- **Auth:** Bearer Token
- **Headers:**
  - `Authorization: Bearer YOUR_TOKEN`

### 7. Update Booking Status (Admin Only)
- **Method:** `PUT`
- **URL:** `{{baseUrl}}/api/bookings/:id/status`
- **Auth:** Bearer Token (Admin)
- **Headers:**
  - `Authorization: Bearer YOUR_ADMIN_TOKEN`
- **Body (JSON):**
```json
{
  "status": "confirmed"
}
```
- **Valid Status Values:** `pending`, `confirmed`, `completed`, `cancelled`

---

## ⭐ Favorite Endpoints

### 1. Get All Favorites
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/favorites`
- **Auth:** Bearer Token
- **Headers:**
  - `Authorization: Bearer YOUR_TOKEN`
- **Description:**
  - Regular users: Returns only their own favorites
  - Admin: Returns all favorites

### 2. Get Favorite by ID
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/favorites/:id`
- **Auth:** Bearer Token
- **Headers:**
  - `Authorization: Bearer YOUR_TOKEN`

### 3. Add Favorite
- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/favorites`
- **Auth:** Bearer Token
- **Headers:**
  - `Authorization: Bearer YOUR_TOKEN`
  - `Content-Type: application/json`
- **Body (JSON):**
```json
{
  "service_id": "65f1a2b3c4d5e6f7g8h9i0j1"
}
```

### 4. Update Favorite
- **Method:** `PUT`
- **URL:** `{{baseUrl}}/api/favorites/:id`
- **Auth:** Bearer Token
- **Headers:**
  - `Authorization: Bearer YOUR_TOKEN`
  - `Content-Type: application/json`
- **Body (JSON):**
```json
{
  "service_id": "65f1a2b3c4d5e6f7g8h9i0j2"
}
```

### 5. Delete Favorite
- **Method:** `DELETE`
- **URL:** `{{baseUrl}}/api/favorites/:id`
- **Auth:** Bearer Token
- **Headers:**
  - `Authorization: Bearer YOUR_TOKEN`

**Testing Notes:**
- ⚠️ **IMPORTANT:** For POST and PUT requests, you MUST set `Content-Type: application/json` header in Postman
- In Postman, select **Body** → **raw** → **JSON** (not Text)
- The `service_id` must be a valid service ID that exists in your database
- You cannot add the same service to favorites twice (will get 409 error)

---

## 📞 Contact Endpoints

### 1. Get All Contacts (Admin Only)
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/contact`
- **Auth:** Bearer Token (Admin)
- **Headers:**
  - `Authorization: Bearer YOUR_ADMIN_TOKEN`
- **Description:** Get all contact form submissions

### 2. Submit Contact Form (Contact Us)
- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/contact`
- **Auth:** None required
- **Headers:**
  - `Content-Type: application/json`
- **Body (JSON):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "subject": "Wedding Package Inquiry",
  "message": "Hi, I want details about your wedding decoration and photography packages."
}
```
- **Required fields:** `name`, `email`, `subject`, `message`
- **Optional fields:** `phone`

### 3. Get Contact by ID (Authenticated)
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/contact/:id`
- **Auth:** Bearer Token
- **Headers:**
  - `Authorization: Bearer YOUR_TOKEN`
- **Example:** `{{baseUrl}}/api/contact/65f1a2b3c4d5e6f7g8h9i0j1`

### 4. Reply to Contact (Admin Only)
- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/contact/:id/reply`
- **Auth:** Bearer Token (Admin)
- **Headers:**
  - `Authorization: Bearer YOUR_ADMIN_TOKEN`
  - `Content-Type: application/json`
- **Body (JSON):**
```json
{
  "reply_message": "Thank you for contacting us. Our team will get back to you shortly with package details."
}
```

### 5. Delete Contact (Admin Only)
- **Method:** `DELETE`
- **URL:** `{{baseUrl}}/api/contact/:id`
- **Auth:** Bearer Token (Admin)
- **Headers:**
  - `Authorization: Bearer YOUR_ADMIN_TOKEN`

**Contact Testing Notes:**
- For Contact Us form, use `POST /api/contact` without token.
- Ensure `subject` is included, otherwise API returns `400`.
- Use `POST /api/contact/:id/reply` to mark a message as replied (`replied: true`).
- Admin token is required for listing all contacts, replying, and deleting.

---

## 🖼️ Gallery Endpoints

### 1. Get All Gallery Items
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/gallery`
- **Auth:** None required

### 2. Create Gallery Item (Admin Only)
- **Method:** `POST`
- **URL:** `{{baseUrl}}/api/gallery`
- **Auth:** Bearer Token (Admin)
- **Headers:**
  - `Authorization: Bearer YOUR_ADMIN_TOKEN`
- **Body (form-data):**
  - `title`: Beautiful Wedding Setup (text)
  - `description`: Outdoor wedding decoration (text)
  - `category`: Wedding (text)
  - `image`: [Select File] (file)

### 3. Update Gallery Item (Admin Only)
- **Method:** `PUT`
- **URL:** `{{baseUrl}}/api/gallery/:id`
- **Auth:** Bearer Token (Admin)
- **Headers:**
  - `Authorization: Bearer YOUR_ADMIN_TOKEN`

### 4. Delete Gallery Item (Admin Only)
- **Method:** `DELETE`
- **URL:** `{{baseUrl}}/api/gallery/:id`
- **Auth:** Bearer Token (Admin)
- **Headers:**
  - `Authorization: Bearer YOUR_ADMIN_TOKEN`

---

## 👥 Admin - User Management Endpoints

### 1. Get All Users (Admin Only)
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/admin/users`
- **Auth:** Bearer Token (Admin)
- **Headers:**
  - `Authorization: Bearer YOUR_ADMIN_TOKEN`

### 2. Get User by ID (Admin Only)
- **Method:** `GET`
- **URL:** `{{baseUrl}}/api/admin/users/:id`
- **Auth:** Bearer Token (Admin)
- **Headers:**
  - `Authorization: Bearer YOUR_ADMIN_TOKEN`

### 3. Update User (Admin Only)
- **Method:** `PUT`
- **URL:** `{{baseUrl}}/api/admin/users/:id`
- **Auth:** Bearer Token (Admin)
- **Headers:**
  - `Authorization: Bearer YOUR_ADMIN_TOKEN`
- **Body (JSON):**
```json
{
  "name": "Updated Name",
  "email": "newemail@example.com",
  "phone": "9876543210",
  "role": "user"
}
```

### 4. Delete User (Admin Only)
- **Method:** `DELETE`
- **URL:** `{{baseUrl}}/api/admin/users/:id`
- **Auth:** Bearer Token (Admin)
- **Headers:**
  - `Authorization: Bearer YOUR_ADMIN_TOKEN`

---

## 📝 Setting Up Postman

### 1. Create Environment Variables
1. Create a new environment in Postman
2. Add variable: `baseUrl` = `http://localhost:8000`
3. Add variable: `token` = (leave empty, will be set after login)
4. Add variable: `adminToken` = (leave empty, will be set after admin login)

### 2. Setting Token After Login
After successful login, copy the token from the response and:
1. Manually set it in your environment variables, OR
2. Add this script to the login request's "Tests" tab:
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("token", jsonData.data.token);
}
```

For admin login, use the same script but set `adminToken`:
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("adminToken", jsonData.data.token);
}
```

### 3. Using Authorization
For protected endpoints:
1. Go to **Authorization** tab
2. Select **Type:** Bearer Token
3. Use `{{token}}` for user endpoints
4. Use `{{adminToken}}` for admin endpoints

---

## 🎨 Service Structure Overview

Each service has:
- ✅ **image**: Service image (optional) - stored in `uploads/services/`
- ✅ **description**: Detailed service description (required)
- ✅ **price**: Service price (required)
- ✅ **bookings**: All bookings for that service can be retrieved via `/api/services/:id/bookings`

## 📊 Response Structure

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## 🚀 Quick Start Testing Flow

1. **Register a user** → Save the token
2. **Register/Login as admin** → Save the admin token
3. **Create a service** (Admin) → Note the service ID
4. **Get all services** → Verify service is created
5. **Create a booking** (User) → Book the service
6. **Get service bookings** (Admin) → See the booking for that service
7. **Update booking status** (Admin) → Change status to confirmed

### Quick Test: Create Service with File Upload
```
POST http://localhost:5050/api/services

Headers:
  Authorization: Bearer YOUR_ADMIN_TOKEN

Body (form-data):
  name: Wedding Photography
  description: Professional wedding photography service with 8 hours coverage
  price: 5000
  category: Photography
  duration: 480
  features: High-resolution images,Online gallery,Photo editing
  image: [Optional - Upload your image file here]
```

**Note:** Images are optional but if uploaded, they are stored in `uploads/services/` and accessed via `http://localhost:5050/uploads/services/filename.jpg`

## 📁 File Upload Notes

### Services Image Upload:
- **Required:** No - image file is optional
- **Storage Location:** `uploads/services/` (if uploaded)
- **Access URL:** `{{baseUrl}}/uploads/services/filename.jpg`
- **Max File Size:** 5MB
- **Allowed Formats:** jpeg, jpg, png, gif, webp
- **Upload Method:** Form-data with `image` field

### User Profile Upload:
- **Storage Location:** `uploads/users/`
- **Access URL:** `{{baseUrl}}/uploads/users/filename.jpg`

---

## 💡 Common Testing Scenarios

### Scenario 1: Create Service and Book It
1. Login as admin
2. Create new service with image
3. Login as user
4. Create booking for that service
5. Admin can view booking under service bookings

### Scenario 2: Search and Filter Services
1. Get all services
2. Search by keyword
3. Filter by category
4. Filter by price range

### Scenario 3: Booking Management
1. User creates booking
2. User gets their bookings
3. Admin views all bookings
4. Admin updates booking status
5. User checks updated status

### Scenario 4: Favorites Management
1. Login as user
2. Get all services (to obtain a service_id)
3. Add service to favorites with POST request
   - Body: `{"service_id": "YOUR_SERVICE_ID"}`
   - Headers: `Content-Type: application/json` + `Authorization: Bearer YOUR_TOKEN`
4. Get all favorites to verify
5. Delete favorite

---

**Last Updated:** March 1, 2026

