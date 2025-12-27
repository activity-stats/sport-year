import toast from 'react-hot-toast';

/**
 * Toast notification utility
 * Provides consistent toast messages across the application
 * Uses react-hot-toast library with custom styling
 * Accessibility features:
 * - ARIA live regions for screen readers
 * - Longer durations for low vision users
 * - High contrast colors
 * - Larger text and padding
 * - Icons + text for non-color indicators
 */

/**
 * Show success toast
 * @param message - Message to display
 */
export const showSuccess = (message: string) => {
  toast.success(message, {
    duration: 5000, // Increased from 3s to 5s for reading time
    style: {
      background: '#10B981',
      color: '#fff',
      padding: '16px 20px',
      borderRadius: '8px',
      fontSize: '16px', // Explicit larger font
      fontWeight: '500',
      minWidth: '300px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#10B981',
    },
    ariaProps: {
      role: 'status',
      'aria-live': 'polite',
    },
  });
};

/**
 * Show error toast
 * @param message - Error message to display
 */
export const showError = (message: string) => {
  toast.error(message, {
    duration: 8000, // Increased from 4s to 8s - errors need more time
    style: {
      background: '#EF4444',
      color: '#fff',
      padding: '16px 20px',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '500',
      minWidth: '300px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#EF4444',
    },
    ariaProps: {
      role: 'alert',
      'aria-live': 'assertive', // More urgent for errors
    },
  });
};

/**
 * Show info toast
 * @param message - Info message to display
 */
export const showInfo = (message: string) => {
  toast(message, {
    duration: 5000,
    icon: 'ℹ️',
    style: {
      background: '#3B82F6',
      color: '#fff',
      padding: '16px 20px',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '500',
      minWidth: '300px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
    ariaProps: {
      role: 'status',
      'aria-live': 'polite',
    },
  });
};

/**
 * Show warning toast
 * @param message - Warning message to display
 */
export const showWarning = (message: string) => {
  toast(message, {
    duration: 6000, // Increased from 3.5s to 6s
    icon: '⚠️',
    style: {
      background: '#F59E0B',
      color: '#fff',
      padding: '16px 20px',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '500',
      minWidth: '300px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
    ariaProps: {
      role: 'status',
      'aria-live': 'polite',
    },
  });
};

/**
 * Show loading toast with promise
 * Automatically shows success/error based on promise resolution
 * @param promise - Promise to track
 * @param messages - Loading, success, and error messages
 */
export const showPromise = <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    },
    {
      style: {
        padding: '16px',
        borderRadius: '8px',
      },
    }
  );
};
