import { SystemMonitorAPI } from '../../lib/api';
import { IPCMock, IPCTestEnvironment } from '../utils/ipc-mock';

describe('IPC端到端测试', () => {
  beforeAll(() => {
    IPCTestEnvironment.setup();
  });

  afterAll(() => {
    IPCTestEnvironment.teardown();
  });

  beforeEach(() => {
    IPCMock.reset();
  });

  describe('完整的系统监控流程测试', () => {
    it('应该能够完成完整的系统信息收集流程', async () => {
      // 步骤1: 获取系统基本信息
      const systemInfo = await SystemMonitorAPI.getSystemInfo();
      expect(systemInfo).toBeDefined();
      expect(systemInfo.os_name).toBe('Mocked OS');
      expect(systemInfo.hostname).toBe('mocked-host');

      // 步骤2: 获取CPU信息
      const cpuInfo = await SystemMonitorAPI.getCpuInfo();
      expect(cpuInfo).toBeDefined();
      expect(cpuInfo.name).toBe('Mocked CPU');
      expect(cpuInfo.cores).toBe(8);

      // 步骤3: 获取内存信息
      const memoryInfo = await SystemMonitorAPI.getMemoryInfo();
      expect(memoryInfo).toBeDefined();
      expect(memoryInfo.total).toBe(8589934592);
      expect(memoryInfo.usage_percent).toBe(50.0);

      // 步骤4: 获取磁盘信息
      const diskInfo = await SystemMonitorAPI.getDiskInfo();
      expect(diskInfo).toBeDefined();
      expect(Array.isArray(diskInfo)).toBe(true);
      expect(diskInfo[0].name).toBe('Mocked Disk');

      // 步骤5: 获取网络状态
      const networkStatus = await SystemMonitorAPI.getNetworkStatus();
      expect(networkStatus).toBeDefined();
      expect(networkStatus.is_connected).toBe(true);

      // 步骤6: 获取GPU信息
      const gpuInfo = await SystemMonitorAPI.getGpuInfo();
      expect(gpuInfo).toBeDefined();
      expect(Array.isArray(gpuInfo)).toBe(true);
      expect(gpuInfo[0].name).toBe('Mocked GPU');

      // 验证所有数据的一致性
      expect(systemInfo.hostname).toBe(networkStatus.local_ip);
      expect(cpuInfo.usage).toBeGreaterThan(0);
      expect(memoryInfo.usage_percent).toBeGreaterThan(0);
    });

    it('应该能够处理网络连通性测试流程', async () => {
      // 步骤1: 获取网络状态
      const networkStatus = await SystemMonitorAPI.getNetworkStatus();
      expect(networkStatus.is_connected).toBe(true);

      // 步骤2: 测试ping不同主机
      const pingResults = await Promise.all([
        SystemMonitorAPI.pingHost('8.8.8.8'),
        SystemMonitorAPI.pingHost('1.1.1.1'),
        SystemMonitorAPI.pingHost('127.0.0.1'),
      ]);

      // 验证所有ping结果
      expect(pingResults).toHaveLength(3);
      pingResults.forEach(result => {
        expect(result).toContain('成功');
        expect(result).toContain('时间=');
      });

      // 步骤3: 获取系统运行时间
      const uptime = await SystemMonitorAPI.getUptime();
      expect(uptime).toBe(3600);
    });

    it('应该能够完成音频设备管理流程', async () => {
      // 步骤1: 获取音频设备列表
      const audioDevices = await SystemMonitorAPI.getAudioDevices();
      expect(audioDevices).toBeDefined();
      expect(Array.isArray(audioDevices)).toBe(true);
      expect(audioDevices).toHaveLength(2);

      // 步骤2: 验证输入设备
      const inputDevices = audioDevices.filter(device => device.is_input);
      expect(inputDevices).toHaveLength(1);
      expect(inputDevices[0].name).toBe('Mocked Microphone');

      // 步骤3: 验证输出设备
      const outputDevices = audioDevices.filter(device => device.is_output);
      expect(outputDevices).toHaveLength(1);
      expect(outputDevices[0].name).toBe('Mocked Speaker');

      // 步骤4: 验证默认设备
      const defaultDevices = audioDevices.filter(device => device.is_default);
      expect(defaultDevices).toHaveLength(2);
    });

    it('应该能够完成进程监控流程', async () => {
      // 步骤1: 获取进程列表
      const processes = await SystemMonitorAPI.getProcesses();
      expect(processes).toBeDefined();
      expect(Array.isArray(processes)).toBe(true);
      expect(processes).toHaveLength(1);

      // 步骤2: 验证进程信息结构
      const process = processes[0];
      expect(process).toHaveProperty('pid');
      expect(process).toHaveProperty('name');
      expect(process).toHaveProperty('cpu_usage');
      expect(process).toHaveProperty('memory_usage');
      expect(process.name).toBe('mocked-process');

      // 步骤3: 获取系统资源使用情况
      const cpuInfo = await SystemMonitorAPI.getCpuInfo();
      const memoryInfo = await SystemMonitorAPI.getMemoryInfo();

      // 验证资源使用情况
      expect(cpuInfo.usage).toBeGreaterThanOrEqual(0);
      expect(memoryInfo.usage_percent).toBeGreaterThanOrEqual(0);
    });
  });

  describe('错误恢复和容错测试', () => {
    it('应该能够在部分命令失败时继续执行', async () => {
      // 步骤1: 设置一个命令会失败
      IPCMock.simulateError('get_system_info', '模拟的系统信息获取失败');

      // 步骤2: 尝试获取系统信息（应该失败）
      await expect(SystemMonitorAPI.getSystemInfo()).rejects.toThrow();

      // 步骤3: 重置错误状态
      IPCMock.reset();

      // 步骤4: 继续获取其他信息（应该成功）
      const cpuInfo = await SystemMonitorAPI.getCpuInfo();
      expect(cpuInfo).toBeDefined();

      const memoryInfo = await SystemMonitorAPI.getMemoryInfo();
      expect(memoryInfo).toBeDefined();
    });

    it('应该能够处理网络延迟和超时', async () => {
      // 步骤1: 模拟网络延迟
      IPCMock.simulateNetworkDelay('get_cpu_info', 200);

      // 步骤2: 测试延迟情况下的调用
      const startTime = Date.now();
      const cpuInfo = await SystemMonitorAPI.getCpuInfo();
      const endTime = Date.now();

      expect(cpuInfo).toBeDefined();
      expect(endTime - startTime).toBeGreaterThanOrEqual(200);

      // 步骤3: 重置延迟
      IPCMock.reset();

      // 步骤4: 验证正常调用
      const normalCpuInfo = await SystemMonitorAPI.getCpuInfo();
      expect(normalCpuInfo).toBeDefined();
    });

    it('应该能够处理并发错误', async () => {
      // 步骤1: 设置一个命令会失败
      IPCMock.simulateError('ping_host', '网络连接失败');

      // 步骤2: 并发调用多个命令
      const promises = [
        SystemMonitorAPI.pingHost('8.8.8.8'), // 这会失败
        SystemMonitorAPI.getSystemInfo(),     // 这会成功
        SystemMonitorAPI.getCpuInfo(),         // 这会成功
      ];

      const results = await Promise.allSettled(promises);

      // 步骤3: 验证结果
      expect(results).toHaveLength(3);
      expect(results[0].status).toBe('rejected');
      expect(results[1].status).toBe('fulfilled');
      expect(results[2].status).toBe('fulfilled');

      // 步骤4: 验证成功的调用
      if (results[1].status === 'fulfilled') {
        expect(results[1].value).toBeDefined();
      }
      if (results[2].status === 'fulfilled') {
        expect(results[2].value).toBeDefined();
      }

      // 步骤5: 重置错误状态
      IPCMock.reset();
    });
  });

  describe('性能和负载测试', () => {
    it('应该能够处理高频率的IPC调用', async () => {
      const callCount = 20;
      const promises = Array(callCount).fill(null).map(() => 
        SystemMonitorAPI.getSystemInfo()
      );

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();

      // 验证所有调用都成功
      expect(results).toHaveLength(callCount);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.os_name).toBe('Mocked OS');
      });

      // 验证性能（应该在合理时间内完成）
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('应该能够处理混合类型的并发调用', async () => {
      const callCount = 10;
      const promises = [];

      // 创建混合类型的调用
      for (let i = 0; i < callCount; i++) {
        switch (i % 4) {
          case 0:
            promises.push(SystemMonitorAPI.getSystemInfo());
            break;
          case 1:
            promises.push(SystemMonitorAPI.getCpuInfo());
            break;
          case 2:
            promises.push(SystemMonitorAPI.getMemoryInfo());
            break;
          case 3:
            promises.push(SystemMonitorAPI.getDiskInfo());
            break;
        }
      }

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();

      // 验证所有调用都成功
      expect(results).toHaveLength(callCount);
      results.forEach((result, index) => {
        expect(result).toBeDefined();
        // 使用类型断言来处理不同的返回类型
        switch (index % 4) {
          case 0:
            const systemInfo = result as any;
            expect(systemInfo.os_name).toBe('Mocked OS');
            break;
          case 1:
            const cpuInfo = result as any;
            expect(cpuInfo.name).toBe('Mocked CPU');
            break;
          case 2:
            const memoryInfo = result as any;
            expect(memoryInfo.total).toBe(8589934592);
            break;
          case 3:
            expect(Array.isArray(result)).toBe(true);
            break;
        }
      });

      // 验证性能
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });

  describe('数据一致性和完整性测试', () => {
    it('应该确保多次调用返回一致的数据结构', async () => {
      // 多次调用相同的命令
      const calls = 5;
      const results = await Promise.all(
        Array(calls).fill(null).map(() => SystemMonitorAPI.getSystemInfo())
      );

      // 验证所有结果的结构一致性
      results.forEach(result => {
        expect(result).toHaveProperty('os_name');
        expect(result).toHaveProperty('os_version');
        expect(result).toHaveProperty('hostname');
        expect(result).toHaveProperty('kernel_version');
        expect(typeof result.os_name).toBe('string');
        expect(typeof result.os_version).toBe('string');
        expect(typeof result.hostname).toBe('string');
        expect(typeof result.kernel_version).toBe('string');
      });

      // 验证数据值的一致性
      const firstResult = results[0];
      results.forEach(result => {
        expect(result.os_name).toBe(firstResult.os_name);
        expect(result.os_version).toBe(firstResult.os_version);
        expect(result.hostname).toBe(firstResult.hostname);
        expect(result.kernel_version).toBe(firstResult.kernel_version);
      });
    });

    it('应该确保不同命令间的数据关联性', async () => {
      // 获取系统相关的所有信息
      const [systemInfo, cpuInfo, memoryInfo, networkStatus] = await Promise.all([
        SystemMonitorAPI.getSystemInfo(),
        SystemMonitorAPI.getCpuInfo(),
        SystemMonitorAPI.getMemoryInfo(),
        SystemMonitorAPI.getNetworkStatus(),
      ]);

      // 验证数据间的逻辑关系
      expect(systemInfo.hostname).toBeDefined();
      expect(networkStatus.local_ip).toBeDefined();
      expect(cpuInfo.usage).toBeGreaterThanOrEqual(0);
      expect(cpuInfo.usage).toBeLessThanOrEqual(100);
      expect(memoryInfo.usage_percent).toBeGreaterThanOrEqual(0);
      expect(memoryInfo.usage_percent).toBeLessThanOrEqual(100);

      // 验证系统信息的完整性
      expect(systemInfo.os_name).not.toBe('');
      expect(systemInfo.os_version).not.toBe('');
      expect(systemInfo.hostname).not.toBe('');
      expect(systemInfo.kernel_version).not.toBe('');
    });
  });
});