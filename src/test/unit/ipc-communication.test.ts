import { invoke } from '@tauri-apps/api/core';
import { SystemMonitorAPI } from '../../lib/api';
import { IPCTestUtils, mockInvoke } from '../utils/ipc-test-utils';
import { IPCMock, IPCTestEnvironment } from '../utils/ipc-mock';
import { vi } from 'vitest';

// Mock the invoke function
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('IPC通信单元测试', () => {
  beforeEach(() => {
    // 重置所有模拟
    IPCTestUtils.resetMocks();
    IPCTestEnvironment.setup();
    
    // 设置mock的invoke函数
    (invoke as any).mockImplementation(IPCTestUtils.getMockInvoke());
  });

  afterEach(() => {
    // 清理所有模拟
    IPCTestUtils.clearMocks();
    IPCTestEnvironment.teardown();
  });

  describe('命令调用验证', () => {
    it('应该验证greet命令的正确调用', async () => {
      // 设置模拟返回值
      const mockResponse = 'Hello, Unit Test! You\'ve been greeted from Rust!';
      IPCTestUtils.mockIPCCommand('greet', mockResponse);

      // 调用API
      const result = await SystemMonitorAPI.greet('Unit Test');

      // 验证结果
      expect(result).toBe(mockResponse);
      
      // 验证IPC调用
      IPCTestUtils.verifyIPCCommandCalledWith('greet', { name: 'Unit Test' });
    });

    it('应该验证get_system_info命令的正确调用', async () => {
      // 设置模拟返回值
      const mockSystemInfo = IPCTestUtils.getMockSystemInfo();
      IPCTestUtils.mockIPCCommand('get_system_info', mockSystemInfo);

      // 调用API
      const result = await SystemMonitorAPI.getSystemInfo();

      // 验证结果
      expect(result).toEqual(mockSystemInfo);
      
      // 验证IPC调用
      IPCTestUtils.verifyIPCCommandCalled('get_system_info');
    });

    it('应该验证get_cpu_info命令的正确调用', async () => {
      // 设置模拟返回值
      const mockCpuInfo = IPCTestUtils.getMockCpuInfo();
      IPCTestUtils.mockIPCCommand('get_cpu_info', mockCpuInfo);

      // 调用API
      const result = await SystemMonitorAPI.getCpuInfo();

      // 验证结果
      expect(result).toEqual(mockCpuInfo);
      
      // 验证IPC调用
      IPCTestUtils.verifyIPCCommandCalled('get_cpu_info');
    });

    it('应该验证get_memory_info命令的正确调用', async () => {
      // 设置模拟返回值
      const mockMemoryInfo = IPCTestUtils.getMockMemoryInfo();
      IPCTestUtils.mockIPCCommand('get_memory_info', mockMemoryInfo);

      // 调用API
      const result = await SystemMonitorAPI.getMemoryInfo();

      // 验证结果
      expect(result).toEqual(mockMemoryInfo);
      
      // 验证IPC调用
      IPCTestUtils.verifyIPCCommandCalled('get_memory_info');
    });

    it('应该验证get_disk_info命令的正确调用', async () => {
      // 设置模拟返回值
      const mockDiskInfo = IPCTestUtils.getMockDiskInfo();
      IPCTestUtils.mockIPCCommand('get_disk_info', mockDiskInfo);

      // 调用API
      const result = await SystemMonitorAPI.getDiskInfo();

      // 验证结果
      expect(result).toEqual(mockDiskInfo);
      
      // 验证IPC调用
      IPCTestUtils.verifyIPCCommandCalled('get_disk_info');
    });

    it('应该验证get_network_status命令的正确调用', async () => {
      // 设置模拟返回值
      const mockNetworkStatus = IPCTestUtils.getMockNetworkStatus();
      IPCTestUtils.mockIPCCommand('get_network_status', mockNetworkStatus);

      // 调用API
      const result = await SystemMonitorAPI.getNetworkStatus();

      // 验证结果
      expect(result).toEqual(mockNetworkStatus);
      
      // 验证IPC调用
      IPCTestUtils.verifyIPCCommandCalled('get_network_status');
    });

    it('应该验证get_audio_devices命令的正确调用', async () => {
      // 设置模拟返回值
      const mockAudioDevices = IPCTestUtils.getMockAudioDevices();
      IPCTestUtils.mockIPCCommand('get_audio_devices', mockAudioDevices);

      // 调用API
      const result = await SystemMonitorAPI.getAudioDevices();

      // 验证结果
      expect(result).toEqual(mockAudioDevices);
      
      // 验证IPC调用
      IPCTestUtils.verifyIPCCommandCalled('get_audio_devices');
    });

    it('应该验证ping_host命令的正确调用', async () => {
      // 设置模拟返回值
      const mockResponse = 'Ping 192.168.1.1 成功: 时间=10ms';
      IPCTestUtils.mockIPCCommand('ping_host', mockResponse);

      // 调用API
      const result = await SystemMonitorAPI.pingHost('192.168.1.1');

      // 验证结果
      expect(result).toBe(mockResponse);
      
      // 验证IPC调用
      IPCTestUtils.verifyIPCCommandCalledWith('ping_host', { host: '192.168.1.1' });
    });

    it('应该验证get_uptime命令的正确调用', async () => {
      // 设置模拟返回值
      const mockUptime = 7200;
      IPCTestUtils.mockIPCCommand('get_uptime', mockUptime);

      // 调用API
      const result = await SystemMonitorAPI.getUptime();

      // 验证结果
      expect(result).toBe(mockUptime);
      
      // 验证IPC调用
      IPCTestUtils.verifyIPCCommandCalled('get_uptime');
    });

    it('应该验证get_processes命令的正确调用', async () => {
      // 设置模拟返回值
      const mockProcesses = IPCTestUtils.getMockProcesses();
      IPCTestUtils.mockIPCCommand('get_processes', mockProcesses);

      // 调用API
      const result = await SystemMonitorAPI.getProcesses();

      // 验证结果
      expect(result).toEqual(mockProcesses);
      
      // 验证IPC调用
      IPCTestUtils.verifyIPCCommandCalled('get_processes');
    });

    it('应该验证get_gpu_info命令的正确调用', async () => {
      // 设置模拟返回值
      const mockGpuInfo = IPCTestUtils.getMockGpuInfo();
      IPCTestUtils.mockIPCCommand('get_gpu_info', mockGpuInfo);

      // 调用API
      const result = await SystemMonitorAPI.getGpuInfo();

      // 验证结果
      expect(result).toEqual(mockGpuInfo);
      
      // 验证IPC调用
      IPCTestUtils.verifyIPCCommandCalled('get_gpu_info');
    });
  });

  describe('错误处理', () => {
    it('应该正确处理greet命令的错误', async () => {
      // 设置模拟抛出错误
      IPCTestUtils.mockIPCCommand('greet', null, true);

      // 验证抛出错误
      await expect(SystemMonitorAPI.greet('Test')).rejects.toThrow('Mocked error for command: greet');
    });

    it('应该正确处理get_system_info命令的错误', async () => {
      // 设置模拟抛出错误
      IPCTestUtils.mockIPCCommand('get_system_info', null, true);

      // 验证抛出错误
      await expect(SystemMonitorAPI.getSystemInfo()).rejects.toThrow('Mocked error for command: get_system_info');
    });

    it('应该正确处理get_cpu_info命令的错误', async () => {
      // 设置模拟抛出错误
      IPCTestUtils.mockIPCCommand('get_cpu_info', null, true);

      // 验证抛出错误
      await expect(SystemMonitorAPI.getCpuInfo()).rejects.toThrow('Mocked error for command: get_cpu_info');
    });

    it('应该正确处理ping_host命令的错误', async () => {
      // 设置模拟抛出错误
      IPCTestUtils.mockIPCCommand('ping_host', null, true);

      // 验证抛出错误
      await expect(SystemMonitorAPI.pingHost('8.8.8.8')).rejects.toThrow('Mocked error for command: ping_host');
    });
  });

  describe('参数验证', () => {
    it('应该验证ping_host命令的参数传递', async () => {
      // 设置模拟返回值
      const mockResponse = 'Ping test.example.com 成功: 时间=25ms';
      IPCTestUtils.mockIPCCommand('ping_host', mockResponse);

      // 调用API
      const result = await SystemMonitorAPI.pingHost('test.example.com');

      // 验证结果
      expect(result).toBe(mockResponse);
      
      // 验证IPC调用参数
      expect(mockInvoke).toHaveBeenCalledWith('ping_host', { host: 'test.example.com' });
    });

    it('应该验证greet命令的参数传递', async () => {
      // 设置模拟返回值
      const mockResponse = 'Hello, Parameter Test! You\'ve been greeted from Rust!';
      IPCTestUtils.mockIPCCommand('greet', mockResponse);

      // 调用API
      const result = await SystemMonitorAPI.greet('Parameter Test');

      // 验证结果
      expect(result).toBe(mockResponse);
      
      // 验证IPC调用参数
      expect(mockInvoke).toHaveBeenCalledWith('greet', { name: 'Parameter Test' });
    });
  });

  describe('返回值验证', () => {
    it('应该验证get_system_info返回值的结构', async () => {
      // 设置模拟返回值
      const mockSystemInfo = IPCTestUtils.getMockSystemInfo();
      IPCTestUtils.mockIPCCommand('get_system_info', mockSystemInfo);

      // 调用API
      const result = await SystemMonitorAPI.getSystemInfo();

      // 验证返回值结构
      expect(result).toHaveProperty('os_name');
      expect(result).toHaveProperty('os_version');
      expect(result).toHaveProperty('hostname');
      expect(result).toHaveProperty('kernel_version');
      expect(typeof result.os_name).toBe('string');
      expect(typeof result.os_version).toBe('string');
      expect(typeof result.hostname).toBe('string');
      expect(typeof result.kernel_version).toBe('string');
    });

    it('应该验证get_cpu_info返回值的结构', async () => {
      // 设置模拟返回值
      const mockCpuInfo = IPCTestUtils.getMockCpuInfo();
      IPCTestUtils.mockIPCCommand('get_cpu_info', mockCpuInfo);

      // 调用API
      const result = await SystemMonitorAPI.getCpuInfo();

      // 验证返回值结构
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('vendor_id');
      expect(result).toHaveProperty('cores');
      expect(result).toHaveProperty('usage');
      expect(typeof result.name).toBe('string');
      expect(typeof result.vendor_id).toBe('string');
      expect(typeof result.cores).toBe('number');
      expect(typeof result.usage).toBe('number');
      expect(result.usage).toBeGreaterThanOrEqual(0);
      expect(result.usage).toBeLessThanOrEqual(100);
    });

    it('应该验证get_memory_info返回值的结构', async () => {
      // 设置模拟返回值
      const mockMemoryInfo = IPCTestUtils.getMockMemoryInfo();
      IPCTestUtils.mockIPCCommand('get_memory_info', mockMemoryInfo);

      // 调用API
      const result = await SystemMonitorAPI.getMemoryInfo();

      // 验证返回值结构
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('available');
      expect(result).toHaveProperty('used');
      expect(result).toHaveProperty('usage_percent');
      expect(typeof result.total).toBe('number');
      expect(typeof result.available).toBe('number');
      expect(typeof result.used).toBe('number');
      expect(typeof result.usage_percent).toBe('number');
      expect(result.total).toBeGreaterThan(0);
      expect(result.usage_percent).toBeGreaterThanOrEqual(0);
      expect(result.usage_percent).toBeLessThanOrEqual(100);
    });

    it('应该验证get_disk_info返回值的结构', async () => {
      // 设置模拟返回值
      const mockDiskInfo = IPCTestUtils.getMockDiskInfo();
      IPCTestUtils.mockIPCCommand('get_disk_info', mockDiskInfo);

      // 调用API
      const result = await SystemMonitorAPI.getDiskInfo();

      // 验证返回值结构
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      const disk = result[0];
      expect(disk).toHaveProperty('name');
      expect(disk).toHaveProperty('mount_point');
      expect(disk).toHaveProperty('total_space');
      expect(disk).toHaveProperty('usage_percent');
      expect(typeof disk.name).toBe('string');
      expect(typeof disk.mount_point).toBe('string');
      expect(typeof disk.total_space).toBe('number');
      expect(typeof disk.usage_percent).toBe('number');
    });
  });

  describe('调用次数验证', () => {
    it('应该验证IPC命令的调用次数', async () => {
      // 设置模拟返回值
      IPCTestUtils.mockIPCCommand('get_system_info', IPCTestUtils.getMockSystemInfo());

      // 调用API多次
      await SystemMonitorAPI.getSystemInfo();
      await SystemMonitorAPI.getSystemInfo();
      await SystemMonitorAPI.getSystemInfo();

      // 验证调用次数
      expect(mockInvoke).toHaveBeenCalledTimes(3);
      expect(mockInvoke).toHaveBeenCalledWith('get_system_info', expect.anything());
    });

    it('应该验证不同命令的调用次数', async () => {
      // 设置模拟返回值
      IPCTestUtils.mockIPCCommand('get_system_info', IPCTestUtils.getMockSystemInfo());
      IPCTestUtils.mockIPCCommand('get_cpu_info', IPCTestUtils.getMockCpuInfo());

      // 调用不同API
      await SystemMonitorAPI.getSystemInfo();
      await SystemMonitorAPI.getSystemInfo();
      await SystemMonitorAPI.getCpuInfo();

      // 验证调用次数
      expect(mockInvoke).toHaveBeenCalledTimes(3);
      expect(mockInvoke).toHaveBeenCalledWith('get_system_info', expect.anything());
      expect(mockInvoke).toHaveBeenCalledWith('get_cpu_info', expect.anything());
    });
  });
});