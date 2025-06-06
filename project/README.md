# TimeCapsule API

A RESTful API for the TimeCapsule application, allowing users to schedule multimedia messages for delivery at future dates.

## Features

- User authentication via Supabase
- Child profile management
- Scheduling text, audio, video, and image messages
- AI prompt handling
- Future delivery of messages

## Tech Stack

- Node.js
- TypeScript
- Express.js
- Supabase (Auth & Database)

## Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── middleware/      # Custom middleware
├── routes/          # API routes
├── services/        # Business logic
├── types/           # TypeScript interfaces
├── utils/           # Utility functions
├── scheduler.ts     # Message delivery scheduler
└── index.ts         # Entry point
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `POST /api/auth/reset-password` - Request password reset
- `GET /api/auth/profile` - Get user profile (protected)

### Children

- `POST /api/children` - Create a child profile (protected)
- `GET /api/children` - Get all children for user (protected)
- `GET /api/children/:id` - Get a specific child (protected)
- `PUT /api/children/:id` - Update a child profile (protected)
- `DELETE /api/children/:id` - Delete a child profile (protected)

### Messages

- `POST /api/messages` - Create a new message (protected)
- `GET /api/messages` - Get all messages for user (protected)
- `GET /api/messages/child/:childId` - Get messages for a specific child (protected)
- `GET /api/messages/:id` - Get a specific message (protected)
- `PUT /api/messages/:id` - Update a message (protected)
- `DELETE /api/messages/:id` - Delete a message (protected)

## Setup and Installation

1. Clone the repository
2. Create a `.env` file based on `.env.example`
3. Install dependencies with `npm install`
4. Start the development server with `npm run dev`

## Testing

Use Postman or any API client to test the endpoints. Make sure to include the appropriate authentication headers for protected routes.

## Database Tables

The API expects the following tables to exist in your Supabase database:

- `users`: User profiles
- `children`: Child profiles associated with users
- `messages`: Messages scheduled for delivery