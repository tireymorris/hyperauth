import { describe, expect, it } from 'bun:test';
import { normalizeEmail } from '@/utils/email';

describe('Email Utilities', () => {
  describe('normalizeEmail', () => {
    it('should trim whitespace and convert to lowercase', () => {
      expect(normalizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
    });

    it('should preserve Gmail dots (only removes plus addressing)', () => {
      expect(normalizeEmail('test.email@gmail.com')).toBe('test.email@gmail.com');
    });

    it('should handle Gmail plus addressing', () => {
      expect(normalizeEmail('test+tag@gmail.com')).toBe('test@gmail.com');
      expect(normalizeEmail('test+tag+another@gmail.com')).toBe('test@gmail.com');
    });

    it('should handle multiple transformations', () => {
      expect(normalizeEmail('  TEST.EMAIL+TAG@GMAIL.COM  ')).toBe('test.email@gmail.com');
    });

    it('should handle emails without @ symbol', () => {
      expect(normalizeEmail('invalid-email')).toBe('invalid-email');
    });

    it('should handle emails with empty local part', () => {
      expect(normalizeEmail('@example.com')).toBe('@example.com');
    });

    it('should handle emails with empty domain', () => {
      expect(normalizeEmail('test@')).toBe('test@');
    });

    it('should handle regular emails without special characters', () => {
      expect(normalizeEmail('user@domain.com')).toBe('user@domain.com');
    });

    it('should handle uppercase domains', () => {
      expect(normalizeEmail('user@DOMAIN.COM')).toBe('user@domain.com');
    });
  });
});
