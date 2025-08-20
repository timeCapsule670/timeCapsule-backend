# TimeCapsule API Documentation

## Overview
This document provides comprehensive API documentation for the TimeCapsule backend, specifically covering the Profile Picture and Moment Selection (Categories) functionality.

---

## Table of Contents
1. [Authentication](#authentication)
2. [Profile Picture API](#profile-picture-api)
3. [Moment Selection (Categories) API](#moment-selection-categories-api)
4. [Error Handling](#error-handling)
5. [Testing Examples](#testing-examples)

---

## Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

To obtain a token, use the authentication endpoints:
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token

---

## Profile Picture API

The Profile Picture API allows users to select from predefined avatars or upload custom profile pictures.

### Base URL
```
/api/avatars
```

### Endpoints

#### 1. Get All Available Avatars

**Endpoint:** `GET /api/avatars`

**Description:** Retrieves all available avatar options from the Supabase storage bucket.

**Authentication:** Not required (public endpoint)

**Response:**
```typescript
interface Avatar {
  id: string;           // Unique identifier (e.g., "avatar-1", "avatar-2")
  imageUrl: string;     // Public URL to the avatar image
  label: string;        // Display name (filename without extension)
}

interface GetAvatarsResponse {
  success: boolean;
  data: Avatar[];
  message: string;
}
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "avatar-1",
      "imageUrl": "https://your-project.supabase.co/storage/v1/object/public/avatars/avatar1.png",
      "label": "avatar1"
    },
    {
      "id": "avatar-2", 
      "imageUrl": "https://your-project.supabase.co/storage/v1/object/public/avatars/avatar2.png",
      "label": "avatar2"
    }
  ],
  "message": "Avatars retrieved successfully"
}
```

**Notes:**
- Images are dynamically fetched from your Supabase `avatars` storage bucket
- Each image gets a sequential ID (avatar-1, avatar-2, etc.)
- Labels are derived from the filename (without extension)

---

#### 2. Upload Profile Picture

**Endpoint:** `POST /api/avatars/upload/profile-picture`

**Description:** Uploads a custom profile picture file to Supabase storage.

**Authentication:** Required

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data
```

**Body:** Form data with image file
```
image: [file] - Image file (JPG, PNG, GIF, WebP)
```

**File Requirements:**
- **Types:** JPG, JPEG, PNG, GIF, WebP
- **Size:** Maximum 5MB
- **Storage:** Files are stored in `uploads/` folder within the `avatars` bucket

**Response:**
```typescript
interface UploadProfilePictureResponse {
  success: boolean;
  data: {
    image_url: string;    // Public URL to the uploaded image
    file_path: string;    // Internal file path in storage
  };
  message: string;
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "image_url": "https://your-project.supabase.co/storage/v1/object/public/avatars/uploads/1703123456789-abc123.jpg",
    "file_path": "uploads/1703123456789-abc123.jpg"
  },
  "message": "Profile picture uploaded successfully"
}
```

**Error Responses:**
- `400` - File too large (>5MB) or invalid file type
- `401` - Authentication required
- `500` - Upload failed

---

#### 3. Save Profile Picture

**Endpoint:** `POST /api/avatars/director/profile-picture`

**Description:** Saves the director's profile picture choice (either selected avatar or uploaded image).

**Authentication:** Required

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```typescript
interface SaveProfilePictureRequest {
  type: 'upload' | 'avatar';  // Type of profile picture
  data: string;                // For 'avatar': avatar ID, for 'upload': image URL
}
```

**Example Requests:**

**Selecting an Avatar:**
```json
{
  "type": "avatar",
  "data": "avatar-1"
}
```

**Using Uploaded Image:**
```json
{
  "type": "upload", 
  "data": "https://your-project.supabase.co/storage/v1/object/public/avatars/uploads/1703123456789-abc123.jpg"
}
```

**Response:**
```typescript
interface SaveProfilePictureResponse {
  success: boolean;
  message: string;
  data: {
    profile_picture_url: string;  // The saved profile picture URL
  };
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "profile_picture_url": "https://your-project.supabase.co/storage/v1/object/public/avatars/avatar1.png"
  },
  "message": "Profile picture saved successfully"
}
```

**Database Update:**
This endpoint updates the `directors` table with:
- `profile_picture_url`: The selected/uploaded image URL
- `updated_at`: Timestamp of the update

**Error Responses:**
- `400` - Invalid request data or avatar ID
- `401` - Authentication required
- `500` - Database update failed

---

## Moment Selection (Categories) API

The Categories API allows directors to select the types of moments that are most important to them for personalizing their TimeCapsule experience.

### Base URL
```
/api/categories
```

### Endpoints

#### 1. Get All Categories

**Endpoint:** `GET /api/categories`

**Description:** Retrieves all available moment categories for selection.

**Authentication:** Not required (public endpoint)

**Response:**
```typescript
interface Category {
  id: string;        // Unique identifier
  name: string;      // Display name
  emoji: string;     // Associated emoji
}

interface GetCategoriesResponse {
  success: boolean;
  data: Category[];
  message: string;
}
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "milestones",
      "name": "Milestones",
      "emoji": "🎓"
    },
    {
      "id": "emotional-support",
      "name": "Emotional Support", 
      "emoji": "😊"
    },
    {
      "id": "celebrations",
      "name": "Celebrations and Encouragement",
      "emoji": "🎉"
    },
    {
      "id": "life-advice",
      "name": "Life Advice",
      "emoji": "💬"
    },
    {
      "id": "just-because",
      "name": "Just Because",
      "emoji": "❤️"
    }
  ],
  "message": "Categories retrieved successfully"
}
```

---

#### 2. Save Director Categories

**Endpoint:** `POST /api/categories/director`

**Description:** Saves the director's selected moment categories.

**Authentication:** Required

**Headers:**
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

**Request Body:**
```typescript
interface SaveCategoriesRequest {
  category_ids: string[];  // Array of category IDs to select
}
```

**Example Request:**
```json
{
  "category_ids": ["milestones", "emotional-support", "celebrations"]
}
```

**Response:**
```typescript
interface SaveCategoriesResponse {
  success: boolean;
  message: string;
  data: {
    saved_count: number;     // Number of new categories saved
    existing_count: number;  // Number of categories already existed
  };
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "saved_count": 2,
    "existing_count": 1
  },
  "message": "Successfully saved 2 new category selection(s)"
}
```

**Database Update:**
This endpoint creates relationships in the `director_categories` junction table:
- `director_id`: The authenticated user's ID
- `category_id`: Each selected category ID
- `created_at`: Timestamp of creation

**Business Logic:**
- Users must select at least one category
- Duplicate selections are automatically removed
- Only new relationships are inserted (existing ones are counted but not re-inserted)
- Returns success even if all categories already exist

**Error Responses:**
- `400` - No categories selected or invalid category IDs
- `401` - Authentication required
- `500` - Database operation failed

---

## Error Handling

### Standard Error Response Format
```typescript
interface ErrorResponse {
  success: false;
  error: string;        // Error message
  statusCode?: number;  // HTTP status code
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### Validation Errors
When using express-validator, validation errors return:
```json
{
  "success": false,
  "error": "Validation error message"
}
```

---

## Testing Examples

### Using Postman

#### 1. Test Get Avatars (Public)
```
GET {{baseUrl}}/api/avatars
```

#### 2. Test Get Categories (Public)
```
GET {{baseUrl}}/api/categories
```

#### 3. Test Upload Profile Picture (Protected)
```
POST {{baseUrl}}/api/avatars/upload/profile-picture
Headers:
  Authorization: Bearer {{authToken}}
Body: form-data
  image: [select file]
```

#### 4. Test Save Profile Picture (Protected)
```
POST {{baseUrl}}/api/avatars/director/profile-picture
Headers:
  Authorization: Bearer {{authToken}}
  Content-Type: application/json
Body:
{
  "type": "avatar",
  "data": "avatar-1"
}
```

#### 5. Test Save Categories (Protected)
```
POST {{baseUrl}}/api/categories/director
Headers:
  Authorization: Bearer {{authToken}}
  Content-Type: application/json
Body:
{
  "category_ids": ["milestones", "emotional-support"]
}
```

### Using cURL

#### Get Avatars
```bash
curl -X GET "http://localhost:3000/api/avatars"
```

#### Upload Profile Picture
```bash
curl -X POST "http://localhost:3000/api/avatars/upload/profile-picture" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@/path/to/your/image.jpg"
```

#### Save Profile Picture
```bash
curl -X POST "http://localhost:3000/api/avatars/director/profile-picture" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "avatar", "data": "avatar-1"}'
```

#### Save Categories
```bash
curl -X POST "http://localhost:3000/api/categories/director" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category_ids": ["milestones", "emotional-support"]}'
```

---

## Database Schema

### Required Tables

#### 1. directors
```sql
CREATE TABLE directors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_picture_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- ... other fields
);
```

#### 2. director_categories
```sql
CREATE TABLE director_categories (
  director_id UUID REFERENCES directors(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (director_id, category_id)
);
```

### Storage Bucket
- **Name:** `avatars`
- **Public:** Yes (for profile picture access)
- **Folders:**
  - Root: Predefined avatar images
  - `uploads/`: User-uploaded profile pictures

---

## Setup Requirements

### Environment Variables
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Dependencies
```json
{
  "multer": "^1.4.5-lts.1",
  "@types/multer": "^1.4.7"
}
```

### Supabase Configuration
1. Create storage bucket named `avatars`
2. Set bucket to public
3. Upload predefined avatar images
4. Ensure proper RLS policies

---

## Notes

- **File Uploads:** All uploads use memory storage for processing before uploading to Supabase
- **Avatar IDs:** Generated dynamically based on file order in storage bucket
- **Error Handling:** Comprehensive error messages for debugging
- **Validation:** Input validation using express-validator
- **Security:** JWT authentication for protected endpoints
- **Performance:** Efficient database queries with proper indexing

For additional support or questions, refer to the main README.md file or contact the development team.
