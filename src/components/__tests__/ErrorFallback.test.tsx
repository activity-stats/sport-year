import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorFallback } from '../ErrorFallback';

describe('ErrorFallback', () => {
  const mockOnReset = vi.fn();
  const mockError = new Error('Test error message');
  const mockErrorInfo = {
    componentStack: 'Component stack trace here',
  };

  beforeEach(() => {
    mockOnReset.mockClear();

    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        reload: vi.fn(),
      },
    });

    // Mock localStorage
    Storage.prototype.clear = vi.fn();
  });

  it('should render error fallback UI', () => {
    render(<ErrorFallback error={mockError} errorInfo={mockErrorInfo} onReset={mockOnReset} />);

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument();
  });

  it('should render action buttons', () => {
    render(<ErrorFallback error={mockError} errorInfo={mockErrorInfo} onReset={mockOnReset} />);

    expect(screen.getByText('Refresh Page')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Clear & Reset')).toBeInTheDocument();
  });

  it('should call window.location.reload when refresh button is clicked', () => {
    render(<ErrorFallback error={mockError} errorInfo={mockErrorInfo} onReset={mockOnReset} />);

    const refreshButton = screen.getByText('Refresh Page');
    fireEvent.click(refreshButton);

    expect(window.location.reload).toHaveBeenCalled();
  });

  it('should call onReset when try again button is clicked', () => {
    render(<ErrorFallback error={mockError} errorInfo={mockErrorInfo} onReset={mockOnReset} />);

    const tryAgainButton = screen.getByText('Try Again');
    fireEvent.click(tryAgainButton);

    expect(mockOnReset).toHaveBeenCalledOnce();
  });

  it('should clear localStorage and reload when clear & reset button is clicked', () => {
    render(<ErrorFallback error={mockError} errorInfo={mockErrorInfo} onReset={mockOnReset} />);

    const clearButton = screen.getByText('Clear & Reset');
    fireEvent.click(clearButton);

    expect(localStorage.clear).toHaveBeenCalled();
    expect(window.location.reload).toHaveBeenCalled();
  });

  it('should render GitHub issues link', () => {
    render(<ErrorFallback error={mockError} errorInfo={mockErrorInfo} onReset={mockOnReset} />);

    const link = screen.getByText('report an issue');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://github.com/activity-stats/sport-year/issues');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should handle null error', () => {
    render(<ErrorFallback error={null} errorInfo={null} onReset={mockOnReset} />);

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    expect(screen.queryByText('Error Details (Dev Only):')).not.toBeInTheDocument();
  });

  it('should handle null errorInfo', () => {
    render(<ErrorFallback error={mockError} errorInfo={null} onReset={mockOnReset} />);

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
  });

  it('should render error icon', () => {
    const { container } = render(
      <ErrorFallback error={mockError} errorInfo={mockErrorInfo} onReset={mockOnReset} />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
  });
});
