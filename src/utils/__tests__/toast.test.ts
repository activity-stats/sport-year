import { describe, it, expect, vi, beforeEach } from 'vitest';
import toast from 'react-hot-toast';
import { showSuccess, showError, showInfo, showWarning, showPromise } from '../toast';

// Mock react-hot-toast
vi.mock('react-hot-toast');

describe('toast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('showSuccess', () => {
    it('should call toast.success with correct message and options', () => {
      showSuccess('Operation successful');

      expect(toast.success).toHaveBeenCalledWith('Operation successful', {
        duration: 5000,
        style: expect.objectContaining({
          background: '#10B981',
          color: '#fff',
          fontSize: '16px',
          fontWeight: '500',
          minWidth: '300px',
        }),
        iconTheme: {
          primary: '#fff',
          secondary: '#10B981',
        },
        ariaProps: {
          role: 'status',
          'aria-live': 'polite',
        },
      });
    });
  });

  describe('showError', () => {
    it('should call toast.error with correct message and options', () => {
      showError('An error occurred');

      expect(toast.error).toHaveBeenCalledWith('An error occurred', {
        duration: 8000,
        style: expect.objectContaining({
          background: '#EF4444',
          color: '#fff',
          fontSize: '16px',
        }),
        iconTheme: {
          primary: '#fff',
          secondary: '#EF4444',
        },
        ariaProps: {
          role: 'alert',
          'aria-live': 'assertive',
        },
      });
    });
  });

  describe('showInfo', () => {
    it('should call toast with info styling', () => {
      showInfo('Information message');

      expect(toast).toHaveBeenCalledWith('Information message', {
        duration: 5000,
        icon: 'ℹ️',
        style: expect.objectContaining({
          background: '#3B82F6',
          color: '#fff',
          fontSize: '16px',
        }),
        ariaProps: {
          role: 'status',
          'aria-live': 'polite',
        },
      });
    });
  });

  describe('showWarning', () => {
    it('should call toast with warning styling', () => {
      showWarning('Warning message');

      expect(toast).toHaveBeenCalledWith('Warning message', {
        duration: 6000,
        icon: '⚠️',
        style: expect.objectContaining({
          background: '#F59E0B',
          color: '#fff',
          fontSize: '16px',
        }),
        ariaProps: {
          role: 'status',
          'aria-live': 'polite',
        },
      });
    });
  });

  describe('showPromise', () => {
    it('should call toast.promise with correct arguments', async () => {
      const promise = Promise.resolve('success');
      const messages = {
        loading: 'Loading...',
        success: 'Success!',
        error: 'Error!',
      };

      showPromise(promise, messages);

      expect(toast.promise).toHaveBeenCalledWith(
        promise,
        {
          loading: 'Loading...',
          success: 'Success!',
          error: 'Error!',
        },
        {
          style: {
            padding: '16px',
            borderRadius: '8px',
          },
        }
      );
    });

    it('should handle rejected promises', async () => {
      const promise = Promise.reject(new Error('test error'));
      const messages = {
        loading: 'Processing...',
        success: 'Done!',
        error: 'Failed!',
      };

      showPromise(promise, messages);

      expect(toast.promise).toHaveBeenCalledWith(promise, messages, expect.any(Object));

      // Catch the rejection to prevent unhandled rejection error
      await promise.catch(() => {});
    });
  });
});
