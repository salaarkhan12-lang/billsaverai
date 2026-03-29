// Vitest global setup: minimal jest shim for legacy tests
import { vi } from 'vitest';

if (!(globalThis as any).jest) {
  (globalThis as any).jest = {
    fn: vi.fn,
    spyOn: vi.spyOn,
    mock: vi.mock,
    useFakeTimers: vi.useFakeTimers,
    useRealTimers: vi.useRealTimers,
    advanceTimersByTime: vi.advanceTimersByTime,
    runAllTimers: vi.runAllTimers,
    clearAllMocks: vi.clearAllMocks,
    resetAllMocks: vi.resetAllMocks,
    restoreAllMocks: vi.restoreAllMocks,
  } as any;
}
EOF; __hermes_rc=$?; printf '__HERMES_FENCE_a9f7b3__'; exit $__hermes_rc
