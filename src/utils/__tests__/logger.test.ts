import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../logger';

describe('logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('debug', () => {
    it('should call console.log with arguments', () => {
      logger.debug('test message', 123, { key: 'value' });
      expect(consoleLogSpy).toHaveBeenCalledWith('test message', 123, { key: 'value' });
    });

    it('should handle multiple arguments', () => {
      logger.debug('a', 'b', 'c');
      expect(consoleLogSpy).toHaveBeenCalledWith('a', 'b', 'c');
    });

    it('should handle single argument', () => {
      logger.debug('single');
      expect(consoleLogSpy).toHaveBeenCalledWith('single');
    });

    it('should handle no arguments', () => {
      logger.debug();
      expect(consoleLogSpy).toHaveBeenCalledWith();
    });
  });

  describe('info', () => {
    it('should call console.info with arguments', () => {
      logger.info('info message', 456);
      expect(consoleInfoSpy).toHaveBeenCalledWith('info message', 456);
    });

    it('should handle objects', () => {
      const obj = { data: 'test' };
      logger.info('object:', obj);
      expect(consoleInfoSpy).toHaveBeenCalledWith('object:', obj);
    });
  });

  describe('warn', () => {
    it('should call console.warn with arguments', () => {
      logger.warn('warning message');
      expect(consoleWarnSpy).toHaveBeenCalledWith('warning message');
    });

    it('should handle multiple arguments', () => {
      logger.warn('warn:', 'test', 123);
      expect(consoleWarnSpy).toHaveBeenCalledWith('warn:', 'test', 123);
    });
  });

  describe('error', () => {
    it('should call console.error with arguments', () => {
      logger.error('error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith('error message');
    });

    it('should handle Error objects', () => {
      const error = new Error('test error');
      logger.error('Error occurred:', error);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error occurred:', error);
    });

    it('should handle multiple arguments', () => {
      logger.error('error:', 'details', { code: 500 });
      expect(consoleErrorSpy).toHaveBeenCalledWith('error:', 'details', { code: 500 });
    });
  });
});
