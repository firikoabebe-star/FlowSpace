import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { errorHandler } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import workspaceRoutes from './routes/workspace.routes';
import channelRoutes from './routes/channel.routes';
import messageRoutes from './routes/message.routes';
import fileRoutes from './routes/file.routes';
import reactionRoutes from './routes/reaction.routes';
import healthRoutes from './routes/health.routes';
import analyticsRoutes from './routes/analytics.routes';
import backupRoutes from './routes/backup.routes';
import monitoringRoutes from './routes/monitoring.routes';
import { apiRateLimit } from './middleware/rateLimiter.middleware';

const app = express();

// Rate limiting
const limiter = rateLimit(config.rateLimit);
app.use(limiter);

// Security middleware
app.use(helmet());

// CORS
app.use(cors(config.cors));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Swagger documentation
const swaggerOptions = {
  definition: require('../swaggerDef.js'),
  apis: ['./src/routes/*.ts'],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'FlowSpace API Documentation',
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Health routes
app.use('/health', healthRoutes);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', apiRateLimit, workspaceRoutes);
app.use('/api/channels', apiRateLimit, channelRoutes);
app.use('/api/messages', apiRateLimit, messageRoutes);
app.use('/api/files', fileRoutes);
app.use('/api', reactionRoutes);
app.use('/api/analytics', apiRateLimit, analyticsRoutes);
app.use('/api/backup', apiRateLimit, backupRoutes);
app.use('/api/monitoring', apiRateLimit, monitoringRoutes);

// Error handling
app.use(errorHandler);

export default app;
