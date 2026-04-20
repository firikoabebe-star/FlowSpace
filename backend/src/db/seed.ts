import bcrypt from 'bcrypt';
import prisma from './prisma';
import { logger } from '../utils/logger';

async function main() {
  logger.info('Starting database seed...');

  // Create demo users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      username: 'john_doe',
      displayName: 'John Doe',
      password: hashedPassword,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      email: 'jane@example.com',
      username: 'jane_smith',
      displayName: 'Jane Smith',
      password: hashedPassword,
    },
  });

  // Create demo workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'demo-workspace' },
    update: {},
    create: {
      name: 'Demo Workspace',
      slug: 'demo-workspace',
      ownerId: user1.id,
    },
  });

  // Add users to workspace
  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: user1.id,
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: user1.id,
      role: 'OWNER',
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: user2.id,
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: user2.id,
      role: 'MEMBER',
    },
  });

  // Create demo channels
  const generalChannel = await prisma.channel.upsert({
    where: {
      workspaceId_name: {
        workspaceId: workspace.id,
        name: 'general',
      },
    },
    update: {},
    create: {
      name: 'general',
      description: 'General discussion',
      workspaceId: workspace.id,
      isPrivate: false,
    },
  });

  const randomChannel = await prisma.channel.upsert({
    where: {
      workspaceId_name: {
        workspaceId: workspace.id,
        name: 'random',
      },
    },
    update: {},
    create: {
      name: 'random',
      description: 'Random conversations',
      workspaceId: workspace.id,
      isPrivate: false,
    },
  });

  // Add users to channels
  await prisma.channelMember.upsert({
    where: {
      channelId_userId: {
        channelId: generalChannel.id,
        userId: user1.id,
      },
    },
    update: {},
    create: {
      channelId: generalChannel.id,
      userId: user1.id,
    },
  });

  await prisma.channelMember.upsert({
    where: {
      channelId_userId: {
        channelId: generalChannel.id,
        userId: user2.id,
      },
    },
    update: {},
    create: {
      channelId: generalChannel.id,
      userId: user2.id,
    },
  });

  logger.info('Database seeded successfully!');
  logger.info('Demo users:');
  logger.info('- john@example.com / john_doe (password: password123)');
  logger.info('- jane@example.com / jane_smith (password: password123)');
}

main()
  .catch((e) => {
    logger.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });