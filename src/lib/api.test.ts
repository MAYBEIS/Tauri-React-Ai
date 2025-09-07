import { SystemMonitorAPI } from './api';
import { IPCTestUtils } from '../test/utils/ipc-test-utils';
import { invoke } from '@tauri-apps/api/core';
import { vi } from 'vitest';

// Mock the invoke function
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('SystemMonitorAPI', () => {
  beforeEach(() => {
    // 重置所有模拟
    IPCTestUtils.resetMocks();
    // 设置mock的invoke函数
    (invoke as any).mockImplementation(IPCTestUtils.getMockInvoke());
  });

  afterEach(() => {
    // 清理所有模拟
    IPCTestUtils.clearMocks();
  });

  describe('greet', () => {
    it('应该正确调用greet命令', async () => {
      // 设置模拟返回值
      IPCTestUtils.mockIPCCommand('greet', 'Hello, Test! You\'ve been greeted from Rust!');

      // 调用API
      const result = await SystemMonitorAPI.greet('Test');

      // 验证结果
      expect(result).toBe('Hello, Test! You\'ve been greeted from Rust!');
      
      // 验证IPC调用
      IPCTestUtils.verifyIPCCommandCalledWith('greet', { name: 'Test' });
    });

    it('应该处理greet命令的错误', async () => {
      // 设置模拟抛出错误
      IPCTestUtils.mockIPCCommand('greet', null, true);

      // 验证抛出错误
      await expect(SystemMonitorAPI.greet('Test')).rejects.toThrow('Mocked error for command: greet');
    });
  });

  describe('getSystemInfo', () => {
    it('应该正确获取系统信息', async () => {
      // 设置模拟返回值
      const mockSystemInfo = IPCTestUtils.getMockSystemInfo();
      IPCTestUtils.mockIPCCommand('get_system_info', mockSystemInfo);

      // 调用API
      const result = await SystemMonitorAPI.getSystemInfo();

      // 验证结果
      expect(result).toEqual(mockSystemInfo);
      expect(result.os_name).toBe('Windows 10');
      expect(result.hostname).toBe('Test-PC');
      
      // 验证IPC调用
      IPCTestUtils.verifyIPCCommandCalled('get_system_info');
    });
  });

  describe('getCpuInfo', () => {
    it('应该正确获取CPU信息', async () => {
      // 设置模拟返回值
      const mockCpuInfo = IPCTestUtils.getMockCpuInfo();
      IPCTestUtils.mockIPCCommand('get_cpu_info', mockCpuInfo);

      // 调用API
      const result = await SystemMonitorAPI.getCpuInfo();

      // 验证结果
      expect(result).toEqual(mockCpuInfo);
      expect(result.name).toContain('Intel');
      expect(result.cores).toBe(16);
      expect(result.usage).toBe(25.5);
      
      // 验证IPC调用
      IPCTestUtils.verifyIPCCommandCalled('get_cpu_info');
    });
  });

  describe('getMemoryInfo', () => {
    it('应该正确获取内存信息', async () => {
      // 设置模拟返回值
      const mockMemoryInfo = IPCTestUtils.getMockMemoryInfo();
      IPCTestUtils.mockIPCCommand('get_memory_info', mockMemoryInfo);

      // 调用API
      const result = await SystemMonitorAPI.getMemoryInfo();

      // 验证结果
      expect(result).toEqual(mockMemoryInfo);
      expect(result.total).toBe(17179869184);
      expect(result.usage_percent).toBe(50.0);
      
      // 验证IPC调用
      IPCTestUtils.verifyIPCCommandCalled('get_memory_info');
    });
  });

  describe('getDiskInfo', () => {
    it('应该正确获取磁盘信息', async () => {
      // 设置模拟返回值
      const mockDiskInfo = IPCTestUtils.getMockDiskInfo();
      IPCTestUtils.mockIPCCommand('get_disk_info', mockDiskInfo);

      // 调用API
      const result = await SystemMonitorAPI.getDiskInfo();

      // 验证结果
      expect(result).toEqual(mockDiskInfo);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Local Disk');
      expect(result[0].file_system).toBe('NTFS');
      
      // 验证IPC调用
      IPCTestUtils.verifyIPCCommandCalled('get_disk_info');
    });
  });

  describe('getNetworkStatus', () => {
    it('应该正确获取网络状态', async () => {
      // 设置模拟返回值
      const mockNetworkStatus = IPCTestUtils.getMockNetworkStatus();
      IPCTestUtils.mockIPCCommand('get_network_status', mockNetworkStatus);

      // 调用API
      const result = await SystemMonitorAPI.getNetworkStatus();

      // 验证结果
      expect(result).toEqual(mockNetworkStatus);
      expect(result.is_connected).toBe(true);
      expect(result.interfaces).toHaveLength(1);
      expect(result.local_ip).toBe('192.168.1.100');
      
      // 验证IPC调用
      IPCTestUtils.verifyIPCCommandCalled('get_network_status');
    });
  });

  describe('getAudioDevices', () => {
    it('应该正确获取音频设备列表', async () => {
      // 设置模拟返回值
      const mockAudioDevices = IPCTestUtils.getMockAudioDevices();
      IPCTestUtils.mockIPCCommand('get_audio_devices', mockAudioDevices);

      // 调用API
      const result = await SystemMonitorAPI.getAudioDevices();

      // 验证结果
      expect(result).toEqual(mockAudioDevices);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Speakers');
      expect(result[0].is_output).toBe(true);
      expect(result[1].name).toBe('Microphone');
      expect(result[1].is_input).toBe(true);
      
      // 验证IPC调用
      IPCTestUtils.verifyIPCCommandCalled('get_audio_devices');
    });
  });

  describe('pingHost', () => {
    it('应该正确执行ping命令', async () => {
      // 设置模拟返回值
      IPCTestUtils.mockIPCCommand('ping_host', 'Ping 8.8.8.8 成功: 时间=15ms');

      // 调用API
      const result = await SystemMonitorAPI.pingHost('8.8.8.8');

      // 验证结果
      expect(result).toBe('Ping 8.8.8.8 成功: 时间=15ms');
      
      // 验证IPC调用
      IPCTestUtils.verifyIPCCommandCalledWith('ping_host', { host: '8.8.8.8' });
    });
  });

  describe('getUptime', () => {
    it('应该正确获取系统运行时间', async () => {
      // 设置模拟返回值
      IPCTestUtils.mockIPCCommand('get_uptime', 3600);

      // 调用API
      const result = await SystemMonitorAPI.getUptime();

      // 验证结果
      expect(result).toBe(3600);
      
      // 验证IPC调用
      IPCTestUtils.verifyIPCCommandCalled('get_uptime');
    });
  });

  describe('getProcesses', () => {
    it('应该正确获取进程列表', async () => {
      // 设置模拟返回值
      const mockProcesses = IPCTestUtils.getMockProcesses();
      IPCTestUtils.mockIPCCommand('get_processes', mockProcesses);

      // 调用API
      const result = await SystemMonitorAPI.getProcesses();

      // 验证结果
      expect(result).toEqual(mockProcesses);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('chrome.exe');
      expect(result[0].pid).toBe('1234');
      
      // 验证IPC调用
      IPCTestUtils.verifyIPCCommandCalled('get_processes');
    });
  });

  describe('getGpuInfo', () => {
    it('应该正确获取GPU信息', async () => {
      // 设置模拟返回值
      const mockGpuInfo = IPCTestUtils.getMockGpuInfo();
      IPCTestUtils.mockIPCCommand('get_gpu_info', mockGpuInfo);

      // 调用API
      const result = await SystemMonitorAPI.getGpuInfo();

      // 验证结果
      expect(result).toEqual(mockGpuInfo);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('NVIDIA GeForce RTX 3080');
      expect(result[0].vendor).toBe('NVIDIA');
      expect(result[0].usage_percent).toBe(60.0);
      
      // 验证IPC调用
      IPCTestUtils.verifyIPCCommandCalled('get_gpu_info');
    });
  });
});