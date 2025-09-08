import { useState, useEffect, useRef, useCallback } from 'react';
import { SystemMonitorAPI, CpuInfo, MemoryInfo, DiskInfo, NetworkStatus, GpuInfo } from '../lib/api';

interface RealTimeData {
  cpu: CpuInfo | null;
  memory: MemoryInfo | null;
  disk: DiskInfo[] | null;
  network: NetworkStatus | null;
  gpu: GpuInfo[] | null;
  lastUpdated: Date | null;
  isLoading: boolean;
  error: string | null;
}

interface UseRealTimeMonitoringOptions {
  interval?: number; // 更新间隔（毫秒）
  autoStart?: boolean; // 是否自动开始监控
  enableCpu?: boolean; // 是否启用CPU监控
  enableMemory?: boolean; // 是否启用内存监控
  enableDisk?: boolean; // 是否启用磁盘监控
  enableNetwork?: boolean; // 是否启用网络监控
  enableGpu?: boolean; // 是否启用GPU监控
}

export const useRealTimeMonitoring = (options: UseRealTimeMonitoringOptions = {}) => {
  const {
    interval = 5000, // 默认5秒更新一次
    autoStart = true,
    enableCpu = true,
    enableMemory = true,
    enableDisk = true,
    enableNetwork = true,
    enableGpu = true,
  } = options;

  const [data, setData] = useState<RealTimeData>({
    cpu: null,
    memory: null,
    disk: null,
    network: null,
    gpu: null,
    lastUpdated: null,
    isLoading: false,
    error: null,
  });

  const [isActive, setIsActive] = useState(autoStart);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  // 获取所有系统数据
  const fetchSystemData = useCallback(async () => {
    if (!isMounted.current) return;

    setData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const promises: Promise<any>[] = [];

      if (enableCpu) {
        promises.push(SystemMonitorAPI.getCpuInfo());
      }
      if (enableMemory) {
        promises.push(SystemMonitorAPI.getMemoryInfo());
      }
      if (enableDisk) {
        promises.push(SystemMonitorAPI.getDiskInfo());
      }
      if (enableNetwork) {
        promises.push(SystemMonitorAPI.getNetworkStatus());
      }
      if (enableGpu) {
        promises.push(SystemMonitorAPI.getGpuInfo());
      }

      const results = await Promise.allSettled(promises);

      const newData: Partial<RealTimeData> = {
        lastUpdated: new Date(),
        isLoading: false,
        error: null,
      };

      let resultIndex = 0;

      if (enableCpu) {
        const cpuResult = results[resultIndex++] as PromiseSettledResult<CpuInfo>;
        if (cpuResult.status === 'fulfilled') {
          newData.cpu = cpuResult.value;
        } else {
          console.error('Failed to fetch CPU info:', cpuResult.reason);
        }
      }

      if (enableMemory) {
        const memoryResult = results[resultIndex++] as PromiseSettledResult<MemoryInfo>;
        if (memoryResult.status === 'fulfilled') {
          newData.memory = memoryResult.value;
        } else {
          console.error('Failed to fetch memory info:', memoryResult.reason);
        }
      }

      if (enableDisk) {
        const diskResult = results[resultIndex++] as PromiseSettledResult<DiskInfo[]>;
        if (diskResult.status === 'fulfilled') {
          newData.disk = diskResult.value;
        } else {
          console.error('Failed to fetch disk info:', diskResult.reason);
        }
      }

      if (enableNetwork) {
        const networkResult = results[resultIndex++] as PromiseSettledResult<NetworkStatus>;
        if (networkResult.status === 'fulfilled') {
          newData.network = networkResult.value;
        } else {
          console.error('Failed to fetch network status:', networkResult.reason);
        }
      }

      if (enableGpu) {
        const gpuResult = results[resultIndex++] as PromiseSettledResult<GpuInfo[]>;
        if (gpuResult.status === 'fulfilled') {
          newData.gpu = gpuResult.value;
        } else {
          console.error('Failed to fetch GPU info:', gpuResult.reason);
        }
      }

      if (isMounted.current) {
        setData(prev => ({ ...prev, ...newData }));
      }
    } catch (error) {
      console.error('Failed to fetch system data:', error);
      if (isMounted.current) {
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
      }
    }
  }, [enableCpu, enableMemory, enableDisk, enableNetwork, enableGpu]);

  // 开始实时监控
  const startMonitoring = useCallback(() => {
    if (isActive) return;

    setIsActive(true);
    
    // 立即获取一次数据
    fetchSystemData();

    // 设置定时器
    intervalRef.current = setInterval(() => {
      fetchSystemData();
    }, interval);
  }, [fetchSystemData, interval, isActive]);

  // 停止实时监控
  const stopMonitoring = useCallback(() => {
    if (!isActive) return;

    setIsActive(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isActive]);

  // 切换监控状态
  const toggleMonitoring = useCallback(() => {
    if (isActive) {
      stopMonitoring();
    } else {
      startMonitoring();
    }
  }, [isActive, startMonitoring, stopMonitoring]);

  // 手动刷新数据
  const refreshData = useCallback(() => {
    fetchSystemData();
  }, [fetchSystemData]);

  // 更新监控选项
  const updateOptions = useCallback((_newOptions: Partial<UseRealTimeMonitoringOptions>) => {
    // 如果正在运行，先停止再重新开始以应用新选项
    const wasActive = isActive;
    if (wasActive) {
      stopMonitoring();
    }

    // 这里可以更新选项状态，但为了简单起见，我们只是重新开始监控
    // 在实际应用中，你可能想要管理选项状态

    if (wasActive) {
      setTimeout(() => startMonitoring(), 100);
    }
  }, [isActive, stopMonitoring, startMonitoring]);

  // 组件挂载时设置
  useEffect(() => {
    isMounted.current = true;

    if (autoStart) {
      startMonitoring();
    }

    return () => {
      isMounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoStart, startMonitoring]);

  // 当监控状态改变时
  useEffect(() => {
    if (isActive && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        fetchSystemData();
      }, interval);
    } else if (!isActive && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isActive, interval, fetchSystemData]);

  return {
    data,
    isActive,
    startMonitoring,
    stopMonitoring,
    toggleMonitoring,
    refreshData,
    updateOptions,
  };
};

export default useRealTimeMonitoring;