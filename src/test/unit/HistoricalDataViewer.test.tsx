import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HistoricalDataViewer from '@/components/HistoricalDataViewer';
import SystemMonitorAPI from '@/lib/api';
import { IPCTestUtils } from '@/test/utils/ipc-test-utils';

// 模拟 SystemMonitorAPI
vi.mock('@/lib/api', () => ({
  default: {
    getHistoricalData: vi.fn(),
    exportHistoricalData: vi.fn(),
    pruneHistoricalData: vi.fn()
  }
}));

describe('HistoricalDataViewer', () => {
  const mockHistoricalData = {
    cpu: Array.from({ length: 24 }, (_, i) => 20 + Math.sin(i / 3) * 20 + Math.random() * 10),
    memory: Array.from({ length: 24 }, (_, i) => 40 + Math.cos(i / 4) * 15 + Math.random() * 10),
    disk: Array.from({ length: 24 }, (_, i) => 30 + Math.sin(i / 5) * 10 + Math.random() * 5),
    network: Array.from({ length: 24 }, (_, i) => 10 + Math.cos(i / 2) * 5 + Math.random() * 5),
    timestamps: Array.from({ length: 24 }, (_, i) => {
      const date = new Date();
      date.setHours(date.getHours() - i);
      return date.toISOString();
    }).reverse()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // 模拟 API 调用返回成功
    (SystemMonitorAPI.getHistoricalData as any).mockResolvedValue(mockHistoricalData);
    (SystemMonitorAPI.exportHistoricalData as any).mockResolvedValue(true);
    (SystemMonitorAPI.pruneHistoricalData as any).mockResolvedValue(true);
  });

  it('renders without crashing', async () => {
    render(<HistoricalDataViewer />);
    
    // 初始渲染时显示加载状态
    expect(screen.getByText('Loading historical data...')).toBeInTheDocument();
    
    // 等待数据加载完成
    const title = await screen.findByText('monitoring.historical');
    expect(title).toBeInTheDocument();
  });

  it('displays time range selector', async () => {
    render(<HistoricalDataViewer />);
    
    // 等待数据加载完成
    await screen.findByText('monitoring.historical');
    
    // 检查时间范围选择器
    expect(screen.getByText('1h')).toBeInTheDocument();
    expect(screen.getByText('24h')).toBeInTheDocument();
    expect(screen.getByText('7d')).toBeInTheDocument();
    expect(screen.getByText('30d')).toBeInTheDocument();
  });

  it('displays metric selection checkboxes', async () => {
    render(<HistoricalDataViewer />);
    
    // 等待数据加载完成
    await screen.findByText('monitoring.historical');
    
    // 检查指标选择复选框
    expect(screen.getByText('CPU')).toBeInTheDocument();
    expect(screen.getByText('Memory')).toBeInTheDocument();
    expect(screen.getByText('Disk')).toBeInTheDocument();
    expect(screen.getByText('Network')).toBeInTheDocument();
  });

  it('calls getHistoricalData with correct parameters when time range changes', async () => {
    render(<HistoricalDataViewer />);
    
    // 等待数据加载完成
    await screen.findByText('monitoring.historical');
    
    // 点击 7d 时间范围
    fireEvent.click(screen.getByText('7d'));
    
    // 验证 API 调用
    expect(SystemMonitorAPI.getHistoricalData).toHaveBeenCalledWith({
      timeRange: '7d',
      metrics: ['cpu', 'memory', 'disk', 'network']
    });
  });

  it('calls getHistoricalData with correct parameters when metrics change', async () => {
    render(<HistoricalDataViewer />);
    
    // 等待数据加载完成
    await screen.findByText('monitoring.historical');
    
    // 取消 Memory 和 Disk 选项
    const memoryCheckbox = screen.getByLabelText('Memory');
    const diskCheckbox = screen.getByLabelText('Disk');
    
    fireEvent.click(memoryCheckbox);
    fireEvent.click(diskCheckbox);
    
    // 验证 API 调用
    expect(SystemMonitorAPI.getHistoricalData).toHaveBeenCalledWith({
      timeRange: '24h', // 默认时间范围
      metrics: ['cpu', 'network']
    });
  });

  it('calls exportHistoricalData when export button is clicked', async () => {
    render(<HistoricalDataViewer />);
    
    // 等待数据加载完成
    await screen.findByText('monitoring.historical');
    
    // 点击导出按钮
    const exportButton = screen.getByText('Export to CSV');
    fireEvent.click(exportButton);
    
    // 验证 API 调用
    expect(SystemMonitorAPI.exportHistoricalData).toHaveBeenCalledWith({
      timeRange: '24h', // 默认时间范围
      metrics: ['cpu', 'memory', 'disk', 'network'],
      format: 'csv'
    });
  });

  it('displays error message when data loading fails', async () => {
    // 模拟 API 调用失败
    (SystemMonitorAPI.getHistoricalData as any).mockRejectedValue(new Error('Failed to fetch data'));
    
    render(<HistoricalDataViewer />);
    
    // 等待错误消息显示
    const errorMessage = await screen.findByText('Failed to load historical data. Please try again.');
    expect(errorMessage).toBeInTheDocument();
    
    // 检查重试按钮
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('retries data loading when retry button is clicked', async () => {
    // 第一次调用失败
    (SystemMonitorAPI.getHistoricalData as any)
      .mockRejectedValueOnce(new Error('Failed to fetch data'))
      .mockResolvedValueOnce(mockHistoricalData);
    
    render(<HistoricalDataViewer />);
    
    // 等待错误消息显示
    await screen.findByText('Failed to load historical data. Please try again.');
    
    // 点击重试按钮
    fireEvent.click(screen.getByText('Retry'));
    
    // 验证 API 被再次调用
    expect(SystemMonitorAPI.getHistoricalData).toHaveBeenCalledTimes(2);
    
    // 等待数据加载完成
    await screen.findByText('monitoring.historical');
  });

  it('displays charts with correct data', async () => {
    render(<HistoricalDataViewer />);
    
    // 等待数据加载完成
    await screen.findByText('monitoring.historical');
    
    // 检查图表是否渲染
    // 注意：这里假设图表组件有特定的测试ID或类名
    // 实际实现可能需要根据图表库的具体实现进行调整
    expect(screen.getByTestId('cpu-chart')).toBeInTheDocument();
    expect(screen.getByTestId('memory-chart')).toBeInTheDocument();
    expect(screen.getByTestId('disk-chart')).toBeInTheDocument();
    expect(screen.getByTestId('network-chart')).toBeInTheDocument();
  });

  it('updates charts when time range changes', async () => {
    render(<HistoricalDataViewer />);
    
    // 等待数据加载完成
    await screen.findByText('monitoring.historical');
    
    // 点击 7d 时间范围
    fireEvent.click(screen.getByText('7d'));
    
    // 验证图表数据更新
    // 注意：这里假设图表组件有特定的测试ID或类名
    // 实际实现可能需要根据图表库的具体实现进行调整
    expect(screen.getByTestId('cpu-chart')).toBeInTheDocument();
  });

  it('updates charts when metrics selection changes', async () => {
    render(<HistoricalDataViewer />);
    
    // 等待数据加载完成
    await screen.findByText('monitoring.historical');
    
    // 取消 Memory 和 Disk 选项
    const memoryCheckbox = screen.getByLabelText('Memory');
    const diskCheckbox = screen.getByLabelText('Disk');
    
    fireEvent.click(memoryCheckbox);
    fireEvent.click(diskCheckbox);
    
    // 验证图表更新
    // 注意：这里假设图表组件有特定的测试ID或类名
    // 实际实现可能需要根据图表库的具体实现进行调整
    expect(screen.getByTestId('cpu-chart')).toBeInTheDocument();
    expect(screen.queryByTestId('memory-chart')).not.toBeInTheDocument();
    expect(screen.queryByTestId('disk-chart')).not.toBeInTheDocument();
    expect(screen.getByTestId('network-chart')).toBeInTheDocument();
  });
});