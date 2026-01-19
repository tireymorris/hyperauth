import { describe, expect, it } from 'bun:test';
import { getEmailDomain, getEmailUsername, normalizeEmail } from '@/utils/email';

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

  describe('getEmailDomain', () => {
    it('should extract domain from email', () => {
      expect(getEmailDomain('user@example.com')).toBe('example.com');
    });

    it('should handle Gmail plus addressing', () => {
      expect(getEmailDomain('user+tag@gmail.com')).toBe('gmail.com');
    });

    it('should handle Gmail dots', () => {
      expect(getEmailDomain('test.email@gmail.com')).toBe('gmail.com');
    });

    it('should handle invalid emails appropriately', () => {
      expect(getEmailDomain('invalid-email')).toBe('');
      expect(getEmailDomain('test@')).toBe('');
      expect(getEmailDomain('@domain.com')).toBe('domain.com');
    });

    it('should handle uppercase domains', () => {
      expect(getEmailDomain('user@EXAMPLE.COM')).toBe('example.com');
    });
  });

  describe('getEmailUsername', () => {
    it('should extract username from email', () => {
      expect(getEmailUsername('user@example.com')).toBe('user');
    });

    it('should handle Gmail plus addressing', () => {
      expect(getEmailUsername('user+tag@gmail.com')).toBe('user');
    });

    it('should preserve Gmail dots in username', () => {
      expect(getEmailUsername('test.email@gmail.com')).toBe('test.email');
    });

    it('should handle uppercase emails', () => {
      expect(getEmailUsername('USER@EXAMPLE.COM')).toBe('user');
    });

    it('should handle invalid emails appropriately', () => {
      expect(getEmailUsername('invalid-email')).toBe('invalid-email');
      expect(getEmailUsername('test@')).toBe('test');
      expect(getEmailUsername('@domain.com')).toBe('User');
    });
  });
});
