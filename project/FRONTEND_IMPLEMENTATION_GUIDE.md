# Frontend Implementation Guide

## TimeCapsule Profile Picture & Categories Integration

This guide provides step-by-step instructions for frontend developers to integrate with the TimeCapsule backend APIs for profile picture management and moment category selection.

---

## 🚀 Quick Start

**Base URL:** `https://timecapsule-backend-z21v.onrender.com`

**Authentication:** JWT tokens required for protected endpoints

---

## 📱 Profile Picture Implementation

### 1. Get Available Avatars

**Endpoint:** `GET /api/profile-pictures`

**Purpose:** Fetch all available avatar options from your Supabase storage bucket

```typescript
interface Avatar {
  id: string;           // "avatar-1", "avatar-2", etc.
  imageUrl: string;     // Public URL to the image
  label: string;        // Display name
}

// React Hook Example
const useAvatars = () => {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://timecapsule-backend-z21v.onrender.com/api/profile-pictures');
        const data = await response.json();
        
        if (data.success) {
          setAvatars(data.data);
        } else {
          setError(data.error || 'Failed to fetch avatars');
        }
      } catch (err) {
        setError('Network error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAvatars();
  }, []);

  return { avatars, loading, error };
};
```

**React Component Example:**
```tsx
const AvatarSelector = () => {
  const { avatars, loading, error } = useAvatars();
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  if (loading) return <div>Loading avatars...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="avatar-grid">
      {avatars.map((avatar) => (
        <div
          key={avatar.id}
          className={`avatar-option ${selectedAvatar === avatar.id ? 'selected' : ''}`}
          onClick={() => setSelectedAvatar(avatar.id)}
        >
          <img src={avatar.imageUrl} alt={avatar.label} />
          <span>{avatar.label}</span>
        </div>
      ))}
    </div>
  );
};
```

---

### 2. Upload Custom Profile Picture

**Endpoint:** `POST /api/profile-pictures/upload/profile-picture`

**Purpose:** Allow users to upload their own profile picture

```typescript
// File upload hook
const useProfilePictureUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const uploadImage = async (file: File, token: string) => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(
        'https://timecapsule-backend-z21v.onrender.com/api/profile-pictures/upload/profile-picture',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      
      if (data.success) {
        setUploadedImageUrl(data.data.image_url);
        return data.data.image_url;
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return { uploadImage, uploading, uploadedImageUrl };
};
```

**React Component Example:**
```tsx
const ProfilePictureUpload = () => {
  const { uploadImage, uploading } = useProfilePictureUpload();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { token } = useAuth(); // Your auth context

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        alert('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !token) return;
    
    try {
      const imageUrl = await uploadImage(selectedFile, token);
      // Handle successful upload (e.g., save to profile)
      console.log('Uploaded image URL:', imageUrl);
    } catch (error) {
      alert('Upload failed: ' + error.message);
    }
  };

  return (
    <div className="upload-section">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
      />
      {selectedFile && (
        <button 
          onClick={handleUpload}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Upload Picture'}
        </button>
      )}
    </div>
  );
};
```

---

### 3. Save Profile Picture Selection

**Endpoint:** `POST /api/profile-pictures/director/profile-picture`

**Purpose:** Save the user's profile picture choice (avatar or uploaded image)

```typescript
// Save profile picture hook
const useSaveProfilePicture = () => {
  const [saving, setSaving] = useState(false);

  const saveProfilePicture = async (
    type: 'avatar' | 'upload',
    data: string,
    token: string
  ) => {
    try {
      setSaving(true);
      
      const response = await fetch(
        'https://timecapsule-backend-z21v.onrender.com/api/profile-pictures/director/profile-picture',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ type, data }),
        }
      );

      const result = await response.json();
      
      if (result.success) {
        return result.data.profile_picture_url;
      } else {
        throw new Error(result.error || 'Failed to save profile picture');
      }
    } catch (error) {
      throw error;
    } finally {
      setSaving(false);
    }
  };

  return { saveProfilePicture, saving };
};
```

**Complete Profile Picture Component:**
```tsx
const ProfilePictureSetup = () => {
  const { avatars, loading: avatarsLoading } = useAvatars();
  const { uploadImage, uploading } = useProfilePictureUpload();
  const { saveProfilePicture, saving } = useSaveProfilePicture();
  const { token } = useAuth();
  
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);

  const handleAvatarSelect = (avatarId: string) => {
    setSelectedAvatar(avatarId);
    setUploadedImageUrl(null);
  };

  const handleImageUpload = async (file: File) => {
    try {
      const imageUrl = await uploadImage(file, token);
      setUploadedImageUrl(imageUrl);
      setSelectedAvatar(null);
    } catch (error) {
      alert('Upload failed: ' + error.message);
    }
  };

  const handleSaveProfilePicture = async () => {
    if (!token) return;
    
    try {
      let type: 'avatar' | 'upload';
      let data: string;
      
      if (selectedAvatar) {
        type = 'avatar';
        data = selectedAvatar;
      } else if (uploadedImageUrl) {
        type = 'upload';
        data = uploadedImageUrl;
      } else {
        alert('Please select an avatar or upload an image');
        return;
      }

      const profilePictureUrl = await saveProfilePicture(type, data, token);
      setFinalImageUrl(profilePictureUrl);
      
      // Navigate to next step or show success message
      alert('Profile picture saved successfully!');
    } catch (error) {
      alert('Failed to save profile picture: ' + error.message);
    }
  };

  if (avatarsLoading) return <div>Loading...</div>;

  return (
    <div className="profile-picture-setup">
      <h2>Choose Your Profile Picture</h2>
      
      {/* Avatar Selection */}
      <div className="avatar-section">
        <h3>Select from Avatars</h3>
        <div className="avatar-grid">
          {avatars.map((avatar) => (
            <div
              key={avatar.id}
              className={`avatar-option ${selectedAvatar === avatar.id ? 'selected' : ''}`}
              onClick={() => handleAvatarSelect(avatar.id)}
            >
              <img src={avatar.imageUrl} alt={avatar.label} />
              <span>{avatar.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Upload */}
      <div className="upload-section">
        <h3>Or Upload Your Own</h3>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
          }}
          disabled={uploading}
        />
        {uploading && <div>Uploading...</div>}
      </div>

      {/* Preview */}
      {(selectedAvatar || uploadedImageUrl) && (
        <div className="preview-section">
          <h3>Preview</h3>
          <img 
            src={uploadedImageUrl || avatars.find(a => a.id === selectedAvatar)?.imageUrl} 
            alt="Profile preview" 
            className="preview-image"
          />
          <button 
            onClick={handleSaveProfilePicture}
            disabled={saving}
            className="save-button"
          >
            {saving ? 'Saving...' : 'Save Profile Picture'}
          </button>
        </div>
      )}

      {finalImageUrl && (
        <div className="success-message">
          ✅ Profile picture saved successfully!
        </div>
      )}
    </div>
  );
};
```

---

## 🎯 Categories (Moment Selection) Implementation

### 1. Get Available Categories

**Endpoint:** `GET /api/categories`

**Purpose:** Fetch all available moment categories

```typescript
interface Category {
  id: string;        // "milestones", "emotional-support", etc.
  name: string;      // "Milestones", "Emotional Support"
  emoji: string;     // "🎓", "😊"
}

// Categories hook
const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://timecapsule-backend-z21v.onrender.com/api/categories');
        const data = await response.json();
        
        if (data.success) {
          setCategories(data.data);
        } else {
          setError(data.error || 'Failed to fetch categories');
        }
      } catch (err) {
        setError('Network error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};
```

---

### 2. Save Category Selections

**Endpoint:** `POST /api/categories/director`

**Purpose:** Save user's selected moment categories

```typescript
// Save categories hook
const useSaveCategories = () => {
  const [saving, setSaving] = useState(false);

  const saveCategories = async (categoryIds: string[], token: string) => {
    try {
      setSaving(true);
      
      const response = await fetch(
        'https://timecapsule-backend-z21v.onrender.com/api/categories/director',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ category_ids: categoryIds }),
        }
      );

      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to save categories');
      }
    } catch (error) {
      throw error;
    } finally {
      setSaving(false);
    }
  };

  return { saveCategories, saving };
};
```

**Complete Categories Component:**
```tsx
const CategoriesSelection = () => {
  const { categories, loading: categoriesLoading } = useCategories();
  const { saveCategories, saving } = useSaveCategories();
  const { token } = useAuth();
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSaveCategories = async () => {
    if (selectedCategories.length === 0) {
      alert('Please select at least one category');
      return;
    }

    try {
      const result = await saveCategories(selectedCategories, token);
      setSaved(true);
      
      // Show success message
      alert(`Successfully saved ${result.saved_count} new category selection(s)!`);
      
      // Navigate to next step
      // router.push('/next-step');
    } catch (error) {
      alert('Failed to save categories: ' + error.message);
    }
  };

  if (categoriesLoading) return <div>Loading categories...</div>;

  return (
    <div className="categories-selection">
      <h2>Select Your Moment Categories</h2>
      <p>Choose the types of moments that are most important to you</p>
      
      <div className="categories-grid">
        {categories.map((category) => (
          <div
            key={category.id}
            className={`category-option ${selectedCategories.includes(category.id) ? 'selected' : ''}`}
            onClick={() => handleCategoryToggle(category.id)}
          >
            <span className="category-emoji">{category.emoji}</span>
            <span className="category-name">{category.name}</span>
            {selectedCategories.includes(category.id) && (
              <span className="checkmark">✓</span>
            )}
          </div>
        ))}
      </div>

      <div className="selection-summary">
        <p>Selected: {selectedCategories.length} categories</p>
        {selectedCategories.length > 0 && (
          <button 
            onClick={handleSaveCategories}
            disabled={saving}
            className="save-categories-button"
          >
            {saving ? 'Saving...' : 'Save & Continue'}
          </button>
        )}
      </div>

      {saved && (
        <div className="success-message">
          ✅ Categories saved successfully!
        </div>
      )}
    </div>
  );
};
```

---

## 🎨 CSS Styling Examples

### Profile Picture Styling
```css
.profile-picture-setup {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.avatar-option {
  text-align: center;
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.avatar-option:hover {
  border-color: #007bff;
  transform: translateY(-2px);
}

.avatar-option.selected {
  border-color: #007bff;
  background-color: #f8f9ff;
}

.avatar-option img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 10px;
}

.upload-section {
  margin: 30px 0;
  padding: 20px;
  border: 2px dashed #ccc;
  border-radius: 12px;
  text-align: center;
}

.preview-image {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  margin: 20px 0;
}

.save-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}

.save-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
```

### Categories Styling
```css
.categories-selection {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin: 30px 0;
}

.category-option {
  display: flex;
  align-items: center;
  padding: 20px;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.category-option:hover {
  border-color: #007bff;
  transform: translateY(-2px);
}

.category-option.selected {
  border-color: #007bff;
  background-color: #f8f9ff;
}

.category-emoji {
  font-size: 24px;
  margin-right: 15px;
}

.category-name {
  font-size: 16px;
  font-weight: 500;
}

.checkmark {
  position: absolute;
  top: 10px;
  right: 15px;
  color: #007bff;
  font-size: 20px;
  font-weight: bold;
}

.selection-summary {
  text-align: center;
  margin: 30px 0;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 12px;
}

.save-categories-button {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 8px;
  font-size: 18px;
  cursor: pointer;
  margin-top: 15px;
}

.save-categories-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.success-message {
  text-align: center;
  color: #28a745;
  font-size: 18px;
  font-weight: 500;
  margin: 20px 0;
  padding: 15px;
  background-color: #d4edda;
  border-radius: 8px;
}
```

---

## 🔧 Troubleshooting

### Common Issues & Solutions

#### 1. Empty Avatars Array
**Problem:** `GET /api/profile-pictures` returns empty data
**Solution:** 
- Ensure your Supabase bucket `profile-pictures` has images uploaded
- Check bucket permissions (should be public)
- Verify bucket name matches exactly

#### 2. Authentication Errors
**Problem:** 401 Unauthorized errors
**Solution:**
- Ensure JWT token is valid and not expired
- Check Authorization header format: `Bearer <token>`
- Verify token is being sent with protected endpoints

#### 3. File Upload Issues
**Problem:** Upload fails or returns errors
**Solution:**
- Check file size (max 5MB)
- Verify file type (JPG, PNG, GIF, WebP)
- Ensure user is authenticated
- Check Supabase storage bucket permissions

#### 4. CORS Issues
**Problem:** Frontend can't access backend
**Solution:**
- Backend is already configured with CORS
- Ensure you're using the correct base URL
- Check if your domain is allowed in CORS settings

---

## 📱 Mobile Considerations

### Responsive Design
- Use CSS Grid with `auto-fill` for flexible layouts
- Implement touch-friendly tap targets (min 44px)
- Add swipe gestures for mobile navigation
- Use viewport units for consistent sizing

### Performance
- Implement image lazy loading
- Use appropriate image formats (WebP for modern browsers)
- Compress images before upload
- Cache API responses when possible

---

## 🚀 Next Steps

1. **Test the APIs** using the provided examples
2. **Upload some images** to your `profile-pictures` bucket
3. **Implement the components** in your React app
4. **Add error handling** and loading states
5. **Style the components** using the CSS examples
6. **Test on mobile devices** for responsiveness

---

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify your Supabase configuration
3. Test the APIs directly in Postman
4. Check the backend logs for server-side errors

The backend is live at: `https://timecapsule-backend-z21v.onrender.com`
