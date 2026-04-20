import { BackupService } from '../src/services/backup.service';
import fs from 'fs/promises';
import path from 'path';

// Mock dependencies
jest.mock('child_process');
jest.mock('fs/promises');
jest.mock('../src/utils/logger');
jest.mock('../src/services/cache.service');

const mockExec = jest.fn();
jest.mock('util', () => ({
  promisify: () => mockExec,
}));

describe('BackupService', () => {
  let backupService: BackupService;
  const mockBackupDir = 'test-backups';

  beforeEach(() => {
    backupService = new BackupService();
    jest.clearAllMocks();
    
    // Mock environment variables
    process.env.BACKUP_DIR = mockBackupDir;
    process.env.MAX_BACKUPS = '5';
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';
  });

  afterEach(() => {
    delete process.env.BACKUP_DIR;
    delete process.env.MAX_BACKUPS;
    delete process.env.DATABASE_URL;
  });

  describe('createDatabaseBackup', () => {
    it('should create a database backup successfully', async () => {
      const mockMkdir = jest.mocked(fs.mkdir);
      mockMkdir.mockResolvedValue(undefined);
      
      mockExec
        .mockResolvedValueOnce({ stdout: '', stderr: '' }) // pg_dump
        .mockResolvedValueOnce({ stdout: '', stderr: '' }); // gzip

      const result = await backupService.createDatabaseBackup();

      expect(mockMkdir).toHaveBeenCalledWith(mockBackupDir, { recursive: true });
      expect(mockExec).toHaveBeenCalledTimes(2);
      expect(result).toContain('.sql.gz');
    });

    it('should handle backup creation errors', async () => {
      const mockMkdir = jest.mocked(fs.mkdir);
      mockMkdir.mockResolvedValue(undefined);
      
      mockExec.mockRejectedValue(new Error('pg_dump failed'));

      await expect(backupService.createDatabaseBackup()).rejects.toThrow('pg_dump failed');
    });
  });

  describe('createFileBackup', () => {
    it('should create a file backup successfully', async () => {
      const mockMkdir = jest.mocked(fs.mkdir);
      mockMkdir.mockResolvedValue(undefined);
      
      mockExec.mockResolvedValue({ stdout: '', stderr: '' });

      const result = await backupService.createFileBackup();

      expect(mockMkdir).toHaveBeenCalledWith(mockBackupDir, { recursive: true });
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('tar -czf')
      );
      expect(result).toContain('.tar.gz');
    });
  });

  describe('createFullBackup', () => {
    it('should create both database and file backups', async () => {
      const mockMkdir = jest.mocked(fs.mkdir);
      mockMkdir.mockResolvedValue(undefined);
      
      mockExec.mockResolvedValue({ stdout: '', stderr: '' });

      const result = await backupService.createFullBackup();

      expect(result).toHaveProperty('database');
      expect(result).toHaveProperty('files');
      expect(result.database).toContain('.sql.gz');
      expect(result.files).toContain('.tar.gz');
    });
  });

  describe('listBackups', () => {
    it('should list all backup files', async () => {
      const mockFiles = [
        'flowspace-db-2024-01-01.sql.gz',
        'flowspace-files-2024-01-01.tar.gz',
      ];
      
      const mockReaddir = jest.mocked(fs.readdir);
      const mockStat = jest.mocked(fs.stat);
      
      mockReaddir.mockResolvedValue(mockFiles as any);
      mockStat.mockResolvedValue({
        size: 1024,
        birthtime: new Date('2024-01-01'),
      } as any);

      const result = await backupService.listBackups();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('filename');
      expect(result[0]).toHaveProperty('size');
      expect(result[0]).toHaveProperty('type');
    });

    it('should handle empty backup directory', async () => {
      const mockReaddir = jest.mocked(fs.readdir);
      mockReaddir.mockResolvedValue([]);

      const result = await backupService.listBackups();

      expect(result).toHaveLength(0);
    });
  });

  describe('deleteBackup', () => {
    it('should delete a backup file', async () => {
      const mockUnlink = jest.mocked(fs.unlink);
      mockUnlink.mockResolvedValue(undefined);

      const filename = 'test-backup.sql.gz';
      await backupService.deleteBackup(filename);

      expect(mockUnlink).toHaveBeenCalledWith(
        path.join(mockBackupDir, filename)
      );
    });
  });

  describe('restoreDatabase', () => {
    it('should restore database from compressed backup', async () => {
      mockExec.mockResolvedValue({ stdout: '', stderr: '' });
      const mockUnlink = jest.mocked(fs.unlink);
      mockUnlink.mockResolvedValue(undefined);

      const backupPath = 'test-backup.sql.gz';
      await backupService.restoreDatabase(backupPath);

      expect(mockExec).toHaveBeenCalledTimes(2); // gunzip and psql
    });

    it('should restore database from uncompressed backup', async () => {
      mockExec.mockResolvedValue({ stdout: '', stderr: '' });

      const backupPath = 'test-backup.sql';
      await backupService.restoreDatabase(backupPath);

      expect(mockExec).toHaveBeenCalledTimes(1); // only psql
    });
  });

  describe('restoreFiles', () => {
    it('should restore files from backup', async () => {
      mockExec.mockResolvedValue({ stdout: '', stderr: '' });

      const backupPath = 'test-files.tar.gz';
      await backupService.restoreFiles(backupPath);

      expect(mockExec).toHaveBeenCalledWith(
        `tar -xzf "${backupPath}" -C .`
      );
    });
  });

  describe('getBackupStatus', () => {
    it('should return backup status information', async () => {
      // Mock cache service
      const mockCacheGet = jest.fn().mockResolvedValue({
        timestamp: '2024-01-01T00:00:00.000Z',
        database: 'db-backup.sql.gz',
        files: 'files-backup.tar.gz',
      });

      // Mock listBackups
      jest.spyOn(backupService, 'listBackups').mockResolvedValue([
        {
          filename: 'test.sql.gz',
          path: '/path/to/test.sql.gz',
          size: 1024,
          created: '2024-01-01',
          type: 'database',
        },
      ]);

      const status = await backupService.getBackupStatus();

      expect(status).toHaveProperty('totalBackups');
      expect(status).toHaveProperty('totalSize');
    });
  });
});