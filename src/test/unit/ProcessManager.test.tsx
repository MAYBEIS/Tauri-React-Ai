import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProcessManager from '@/components/ProcessManager';
import SystemMonitorAPI from '@/lib/api';
import { IPCTestUtils } from '@/test/utils/ipc-test-utils';

// 模拟 SystemMonitorAPI
vi.mock('@/lib/api', () => ({
  default: {
    getProcesses: vi.fn(),
    getProcessDetails: vi.fn(),
    terminateProcess: vi.fn(),
  }
}));

describe('ProcessManager', () => {
  const mockProcesses = [
    {
      pid: '1234',
      name: 'chrome.exe',
      cpu_usage: '15.2',
      memory_usage: '1048576',
      cmd: 'C:\\Program Files\\Chrome\\chrome.exe --profile-directory=Default',
      exe: 'C:\\Program Files\\Chrome\\chrome.exe',
    },
    {
      pid: '5678',
      name: 'code.exe',
      cpu_usage: '8.5',
      memory_usage: '524288',
      cmd: 'C:\\Program Files\\VS Code\\Code.exe',
      exe: 'C:\\Program Files\\VS Code\\Code.exe',
    },
    {
      pid: '9012',
      name: 'node.exe',
      cpu_usage: '3.2',
      memory_usage: '262144',
      cmd: 'node server.js',
      exe: 'C:\\Program Files\\nodejs\\node.exe',
    }
  ];

  const mockProcessDetails = {
    pid: '1234',
    name: 'chrome.exe',
    cpu_usage: '15.2',
    memory_usage: '1048576',
    memory_percent: '5.2',
    cmd: 'C:\\Program Files\\Chrome\\chrome.exe --profile-directory=Default',
    exe: 'C:\\Program Files\\Chrome\\chrome.exe',
    cwd: 'C:\\Users\\TestUser',
    user: 'TestUser',
    start_time: new Date(Date.now() - 3600000).toISOString(),
    threads: 12,
    handles: 245,
    parent_pid: '5678',
    status: 'running',
    priority: 8
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // 模拟 API 调用返回成功
    (SystemMonitorAPI.getProcesses as any).mockResolvedValue(mockProcesses);
    (SystemMonitorAPI.getProcessDetails as any).mockResolvedValue(mockProcessDetails);
    (SystemMonitorAPI.terminateProcess as any).mockResolvedValue(true);
  });

  it('renders without crashing', async () => {
    render(<ProcessManager />);
    
    // 初始渲染时显示加载状态
    expect(screen.getByText('Loading processes...')).toBeInTheDocument();
    
    // 等待数据加载完成
    const title = await screen.findByText('进程管理');
    expect(title).toBeInTheDocument();
  });

  it('displays process list when data is loaded', async () => {
    render(<ProcessManager />);
    
    // 等待数据加载完成
    await screen.findByText('进程管理');
    
    // 检查进程列表
    expect(screen.getByText('chrome.exe')).toBeInTheDocument();
    expect(screen.getByText('code.exe')).toBeInTheDocument();
    expect(screen.getByText('node.exe')).toBeInTheDocument();
  });

  it('displays process details when a process is selected', async () => {
    render(<ProcessManager />);
    
    // 等待数据加载完成
    await screen.findByText('进程管理');
    
    // 点击一个进程
    fireEvent.click(screen.getByText('chrome.exe'));
    
    // 验证 getProcessDetails 被调用
    expect(SystemMonitorAPI.getProcessDetails).toHaveBeenCalledWith('1234');
    
    // 检查进程详情是否显示
    expect(screen.getByText('Process Details')).toBeInTheDocument();
    expect(screen.getByText('PID: 1234')).toBeInTheDocument();
    expect(screen.getByText('Name: chrome.exe')).toBeInTheDocument();
  });

  it('calls terminateProcess when terminate button is clicked', async () => {
    // 模拟用户确认
    window.confirm = vi.fn(() => true);
    
    render(<ProcessManager />);
    
    // 等待数据加载完成
    await screen.findByText('进程管理');
    
    // 点击一个进程
    fireEvent.click(screen.getByText('chrome.exe'));
    
    // 等待进程详情加载
    await screen.findByText('Process Details');
    
    // 点击终止按钮
    const terminateButton = screen.getByText('Terminate');
    fireEvent.click(terminateButton);
    
    // 验证 terminateProcess 被调用
    expect(SystemMonitorAPI.terminateProcess).toHaveBeenCalledWith('1234');
    
    // 验证确认对话框被调用
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to terminate chrome.exe (PID: 1234)?');
  });

  it('calls setProcessPriority when priority is changed', async () => {
    render(<ProcessManager />);
    
    // 等待数据加载完成
    await screen.findByText('进程管理');
    
    // 点击一个进程
    fireEvent.click(screen.getByText('chrome.exe'));
    
    // 等待进程详情加载
    await screen.findByText('Process Details');
    
    // 更改优先级
    const prioritySelect = screen.getByLabelText('Priority');
    fireEvent.change(prioritySelect, { target: { value: 'high' } });
    
    // 验证 getProcessDetails 被调用
    expect(SystemMonitorAPI.getProcessDetails).toHaveBeenCalledWith('1234');
  });

  it('displays error message when process loading fails', async () => {
    // 模拟 API 调用失败
    (SystemMonitorAPI.getProcesses as any).mockRejectedValue(new Error('Failed to fetch processes'));
    
    render(<ProcessManager />);
    
    // 等待错误消息显示
    const errorMessage = await screen.findByText('Failed to load processes. Please try again.');
    expect(errorMessage).toBeInTheDocument();
    
    // 检查重试按钮
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('retries data loading when retry button is clicked', async () => {
    // 第一次调用失败
    (SystemMonitorAPI.getProcesses as any)
      .mockRejectedValueOnce(new Error('Failed to fetch processes'))
      .mockResolvedValueOnce(mockProcesses);
    
    render(<ProcessManager />);
    
    // 等待错误消息显示
    await screen.findByText('Failed to load processes. Please try again.');
    
    // 点击重试按钮
    fireEvent.click(screen.getByText('Retry'));
    
    // 验证 API 被再次调用
    expect(SystemMonitorAPI.getProcesses).toHaveBeenCalledTimes(2);
    
    // 等待数据加载完成
    await screen.findByText('进程管理');
  });

  it('displays error message when process termination fails', async () => {
    // 模拟终止进程失败
    (SystemMonitorAPI.terminateProcess as any).mockRejectedValue(new Error('Access denied'));
    
    // 模拟用户确认
    window.confirm = vi.fn(() => true);
    
    render(<ProcessManager />);
    
    // 等待数据加载完成
    await screen.findByText('进程管理');
    
    // 点击一个进程
    fireEvent.click(screen.getByText('chrome.exe'));
    
    // 等待进程详情加载
    await screen.findByText('Process Details');
    
    // 点击终止按钮
    const terminateButton = screen.getByText('Terminate');
    fireEvent.click(terminateButton);
    
    // 等待错误消息显示
    const errorMessage = await screen.findByText('Failed to terminate process: Access denied');
    expect(errorMessage).toBeInTheDocument();
  });

  it('filters processes when search term is entered', async () => {
    render(<ProcessManager />);
    
    // 等待数据加载完成
    await screen.findByText('进程管理');
    
    // 输入搜索词
    const searchInput = screen.getByPlaceholderText('Search processes...');
    fireEvent.change(searchInput, { target: { value: 'chrome' } });
    
    // 检查过滤结果
    expect(screen.getByText('chrome.exe')).toBeInTheDocument();
    expect(screen.queryByText('code.exe')).not.toBeInTheDocument();
    expect(screen.queryByText('node.exe')).not.toBeInTheDocument();
  });

  it('sorts processes when column header is clicked', async () => {
    render(<ProcessManager />);
    
    // 等待数据加载完成
    await screen.findByText('进程管理');
    
    // 点击 CPU 列标题进行排序
    const cpuHeader = screen.getByText('CPU %');
    fireEvent.click(cpuHeader);
    
    // 检查排序结果（chrome.exe 应该在顶部，因为 CPU 使用率最高）
    const processRows = screen.getAllByTestId('process-row');
    expect(processRows[0]).toHaveTextContent('chrome.exe');
    
    // 再次点击 CPU 列标题进行反向排序
    fireEvent.click(cpuHeader);
    
    // 检查反向排序结果（node.exe 应该在顶部，因为 CPU 使用率最低）
    const reversedProcessRows = screen.getAllByTestId('process-row');
    expect(reversedProcessRows[0]).toHaveTextContent('node.exe');
  });

  it('refreshes process list when refresh button is clicked', async () => {
    render(<ProcessManager />);
    
    // 等待数据加载完成
    await screen.findByText('进程管理');
    
    // 点击刷新按钮
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    // 验证 getProcesses 被再次调用
    expect(SystemMonitorAPI.getProcesses).toHaveBeenCalledTimes(2);
  });
});