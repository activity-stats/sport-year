import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingProgress, type LoadingStep } from '../LoadingProgress';

describe('LoadingProgress', () => {
  it('renders loading progress with steps', () => {
    const steps: LoadingStep[] = [
      { id: 'step1', label: 'Step 1', status: 'complete' },
      { id: 'step2', label: 'Step 2', status: 'active' },
      { id: 'step3', label: 'Step 3', status: 'pending' },
    ];

    render(<LoadingProgress steps={steps} />);

    expect(screen.getByText('Loading Your Activities')).toBeInTheDocument();
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Step 3')).toBeInTheDocument();
  });

  it('calculates progress percentage correctly', () => {
    const steps: LoadingStep[] = [
      { id: 'step1', label: 'Step 1', status: 'complete' },
      { id: 'step2', label: 'Step 2', status: 'complete' },
      { id: 'step3', label: 'Step 3', status: 'pending' },
      { id: 'step4', label: 'Step 4', status: 'pending' },
    ];

    render(<LoadingProgress steps={steps} />);

    // 2 complete out of 4 = 50%
    expect(screen.getByText('50% Complete')).toBeInTheDocument();
  });

  it('shows 100% when all steps are complete', () => {
    const steps: LoadingStep[] = [
      { id: 'step1', label: 'Step 1', status: 'complete' },
      { id: 'step2', label: 'Step 2', status: 'complete' },
    ];

    render(<LoadingProgress steps={steps} />);

    expect(screen.getByText('100% Complete')).toBeInTheDocument();
  });

  it('shows 0% when no steps are complete', () => {
    const steps: LoadingStep[] = [
      { id: 'step1', label: 'Step 1', status: 'pending' },
      { id: 'step2', label: 'Step 2', status: 'pending' },
    ];

    render(<LoadingProgress steps={steps} />);

    expect(screen.getByText('0% Complete')).toBeInTheDocument();
  });

  it('displays all step statuses correctly', () => {
    const steps: LoadingStep[] = [
      { id: 'step1', label: 'Completed Step', status: 'complete' },
      { id: 'step2', label: 'Active Step', status: 'active' },
      { id: 'step3', label: 'Pending Step', status: 'pending' },
      { id: 'step4', label: 'Error Step', status: 'error' },
    ];

    render(<LoadingProgress steps={steps} />);

    // Verify all step labels are visible
    expect(screen.getByText('Completed Step')).toBeInTheDocument();
    expect(screen.getByText('Active Step')).toBeInTheDocument();
    expect(screen.getByText('Pending Step')).toBeInTheDocument();
    expect(screen.getByText('Error Step')).toBeInTheDocument();
  });
});
