import { describe, expect, it } from 'vitest';
import { CreateUserSchema, UpdateUserSchema } from '../validators/user.schema';

describe('User Schemas', () => {
  describe('CreateUserSchema', () => {
    it('validates valid user creation data', () => {
      const result = CreateUserSchema.parse({
        body: {
          email: 'test@example.com',
          password: 'password123',
          role: 'ADMIN',
          isActive: true,
        },
      });

      expect(result.body.email).toBe('test@example.com');
      expect(result.body.password).toBe('password123');
      expect(result.body.role).toBe('ADMIN');
      expect(result.body.isActive).toBe(true);
    });

    it('applies default values for optional fields', () => {
      const result = CreateUserSchema.parse({
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
      });

      expect(result.body.role).toBeUndefined(); // role is optional in schema
      expect(result.body.isActive).toBeUndefined(); // isActive is optional
    });

    it('rejects invalid email', () => {
      expect(() => {
        CreateUserSchema.parse({
          body: {
            email: 'invalid-email',
            password: 'password123',
          },
        });
      }).toThrow();
    });

    it('rejects password too short', () => {
      expect(() => {
        CreateUserSchema.parse({
          body: {
            email: 'test@example.com',
            password: '12345', // less than 6 characters
          },
        });
      }).toThrow('Password must be at least 6 characters');
    });

    it('rejects password too long', () => {
      expect(() => {
        CreateUserSchema.parse({
          body: {
            email: 'test@example.com',
            password: 'a'.repeat(101), // more than 100 characters
          },
        });
      }).toThrow('Password must be at most 100 characters');
    });

    it('rejects invalid role', () => {
      expect(() => {
        CreateUserSchema.parse({
          body: {
            email: 'test@example.com',
            password: 'password123',
            role: 'INVALID_ROLE',
          },
        });
      }).toThrow();
    });
  });

  describe('UpdateUserSchema', () => {
    it('validates valid user update data', () => {
      const result = UpdateUserSchema.parse({
        body: {
          role: 'ANALYST',
          isActive: false,
        },
      });

      expect(result.body.role).toBe('ANALYST');
      expect(result.body.isActive).toBe(false);
    });

    it('allows partial updates', () => {
      const result = UpdateUserSchema.parse({
        body: {
          role: 'VIEWER',
        },
      });

      expect(result.body.role).toBe('VIEWER');
      expect(result.body.isActive).toBeUndefined();
    });

    it('allows empty update object', () => {
      const result = UpdateUserSchema.parse({
        body: {},
      });

      expect(result.body).toEqual({});
    });

    it('rejects invalid role in update', () => {
      expect(() => {
        UpdateUserSchema.parse({
          body: {
            role: 'INVALID',
          },
        });
      }).toThrow();
    });
  });
});