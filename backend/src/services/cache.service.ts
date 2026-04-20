import Redis from 'ioredis';
import { logger } from '../utils/logger';

class CacheService {
  private redis: Redis | null = null;
  private isConnected = false;

  constructor() {
    this.connect();
  }

  private async connect() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      this.redis = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      this.redis.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis connected successfully');
      });

      this.redis.on('error', (error) => {
        this.isConnected = false;
        logger.error('Redis connection error:', error);
      });

      this.redis.on('close', () => {
        this.isConnected = false;
        logger.warn('Redis connection closed');
      });

      await this.redis.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      this.redis = null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis || !this.isConnected) {
      return null;
    }

    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds = 3600): Promise<boolean> {
    if (!this.redis || !this.isConnected) {
      return false;
    }

    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.redis || !this.isConnected) {
      return false;
    }

    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.redis || !this.isConnected) {
      return false;
    }

    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  async increment(key: string, ttlSeconds = 3600): Promise<number> {
    if (!this.redis || !this.isConnected) {
      return 0;
    }

    try {
      const result = await this.redis.incr(key);
      if (result === 1) {
        // First increment, set TTL
        await this.redis.expire(key, ttlSeconds);
      }
      return result;
    } catch (error) {
      logger.error('Cache increment error:', error);
      return 0;
    }
  }

  async setHash(key: string, field: string, value: any, ttlSeconds = 3600): Promise<boolean> {
    if (!this.redis || !this.isConnected) {
      return false;
    }

    try {
      await this.redis.hset(key, field, JSON.stringify(value));
      await this.redis.expire(key, ttlSeconds);
      return true;
    } catch (error) {
      logger.error('Cache hash set error:', error);
      return false;
    }
  }

  async getHash<T>(key: string, field: string): Promise<T | null> {
    if (!this.redis || !this.isConnected) {
      return null;
    }

    try {
      const value = await this.redis.hget(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache hash get error:', error);
      return null;
    }
  }

  async getAllHash<T>(key: string): Promise<Record<string, T> | null> {
    if (!this.redis || !this.isConnected) {
      return null;
    }

    try {
      const hash = await this.redis.hgetall(key);
      const result: Record<string, T> = {};
      
      for (const [field, value] of Object.entries(hash)) {
        result[field] = JSON.parse(value);
      }
      
      return result;
    } catch (error) {
      logger.error('Cache hash getall error:', error);
      return null;
    }
  }

  async addToSet(key: string, value: string, ttlSeconds = 3600): Promise<boolean> {
    if (!this.redis || !this.isConnected) {
      return false;
    }

    try {
      await this.redis.sadd(key, value);
      await this.redis.expire(key, ttlSeconds);
      return true;
    } catch (error) {
      logger.error('Cache set add error:', error);
      return false;
    }
  }

  async getSet(key: string): Promise<string[]> {
    if (!this.redis || !this.isConnected) {
      return [];
    }

    try {
      return await this.redis.smembers(key);
    } catch (error) {
      logger.error('Cache set get error:', error);
      return [];
    }
  }

  async removeFromSet(key: string, value: string): Promise<boolean> {
    if (!this.redis || !this.isConnected) {
      return false;
    }

    try {
      await this.redis.srem(key, value);
      return true;
    } catch (error) {
      logger.error('Cache set remove error:', error);
      return false;
    }
  }

  async flushPattern(pattern: string): Promise<boolean> {
    if (!this.redis || !this.isConnected) {
      return false;
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      logger.error('Cache flush pattern error:', error);
      return false;
    }
  }

  async getStats(): Promise<any> {
    if (!this.redis || !this.isConnected) {
      return { connected: false };
    }

    try {
      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');
      
      return {
        connected: this.isConnected,
        memory: info,
        keyspace: keyspace,
      };
    } catch (error) {
      logger.error('Cache stats error:', error);
      return { connected: false, error: error.message };
    }
  }

  // Cache key generators
  static keys = {
    userSession: (userId: string) => `session:${userId}`,
    workspaceMembers: (workspaceId: string) => `workspace:${workspaceId}:members`,
    channelMembers: (channelId: string) => `channel:${channelId}:members`,
    channelMessages: (channelId: string, page: number) => `channel:${channelId}:messages:${page}`,
    userWorkspaces: (userId: string) => `user:${userId}:workspaces`,
    onlineUsers: (channelId: string) => `online:${channelId}`,
    typingUsers: (channelId: string) => `typing:${channelId}`,
    rateLimitUser: (userId: string) => `ratelimit:user:${userId}`,
    rateLimitIP: (ip: string) => `ratelimit:ip:${ip}`,
    analytics: (type: string, id: string) => `analytics:${type}:${id}`,
  };
}

export const cacheService = new CacheService();
export { CacheService };