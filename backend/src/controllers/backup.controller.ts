import { Request, Response } from 'express';
import { BackupService } from '../services/backup.service';
import { auditService } from '../services/audit.service';
import { logger } from '../utils/logger';

const backupService = new BackupService();

export const createDatabaseBackup = async (req: Request, res: Response) => {
  try {
    const backupPath = await backupService.createDatabaseBackup();
    
    await auditService.log({
      action: 'backup.database.create',
      userId: req.user?.id,
      metadata: { backupPath },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: { backupPath },
      message: 'Database backup created successfully',
    });
  } catch (error) {
    logger.error('Failed to create database backup', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create database backup',
    });
  }
};

export const createFileBackup = async (req: Request, res: Response) => {
  try {
    const backupPath = await backupService.createFileBackup();
    
    await auditService.log({
      action: 'backup.files.create',
      userId: req.user?.id,
      metadata: { backupPath },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: { backupPath },
      message: 'File backup created successfully',
    });
  } catch (error) {
    logger.error('Failed to create file backup', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create file backup',
    });
  }
};

export const createFullBackup = async (req: Request, res: Response) => {
  try {
    const backupPaths = await backupService.createFullBackup();
    
    await auditService.log({
      action: 'backup.full.create',
      userId: req.user?.id,
      metadata: backupPaths,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      data: backupPaths,
      message: 'Full backup created successfully',
    });
  } catch (error) {
    logger.error('Failed to create full backup', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create full backup',
    });
  }
};

export const restoreDatabase = async (req: Request, res: Response) => {
  try {
    const { backupPath } = req.body;
    
    if (!backupPath) {
      return res.status(400).json({
        success: false,
        message: 'Backup path is required',
      });
    }

    await backupService.restoreDatabase(backupPath);
    
    await auditService.log({
      action: 'backup.database.restore',
      userId: req.user?.id,
      metadata: { backupPath },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: 'Database restored successfully',
    });
  } catch (error) {
    logger.error('Failed to restore database', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore database',
    });
  }
};

export const restoreFiles = async (req: Request, res: Response) => {
  try {
    const { backupPath } = req.body;
    
    if (!backupPath) {
      return res.status(400).json({
        success: false,
        message: 'Backup path is required',
      });
    }

    await backupService.restoreFiles(backupPath);
    
    await auditService.log({
      action: 'backup.files.restore',
      userId: req.user?.id,
      metadata: { backupPath },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: 'Files restored successfully',
    });
  } catch (error) {
    logger.error('Failed to restore files', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore files',
    });
  }
};

export const listBackups = async (req: Request, res: Response) => {
  try {
    const backups = await backupService.listBackups();
    
    res.json({
      success: true,
      data: { backups },
    });
  } catch (error) {
    logger.error('Failed to list backups', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list backups',
    });
  }
};

export const deleteBackup = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    await backupService.deleteBackup(filename);
    
    await auditService.log({
      action: 'backup.delete',
      userId: req.user?.id,
      metadata: { filename },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: 'Backup deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete backup', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete backup',
    });
  }
};

export const getBackupStatus = async (req: Request, res: Response) => {
  try {
    const status = await backupService.getBackupStatus();
    
    res.json({
      success: true,
      data: { status },
    });
  } catch (error) {
    logger.error('Failed to get backup status', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get backup status',
    });
  }
};

export const scheduleBackup = async (req: Request, res: Response) => {
  try {
    const { cronExpression } = req.body;
    
    if (!cronExpression) {
      return res.status(400).json({
        success: false,
        message: 'Cron expression is required',
      });
    }

    await backupService.scheduleBackup(cronExpression);
    
    await auditService.log({
      action: 'backup.schedule',
      userId: req.user?.id,
      metadata: { cronExpression },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.json({
      success: true,
      message: 'Backup scheduled successfully',
    });
  } catch (error) {
    logger.error('Failed to schedule backup', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule backup',
    });
  }
};