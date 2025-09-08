import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NetworkDiagnostics from '@/components/NetworkDiagnostics';
import SystemMonitorAPI from '@/lib/api';
import { IPCTestUtils } from '@/test/utils/ipc-test-utils';

// 模拟 SystemMonitorAPI
vi.mock('@/lib/api', () => ({
  default: {
    pingHost: vi.fn(),
    traceroute: vi.fn(),
    getNetworkInterfaces: vi.fn(),
    getNetworkStatus: vi.fn()
  }
}));

describe('NetworkDiagnostics', () => {
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

  const mockPingResult = {
    host: 'google.com',
    packets_sent: 4,
    packets_received: 4,
    packet_loss: 0,
    min_time: 15.2,
    max_time: 18.5,
    avg_time: 16.8
  };

  const mockTracerouteResult = [
    { hop: 1, ip: '192.168.1.1', hostname: 'gateway.local', time: 2.1 },
    { hop: 2, ip: '10.0.0.1', hostname: 'isp-gateway.local', time: 15.3 },
    { hop: 3, ip: '203.0.113.1', hostname: 'core-router.local', time: 16.8 }
  ];

  const mockNetworkInterfaces = [
    {
      name: 'Ethernet',
      description: 'Intel Ethernet Connection',
      ip_address: '192.168.1.100',
      mac_address: '00:11:22:33:44:55',
      is_up: true,
      speed: 1000,
      mtu: 1500,
      bytes_sent: 104857600,
      bytes_recv: 524288000,
      packets_sent: 100000,
      packets_recv: 200000
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // 模拟 API 调用返回成功
    (SystemMonitorAPI.getNetworkStatus as any).mockResolvedValue(mockNetworkStatus);
    (SystemMonitorAPI.pingHost as any).mockResolvedValue(mockPingResult);
    (SystemMonitorAPI.traceroute as any).mockResolvedValue(mockTracerouteResult);
    (SystemMonitorAPI.getNetworkInterfaces as any).mockResolvedValue(mockNetworkInterfaces);
  });

  it('renders without crashing', async () => {
    render(<NetworkDiagnostics />);
    
    // 初始渲染时显示加载状态
    expect(screen.getByText('Loading network data...')).toBeInTheDocument();
    
    // 等待数据加载完成
    const title = await screen.findByText('monitoring.network');
    expect(title).toBeInTheDocument();
  });

  it('displays network status when data is loaded', async () => {
    render(<NetworkDiagnostics />);
    
    // 等待数据加载完成
    await screen.findByText('monitoring.network');
    
    // 检查网络状态
    expect(screen.getByText('Connection Status')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('Local IP: 192.168.1.100')).toBeInTheDocument();
    expect(screen.getByText('Public IP: 203.0.113.1')).toBeInTheDocument();
  });

  it('displays ping tool section', async () => {
    render(<NetworkDiagnostics />);
    
    // 等待数据加载完成
    await screen.findByText('monitoring.network');
    
    // 检查 Ping 工具部分
    expect(screen.getByText('Ping Tool')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter host or IP address')).toBeInTheDocument();
    expect(screen.getByText('Ping')).toBeInTheDocument();
  });

  it('calls pingHost when ping button is clicked', async () => {
    render(<NetworkDiagnostics />);
    
    // 等待数据加载完成
    await screen.findByText('monitoring.network');
    
    // 输入主机名
    const hostInput = screen.getByPlaceholderText('Enter host or IP address');
    fireEvent.change(hostInput, { target: { value: 'google.com' } });
    
    // 点击 Ping 按钮
    const pingButton = screen.getByText('Ping');
    fireEvent.click(pingButton);
    
    // 验证 pingHost 被调用
    expect(SystemMonitorAPI.pingHost).toHaveBeenCalledWith('google.com');
    
    // 等待结果显示
    await screen.findByText('Ping Results:');
  });

  it('displays ping results', async () => {
    render(<NetworkDiagnostics />);
    
    // 等待数据加载完成
    await screen.findByText('monitoring.network');
    
    // 输入主机名
    const hostInput = screen.getByPlaceholderText('Enter host or IP address');
    fireEvent.change(hostInput, { target: { value: 'google.com' } });
    
    // 点击 Ping 按钮
    const pingButton = screen.getByText('Ping');
    fireEvent.click(pingButton);
    
    // 等待结果显示
    await screen.findByText('Ping Results:');
    
    // 检查 Ping 结果
    expect(screen.getByText('Host: google.com')).toBeInTheDocument();
    expect(screen.getByText('Packets: 4 sent, 4 received')).toBeInTheDocument();
    expect(screen.getByText('Packet Loss: 0%')).toBeInTheDocument();
    expect(screen.getByText('Min/Avg/Max: 15.2/16.8/18.5 ms')).toBeInTheDocument();
  });

  it('displays traceroute tool section', async () => {
    render(<NetworkDiagnostics />);
    
    // 等待数据加载完成
    await screen.findByText('monitoring.network');
    
    // 检查 Traceroute 工具部分
    expect(screen.getByText('Traceroute')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter host or IP address')).toBeInTheDocument();
    expect(screen.getByText('Trace')).toBeInTheDocument();
  });

  it('calls traceroute when trace button is clicked', async () => {
    render(<NetworkDiagnostics />);
    
    // 等待数据加载完成
    await screen.findByText('monitoring.network');
    
    // 输入主机名
    const hostInput = screen.getAllByPlaceholderText('Enter host or IP address')[1];
    fireEvent.change(hostInput, { target: { value: 'google.com' } });
    
    // 点击 Trace 按钮
    const traceButton = screen.getByText('Trace');
    fireEvent.click(traceButton);
    
    // 验证 traceroute 被调用
    expect(SystemMonitorAPI.traceroute).toHaveBeenCalledWith('google.com');
    
    // 等待结果显示
    await screen.findByText('Traceroute Results:');
  });

  it('displays traceroute results', async () => {
    render(<NetworkDiagnostics />);
    
    // 等待数据加载完成
    await screen.findByText('monitoring.network');
    
    // 输入主机名
    const hostInput = screen.getAllByPlaceholderText('Enter host or IP address')[1];
    fireEvent.change(hostInput, { target: { value: 'google.com' } });
    
    // 点击 Trace 按钮
    const traceButton = screen.getByText('Trace');
    fireEvent.click(traceButton);
    
    // 等待结果显示
    await screen.findByText('Traceroute Results:');
    
    // 检查 Traceroute 结果
    expect(screen.getByText('Hop 1: 192.168.1.1 (gateway.local) - 2.1 ms')).toBeInTheDocument();
    expect(screen.getByText('Hop 2: 10.0.0.1 (isp-gateway.local) - 15.3 ms')).toBeInTheDocument();
    expect(screen.getByText('Hop 3: 203.0.113.1 (core-router.local) - 16.8 ms')).toBeInTheDocument();
  });

  it('displays network interfaces section', async () => {
    render(<NetworkDiagnostics />);
    
    // 等待数据加载完成
    await screen.findByText('monitoring.network');
    
    // 检查网络接口部分
    expect(screen.getByText('Network Interfaces')).toBeInTheDocument();
    expect(screen.getByText('Refresh Interfaces')).toBeInTheDocument();
  });

  it('displays network interface details', async () => {
    render(<NetworkDiagnostics />);
    
    // 等待数据加载完成
    await screen.findByText('monitoring.network');
    
    // 检查网络接口详情
    expect(screen.getByText('Ethernet')).toBeInTheDocument();
    expect(screen.getByText('Intel Ethernet Connection')).toBeInTheDocument();
    expect(screen.getByText('IP: 192.168.1.100')).toBeInTheDocument();
    expect(screen.getByText('MAC: 00:11:22:33:44:55')).toBeInTheDocument();
    expect(screen.getByText('Status: Up')).toBeInTheDocument();
    expect(screen.getByText('Speed: 1000 Mbps')).toBeInTheDocument();
    expect(screen.getByText('MTU: 1500')).toBeInTheDocument();
  });

  it('calls getNetworkInterfaces when refresh button is clicked', async () => {
    render(<NetworkDiagnostics />);
    
    // 等待数据加载完成
    await screen.findByText('monitoring.network');
    
    // 点击刷新接口按钮
    const refreshButton = screen.getByText('Refresh Interfaces');
    fireEvent.click(refreshButton);
    
    // 验证 getNetworkInterfaces 被再次调用
    expect(SystemMonitorAPI.getNetworkInterfaces).toHaveBeenCalledTimes(2);
  });

  it('displays error message when ping fails', async () => {
    // 模拟 ping 失败
    (SystemMonitorAPI.pingHost as any).mockRejectedValue(new Error('Request timed out'));
    
    render(<NetworkDiagnostics />);
    
    // 等待数据加载完成
    await screen.findByText('monitoring.network');
    
    // 输入主机名
    const hostInput = screen.getByPlaceholderText('Enter host or IP address');
    fireEvent.change(hostInput, { target: { value: 'nonexistent.host' } });
    
    // 点击 Ping 按钮
    const pingButton = screen.getByText('Ping');
    fireEvent.click(pingButton);
    
    // 等待错误消息显示
    const errorMessage = await screen.findByText('Error: Request timed out');
    expect(errorMessage).toBeInTheDocument();
  });

  it('displays error message when traceroute fails', async () => {
    // 模拟 traceroute 失败
    (SystemMonitorAPI.traceroute as any).mockRejectedValue(new Error('Network unreachable'));
    
    render(<NetworkDiagnostics />);
    
    // 等待数据加载完成
    await screen.findByText('monitoring.network');
    
    // 输入主机名
    const hostInput = screen.getAllByPlaceholderText('Enter host or IP address')[1];
    fireEvent.change(hostInput, { target: { value: 'nonexistent.host' } });
    
    // 点击 Trace 按钮
    const traceButton = screen.getByText('Trace');
    fireEvent.click(traceButton);
    
    // 等待错误消息显示
    const errorMessage = await screen.findByText('Error: Network unreachable');
    expect(errorMessage).toBeInTheDocument();
  });

  it('displays error message when network interfaces loading fails', async () => {
    // 模拟网络接口加载失败
    (SystemMonitorAPI.getNetworkInterfaces as any).mockRejectedValue(new Error('Failed to get network interfaces'));
    
    render(<NetworkDiagnostics />);
    
    // 等待数据加载完成
    await screen.findByText('monitoring.network');
    
    // 等待错误消息显示
    const errorMessage = await screen.findByText('Failed to load network interfaces. Please try again.');
    expect(errorMessage).toBeInTheDocument();
    
    // 检查重试按钮
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });
});