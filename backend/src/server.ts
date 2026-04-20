import app from './app';
import { createServer } from 'http';
import { config } from './config';
import { logger } from './utils/logger';
import { SocketService } from './socket/socket.service';
import { enterpriseService } from './services/enterprise.service';

const server = createServer(app);

// Initialize Socket.IO
const socketService = new SocketService(server);

// Initialize enterprise services
async function initializeServices() {
  try {
    await enterpriseService.initialize();
    logger.info('All enterprise services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize enterprise services', error);
    // Continue startup even if enterprise services fail
  }
}

server.listen(config.port, async () => {
  logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
  logger.info(`Socket.IO server initialized`);
  
  // Initialize enterprise services after server starts
  await initializeServices();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});
