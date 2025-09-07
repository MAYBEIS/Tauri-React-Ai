import { invoke } from '@tauri-apps/api/core';

/**
 * IPC模拟器类
 * 提供完整的Tauri IPC调用模拟环境
 */
export class IPCMock {
  private static mockHandlers: Map<string, (args?: any) => Promise<any>> = new Map();
  private static originalInvoke: typeof invoke | null = null;

  /**
   * 初始化IPC模拟器
   */
  static init() {
    // 保存原始的invoke函数
    if (!this.originalInvoke) {
      this.originalInvoke = invoke;
    }

    // 替换invoke函数
    (global as any).invoke = this.mockInvoke.bind(this);
    
    // 设置默认的模拟处理器
    this.setupDefaultHandlers();
  }

  /**
   * 清理IPC模拟器，恢复原始函数
   */
  static cleanup() {
    if (this.originalInvoke) {
      (global as any).invoke = this.originalInvoke;
      this.originalInvoke = null;
    }
    this.mockHandlers.clear();
  }

  /**
   * 模拟的invoke函数
   */
  private static async mockInvoke(command: string, args?: any): Promise<any> {
    const handler = this.mockHandlers.get(command);
    if (handler) {
      return await handler(args);
    }

    // 如果没有找到处理器，抛出错误
    throw new Error(`No mock handler found for command: ${command}`);
  }

  /**
   * 注册模拟处理器
   * @param command 命令名称
   * @param handler 处理函数
   */
  static registerHandler(command: string, handler: (args?: any) => Promise<any>) {
    this.mockHandlers.set(command, handler);
  }

  /**
   * 移除模拟处理器
   * @param command 命令名称
   */
  static unregisterHandler(command: string) {
    this.mockHandlers.delete(command);
  }

  /**
   * 设置默认的模拟处理器
   */
  private static setupDefaultHandlers() {
    // greet命令
    this.registerHandler('greet', async (args: { name: string }) => {
      return `Hello, ${args.name}! You've been greeted from Rust!`;
    });

    // get_system_info命令
    this.registerHandler('get_system_info', async () => {
      return {
        os_name: 'Mocked OS',
        os_version: '1.0.0',
        hostname: 'mocked-host',
        kernel_version: '1.0.0-mock',
      };
    });

    // get_cpu_info命令
    this.registerHandler('get_cpu_info', async () => {
      return {
        name: 'Mocked CPU',
        vendor_id: 'MockVendor',
        brand: 'Mocked CPU Brand',
        cores: 8,
        physical_cores: 4,
        frequency: 3000,
        usage: 50.0,
        temperature: 45.0,
      };
    });

    // get_memory_info命令
    this.registerHandler('get_memory_info', async () => {
      return {
        total: 8589934592, // 8GB
        available: 4294967296, // 4GB
        used: 4294967296, // 4GB
        free: 2147483648, // 2GB
        usage_percent: 50.0,
      };
    });

    // get_disk_info命令
    this.registerHandler('get_disk_info', async () => {
      return [
        {
          name: 'Mocked Disk',
          mount_point: '/mock',
          total_space: 107374182400, // 100GB
          available_space: 53687091200, // 50GB
          used_space: 53687091200, // 50GB
          usage_percent: 50.0,
          file_system: 'ext4',
          is_removable: false,
        },
      ];
    });

    // get_network_status命令
    this.registerHandler('get_network_status', async () => {
      return {
        is_connected: true,
        interfaces: [
          {
            name: 'eth0',
            description: 'Mocked Ethernet',
            ip_address: '192.168.1.100',
            mac_address: '00:11:22:33:44:55',
            is_up: true,
          },
        ],
        local_ip: '192.168.1.100',
        public_ip: '203.0.113.1',
      };
    });

    // get_audio_devices命令
    this.registerHandler('get_audio_devices', async () => {
      return [
        {
          name: 'Mocked Speaker',
          is_default: true,
          is_input: false,
          is_output: true,
          volume: 75,
          is_muted: false,
        },
        {
          name: 'Mocked Microphone',
          is_default: true,
          is_input: true,
          is_output: false,
          volume: 80,
          is_muted: false,
        },
      ];
    });

    // ping_host命令
    this.registerHandler('ping_host', async (args: { host: string }) => {
      return `Ping ${args.host} 成功: 时间=15ms`;
    });

    // get_uptime命令
    this.registerHandler('get_uptime', async () => {
      return 3600; // 1小时
    });

    // get_processes命令
    this.registerHandler('get_processes', async () => {
      return [
        {
          pid: '1234',
          name: 'mocked-process',
          cpu_usage: '10.5',
          memory_usage: '1048576',
          cmd: '/usr/bin/mocked-process',
          exe: '/usr/bin/mocked-process',
        },
      ];
    });

    // get_gpu_info命令
    this.registerHandler('get_gpu_info', async () => {
      return [
        {
          name: 'Mocked GPU',
          vendor: 'MockVendor',
          vram_total: 4294967296, // 4GB
          vram_used: 2147483648, // 2GB
          vram_free: 2147483648, // 2GB
          usage_percent: 60.0,
          temperature: 70.0,
        },
      ];
    });
  }

  /**
   * 模拟延迟响应
   * @param delay 延迟时间（毫秒）
   * @param response 响应数据
   */
  static async delayedResponse<T>(delay: number, response: T): Promise<T> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(response), delay);
    });
  }

  /**
   * 模拟错误响应
   * @param command 命令名称
   * @param errorMessage 错误消息
   */
  static simulateError(command: string, errorMessage: string) {
    this.registerHandler(command, async () => {
      throw new Error(errorMessage);
    });
  }

  /**
   * 模拟网络延迟
   * @param command 命令名称
   * @param delay 延迟时间（毫秒）
   */
  static simulateNetworkDelay(command: string, delay: number) {
    const originalHandler = this.mockHandlers.get(command);
    if (originalHandler) {
      this.registerHandler(command, async (args?: any) => {
        await this.delayedResponse(delay, null);
        return await originalHandler(args);
      });
    }
  }

  /**
   * 模拟网络错误
   * @param command 命令名称
   */
  static simulateNetworkError(command: string) {
    this.simulateError(command, 'Network error: Connection failed');
  }

  /**
   * 模拟超时
   * @param command 命令名称
   * @param timeout 超时时间（毫秒）
   */
  static simulateTimeout(command: string, timeout: number) {
    this.registerHandler(command, async () => {
      await new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeout);
      });
    });
  }

  /**
   * 获取所有已注册的处理器
   */
  static getHandlers(): Map<string, (args?: any) => Promise<any>> {
    return new Map(this.mockHandlers);
  }

  /**
   * 重置所有处理器为默认状态
   */
  static reset() {
    this.mockHandlers.clear();
    this.setupDefaultHandlers();
  }

  /**
   * 验证命令是否被调用
   * @param command 命令名称
   */
  static verifyCommandCalled(command: string): boolean {
    return this.mockHandlers.has(command);
  }

  /**
   * 获取调用统计信息
   */
  static getCallStats(): { [command: string]: number } {
    const stats: { [command: string]: number } = {};
    // 这里可以扩展为记录调用次数
    return stats;
  }
}

/**
 * IPC测试环境类
 * 提供完整的测试环境设置和清理
 */
export class IPCTestEnvironment {
  private static isInitialized = false;

  /**
   * 初始化测试环境
   */
  static setup() {
    if (!this.isInitialized) {
      IPCMock.init();
      this.isInitialized = true;
    }
  }

  /**
   * 清理测试环境
   */
  static teardown() {
    if (this.isInitialized) {
      IPCMock.cleanup();
      this.isInitialized = false;
    }
  }

  /**
   * 在测试用例中使用的设置函数
   */
  static beforeEach() {
    this.setup();
    IPCMock.reset();
  }

  /**
   * 在测试用例中使用的清理函数
   */
  static afterEach() {
    this.teardown();
  }

  /**
   * 在测试套件中使用的设置函数
   */
  static beforeAll() {
    this.setup();
  }

  /**
   * 在测试套件中使用的清理函数
   */
  static afterAll() {
    this.teardown();
  }
}

// 导出便捷的测试工具函数
export const setupIPCTest = () => {
  IPCTestEnvironment.setup();
  return {
    cleanup: () => IPCTestEnvironment.teardown(),
    mock: IPCMock,
  };
};

export const createIPCTestSuite = (description: string, testCases: () => void) => {
  describe(description, () => {
    beforeAll(() => IPCTestEnvironment.beforeAll());
    afterAll(() => IPCTestEnvironment.afterAll());
    beforeEach(() => IPCTestEnvironment.beforeEach());
    afterEach(() => IPCTestEnvironment.afterEach());
    
    testCases();
  });
};