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
    expect(screen.getByText('monitoring.title')).toBeInTheDocument();
    expect(screen.getByText('monitoring.subtitle')).toBeInTheDocument();
  });

  it('displays quick stats cards', () => {
    render(<MonitoringApp />);
    
    // 检查快速统计卡片
    expect(screen.getByText('monitoring.cpu')).toBeInTheDocument();
    expect(screen.getByText('monitoring.memory')).toBeInTheDocument();
    expect(screen.getByText('monitoring.disk')).toBeInTheDocument();
    expect(screen.getByText('monitoring.network')).toBeInTheDocument();
    expect(screen.getByText('monitoring.alerts')).toBeInTheDocument();
    expect(screen.getByText('monitoring.processes')).toBeInTheDocument();
  });

  it('renders tabs for different monitoring sections', () => {
    render(<MonitoringApp />);
    
    // 检查标签是否渲染
    expect(screen.getByText('monitoring.realTime')).toBeInTheDocument();
    expect(screen.getByText('monitoring.historical')).toBeInTheDocument();
    expect(screen.getByText('monitoring.processes')).toBeInTheDocument();
    expect(screen.getByText('monitoring.network')).toBeInTheDocument();
    expect(screen.getByText('monitoring.alerts')).toBeInTheDocument();
    expect(screen.getByText('monitoring.system')).toBeInTheDocument();
  });

  it('displays the correct component for each tab', () => {
    render(<MonitoringApp />);
    
    // 默认显示实时监控
    expect(screen.getByTestId('realtime-dashboard')).toBeInTheDocument();
    
    // 点击历史数据标签
    fireEvent.click(screen.getByText('monitoring.historical'));
    expect(screen.getByTestId('historical-viewer')).toBeInTheDocument();
    
    // 点击进程管理标签
    fireEvent.click(screen.getByText('monitoring.processes'));
    expect(screen.getByTestId('process-manager')).toBeInTheDocument();
    
    // 点击网络诊断标签
    fireEvent.click(screen.getByText('monitoring.network'));
    expect(screen.getByTestId('network-diagnostics')).toBeInTheDocument();
    
    // 点击警报系统标签
    fireEvent.click(screen.getByText('monitoring.alerts'));
    expect(screen.getByTestId('alert-system')).toBeInTheDocument();
    
    // 点击系统概览标签
    fireEvent.click(screen.getByText('monitoring.system'));
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
    expect(screen.getByText('monitoring.cpu')).toBeInTheDocument();
    expect(screen.getByText('monitoring.memory')).toBeInTheDocument();
    expect(screen.getByText('monitoring.storage')).toBeInTheDocument();
    expect(screen.getByText('monitoring.network')).toBeInTheDocument();
    expect(screen.getByText('monitoring.health')).toBeInTheDocument();
    expect(screen.getByText('monitoring.uptime')).toBeInTheDocument();
  });

  it('displays system information in the system tab', () => {
    render(<MonitoringApp />);
    
    // 点击系统概览标签
    fireEvent.click(screen.getByText('monitoring.system'));
    
    // 检查系统信息
    expect(screen.getByText('monitoring.systemInformation')).toBeInTheDocument();
    expect(screen.getByText('monitoring.operatingSystem')).toBeInTheDocument();
    expect(screen.getByText('monitoring.processor')).toBeInTheDocument();
    expect(screen.getByText('monitoring.graphics')).toBeInTheDocument();
  });
});