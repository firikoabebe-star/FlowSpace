import prisma from '../db/prisma';
import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from '../utils/errors';
import { WorkspaceRole } from '../types';
import { randomUUID } from 'crypto';

export class WorkspaceService {
  async createWorkspace(userId: string, name: string, slug?: string): Promise<any> {
    // Generate slug if not provided
    if (!slug) {
      slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    }

    // Check if slug already exists
    const existingWorkspace = await prisma.workspace.findUnique({
      where: { slug },
    });

    if (existingWorkspace) {
      throw new ConflictError('Workspace slug already exists');
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: WorkspaceRole.OWNER,
          },
        },
        channels: {
          create: [
            {
              name: 'general',
              description: 'General discussion',
              isPrivate: false,
              members: {
                create: {
                  userId,
                },
              },
            },
            {
              name: 'random',
              description: 'Random conversations',
              isPrivate: false,
              members: {
                create: {
                  userId,
                },
              },
            },
          ],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        channels: {
          include: {
            members: true,
          },
        },
      },
    });

    return workspace;
  }

  async getUserWorkspaces(userId: string): Promise<any[]> {
    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          where: { userId },
          select: { role: true },
        },
        channels: {
          where: {
            OR: [
              { isPrivate: false },
              {
                members: {
                  some: { userId },
                },
              },
            ],
          },
          select: {
            id: true,
            name: true,
            description: true,
            isPrivate: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    return workspaces.map(workspace => ({
      ...workspace,
      userRole: workspace.members[0]?.role,
      members: undefined,
    }));
  }

  async getWorkspaceBySlug(slug: string, userId: string): Promise<any> {
    const workspace = await prisma.workspace.findUnique({
      where: { slug },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        channels: {
          where: {
            OR: [
              { isPrivate: false },
              {
                members: {
                  some: { userId },
                },
              },
            ],
          },
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            _count: {
              select: {
                messages: true,
              },
            },
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }

    // Check if user is a member
    const userMember = workspace.members.find(member => member.userId === userId);
    if (!userMember) {
      throw new ForbiddenError('You are not a member of this workspace');
    }

    return {
      ...workspace,
      userRole: userMember.role,
    };
  }

  async joinWorkspace(inviteCode: string, userId: string): Promise<any> {
    const workspace = await prisma.workspace.findUnique({
      where: { inviteCode },
      include: {
        members: {
          where: { userId },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundError('Invalid invite code');
    }

    // Check if user is already a member
    if (workspace.members.length > 0) {
      throw new ConflictError('You are already a member of this workspace');
    }

    // Add user to workspace
    await prisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId,
        role: WorkspaceRole.MEMBER,
      },
    });

    // Add user to general channel
    const generalChannel = await prisma.channel.findFirst({
      where: {
        workspaceId: workspace.id,
        name: 'general',
      },
    });

    if (generalChannel) {
      await prisma.channelMember.create({
        data: {
          channelId: generalChannel.id,
          userId,
        },
      });
    }

    return this.getWorkspaceBySlug(workspace.slug, userId);
  }

  async updateWorkspace(workspaceId: string, userId: string, data: { name?: string; description?: string }): Promise<any> {
    // Check if user has permission to update workspace
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!member || (member.role !== WorkspaceRole.OWNER && member.role !== WorkspaceRole.ADMIN)) {
      throw new ForbiddenError('You do not have permission to update this workspace');
    }

    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return workspace;
  }

  async deleteWorkspace(workspaceId: string, userId: string): Promise<void> {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }

    if (workspace.ownerId !== userId) {
      throw new ForbiddenError('Only the workspace owner can delete the workspace');
    }

    await prisma.workspace.delete({
      where: { id: workspaceId },
    });
  }

  async regenerateInviteCode(workspaceId: string, userId: string): Promise<string> {
    // Check if user has permission
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!member || (member.role !== WorkspaceRole.OWNER && member.role !== WorkspaceRole.ADMIN)) {
      throw new ForbiddenError('You do not have permission to regenerate invite code');
    }

    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        inviteCode: randomUUID(),
      },
    });

    return workspace.inviteCode;
  }
}