
# Child Profile Setup API Documentation

## Overview

The Child Profile Setup API provides a comprehensive system for creating and managing child profiles with proper authentication, validation, and relationship management. This system implements the actor-director model where directors (parents/guardians) manage actors (children).

## Base URL

```
https://your-api-domain.com/api/child-profiles
```

## Authentication

All endpoints require authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Data Models

### Actor (Child Profile)
```typescript
interface Actor {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  notes?: string;
  username: string;
  profile_picture_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### Director (Parent/Guardian)
```typescript
interface Director {
  id: string;
  auth_user_id: string;
  director_type: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}
```

### Director-Actor Relationship
```typescript
interface DirectorActorRelationship {
  id: string;
  director_id: string;
  actor_id: string;
  relationship: string;
  relationship_start_date: string;
  relationship_end_date?: string;
  is_primary_guardian: boolean;
  can_manage_profile: boolean;
  can_view_messages: boolean;
  created_at: string;
  updated_at: string;
}
```

## API Endpoints

### 1. Create Child Profiles

Creates one or more child profiles with full setup flow.

**Endpoint:** `POST /api/child-profiles`

**Request Body:**
```json
{
  "children": [
    {
      "first_name": "John",
      "last_name": "Doe",
      "date_of_birth": "2015-06-15",
      "gender": "male",
      "notes": "Loves playing soccer"
    },
    {
      "first_name": "Jane",
      "last_name": "Doe",
      "date_of_birth": "2018-03-22",
      "gender": "female",
      "notes": "Enjoys reading books"
    }
  ]
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "data": {
    "actors": [
      {
        "id": "uuid-1",
        "first_name": "John",
        "last_name": "Doe",
        "date_of_birth": "2015-06-15",
        "gender": "male",
        "notes": "Loves playing soccer",
        "username": "john123456",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
      }
    ],
    "relationships": [
      {
        "id": "rel-uuid-1",
        "director_id": "dir-uuid-1",
        "actor_id": "uuid-1",
        "relationship": "Child",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "message": "Child profiles created successfully",
    "nextStep": "family_setup"
  },
  "message": "Child profiles created successfully"
}
```

**Response (Validation Error - 400):**
```json
{
  "success": false,
  "error": "Validation failed: Child 1 (John): Name must be at least 2 characters long"
}
```

**Response (Authentication Error - 401):**
```json
{
  "success": false,
  "error": "User not authenticated"
}
```

**Response (Permission Error - 403):**
```json
{
  "success": false,
  "error": "You do not have permission to create child profiles"
}
```

### 2. Get All Child Profiles

Retrieves all child profiles for the authenticated user.

**Endpoint:** `GET /api/child-profiles`

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "actors": [
      {
        "id": "uuid-1",
        "first_name": "John",
        "last_name": "Doe",
        "date_of_birth": "2015-06-15",
        "gender": "male",
        "username": "john123456",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
      }
    ],
    "relationships": [
      {
        "id": "rel-uuid-1",
        "director_id": "dir-uuid-1",
        "actor_id": "uuid-1",
        "relationship": "Child",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ]
  },
  "message": "Child profiles retrieved successfully"
}
```

### 3. Get Specific Child Profile

Retrieves a specific child profile by ID.

**Endpoint:** `GET /api/child-profiles/:id`

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "uuid-1",
      "first_name": "John",
      "last_name": "Doe",
      "date_of_birth": "2015-06-15",
      "gender": "male",
      "username": "john123456",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    },
    "relationship": {
      "id": "rel-uuid-1",
      "director_id": "dir-uuid-1",
      "actor_id": "uuid-1",
      "relationship": "Child",
      "created_at": "2024-01-15T10:30:00Z"
    }
  },
  "message": "Child profile retrieved successfully"
}
```

**Response (Not Found - 404):**
```json
{
  "success": false,
  "error": "Child profile not found"
}
```

### 4. Update Child Profile

Updates a specific child profile.

**Endpoint:** `PUT /api/child-profiles/:id`

**Request Body:**
```json
{
  "first_name": "Johnny",
  "notes": "Updated notes about John"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-1",
    "first_name": "Johnny",
    "last_name": "Doe",
    "date_of_birth": "2015-06-15",
    "gender": "male",
    "notes": "Updated notes about John",
    "username": "john123456",
    "updated_at": "2024-01-15T11:00:00Z"
  },
  "message": "Child profile updated successfully"
}
```

### 5. Delete Child Profile

Deletes a specific child profile and its relationships.

**Endpoint:** `DELETE /api/child-profiles/:id`

**Response (Success - 200):**
```json
{
  "success": true,
  "data": null,
  "message": "Child profile deleted successfully"
}
```

### 6. Bulk Update Child Profiles

Updates multiple child profiles in a single request.

**Endpoint:** `PUT /api/child-profiles/bulk-update`

**Request Body:**
```json
{
  "updates": [
    {
      "id": "uuid-1",
      "first_name": "Johnny",
      "notes": "Updated notes"
    },
    {
      "id": "uuid-2",
      "gender": "female"
    }
  ]
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "data": {
    "successful": [
      {
        "id": "uuid-1",
        "first_name": "Johnny",
        "notes": "Updated notes"
      }
    ],
    "failed": [
      "Profile uuid-2: You do not have permission to update this child profile"
    ],
    "message": "Some updates failed"
  },
  "message": "Some updates failed"
}
```

## Validation Rules

### Child Name Validation
- **Required:** Yes
- **Minimum length:** 2 characters
- **Maximum length:** 50 characters
- **Allowed characters:** Letters, numbers, spaces, hyphens, apostrophes
- **Whitespace:** Automatically trimmed

### Birthday Validation
- **Required:** Yes
- **Format:** Accepts MM/DD/YYYY, DD/MM/YYYY, or YYYY-MM-DD
- **Auto-conversion:** Converts to ISO format (YYYY-MM-DD)
- **Constraints:**
  - Must be a valid date
  - Cannot be in the future
  - Must be at least 1 year ago
  - Cannot be more than 120 years ago

### Gender Validation
- **Required:** No
- **Allowed values:** `male`, `female`, `other`, `prefer-not-to-say`
- **Case-insensitive**

### Notes Validation
- **Required:** No
- **Maximum length:** 500 characters

## Username Generation

Usernames are automatically generated using the following algorithm:
1. Take the child's first name
2. Convert to lowercase
3. Remove special characters (keep only letters and numbers)
4. Append a 6-digit timestamp suffix
5. Ensure uniqueness in the system

**Example:** `John` → `john123456`

If a username conflict occurs, the system automatically generates a fallback username with additional random characters.

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": "Error message description"
}
```

### HTTP Status Codes
- **200:** Success
- **201:** Created
- **400:** Bad Request (Validation errors)
- **401:** Unauthorized (Authentication required)
- **403:** Forbidden (Permission denied)
- **404:** Not Found
- **409:** Conflict (Username already exists)
- **500:** Internal Server Error

### Common Error Messages
- `"Name is required and must be a string"`
- `"Name must be at least 2 characters long"`
- `"Date of birth must be a valid date"`
- `"Birthday cannot be in the future"`
- `"Username conflict detected. Please try again."`
- `"You do not have permission to access this resource"`

## Security Features

### Row-Level Security (RLS)
- Users can only access their own director profile
- Directors can only access actors they have relationships with
- All database queries are automatically filtered by user permissions

### Input Sanitization
- All user inputs are sanitized to prevent injection attacks
- Special characters are removed or escaped
- Data types are strictly validated

### Authentication & Authorization
- JWT token-based authentication
- Role-based access control
- Session validation on every request

## Performance Considerations

### Batch Operations
- Support for creating up to 10 child profiles in a single request
- Bulk update operations for multiple profiles
- Optimized database queries with proper indexing

### Caching
- User session data caching
- Director profile information caching
- Rate limiting for profile creation

## Monitoring & Logging

### Audit Trail
- All profile creation attempts are logged
- Success/failure rates are tracked
- Performance metrics are monitored

### Error Tracking
- Detailed error information is logged
- Validation failures are tracked
- Database performance is monitored

## Rate Limiting

- **Profile Creation:** 10 requests per minute per user
- **Profile Updates:** 30 requests per minute per user
- **Profile Retrieval:** 100 requests per minute per user

## Next Steps After Profile Creation

After successfully creating child profiles, the system returns a `nextStep` field indicating the next phase:

1. **`family_setup`** - Set up family groups and relationships
2. **`message_scheduling`** - Schedule messages for the children
3. **`profile_completion`** - Complete additional profile information

## Example Usage

### Complete Flow Example

```javascript
// 1. Create child profiles
const createResponse = await fetch('/api/child-profiles', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    children: [
      {
        first_name: "Emma",
        date_of_birth: "2016-09-10",
        gender: "female",
        notes: "Loves drawing and painting"
      }
    ]
  })
});

const result = await createResponse.json();

if (result.success) {
  console.log('Profiles created:', result.data.actors);
  console.log('Next step:', result.data.nextStep);
  
  // 2. Proceed to family setup
  if (result.data.nextStep === 'family_setup') {
    // Navigate to family setup page
    navigateToFamilySetup(result.data.actors);
  }
}
```

## Support

For technical support or questions about the API, please contact:
- **Email:** api-support@timecapsule.com
- **Documentation:** https://docs.timecapsule.com/api
- **Status Page:** https://status.timecapsule.com
