import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger';
import { cacheService } from './cache.service';

const execAsync = promisify(exec);

export class BackupService {
  private backupDir = process.env.BACKUP_DIR || 'backups';
  private maxBackups = parseInt(process.env.MAX_BACKUPS || '30');

  async createDatabaseBackup(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `flowspace-db-${timestamp}.sql`;
      const filepath = path.join(this.backupDir, filename);

      // Ensure backup directory exists
      await fs.mkdir(this.backupDir, { recursive: true });

      // Extract database connection details from DATABASE_URL
      const dbUrl = new URL(process.env.DATABASE_URL!);
      const dbName = dbUrl.pathname.slice(1);
      const host = dbUrl.hostname;
      const port = dbUrl.port || '5432';
      const username = dbUrl.username;
      const password = dbUrl.password;

      // Create pg_dump command
      const command = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${dbName} --no-owner --no-privileges > "${filepath}"`;

      await execAsync(command);

      // Compress the backup
      const compressedPath = `${filepath}.gz`;
      await execAsync(`gzip "${filepath}"`);

      logger.info('Database backup created successfully', { 
        filename: `${filename}.gz`,
        path: compressedPath 
      });

      // Clean up old backups
      await this.cleanupOldBackups();

      return compressedPath;
    } catch (error) {
      logger.error('Failed to create database backup', error);
      throw error;
    }
  }

  async createFileBackup(): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `flowspace-files-${timestamp}.tar.gz`;
      const filepath = path.join(this.backupDir, filename);

      // Ensure backup directory exists
      await fs.mkdir(this.backupDir, { recursive: true });

      // Create tar archive of uploads directory
      const uploadsDir = process.env.UPLOAD_DIR || 'uploads';
      const command = `tar -czf "${filepath}" -C . "${uploadsDir}"`;

      await execAsync(command);

      logger.info('File backup created successfully', { 
        filename,
        path: filepath 
      });

      return filepath;
    } catch (error) {
      logger.error('Failed to create file backup', error);
      throw error;
    }
  }

  async createFullBackup(): Promise<{ database: string; files: string }> {
    try {
      logger.info('Starting full backup process');

      const [databaseBackup, fileBackup] = await Promise.all([
        this.createDatabaseBackup(),
        this.createFileBackup(),
      ]);

      // Cache backup info
      await cacheService.set('last_backup', {
        timestamp: new Date().toISOString(),
        database: databaseBackup,
        files: fileBackup,
      }, 86400 * 7); // Cache for 7 days

      logger.info('Full backup completed successfully', {
        database: databaseBackup,
        files: fileBackup,
      });

      return { database: databaseBackup, files: fileBackup };
    } catch (error) {
      logger.error('Full backup failed', error);
      throw error;
    }
  }

  async restoreDatabase(backupPath: string): Promise<void> {
    try {
      logger.info('Starting database restore', { backupPath });

      // Extract database connection details
      const dbUrl = new URL(process.env.DATABASE_URL!);
      const dbName = dbUrl.pathname.slice(1);
      const host = dbUrl.hostname;
      const port = dbUrl.port || '5432';
      const username = dbUrl.username;
      const password = dbUrl.password;

      // Decompress if needed
      let sqlFile = backupPath;
      if (backupPath.endsWith('.gz')) {
        sqlFile = backupPath.replace('.gz', '');
        await execAsync(`gunzip -c "${backupPath}" > "${sqlFile}"`);
      }

      // Restore database
      const command = `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${username} -d ${dbName} < "${sqlFile}"`;
      await execAsync(command);

      // Clean up temporary file if we decompressed
      if (backupPath.endsWith('.gz')) {
        await fs.unlink(sqlFile);
      }

      logger.info('Database restore completed successfully');
    } catch (error) {
      logger.error('Database restore failed', error);
      throw error;
    }
  }

  async restoreFiles(backupPath: string): Promise<void> {
    try {
      logger.info('Starting file restore', { backupPath });

      // Extract files
      const command = `tar -xzf "${backupPath}" -C .`;
      await execAsync(command);

      logger.info('File restore completed successfully');
    } catch (error) {
      logger.error('File restore failed', error);
      throw error;
    }
  }

  async listBackups(): Promise<any[]> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups = [];

      for (const file of files) {
        const filepath = path.join(this.backupDir, file);
        const stats = await fs.stat(filepath);
        
        backups.push({
          filename: file,
          path: filepath,
          size: stats.size,
          created: stats.birthtime,
          type: file.includes('db') ? 'database' : 'files',
        });
      }

      return backups.sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error) {
      logger.error('Failed to list backups', error);
      return [];
    }
  }

  async deleteBackup(filename: string): Promise<void> {
    try {
      const filepath = path.join(this.backupDir, filename);
      await fs.unlink(filepath);
      
      logger.info('Backup deleted successfully', { filename });
    } catch (error) {
      logger.error('Failed to delete backup', error);
      throw error;
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();
      const dbBackups = backups.filter(b => b.type === 'database');
      
      if (dbBackups.length > this.maxBackups) {
        const toDelete = dbBackups.slice(this.maxBackups);
        
        for (const backup of toDelete) {
          await this.deleteBackup(backup.filename);
        }
        
        logger.info(`Cleaned up ${toDelete.length} old backups`);
      }
    } catch (error) {
      logger.error('Failed to cleanup old backups', error);
    }
  }

  async scheduleBackup(cronExpression: string): Promise<void> {
    // This would integrate with a job scheduler like node-cron
    // For now, we'll just log the intention
    logger.info('Backup scheduled', { cronExpression });
  }

  async getBackupStatus(): Promise<any> {
    try {
      const lastBackup = await cacheService.get('last_backup');
      const backups = await this.listBackups();
      
      return {
        lastBackup,
        totalBackups: backups.length,
        totalSize: backups.reduce((sum, b) => sum + b.size, 0),
        oldestBackup: backups[backups.length - 1]?.created,
        newestBackup: backups[0]?.created,
      };
    } catch (error) {
      logger.error('Failed to get backup status', error);
      return null;
    }
  }
}