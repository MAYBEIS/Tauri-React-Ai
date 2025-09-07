import { SystemMonitorAPI } from '../../lib/api';
import { IPCMock, IPCTestEnvironment, createIPCTestSuite } from '../utils/ipc-mock';
import { vi } from 'vitest';

// Mock the invoke function
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('IPC集成测试', () => {
  beforeAll(() => {
    IPCTestEnvironment.setup();
  });

  afterAll(() => {
    IPCTestEnvironment.teardown();
  });

  beforeEach(() => {
    IPCMock.reset();
  });

  afterEach(() => {
    // 清理工作在teardown中完成
  });

  describe('基本IPC通信测试', () => {
    it('应该能够成功调用greet命令', async () => {
      const result = await SystemMonitorAPI.greet('Integration Test');
      expect(result).toBe('Hello, Integration Test! You\'ve been greeted from Rust!');
    });

    it('应该能够获取系统信息', async () => {
      const result = await SystemMonitorAPI.getSystemInfo();
      expect(result).toBeDefined();
      expect(result.os_name).toBe('Mocked OS');
      expect(result.hostname).toBe('mocked-host');
    });

    it('应该能够获取CPU信息', async () => {
      const result = await SystemMonitorAPI.getCpuInfo();
      expect(result).toBeDefined();
      expect(result.name).toBe('Mocked CPU');
      expect(result.cores).toBe(8);
      expect(result.usage).toBe(50.0);
    });

    it('应该能够获取内存信息', async () => {
      const result = await SystemMonitorAPI.getMemoryInfo();
      expect(result).toBeDefined();
      expect(result.total).toBe(8589934592);
      expect(result.usage_percent).toBe(50.0);
    });

    it('应该能够获取磁盘信息', async () => {
      const result = await SystemMonitorAPI.getDiskInfo();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Mocked Disk');
    });

    it('应该能够获取网络状态', async () => {
      const result = await SystemMonitorAPI.getNetworkStatus();
      expect(result).toBeDefined();
      expect(result.is_connected).toBe(true);
      expect(result.interfaces).toHaveLength(1);
      expect(result.local_ip).toBe('192.168.1.100');
    });

    it('应该能够获取音频设备列表', async () => {
      const result = await SystemMonitorAPI.getAudioDevices();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Mocked Speaker');
      expect(result[1].name).toBe('Mocked Microphone');
    });

    it('应该能够执行ping命令', async () => {
      const result = await SystemMonitorAPI.pingHost('8.8.8.8');
      expect(result).toBeDefined();
      expect(result).toContain('Ping 8.8.8.8 成功');
    });

    it('应该能够获取系统运行时间', async () => {
      const result = await SystemMonitorAPI.getUptime();
      expect(result).toBeDefined();
      expect(result).toBe(3600);
    });

    it('应该能够获取进程列表', async () => {
      const result = await SystemMonitorAPI.getProcesses();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('mocked-process');
    });

    it('应该能够获取GPU信息', async () => {
      const result = await SystemMonitorAPI.getGpuInfo();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Mocked GPU');
    });
  });

  describe('错误处理测试', () => {
    it('应该正确处理IPC调用错误', async () => {
      // 模拟错误响应
      IPCMock.simulateError('greet', 'Test error message');
      
      await expect(SystemMonitorAPI.greet('Test')).rejects.toThrow('Test error message');
      
      // 重置为正常状态
      IPCMock.reset();
    });

    it('应该正确处理网络延迟', async () => {
      // 模拟网络延迟
      IPCMock.simulateNetworkDelay('get_system_info', 100);
      
      const startTime = Date.now();
      const result = await SystemMonitorAPI.getSystemInfo();
      const endTime = Date.now();
      
      expect(result).toBeDefined();
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
      
      // 重置为正常状态
      IPCMock.reset();
    });

    it('应该正确处理网络错误', async () => {
      // 模拟网络错误
      IPCMock.simulateNetworkError('ping_host');
      
      await expect(SystemMonitorAPI.pingHost('8.8.8.8')).rejects.toThrow('Network error');
      
      // 重置为正常状态
      IPCMock.reset();
    });
  });

  describe('并发调用测试', () => {
    it('应该能够正确处理并发IPC调用', async () => {
      // 同时调用多个IPC命令
      const promises = [
        SystemMonitorAPI.getSystemInfo(),
        SystemMonitorAPI.getCpuInfo(),
        SystemMonitorAPI.getMemoryInfo(),
        SystemMonitorAPI.getDiskInfo(),
      ];

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(4);
      expect(results[0]).toBeDefined(); // SystemInfo
      expect(results[1]).toBeDefined(); // CpuInfo
      expect(results[2]).toBeDefined(); // MemoryInfo
      expect(results[3]).toBeDefined(); // DiskInfo
    });

    it('应该能够正确处理混合的成功和失败调用', async () => {
      // 设置一个命令会失败
      IPCMock.simulateError('get_system_info', 'Concurrent test error');
      
      const promises = [
        SystemMonitorAPI.getSystemInfo(), // 这会失败
        SystemMonitorAPI.getCpuInfo(),     // 这会成功
      ];

      const results = await Promise.allSettled(promises);
      
      expect(results).toHaveLength(2);
      expect(results[0].status).toBe('rejected');
      expect(results[1].status).toBe('fulfilled');
      
      if (results[1].status === 'fulfilled') {
        expect(results[1].value).toBeDefined();
      }
      
      // 重置为正常状态
      IPCMock.reset();
    });
  });

  describe('数据一致性测试', () => {
    it('应该返回一致的数据结构', async () => {
      const systemInfo = await SystemMonitorAPI.getSystemInfo();
      const cpuInfo = await SystemMonitorAPI.getCpuInfo();
      const memoryInfo = await SystemMonitorAPI.getMemoryInfo();

      // 验证系统信息结构
      expect(systemInfo).toHaveProperty('os_name');
      expect(systemInfo).toHaveProperty('os_version');
      expect(systemInfo).toHaveProperty('hostname');
      expect(systemInfo).toHaveProperty('kernel_version');

      // 验证CPU信息结构
      expect(cpuInfo).toHaveProperty('name');
      expect(cpuInfo).toHaveProperty('vendor_id');
      expect(cpuInfo).toHaveProperty('cores');
      expect(cpuInfo).toHaveProperty('usage');

      // 验证内存信息结构
      expect(memoryInfo).toHaveProperty('total');
      expect(memoryInfo).toHaveProperty('available');
      expect(memoryInfo).toHaveProperty('used');
      expect(memoryInfo).toHaveProperty('usage_percent');
    });

    it('应该返回合理的数值范围', async () => {
      const cpuInfo = await SystemMonitorAPI.getCpuInfo();
      const memoryInfo = await SystemMonitorAPI.getMemoryInfo();

      // 验证CPU使用率在合理范围内
      expect(cpuInfo.usage).toBeGreaterThanOrEqual(0);
      expect(cpuInfo.usage).toBeLessThanOrEqual(100);

      // 验证内存使用率在合理范围内
      expect(memoryInfo.usage_percent).toBeGreaterThanOrEqual(0);
      expect(memoryInfo.usage_percent).toBeLessThanOrEqual(100);

      // 验证内存数值的逻辑关系
      expect(memoryInfo.total).toBeGreaterThan(0);
      expect(memoryInfo.available).toBeGreaterThan(0);
      expect(memoryInfo.used).toBeGreaterThan(0);
      expect(memoryInfo.free).toBeGreaterThan(0);
      expect(memoryInfo.used + memoryInfo.available).toBeLessThanOrEqual(memoryInfo.total);
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内完成单个IPC调用', async () => {
      const startTime = Date.now();
      await SystemMonitorAPI.getSystemInfo();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // 应该在100ms内完成
    });

    it('应该能够处理大量的IPC调用', async () => {
      const callCount = 50;
      const promises = Array(callCount).fill(null).map(() => 
        SystemMonitorAPI.getSystemInfo()
      );

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(callCount);
      expect(endTime - startTime).toBeLessThan(1000); // 50个调用应该在1秒内完成
    });
  });
});

// 使用测试套件创建器
createIPCTestSuite('使用测试套件创建器的IPC测试', () => {
  it('应该在测试套件中正常工作', async () => {
    const result = await SystemMonitorAPI.greet('Suite Test');
    expect(result).toBe('Hello, Suite Test! You\'ve been greeted from Rust!');
  });

  it('应该能够获取系统信息', async () => {
    const result = await SystemMonitorAPI.getSystemInfo();
    expect(result.os_name).toBe('Mocked OS');
  });
});