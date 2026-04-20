module.exports = {
  openapi: "3.0.0",
  info: {
    title: "FlowSpace API",
    version: "1.0.0",
    description: "Real-time collaboration platform API documentation",
    contact: {
      name: "FlowSpace Team",
      email: "support@flowspace.com",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: "http://localhost:5000/api",
      description: "Development server",
    },
    {
      url: "https://api.flowspace.com/api",
      description: "Production server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          username: { type: "string" },
          displayName: { type: "string" },
          avatarUrl: { type: "string", format: "uri", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Workspace: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          slug: { type: "string" },
          ownerId: { type: "string", format: "uuid" },
          inviteCode: { type: "string", format: "uuid" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Channel: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          workspaceId: { type: "string", format: "uuid" },
          isPrivate: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Message: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          content: { type: "string" },
          userId: { type: "string", format: "uuid" },
          channelId: { type: "string", format: "uuid" },
          fileId: { type: "string", format: "uuid", nullable: true },
          isEdited: { type: "boolean" },
          isDeleted: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      File: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          filename: { type: "string" },
          originalName: { type: "string" },
          mimetype: { type: "string" },
          size: { type: "integer" },
          uploadedById: { type: "string", format: "uuid" },
          channelId: { type: "string", format: "uuid", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      MessageReaction: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          messageId: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          emoji: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
          code: { type: "string", nullable: true },
        },
      },
      Success: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { type: "object" },
          message: { type: "string", nullable: true },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};
