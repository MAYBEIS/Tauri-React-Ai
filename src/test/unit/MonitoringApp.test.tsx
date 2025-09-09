import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useTranslation } from 'react-i18next';
import MonitoringApp from '@/components/MonitoringApp';
import RealTimeDashboard from '@/components/RealTimeDashboard';
import HistoricalDataViewer from '@/components/HistoricalDataViewer';
import ProcessManager from '@/components/ProcessManager';
import NetworkDiagnostics from '@/components/NetworkDiagnostics';
import AlertSystem from '@/components/AlertSystem';

// 模拟组件
vi.mock('@/components/RealTimeDashboard', () => ({
  default: () => <div data-testid="realtime-dashboard">RealTimeDashboard</div>
}));

vi.mock('@/components/HistoricalDataViewer', () => ({
  default: () => <div data-testid="historical-viewer">HistoricalDataViewer</div>
}));

vi.mock('@/components/ProcessManager', () => ({
  default: () => <div data-testid="process-manager">ProcessManager</div>
}));

vi.mock('@/components/NetworkDiagnostics', () => ({
  default: () => <div data-testid="network-diagnostics">NetworkDiagnostics</div>
}));

vi.mock('@/components/AlertSystem', () => ({
  default: () => <div data-testid="alert-system">AlertSystem</div>
}));

// 模拟 useTranslation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: vi.fn()
    }
  })
}));

describe('MonitoringApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<MonitoringApp />);
    expect(screen.getByText('增强系统监控')).toBeInTheDocument();
    expect(screen.getByText('实时和历史系统性能监控')).toBeInTheDocument();
  });

  it('displays quick stats cards', () => {
    render(<MonitoringApp />);
    
    // 检查快速统计卡片
    expect(screen.getByText('CPU')).toBeInTheDocument();
    expect(screen.getByText('内存')).toBeInTheDocument();
    expect(screen.getByText('磁盘')).toBeInTheDocument();
    expect(screen.getByText('网络')).toBeInTheDocument();
    expect(screen.getByText('警报')).toBeInTheDocument();
    expect(screen.getByText('进程')).toBeInTheDocument();
  });

  it('renders tabs for different monitoring sections', () => {
    render(<MonitoringApp />);
    
    // 检查标签是否渲染
    expect(screen.getByText('实时监控')).toBeInTheDocument();
    expect(screen.getByText('历史数据')).toBeInTheDocument();
    expect(screen.getByText('进程管理')).toBeInTheDocument();
    expect(screen.getByText('网络诊断')).toBeInTheDocument();
    expect(screen.getByText('警报系统')).toBeInTheDocument();
    expect(screen.getByText('系统概览')).toBeInTheDocument();
  });

  it('displays the correct component for each tab', () => {
    render(<MonitoringApp />);
    
    // 默认显示实时监控
    expect(screen.getByTestId('realtime-dashboard')).toBeInTheDocument();
    
    // 点击历史数据标签
    fireEvent.click(screen.getByText('历史数据'));
    expect(screen.getByTestId('historical-viewer')).toBeInTheDocument();
    
    // 点击进程管理标签
    fireEvent.click(screen.getByText('进程管理'));
    expect(screen.getByTestId('process-manager')).toBeInTheDocument();
    
    // 点击网络诊断标签
    fireEvent.click(screen.getByText('网络诊断'));
    expect(screen.getByTestId('network-diagnostics')).toBeInTheDocument();
    
    // 点击警报系统标签
    fireEvent.click(screen.getByText('警报系统'));
    expect(screen.getByTestId('alert-system')).toBeInTheDocument();
    
    // 点击系统概览标签
    fireEvent.click(screen.getByText('系统概览'));
    expect(screen.queryByTestId('realtime-dashboard')).not.toBeInTheDocument();
    expect(screen.queryByTestId('historical-viewer')).not.toBeInTheDocument();
    expect(screen.queryByTestId('process-manager')).not.toBeInTheDocument();
    expect(screen.queryByTestId('network-diagnostics')).not.toBeInTheDocument();
    expect(screen.queryByTestId('alert-system')).not.toBeInTheDocument();
  });

  it('displays system overview cards in the system tab', () => {
    render(<MonitoringApp />);
    
    // 点击系统概览标签
    fireEvent.click(screen.getByText('monitoring.system'));
    
    // 检查系统概览卡片
    expect(screen.getByText('CPU')).toBeInTheDocument();
    expect(screen.getByText('内存')).toBeInTheDocument();
    expect(screen.getByText('存储')).toBeInTheDocument();
    expect(screen.getByText('网络')).toBeInTheDocument();
    expect(screen.getByText('健康状态')).toBeInTheDocument();
    expect(screen.getByText('运行时间')).toBeInTheDocument();
  });

  it('displays system information in the system tab', () => {
    render(<MonitoringApp />);
    
    // 点击系统概览标签
    fireEvent.click(screen.getByText('monitoring.system'));
    
    // 检查系统信息
    expect(screen.getByText('系统信息')).toBeInTheDocument();
    expect(screen.getByText('操作系统')).toBeInTheDocument();
    expect(screen.getByText('处理器')).toBeInTheDocument();
    expect(screen.getByText('显卡')).toBeInTheDocument();
  });
});