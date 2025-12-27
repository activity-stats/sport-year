import { describe, it, expect, beforeEach } from 'vitest';
import { useLoadingStore, type LoadingStage } from '../loadingStore';

describe('loadingStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useLoadingStore.getState().reset();
  });

  describe('initial state', () => {
    it('should start with idle stage', () => {
      const { stage } = useLoadingStore.getState();
      expect(stage).toBe('idle');
    });

    it('should start with null error', () => {
      const { error } = useLoadingStore.getState();
      expect(error).toBeNull();
    });
  });

  describe('setStage', () => {
    it('should update stage', () => {
      const { setStage } = useLoadingStore.getState();

      setStage('checking');
      expect(useLoadingStore.getState().stage).toBe('checking');

      setStage('fetching');
      expect(useLoadingStore.getState().stage).toBe('fetching');

      setStage('transforming');
      expect(useLoadingStore.getState().stage).toBe('transforming');
    });

    it('should clear error when setting stage', () => {
      const { setStage, setError } = useLoadingStore.getState();

      // Set an error first
      setError('Test error');
      expect(useLoadingStore.getState().error).toBe('Test error');

      // Setting stage should clear error
      setStage('fetching');
      expect(useLoadingStore.getState().error).toBeNull();
    });

    it('should handle all loading stages', () => {
      const { setStage } = useLoadingStore.getState();
      const stages: LoadingStage[] = [
        'idle',
        'checking',
        'fetching',
        'transforming',
        'aggregating',
        'complete',
        'error',
      ];

      stages.forEach((stage) => {
        setStage(stage);
        expect(useLoadingStore.getState().stage).toBe(stage);
      });
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      const { setError } = useLoadingStore.getState();

      setError('Something went wrong');
      expect(useLoadingStore.getState().error).toBe('Something went wrong');
    });

    it('should set stage to error', () => {
      const { setError } = useLoadingStore.getState();

      setError('Test error');
      expect(useLoadingStore.getState().stage).toBe('error');
    });

    it('should update error message when called multiple times', () => {
      const { setError } = useLoadingStore.getState();

      setError('First error');
      expect(useLoadingStore.getState().error).toBe('First error');

      setError('Second error');
      expect(useLoadingStore.getState().error).toBe('Second error');
    });
  });

  describe('reset', () => {
    it('should reset stage to idle', () => {
      const { setStage, reset } = useLoadingStore.getState();

      setStage('fetching');
      expect(useLoadingStore.getState().stage).toBe('fetching');

      reset();
      expect(useLoadingStore.getState().stage).toBe('idle');
    });

    it('should reset error to null', () => {
      const { setError, reset } = useLoadingStore.getState();

      setError('Test error');
      expect(useLoadingStore.getState().error).toBe('Test error');

      reset();
      expect(useLoadingStore.getState().error).toBeNull();
    });

    it('should reset both stage and error', () => {
      const { setStage, setError, reset } = useLoadingStore.getState();

      setStage('fetching');
      setError('Some error');

      reset();

      const state = useLoadingStore.getState();
      expect(state.stage).toBe('idle');
      expect(state.error).toBeNull();
    });
  });

  describe('loading workflow', () => {
    it('should support typical loading progression', () => {
      const { setStage } = useLoadingStore.getState();

      setStage('checking');
      expect(useLoadingStore.getState().stage).toBe('checking');

      setStage('fetching');
      expect(useLoadingStore.getState().stage).toBe('fetching');

      setStage('transforming');
      expect(useLoadingStore.getState().stage).toBe('transforming');

      setStage('aggregating');
      expect(useLoadingStore.getState().stage).toBe('aggregating');

      setStage('complete');
      expect(useLoadingStore.getState().stage).toBe('complete');
    });

    it('should handle error during loading', () => {
      const { setStage, setError } = useLoadingStore.getState();

      setStage('fetching');
      expect(useLoadingStore.getState().stage).toBe('fetching');

      setError('Network error');
      expect(useLoadingStore.getState().stage).toBe('error');
      expect(useLoadingStore.getState().error).toBe('Network error');
    });

    it('should allow recovery from error', () => {
      const { setStage, setError } = useLoadingStore.getState();

      setError('Network error');
      expect(useLoadingStore.getState().stage).toBe('error');

      // Retry - should clear error
      setStage('fetching');
      expect(useLoadingStore.getState().stage).toBe('fetching');
      expect(useLoadingStore.getState().error).toBeNull();
    });
  });
});
