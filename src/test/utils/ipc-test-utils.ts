import { invoke } from '@tauri-apps/api/core';
import { vi } from 'vitest';

/**
 * IPC测试工具类
 * 提供模拟Tauri IPC调用的功能
 */
export class IPCTestUtils {
  private static mockInvoke = vi.fn();

  /**
   * 设置模拟的IPC调用
   * @param command 命令名称
   * @param returnValue 返回值
   * @param throwError 是否抛出错误
   */
  static mockIPCCommand(command: string, returnValue: any, throwError = false) {
    this.mockInvoke.mockImplementation((cmd: string, args?: any) => {
      if (cmd === command) {
        if (throwError) {
          throw new Error(`Mocked error for command: ${command}`);
        }
        return returnValue;
      }
      return this.mockInvoke(cmd, args);
    });
  }

  /**
   * 重置所有模拟
   */
  static resetMocks() {
    this.mockInvoke.mockReset();
  }

  /**
   * 清除所有模拟调用记录
   */
  static clearMocks() {
    this.mockInvoke.mockClear();
  }

  /**
   * 验证IPC命令是否被调用
   * @param command 命令名称
   * @param times 调用次数
   */
  static verifyIPCCommandCalled(command: string, times = 1) {
    expect(this.mockInvoke).toHaveBeenCalledWith(command, expect.anything());
    expect(this.mockInvoke).toHaveBeenCalledTimes(times);
  }

  /**
   * 验证IPC命令是否被调用特定的参数
   * @param command 命令名称
   * @param args 期望的参数
   */
  static verifyIPCCommandCalledWith(command: string, args: any) {
    expect(this.mockInvoke).toHaveBeenCalledWith(command, args);
  }

  /**
   * 获取模拟的invoke函数
   */
  static getMockInvoke() {
    return this.mockInvoke;
  }

  /**
   * 模拟系统信息数据
   */
  static getMockSystemInfo() {
    return {
      os_name: 'Windows 10',
      os_version: '10.0.19042',
      hostname: 'Test-PC',
      kernel_version: '10.0.19042.1',
    };
  }

  /**
   * 模拟CPU信息数据
   */
  static getMockCpuInfo() {
    return {
      name: 'Intel(R) Core(TM) i7-10700K CPU @ 3.80GHz',
      vendor_id: 'GenuineIntel',
      brand: 'Intel(R) Core(TM) i7-10700K CPU @ 3.80GHz',
      cores: 16,
      physical_cores: 8,
      frequency: 3800,
      usage: 25.5,
      temperature: 45.0,
    };
  }

  /**
   * 模拟内存信息数据
   */
  static getMockMemoryInfo() {
    return {
      total: 17179869184, // 16GB
      available: 8589934592, // 8GB
      used: 8589934592, // 8GB
      free: 4294967296, // 4GB
      usage_percent: 50.0,
    };
  }

  /**
   * 模拟磁盘信息数据
   */
  static getMockDiskInfo() {
    return [
      {
        name: 'Local Disk',
        mount_point: 'C:\\',
        total_space: 536870912000, // 500GB
        available_space: 268435456000, // 250GB
        used_space: 268435456000, // 250GB
        usage_percent: 50.0,
        file_system: 'NTFS',
        is_removable: false,
      },
    ];
  }

  /**
   * 模拟网络状态数据
   */
  static getMockNetworkStatus() {
    return {
      is_connected: true,
      interfaces: [
        {
          name: 'Ethernet',
          description: 'Intel Ethernet Connection',
          ip_address: '192.168.1.100',
          mac_address: '00:11:22:33:44:55',
          is_up: true,
        },
      ],
      local_ip: '192.168.1.100',
      public_ip: '203.0.113.1',
    };
  }

  /**
   * 模拟音频设备数据
   */
  static getMockAudioDevices() {
    return [
      {
        name: 'Speakers',
        is_default: true,
        is_input: false,
        is_output: true,
        volume: 75,
        is_muted: false,
      },
      {
        name: 'Microphone',
        is_default: true,
        is_input: true,
        is_output: false,
        volume: 80,
        is_muted: false,
      },
    ];
  }

  /**
   * 模拟GPU信息数据
   */
  static getMockGpuInfo() {
    return [
      {
        name: 'NVIDIA GeForce RTX 3080',
        vendor: 'NVIDIA',
        vram_total: 10737418240, // 10GB
        vram_used: 5368709120, // 5GB
        vram_free: 5368709120, // 5GB
        usage_percent: 60.0,
        temperature: 72.0,
      },
    ];
  }

  /**
   * 模拟进程列表数据
   */
  static getMockProcesses() {
    return [
      {
        pid: '1234',
        name: 'chrome.exe',
        cpu_usage: '15.2',
        memory_usage: '1048576',
        cmd: 'C:\\Program Files\\Chrome\\chrome.exe --profile-directory=Default',
        exe: 'C:\\Program Files\\Chrome\\chrome.exe',
      },
    ];
  }
}

// 导出模拟的invoke函数供测试使用
export const mockInvoke = IPCTestUtils.getMockInvoke();