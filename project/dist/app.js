"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const childrenRoutes_1 = __importDefault(require("./routes/childrenRoutes"));
const messageRoutes_1 = __importDefault(require("./routes/messageRoutes"));
const categoriesRoutes_1 = __importDefault(require("./routes/categoriesRoutes"));
const profilePictureRoutes_1 = __importDefault(require("./routes/profilePictureRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
const app = (0, express_1.default)();
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/children', childrenRoutes_1.default);
app.use('/api/messages', messageRoutes_1.default);
app.use('/api/categories', categoriesRoutes_1.default);
app.use('/api/avatars', profilePictureRoutes_1.default);
// Base route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to TimeCapsule API',
        version: '1.0.0',
        status: 'operational'
    });
});
// Error handling
app.use(errorHandler_1.errorHandler);
exports.default = app;
