# Categories API Documentation

## Overview
This document provides the complete API specification for the Categories functionality in the TimeCapsule backend. The API allows frontend applications to fetch available categories and save director category preferences.

## Base URL
```
http://localhost:3000/api
```

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 1. Get All Categories

### Endpoint
```
GET /categories
```

### Description
Retrieves all available categories from the system. Each category includes an ID, name, and associated emoji.

### Request
- **Method**: GET
- **Headers**: 
  - `Authorization: Bearer <jwt-token>`
  - `Content-Type: application/json`

### Response

#### Success Response (200)
```json
{
  "success": true,
  "data": [
    {
      "id": "19d8702d-4a37-4bf7-902e-571bd5416b1d",
      "name": "Life Advice",
      "emoji": "💬"
    },
    {
      "id": "4269de96-1610-42aa-847d-811112896224",
      "name": "Celebrations and Encouragement",
      "emoji": "🎉"
    },
    {
      "id": "45dfda76-24a9-47f2-8856-5684814f939b",
      "name": "Milestones",
      "emoji": "🎓"
    },
    {
      "id": "50655bf2-811a-469d-9482-2f7cd4e7f831",
      "name": "Emotional Support",
      "emoji": "😊"
    },
    {
      "id": "7d73d3b0-2736-4484-b99f-a4b807be8210",
      "name": "Just Because",
      "emoji": "❤️"
    }
  ]
}
```

#### Error Response (401)
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

#### Error Response (500)
```json
{
  "success": false,
  "error": "Failed to fetch categories: <error-message>"
}
```

---

## 2. Save Director Categories

### Endpoint
```
POST /categories/director
```

### Description
Saves the selected categories for a specific director. This creates relationships between the director and their chosen categories in the `director_categories` table.

### Request
- **Method**: POST
- **Headers**: 
  - `Authorization: Bearer <jwt-token>`
  - `Content-Type: application/json`
- **Body**:
```json
{
  "category_ids": [
    "19d8702d-4a37-4bf7-902e-571bd5416b1d",
    "45dfda76-24a9-47f2-8856-5684814f939b"
  ]
}
```

### Request Body Schema
```typescript
interface SaveCategoriesRequest {
  category_ids: string[]; // Array of category UUIDs
}
```

### Response

#### Success Response (200)
```json
{
  "success": true,
  "message": "Categories saved successfully",
  "data": {
    "saved_count": 2,
    "existing_count": 0
  }
}
```

#### Error Response (400)
```json
{
  "success": false,
  "error": "At least one category must be selected"
}
```

#### Error Response (400)
```json
{
  "success": false,
  "error": "Invalid category IDs: invalid-uuid-here"
}
```

#### Error Response (400)
```json
{
  "success": false,
  "error": "Director profile not found"
}
```

#### Error Response (401)
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

#### Error Response (500)
```json
{
  "success": false,
  "error": "Failed to save director categories: <error-message>"
}
```

---

## Frontend Implementation Guide

### 1. Fetching Categories

```typescript
// Example using fetch API
const fetchCategories = async (token: string) => {
  try {
    const response = await fetch('/api/categories', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (result.success) {
      return result.data; // Array of Category objects
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    throw error;
  }
};

// Example using axios
const fetchCategories = async (token: string) => {
  try {
    const response = await axios.get('/api/categories', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    throw error;
  }
};
```

### 2. Saving Director Categories

```typescript
// Example using fetch API
const saveDirectorCategories = async (token: string, categoryIds: string[]) => {
  try {
    const response = await fetch('/api/categories/director', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        category_ids: categoryIds
      })
    });

    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Failed to save categories:', error);
    throw error;
  }
};

// Example using axios
const saveDirectorCategories = async (token: string, categoryIds: string[]) => {
  try {
    const response = await axios.post('/api/categories/director', 
      {
        category_ids: categoryIds
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return response.data.data;
  } catch (error) {
    console.error('Failed to save categories:', error);
    throw error;
  }
};
```

### 3. TypeScript Interfaces

```typescript
interface Category {
  id: string;
  name: string;
  emoji: string;
}

interface SaveCategoriesRequest {
  category_ids: string[];
}

interface SaveCategoriesResponse {
  success: boolean;
  message: string;
  data: {
    saved_count: number;
    existing_count: number;
  };
}

interface GetCategoriesResponse {
  success: boolean;
  data: Category[];
}
```

### 4. React Component Example

```tsx
import React, { useState, useEffect } from 'react';

interface Category {
  id: string;
  name: string;
  emoji: string;
}

const CategorySelector: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken'); // Get from your auth system
      const categoriesData = await fetchCategories(token);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const result = await saveDirectorCategories(token, selectedCategories);
      
      console.log(`Saved ${result.saved_count} new categories, ${result.existing_count} already existed`);
      // Show success message to user
    } catch (error) {
      console.error('Failed to save categories:', error);
      // Show error message to user
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Select Categories</h2>
      <div className="categories-grid">
        {categories.map(category => (
          <div
            key={category.id}
            className={`category-item ${selectedCategories.includes(category.id) ? 'selected' : ''}`}
            onClick={() => handleCategoryToggle(category.id)}
          >
            <span className="emoji">{category.emoji}</span>
            <span className="name">{category.name}</span>
          </div>
        ))}
      </div>
      
      <button 
        onClick={handleSave}
        disabled={selectedCategories.length === 0 || loading}
      >
        Save Categories
      </button>
    </div>
  );
};

export default CategorySelector;
```

---

## Error Handling

### Common Error Scenarios

1. **Authentication Errors (401)**
   - Token expired or invalid
   - User not logged in
   - Solution: Redirect to login page or refresh token

2. **Validation Errors (400)**
   - Empty category selection
   - Invalid category IDs
   - Solution: Show user-friendly error messages

3. **Server Errors (500)**
   - Database connection issues
   - Internal server errors
   - Solution: Show generic error message and retry option

### Error Message Display

```typescript
const displayError = (error: string) => {
  // Map technical errors to user-friendly messages
  const errorMessages: { [key: string]: string } = {
    'At least one category must be selected': 'Please select at least one category',
    'Unauthorized': 'Please log in to continue',
    'Failed to fetch categories': 'Unable to load categories. Please try again.',
    'Failed to save director categories': 'Unable to save your selection. Please try again.',
    'Director profile not found': 'Please complete your profile setup before selecting categories'
  };

  return errorMessages[error] || 'An unexpected error occurred. Please try again.';
};
```

---

## Testing

### Test Data
Use these category IDs for testing:
- Life Advice: `19d8702d-4a37-4bf7-902e-571bd5416b1d`
- Celebrations: `4269de96-1610-42aa-847d-811112896224`
- Milestones: `45dfda76-24a9-47f2-8856-5684814f939b`
- Emotional Support: `50655bf2-811a-469d-9482-2f7cd4e7f831`
- Just Because: `7d73d3b0-2736-4484-b99f-a4b807be8210`

### Postman Collection
A Postman collection is available at `project/postman_collection.json` for testing the API endpoints.

---

## Notes

- All category IDs are UUIDs (version 4)
- Categories are returned in the order they exist in the database
- The `emoji` field is automatically assigned based on category names
- Duplicate category selections are automatically filtered out
- The API maintains existing category relationships and only creates new ones
- **Important**: Users must have a director profile in the `directors` table before they can save categories. The system automatically looks up the director ID using the authenticated user's ID.