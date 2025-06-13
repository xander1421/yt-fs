// Test setup for Vitest
import { vi } from 'vitest';

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock Chrome extension APIs
global.chrome = {
  commands: {
    onCommand: {
      addListener: vi.fn(),
    },
  },
} as any;

// Mock location object
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/watch',
    href: 'https://www.youtube.com/watch?v=test',
  },
  writable: true,
});

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  sessionStorageMock.getItem.mockReturnValue(null);
}); 