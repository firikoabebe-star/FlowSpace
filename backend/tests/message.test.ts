import request from 'supertest';
import app from '../src/app';
import prisma from '../src/db/prisma';

describe('Message Endpoints', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    username: 'testuser',
    displayName: 'Test User',
  };

  const mockChannel = {
    id: 'channel-1',
    name: 'general',
    workspaceId: 'workspace-1',
    isPrivate: false,
  };

  const mockMessage = {
    id: 'message-1',
    content: 'Hello, world!',
    userId: mockUser.id,
    channelId: mockChannel.id,
    isEdited: false,
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockUser,
  };

  beforeEach(() => {
    // Mock authentication middleware
    jest.doMock('../src/middleware/auth.middleware', () => ({
      authenticate: (req: any, res: any, next: any) => {
        req.user = { userId: mockUser.id };
        next();
      },
    }));
  });

  describe('GET /api/messages/channel/:channelId', () => {
    it('should get channel messages successfully', async () => {
      (prisma.channel.findUnique as jest.Mock).mockResolvedValue(mockChannel);
      (prisma.workspaceMember.findUnique as jest.Mock).mockResolvedValue({ id: 'member-1' });
      (prisma.message.findMany as jest.Mock).mockResolvedValue([mockMessage]);

      const response = await request(app)
        .get(`/api/messages/channel/${mockChannel.id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.messages).toHaveLength(1);
      expect(response.body.data.messages[0].content).toBe(mockMessage.content);
    });

    it('should return error for unauthorized access', async () => {
      (prisma.channel.findUnique as jest.Mock).mockResolvedValue(mockChannel);
      (prisma.workspaceMember.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/messages/channel/${mockChannel.id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/messages/channel/:channelId', () => {
    it('should create message successfully', async () => {
      const messageData = {
        content: 'New test message',
      };

      (prisma.channel.findUnique as jest.Mock).mockResolvedValue(mockChannel);
      (prisma.workspaceMember.findUnique as jest.Mock).mockResolvedValue({ id: 'member-1' });
      (prisma.message.create as jest.Mock).mockResolvedValue({
        ...mockMessage,
        content: messageData.content,
      });

      const response = await request(app)
        .post(`/api/messages/channel/${mockChannel.id}`)
        .set('Authorization', 'Bearer valid-token')
        .send(messageData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message.content).toBe(messageData.content);
    });

    it('should validate message content', async () => {
      const response = await request(app)
        .post(`/api/messages/channel/${mockChannel.id}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ content: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });
  });

  describe('PUT /api/messages/:messageId', () => {
    it('should edit message successfully', async () => {
      const updatedContent = 'Updated message content';

      (prisma.message.findUnique as jest.Mock).mockResolvedValue(mockMessage);
      (prisma.message.update as jest.Mock).mockResolvedValue({
        ...mockMessage,
        content: updatedContent,
        isEdited: true,
      });

      const response = await request(app)
        .put(`/api/messages/${mockMessage.id}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ content: updatedContent })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message.content).toBe(updatedContent);
      expect(response.body.data.message.isEdited).toBe(true);
    });

    it('should not allow editing other users messages', async () => {
      const otherUserMessage = {
        ...mockMessage,
        userId: 'other-user-id',
      };

      (prisma.message.findUnique as jest.Mock).mockResolvedValue(otherUserMessage);

      const response = await request(app)
        .put(`/api/messages/${mockMessage.id}`)
        .set('Authorization', 'Bearer valid-token')
        .send({ content: 'Updated content' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/messages/:messageId', () => {
    it('should delete message successfully', async () => {
      (prisma.message.findUnique as jest.Mock).mockResolvedValue(mockMessage);
      (prisma.message.update as jest.Mock).mockResolvedValue({
        ...mockMessage,
        isDeleted: true,
      });

      const response = await request(app)
        .delete(`/api/messages/${mockMessage.id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });
  });

  describe('GET /api/messages/channel/:channelId/search', () => {
    it('should search messages successfully', async () => {
      const searchQuery = 'hello';
      const searchResults = [mockMessage];

      (prisma.channel.findUnique as jest.Mock).mockResolvedValue(mockChannel);
      (prisma.workspaceMember.findUnique as jest.Mock).mockResolvedValue({ id: 'member-1' });
      (prisma.message.findMany as jest.Mock).mockResolvedValue(searchResults);

      const response = await request(app)
        .get(`/api/messages/channel/${mockChannel.id}/search`)
        .query({ query: searchQuery })
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.messages).toHaveLength(1);
      expect(response.body.data.query).toBe(searchQuery);
    });

    it('should require search query', async () => {
      const response = await request(app)
        .get(`/api/messages/channel/${mockChannel.id}/search`)
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });
  });
});