# Child Profile Setup Implementation Guide

## Overview

This guide provides a comprehensive walkthrough of implementing the enhanced child profile setup system for the TimeCapsule backend. The system implements a robust actor-director model with proper validation, security, and error handling.

## Architecture Overview

The system follows a layered architecture pattern:

```
┌─────────────────┐
│   Controllers   │ ← HTTP request handling & validation
├─────────────────┤
│    Services     │ ← Business logic & data processing
├─────────────────┤
│   Utilities     │ ← Validation, logging, username generation
├─────────────────┤
│   Database      │ ← Supabase with RLS policies
└─────────────────┘
```

## Key Components

### 1. Types & Interfaces (`src/types/children.ts`)

Defines the data structures for the system:

- **Actor**: Represents a child profile
- **Director**: Represents a parent/guardian
- **DirectorActorRelationship**: Manages relationships between directors and actors
- **Request/Response interfaces**: For API communication

### 2. Validation Utilities (`src/utils/validation.ts`)

Comprehensive validation system:

- **Child name validation**: Length, character restrictions, sanitization
- **Birthday validation**: Date format conversion, range checking
- **Input sanitization**: Security against injection attacks
- **Data type validation**: Ensures proper data formats

### 3. Username Generation (`src/utils/usernameGenerator.ts`)

Automatic username creation:

- **Base generation**: `firstname + timestamp`
- **Uniqueness checking**: Database validation
- **Fallback generation**: Conflict resolution
- **Format consistency**: Lowercase, alphanumeric only

### 4. Child Profile Service (`src/services/childProfileService.ts`)

Core business logic:

- **Profile creation**: Multi-step process with transaction support
- **Data processing**: Validation, sanitization, transformation
- **Relationship management**: Director-actor connections
- **Error handling**: Comprehensive error management with rollback

### 5. Controller (`src/controllers/childProfileController.ts`)

HTTP request handling:

- **Input validation**: Express-validator integration
- **Authentication**: User verification
- **Response formatting**: Consistent API responses
- **Error handling**: Proper HTTP status codes

### 6. Routes (`src/routes/childProfileRoutes.ts`)

API endpoint definitions:

- **RESTful design**: Standard HTTP methods
- **Middleware integration**: Authentication & authorization
- **Validation**: Request body validation
- **Security**: Role-based access control

## Implementation Steps

### Step 1: Database Setup

1. **Run the schema migration**:
   ```sql
   -- Execute the schema.sql file in your Supabase database
   -- This creates all necessary tables, indexes, and RLS policies
   ```

2. **Verify table creation**:
   ```sql
   -- Check that tables were created
   \dt directors
   \dt actors
   \dt director_actor
   \dt family_groups
   \dt family_group_members
   ```

3. **Test RLS policies**:
   ```sql
   -- Verify RLS is enabled
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename IN ('directors', 'actors', 'director_actor');
   ```

### Step 2: Environment Configuration

1. **Update environment variables**:
   ```bash
   # .env
   LOG_LEVEL=info
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Verify Supabase connection**:
   ```typescript
   // Test connection in your service
   const { data, error } = await supabase.from('directors').select('count');
   if (error) {
     console.error('Database connection failed:', error);
   }
   ```

### Step 3: Service Integration

1. **Import the new service**:
   ```typescript
   import { ChildProfileService } from '../services/childProfileService';
   ```

2. **Test basic functionality**:
   ```typescript
   // Test service methods
   try {
     const profiles = await ChildProfileService.getChildProfilesByDirector(userId);
     console.log('Profiles retrieved:', profiles);
   } catch (error) {
     console.error('Service test failed:', error);
   }
   ```

### Step 4: Route Integration

1. **Add routes to main app**:
   ```typescript
   // app.ts
   import childProfileRoutes from './routes/childProfileRoutes';
   app.use('/api/child-profiles', childProfileRoutes);
   ```

2. **Test endpoint accessibility**:
   ```bash
   # Test with curl
   curl -X GET http://localhost:3000/api/child-profiles \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

## Data Flow

### Child Profile Creation Flow

```
1. HTTP Request → Controller
   ↓
2. Input Validation (express-validator + custom validation)
   ↓
3. Authentication Check (JWT token verification)
   ↓
4. Authorization Check (Role verification)
   ↓
5. Service Layer Processing
   ├─ Data Sanitization
   ├─ Business Logic Validation
   ├─ Username Generation
   └─ Database Operations
   ↓
6. Database Transaction
   ├─ Insert Actors
   ├─ Get/Create Director
   └─ Create Relationships
   ↓
7. Response Generation
   ↓
8. Audit Logging
```

### Validation Flow

```
1. Express-validator (Basic format validation)
   ↓
2. Custom Validation (Business logic validation)
   ├─ Name validation
   ├─ Birthday validation
   ├─ Gender validation
   └─ Notes validation
   ↓
3. Data Sanitization
   ↓
4. Format Conversion (Date formats)
   ↓
5. Username Generation
   ↓
6. Database Constraints
```

## Security Features

### 1. Row-Level Security (RLS)

```sql
-- Directors can only access their own profile
CREATE POLICY directors_own_profile ON directors
    FOR ALL USING (auth_user_id = current_setting('app.current_user_id')::UUID);

-- Directors can only access actors they have relationships with
CREATE POLICY actors_authorized_access ON actors
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM director_actor da
            JOIN directors d ON da.director_id = d.id
            WHERE da.actor_id = actors.id
            AND d.auth_user_id = current_setting('app.current_user_id')::UUID
        )
    );
```

### 2. Input Sanitization

```typescript
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};
```

### 3. Authentication & Authorization

```typescript
// Middleware chain
router.use(authenticate); // JWT verification
router.use(authorize(['director', 'parent', 'admin'])); // Role check
```

## Error Handling

### 1. Error Categories

```typescript
// 400 - Validation errors
if (!validation.isValid) {
  throw new ApiError(400, `Validation failed: ${validation.errors.join(', ')}`);
}

// 401 - Authentication errors
if (!req.user || !req.user.id) {
  return sendError(res, 'User not authenticated', 401);
}

// 403 - Permission errors
if (!hasPermission) {
  return sendError(res, 'You do not have permission to access this resource', 403);
}

// 409 - Conflict errors
if (error.code === '23505') { // Unique constraint violation
  throw new ApiError(409, 'Username conflict detected. Please try again.');
}

// 500 - Server errors
throw new ApiError(500, `Operation failed: ${error.message}`);
```

### 2. Transaction Rollback

```typescript
try {
  // Start transaction
  await supabase.rpc('begin_transaction');
  
  // Perform operations
  const actors = await this.insertActors(processedChildren);
  const director = await this.getOrCreateDirector(authUserId);
  const relationships = await this.createRelationships(director.id, actors);
  
  // Commit transaction
  await supabase.rpc('commit_transaction');
  
  return { actors, relationships };
} catch (error) {
  // Rollback on error
  await supabase.rpc('rollback_transaction');
  throw error;
}
```

## Testing

### 1. Unit Tests

```typescript
// test/validation.test.ts
describe('Child Name Validation', () => {
  test('should validate valid names', () => {
    const result = validateChildName('John');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
  
  test('should reject short names', () => {
    const result = validateChildName('A');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Name must be at least 2 characters long');
  });
});
```

### 2. Integration Tests

```typescript
// test/childProfile.test.ts
describe('Child Profile Creation', () => {
  test('should create child profile successfully', async () => {
    const request = {
      children: [{
        first_name: 'Test',
        date_of_birth: '2015-01-01'
      }]
    };
    
    const result = await ChildProfileService.createChildProfiles(userId, request);
    expect(result.actors).toHaveLength(1);
    expect(result.relationships).toHaveLength(1);
  });
});
```

### 3. API Tests

```bash
# Test with Postman or curl
curl -X POST http://localhost:3000/api/child-profiles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "children": [{
      "first_name": "Test",
      "date_of_birth": "2015-01-01"
    }]
  }'
```

## Monitoring & Logging

### 1. Logging Configuration

```typescript
// Set log level via environment variable
const logLevel = process.env.LOG_LEVEL || 'info';

// Log different types of events
logger.info('Child profile creation started', { userId, childrenCount });
logger.audit('create', 'child_profiles', userId, 'success', undefined, { childrenCount });
logger.error('Validation failed', error, { userId, requestData });
```

### 2. Performance Monitoring

```typescript
// Track operation performance
const startTime = Date.now();
try {
  const result = await ChildProfileService.createChildProfiles(userId, request);
  const duration = Date.now() - startTime;
  logger.logPerformance('create_child_profiles', duration, userId);
  return result;
} catch (error) {
  const duration = Date.now() - startTime;
  logger.logPerformance('create_child_profiles_failed', duration, userId);
  throw error;
}
```

## Deployment Considerations

### 1. Database Migration

```bash
# Run migrations in order
psql -h your_host -U your_user -d your_database -f src/config/database/schema.sql

# Verify migration success
psql -h your_host -U your_user -d your_database -c "\dt"
```

### 2. Environment Variables

```bash
# Production environment
NODE_ENV=production
LOG_LEVEL=warn
SUPABASE_URL=your_production_supabase_url
SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
```

### 3. Health Checks

```typescript
// Add health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const { data, error } = await supabase.from('directors').select('count');
    if (error) throw error;
    
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    });
  }
});
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify Supabase credentials
   - Check network connectivity
   - Verify database exists and is accessible

2. **RLS Policy Errors**
   - Ensure RLS is enabled on tables
   - Verify policy syntax
   - Check user context in policies

3. **Validation Failures**
   - Review validation rules
   - Check input data format
   - Verify date format conversion

4. **Username Conflicts**
   - Check username generation logic
   - Verify database constraints
   - Test fallback generation

### Debug Mode

```typescript
// Enable debug logging
process.env.LOG_LEVEL = 'debug';

// Add request logging
app.use((req, res, next) => {
  logger.debug('Incoming request', logger.extractRequestInfo(req));
  next();
});
```

## Performance Optimization

### 1. Database Indexes

```sql
-- Ensure proper indexing
CREATE INDEX CONCURRENTLY idx_director_actor_director_id ON director_actor(director_id);
CREATE INDEX CONCURRENTLY idx_actors_username ON actors(username);
CREATE INDEX CONCURRENTLY idx_actors_date_of_birth ON actors(date_of_birth);
```

### 2. Query Optimization

```typescript
// Use efficient queries
const { data: actors } = await supabase
  .from('actors')
  .select('id, first_name, last_name, date_of_birth')
  .in('id', actorIds)
  .order('first_name', { ascending: true });
```

### 3. Caching Strategy

```typescript
// Implement caching for frequently accessed data
const cacheKey = `director_${userId}`;
let director = cache.get(cacheKey);

if (!director) {
  director = await this.getDirectorFromDatabase(userId);
  cache.set(cacheKey, director, 300000); // 5 minutes
}
```

## Conclusion

This implementation provides a robust, secure, and scalable child profile setup system. The layered architecture ensures maintainability, while comprehensive validation and error handling provide reliability. The system is designed to handle real-world scenarios with proper security measures and performance optimization.

For additional support or questions, refer to the API documentation or contact the development team.
