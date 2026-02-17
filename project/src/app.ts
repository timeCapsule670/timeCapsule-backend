// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes';
import childrenRoutes from './routes/childrenRoutes';
import childProfileRoutes from './routes/childProfileRoutes';
import messageRoutes from './routes/messageRoutes';
import categoriesRoutes from './routes/categoriesRoutes';
import profilePictureRoutes from './routes/profilePictureRoutes';
import inviteCodeRoutes from './routes/inviteCodeRoutes';
import familySetupRoutes from './routes/familySetupRoutes';
import promptRoutes from './routes/promptRoutes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/child-profiles', childProfileRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/avatars', profilePictureRoutes);
app.use('/api/invite-codes', inviteCodeRoutes);
app.use('/api/family-setup', familySetupRoutes);
app.use('/api/prompts', promptRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to TimeCapsule API',
    version: '1.0.0',
    status: 'operational'
  });
});

// Error handling
app.use(errorHandler);

export default app;
