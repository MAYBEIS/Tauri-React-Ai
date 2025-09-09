import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AlertSystem from '@/components/AlertSystem';
import SystemMonitorAPI from '@/lib/api';

// 模拟 SystemMonitorAPI
vi.mock('@/lib/api', () => ({
  default: {
    getAlertConfigurations: vi.fn(),
    getAlertHistory: vi.fn(),
    addAlertConfiguration: vi.fn(),
    updateAlertConfiguration: vi.fn(),
    deleteAlertConfiguration: vi.fn(),
    acknowledgeAlert: vi.fn()
  }
}));

describe('AlertSystem', () => {
  const mockAlertConfigurations = [
    {
      id: '1',
      metric: 'cpu_usage',
      condition: 'greater_than',
      threshold: 80,
      severity: 'medium',
      enabled: true,
      notification_methods: ['visual']
    },
    {
      id: '2',
      metric: 'memory_usage',
      condition: 'greater_than',
      threshold: 90,
      severity: 'high',
      enabled: true,
      notification_methods: ['visual', 'sound']
    }
  ];

  const mockAlertHistory = [
    {
      id: 'alert-1',
      alert_id: '1',
      triggered_at: new Date().toISOString(),
      value: 85.2,
      message: 'CPU usage is high',
      acknowledged: false,
      acknowledged_at: null,
      acknowledged_by: null
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // 模拟 API 调用返回成功
    (SystemMonitorAPI.getAlertConfigurations as any).mockResolvedValue(mockAlertConfigurations);
    (SystemMonitorAPI.getAlertHistory as any).mockResolvedValue(mockAlertHistory);
    (SystemMonitorAPI.addAlertConfiguration as any).mockResolvedValue('3');
    (SystemMonitorAPI.updateAlertConfiguration as any).mockResolvedValue(undefined);
    (SystemMonitorAPI.deleteAlertConfiguration as any).mockResolvedValue(undefined);
    (SystemMonitorAPI.acknowledgeAlert as any).mockResolvedValue(undefined);
  });

  it('renders without crashing', async () => {
    render(<AlertSystem />);
    
    // 初始渲染时显示加载状态
    expect(screen.getByText('Loading alert configurations...')).toBeInTheDocument();
    
    // 等待数据加载完成
    const title = await screen.findByText('警报系统');
    expect(title).toBeInTheDocument();
  });

  it('displays alert configurations when data is loaded', async () => {
    render(<AlertSystem />);
    
    // 等待数据加载完成
    await screen.findByText('警报系统');
    
    // 检查警报配置
    expect(screen.getByText('CPU使用率')).toBeInTheDocument();
    expect(screen.getByText('内存使用率')).toBeInTheDocument();
  });

  it('displays alert history when data is loaded', async () => {
    render(<AlertSystem />);
    
    // 等待数据加载完成
    await screen.findByText('警报系统');
    
    // 点击历史标签
    fireEvent.click(screen.getByText('警报历史'));
    
    // 检查警报历史
    expect(screen.getByText('CPU usage is high')).toBeInTheDocument();
  });

  it('calls addAlertConfiguration when add button is clicked', async () => {
    render(<AlertSystem />);
    
    // 等待数据加载完成
    await screen.findByText('警报系统');
    
    // 填写表单
    const metricSelect = screen.getByRole('combobox', { name: '监控指标' });
    fireEvent.click(metricSelect);
    fireEvent.click(screen.getByText('磁盘使用率'));
    
    const conditionSelect = screen.getByRole('combobox', { name: '触发条件' });
    fireEvent.click(conditionSelect);
    fireEvent.click(screen.getByText('大于'));
    
    const thresholdInput = screen.getByPlaceholderText('输入阈值');
    fireEvent.change(thresholdInput, { target: { value: '75' } });
    
    // 点击添加按钮
    const addButton = screen.getByText('添加配置');
    fireEvent.click(addButton);
    
    // 验证 addAlertConfiguration 被调用
    expect(SystemMonitorAPI.addAlertConfiguration).toHaveBeenCalledWith(expect.objectContaining({
      metric: 'disk_usage',
      condition: 'greater_than',
      threshold: 75
    }));
  });

  it('calls updateAlertConfiguration when update button is clicked', async () => {
    render(<AlertSystem />);
    
    // 等待数据加载完成
    await screen.findByText('警报系统');
    
    // 点击编辑按钮
    fireEvent.click(screen.getAllByText('编辑')[0]);
    
    // 修改阈值
    const thresholdInput = screen.getByPlaceholderText('输入阈值');
    fireEvent.change(thresholdInput, { target: { value: '85' } });
    
    // 点击更新按钮
    const updateButton = screen.getByText('更新配置');
    fireEvent.click(updateButton);
    
    // 验证 updateAlertConfiguration 被调用
    expect(SystemMonitorAPI.updateAlertConfiguration).toHaveBeenCalledWith('1', expect.objectContaining({
      threshold: 85
    }));
  });

  it('calls deleteAlertConfiguration when delete button is clicked', async () => {
    render(<AlertSystem />);
    
    // 等待数据加载完成
    await screen.findByText('警报系统');
    
    // 点击删除按钮
    fireEvent.click(screen.getAllByText('删除')[0]);
    
    // 验证 deleteAlertConfiguration 被调用
    expect(SystemMonitorAPI.deleteAlertConfiguration).toHaveBeenCalledWith('1');
  });

  it('calls acknowledgeAlert when acknowledge button is clicked', async () => {
    render(<AlertSystem />);
    
    // 等待数据加载完成
    await screen.findByText('警报系统');
    
    // 点击历史标签
    fireEvent.click(screen.getByText('警报历史'));
    
    // 点击确认按钮
    fireEvent.click(screen.getByText('确认'));
    
    // 验证 acknowledgeAlert 被调用
    expect(SystemMonitorAPI.acknowledgeAlert).toHaveBeenCalledWith('alert-1', 'user');
  });
});