import { describe, expect, it } from 'vitest';
import { SignupSchema, SigninSchema } from '../validators/auth.schema';

describe('Auth Schemas', () => {
  describe('SignupSchema', () => {
    it('validates valid signup data', () => {
      const result = SignupSchema.parse({
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
      });

      expect(result.body.email).toBe('test@example.com');
      expect(result.body.password).toBe('password123');
      expect(result.body.role).toBe('VIEWER');
    });

    it('accepts an explicit role', () => {
      const result = SignupSchema.parse({
        body: {
          email: 'analyst@example.com',
          password: 'password123',
          role: 'ANALYST',
        },
      });

      expect(result.body.role).toBe('ANALYST');
    });

    it('rejects invalid role', () => {
      expect(() => {
        SignupSchema.parse({
          body: {
            email: 'test@example.com',
            password: 'password123',
            role: 'SUPERUSER',
          },
        });
      }).toThrow();
    });

    it('rejects invalid email', () => {
      expect(() => {
        SignupSchema.parse({
          body: {
            email: 'invalid-email',
            password: 'password123',
          },
        });
      }).toThrow('Invalid email address');
    });

    it('rejects password too short', () => {
      expect(() => {
        SignupSchema.parse({
          body: {
            email: 'test@example.com',
            password: '12345', // less than 6 characters
          },
        });
      }).toThrow('Password must be at least 6 characters');
    });

    it('rejects password too long', () => {
      expect(() => {
        SignupSchema.parse({
          body: {
            email: 'test@example.com',
            password: 'a'.repeat(101), // more than 100 characters
          },
        });
      }).toThrow('Password must be at most 100 characters');
    });

    it('rejects missing password', () => {
      expect(() => {
        SignupSchema.parse({
          body: {
            email: 'test@example.com',
          },
        });
      }).toThrow('Password is required');
    });
  });

  describe('SigninSchema', () => {
    it('validates valid signin data', () => {
      const result = SigninSchema.parse({
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
      });

      expect(result.body.email).toBe('test@example.com');
      expect(result.body.password).toBe('password123');
    });

    it('rejects invalid email', () => {
      expect(() => {
        SigninSchema.parse({
          body: {
            email: 'invalid-email',
            password: 'password123',
          },
        });
      }).toThrow('Invalid email address');
    });

    it('allows any password length for signin', () => {
      const result = SigninSchema.parse({
        body: {
          email: 'test@example.com',
          password: 'x', // single character
        },
      });

      expect(result.body.password).toBe('x');
    });

    it('rejects missing password', () => {
      expect(() => {
        SigninSchema.parse({
          body: {
            email: 'test@example.com',
          },
        });
      }).toThrow('Password is required');
    });

    it('rejects empty password', () => {
      expect(() => {
        SigninSchema.parse({
          body: {
            email: 'test@example.com',
            password: '',
          },
        });
      }).toThrow('Password is required');
    });
  });
});