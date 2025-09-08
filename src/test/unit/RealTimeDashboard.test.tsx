import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RealTimeDashboard from '@/components/RealTimeDashboard';
import { useRealTimeMonitoring } from '@/hooks/useRealTimeMonitoring';

// 模拟 useRealTimeMonitoring hook
vi.mock('@/hooks/useRealTimeMonitoring', () => ({
  useRealTimeMonitoring: vi.fn()
}));

// 模拟 SystemMonitorAPI
vi.mock('@/lib/api', () => ({
  default: {
    getSystemInfo: vi.fn(),
    getCpuInfo: vi.fn(),
    getMemoryInfo: vi.fn(),
    getDiskInfo: vi.fn(),
    getNetworkStatus: vi.fn(),
    getAudioDevices: vi.fn(),
    getGpuInfo: vi.fn(),
    getUptime: vi.fn(),
    getProcesses: vi.fn()
  }
}));

describe('RealTimeDashboard', () => {
  const mockSystemInfo = {
    os_name: 'Windows 10',
    os_version: '10.0.19042',
    hostname: 'Test-PC',
    kernel_version: '10.0.19042.1',
  };

  const mockCpuInfo = {
    name: 'Intel(R) Core(TM) i7-10700K CPU @ 3.80GHz',
    vendor_id: 'GenuineIntel',
    brand: 'Intel(R) Core(TM) i7-10700K CPU @ 3.80GHz',
    cores: 16,
    physical_cores: 8,
    frequency: 3800,
    usage: 25.5,
    temperature: 45.0,
  };

  const mockMemoryInfo = {
    total: 17179869184, // 16GB
    available: 8589934592, // 8GB
    used: 8589934592, // 8GB
    free: 4294967296, // 4GB
    usage_percent: 50.0,
  };

  const mockDiskInfo = [
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

  const mockNetworkStatus = {
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

  const mockGpuInfo = [
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

  const mockUptime = 3600; // 1 hour in seconds

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    (useRealTimeMonitoring as any).mockReturnValue({
      systemInfo: mockSystemInfo,
      cpuInfo: mockCpuInfo,
      memoryInfo: mockMemoryInfo,
      diskInfo: mockDiskInfo,
      networkStatus: mockNetworkStatus,
      gpuInfo: mockGpuInfo,
      uptime: mockUptime,
      loading: false,
      error: null,
      isPaused: false,
      togglePause: vi.fn(),
      refreshInterval: 1000,
      setRefreshInterval: vi.fn()
    });

    render(<RealTimeDashboard />);
    expect(screen.getByText('performance.title')).toBeInTheDocument();
  });

  it('displays loading state when data is loading', () => {
    (useRealTimeMonitoring as any).mockReturnValue({
      systemInfo: null,
      cpuInfo: null,
      memoryInfo: null,
      diskInfo: [],
      networkStatus: null,
      gpuInfo: [],
      uptime: 0,
      loading: true,
      error: null,
      isPaused: false,
      togglePause: vi.fn(),
      refreshInterval: 1000,
      setRefreshInterval: vi.fn()
    });

    render(<RealTimeDashboard />);
    expect(screen.getByText('Loading system data...')).toBeInTheDocument();
  });

  it('displays error state when there is an error', () => {
    (useRealTimeMonitoring as any).mockReturnValue({
      systemInfo: null,
      cpuInfo: null,
      memoryInfo: null,
      diskInfo: [],
      networkStatus: null,
      gpuInfo: [],
      uptime: 0,
      loading: false,
      error: 'Failed to fetch system data. Please try again.',
      isPaused: false,
      togglePause: vi.fn(),
      refreshInterval: 1000,
      setRefreshInterval: vi.fn()
    });

    render(<RealTimeDashboard />);
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch system data. Please try again.')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('displays system performance cards when data is loaded', () => {
    (useRealTimeMonitoring as any).mockReturnValue({
      systemInfo: mockSystemInfo,
      cpuInfo: mockCpuInfo,
      memoryInfo: mockMemoryInfo,
      diskInfo: mockDiskInfo,
      networkStatus: mockNetworkStatus,
      gpuInfo: mockGpuInfo,
      uptime: mockUptime,
      loading: false,
      error: null,
      isPaused: false,
      togglePause: vi.fn(),
      refreshInterval: 1000,
      setRefreshInterval: vi.fn()
    });

    render(<RealTimeDashboard />);
    
    // 检查性能卡片
    expect(screen.getByText('performance.cpu')).toBeInTheDocument();
    expect(screen.getByText('performance.gpu')).toBeInTheDocument();
    expect(screen.getByText('performance.ram')).toBeInTheDocument();
    expect(screen.getByText('performance.diskIO')).toBeInTheDocument();
    expect(screen.getByText('performance.download')).toBeInTheDocument();
    expect(screen.getByText('performance.upload')).toBeInTheDocument();
  });

  it('displays system information when data is loaded', () => {
    (useRealTimeMonitoring as any).mockReturnValue({
      systemInfo: mockSystemInfo,
      cpuInfo: mockCpuInfo,
      memoryInfo: mockMemoryInfo,
      diskInfo: mockDiskInfo,
      networkStatus: mockNetworkStatus,
      gpuInfo: mockGpuInfo,
      uptime: mockUptime,
      loading: false,
      error: null,
      isPaused: false,
      togglePause: vi.fn(),
      refreshInterval: 1000,
      setRefreshInterval: vi.fn()
    });

    render(<RealTimeDashboard />);
    
    // 检查系统信息部分
    expect(screen.getByText('performance.systemInformation')).toBeInTheDocument();
    expect(screen.getByText(mockCpuInfo.brand)).toBeInTheDocument();
    expect(screen.getByText(mockGpuInfo[0].name)).toBeInTheDocument();
  });

  it('displays temperature and power information when data is loaded', () => {
    (useRealTimeMonitoring as any).mockReturnValue({
      systemInfo: mockSystemInfo,
      cpuInfo: mockCpuInfo,
      memoryInfo: mockMemoryInfo,
      diskInfo: mockDiskInfo,
      networkStatus: mockNetworkStatus,
      gpuInfo: mockGpuInfo,
      uptime: mockUptime,
      loading: false,
      error: null,
      isPaused: false,
      togglePause: vi.fn(),
      refreshInterval: 1000,
      setRefreshInterval: vi.fn()
    });

    render(<RealTimeDashboard />);
    
    // 检查温度和功耗部分
    expect(screen.getByText('performance.temperaturePower')).toBeInTheDocument();
    expect(screen.getByText('performance.cpuTemp')).toBeInTheDocument();
    expect(screen.getByText('performance.gpuTemp')).toBeInTheDocument();
    expect(screen.getByText('performance.uptime')).toBeInTheDocument();
  });
});