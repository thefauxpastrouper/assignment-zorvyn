import { OpenApiGeneratorV3, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { SignupSchema, SigninSchema } from "../validators/auth.schema";
import { CreateUserSchema, UpdateUserSchema } from "../validators/user.schema";
import { CreateRecordSchema, UpdateRecordSchema, ListRecordsQuerySchema, IdParamSchema } from "../validators/record.schema";
import { DashboardQuerySchema } from "../validators/dashboard.schema";

const registry = new OpenAPIRegistry();

// Security Scheme for JWT
const bearerAuth = registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

// --- Auth Endpoints ---
registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/signup',
  summary: 'Register a new user',
  tags: ['Auth'],
  request: { body: { content: { 'application/json': { schema: SignupSchema.shape.body } } } },
  responses: { 
    201: { description: 'User registered successfully' },
    400: { description: 'Bad Request' }
  }
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/auth/signin',
  summary: 'Authenticate user and get token',
  tags: ['Auth'],
  request: { body: { content: { 'application/json': { schema: SigninSchema.shape.body } } } },
  responses: { 
    200: { description: 'Authentication successful' },
    401: { description: 'Unauthorized' }
  }
});

// --- User Endpoints ---
registry.registerPath({
  method: 'post',
  path: '/api/v1/users',
  summary: 'Create a new user (Admin only)',
  tags: ['Users'],
  security: [{ [bearerAuth.name]: [] }],
  request: { body: { content: { 'application/json': { schema: CreateUserSchema.shape.body } } } },
  responses: { 
    201: { description: 'User created' },
    403: { description: 'Forbidden' }
  }
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/users',
  summary: 'List all users (Admin only)',
  tags: ['Users'],
  security: [{ [bearerAuth.name]: [] }],
  responses: { 
    200: { description: 'List of users' },
    401: { description: 'Unauthorized' }
  }
});

registry.registerPath({
  method: 'patch',
  path: '/api/v1/users/{id}',
  summary: 'Update user status or role (Admin only)',
  tags: ['Users'],
  security: [{ [bearerAuth.name]: [] }],
  request: { 
    params: IdParamSchema.shape.params,
    body: { content: { 'application/json': { schema: UpdateUserSchema.shape.body } } } 
  },
  responses: { 200: { description: 'User updated' } }
});

// --- Record Endpoints ---
registry.registerPath({
  method: 'get',
  path: '/api/v1/records',
  summary: 'List financial records with filters',
  tags: ['Records'],
  security: [{ [bearerAuth.name]: [] }],
  request: { query: ListRecordsQuerySchema.shape.query},
  responses: { 200: { description: 'List of records' } }
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/records',
  summary: 'Create a new financial record',
  tags: ['Records'],
  security: [{ [bearerAuth.name]: [] }],
  request: { body: { content: { 'application/json': { schema: CreateRecordSchema.shape.body } } } },
  responses: { 201: { description: 'Record created' } }
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/records/{id}',
  summary: 'Get record by ID',
  tags: ['Records'],
  security: [{ [bearerAuth.name]: [] }],
  request: { params: IdParamSchema.shape.params },
  responses: { 200: { description: 'Record details' } }
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/records/{id}',
  summary: 'Update a financial record',
  tags: ['Records'],
  security: [{ [bearerAuth.name]: [] }],
  request: { 
    params: IdParamSchema.shape.params,
    body: { content: { 'application/json': { schema: UpdateRecordSchema.shape.body } } } 
  },
  responses: { 200: { description: 'Record updated' } }
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/records/{id}',
  summary: 'Delete a financial record',
  tags: ['Records'],
  security: [{ [bearerAuth.name]: [] }],
  request: { params: IdParamSchema.shape.params },
  responses: { 204: { description: 'Record deleted' } }
});

// --- Dashboard Endpoints ---
registry.registerPath({
  method: 'get',
  path: '/api/v1/dashboard/overview',
  summary: 'Get dashboard overview statistics',
  tags: ['Dashboard'],
  security: [{ [bearerAuth.name]: [] }],
  responses: { 200: { description: 'Overview data' } }
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/dashboard/summary',
  summary: 'Get financial summary (Total income vs expense)',
  tags: ['Dashboard'],
  security: [{ [bearerAuth.name]: [] }],
  responses: { 200: { description: 'Summary data' } }
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/dashboard/categories',
  summary: 'Get totals by category',
  tags: ['Dashboard'],
  security: [{ [bearerAuth.name]: [] }],
  responses: { 200: { description: 'Category breakdown' } }
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/dashboard/trends/monthly',
  summary: 'Get monthly financial trends',
  tags: ['Dashboard'],
  security: [{ [bearerAuth.name]: [] }],
  request: { query: DashboardQuerySchema.shape.query },
  responses: { 200: { description: 'Monthly trend data' } }
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/dashboard/trends/weekly',
  summary: 'Get weekly financial trends',
  tags: ['Dashboard'],
  security: [{ [bearerAuth.name]: [] }],
  request: { query: DashboardQuerySchema.shape.query },
  responses: { 200: { description: 'Weekly trend data' } }
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/dashboard/recent',
  summary: 'Get recent financial activities',
  tags: ['Dashboard'],
  security: [{ [bearerAuth.name]: [] }],
  request: { query: DashboardQuerySchema.shape.query },
  responses: { 200: { description: 'Recent activities' } }
});

const generator = new OpenApiGeneratorV3(registry.definitions);
const spec = generator.generateDocument({
  openapi: '3.1.0',
  info: { 
    title: 'EquiLedger API', 
    version: '1.0.0',
    description: 'A comprehensive API for EquiLedger, a financial records management system. This API provides endpoints for user authentication, record management, and dashboard analytics.',
    contact: {
      name: 'EquiLedger Support',
      email: 'support@equiledger.com',
      url: 'https://equiledger.com/support'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    },
    termsOfService: 'https://equiledger.com/terms'
  },
  servers: [ 
    { 
      url: 'http://localhost:3000/api/v1', 
      description: 'Development server' 
    },
    {
      url: 'https://api.equiledger.com/v1',
      description: 'Production server'
    }
  ],
  tags: [
    { name: 'Auth', description: 'Authentication and user registration endpoints' },
    { name: 'Users', description: 'User management operations (Admin only)' },
    { name: 'Records', description: 'Financial record CRUD operations and filtering' },
    { name: 'Dashboard', description: 'Analytical statistics and financial overview' }
  ],
  externalDocs: {
    description: 'EquiLedger Documentation',
    url: 'https://docs.equiledger.com'
  }
});

// This creates the exact same type of file as Parallel AI
await Bun.write('src/docs/openapi.json', JSON.stringify(spec, null, 2));
console.log('✅ OpenAPI Documentation generated successfully');