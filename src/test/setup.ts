/*
 * @Author: Maybe 191极速3102@qq.com
 * @Date: 2025-09-07 17:53:28
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-09-07 17:53:43
 * @FilePath: \Tauri-React-Ai\src\test\setup.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koro1FileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9极速%8D%E7%BD%AE
 */
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Mock window.__TAURI__ for testing
Object.defineProperty(window, '__TAURI__', {
  value: {
    invoke: vi.fn(),
  },
  writable: true,
});

// Setup global test utilities (Vitest already provides these globally)

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});