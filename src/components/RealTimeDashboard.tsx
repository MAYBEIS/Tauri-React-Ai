import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Switch } from './ui/switch';
import { Alert, AlertDescription } from './ui/alert';
import useRealTimeMonitoring from '../hooks/useRealTimeMonitoring';
import { CpuInfo, MemoryInfo, DiskInfo, NetworkStatus, GpuInfo } from '../lib/api';

interface MetricThresholds {
  cpu: { warning: number; critical: number };
  memory: { warning: number; critical: number };
  disk: { warning: number; critical: number };
  network: { warning: number; critical: number };
}

const RealTimeDashboard: React.FC = () => {
  const [thresholds] = useState<MetricThresholds>({
    cpu: { warning: 70, critical: 90 },
    memory: { warning: 80, critical: 95 },
    disk: { warning: 85, critical: 95 },
    network: { warning: 1000, critical: 2000 }, // 网络延迟阈值（ms）
  });

  const [enableMetrics, setEnableMetrics] = useState({
    cpu: true,
    memory: true,
    disk: true,
    network: true,
    gpu: true,
  });

  const [updateInterval, setUpdateInterval] = useState(5000); // 默认5秒

  const { data, isActive, toggleMonitoring, refreshData } = useRealTimeMonitoring({
    interval: updateInterval,
    autoStart: true,
    enableCpu: enableMetrics.cpu,
    enableMemory: enableMetrics.memory,
    enableDisk: enableMetrics.disk,
    enableNetwork: enableMetrics.network,
    enableGpu: enableMetrics.gpu,
  });

  // 获取状态颜色
  const getStatusColor = (value: number, type: keyof MetricThresholds) => {
    const threshold = thresholds[type];
    if (value >= threshold.critical) return 'destructive';
    if (value >= threshold.warning) return 'secondary';
    return 'default';
  };

  // 获取状态文本
  const getStatusText = (value: number, type: keyof MetricThresholds) => {
    const threshold = thresholds[type];
    if (value >= threshold.critical) return '严重';
    if (value >= threshold.warning) return '警告';
    return '正常';
  };

  // 格式化字节大小
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 渲染CPU信息
  const renderCpuInfo = (cpu: CpuInfo) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          CPU 信息
          <Badge variant={getStatusColor(cpu.usage, 'cpu')}>
            {getStatusText(cpu.usage, 'cpu')}
          </Badge>
        </CardTitle>
        <CardDescription>{cpu.name}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span>CPU 使用率</span>
              <span>{cpu.usage.toFixed(1)}%</span>
            </div>
            <Progress value={cpu.usage} className="w-full" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">核心数</p>
              <p className="text-lg font-semibold">{cpu.cores}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">物理核心</p>
              <p className="text-lg font-semibold">{cpu.physical_cores}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">频率</p>
            <p className="text-lg font-semibold">{(cpu.frequency / 1000).toFixed(2)} GHz</p>
          </div>
          
          {cpu.temperature && (
            <div>
              <p className="text-sm text-muted-foreground">温度</p>
              <p className="text-lg font-semibold">{cpu.temperature.toFixed(1)}°C</p>
            </div>
          )}
          
          {data.lastUpdated && (
            <p className="text-xs text-muted-foreground">
              最后更新: {data.lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // 渲染内存信息
  const renderMemoryInfo = (memory: MemoryInfo) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          内存信息
          <Badge variant={getStatusColor(memory.usage_percent, 'memory')}>
            {getStatusText(memory.usage_percent, 'memory')}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span>内存使用率</span>
              <span>{memory.usage_percent.toFixed(1)}%</span>
            </div>
            <Progress value={memory.usage_percent} className="w-full" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">总内存</p>
              <p className="text-lg font-semibold">{formatBytes(memory.total)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">已用内存</p>
              <p className="text-lg font-semibold">{formatBytes(memory.used)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">可用内存</p>
              <p className="text-lg font-semibold">{formatBytes(memory.available)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">空闲内存</p>
              <p className="text-lg font-semibold">{formatBytes(memory.free)}</p>
            </div>
          </div>
          
          {memory.swap_total && (
            <div>
              <p className="text-sm text-muted-foreground">交换分区使用率</p>
              <div className="flex justify-between mb-2">
                <span>{formatBytes(memory.swap_used || 0)} / {formatBytes(memory.swap_total)}</span>
                <span>{memory.swap_usage_percent?.toFixed(1)}%</span>
              </div>
              <Progress value={memory.swap_usage_percent || 0} className="w-full" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // 渲染磁盘信息
  const renderDiskInfo = (disks: DiskInfo[]) => (
    <Card>
      <CardHeader>
        <CardTitle>磁盘信息</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {disks.map((disk, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{disk.name}</h4>
                <Badge variant={getStatusColor(disk.usage_percent, 'disk')}>
                  {getStatusText(disk.usage_percent, 'disk')}
                </Badge>
              </div>
              
              <div className="mb-2">
                <div className="flex justify-between mb-1">
                  <span className="text-sm">使用率</span>
                  <span className="text-sm">{disk.usage_percent.toFixed(1)}%</span>
                </div>
                <Progress value={disk.usage_percent} className="w-full" />
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">挂载点: </span>
                  <span>{disk.mount_point}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">文件系统: </span>
                  <span>{disk.file_system}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">总空间: </span>
                  <span>{formatBytes(disk.total_space)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">可用空间: </span>
                  <span>{formatBytes(disk.available_space)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // 渲染网络信息
  const renderNetworkInfo = (network: NetworkStatus) => (
    <Card>
      <CardHeader>
        <CardTitle>网络信息</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${network.is_connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{network.is_connected ? '已连接' : '未连接'}</span>
          </div>
          
          {network.local_ip && (
            <div>
              <p className="text-sm text-muted-foreground">本地 IP</p>
              <p className="font-mono">{network.local_ip}</p>
            </div>
          )}
          
          {network.public_ip && (
            <div>
              <p className="text-sm text-muted-foreground">公网 IP</p>
              <p className="font-mono">{network.public_ip}</p>
            </div>
          )}
          
          <div>
            <p className="text-sm text-muted-foreground mb-2">网络接口</p>
            <div className="space-y-2">
              {network.interfaces.map((iface, index) => (
                <div key={index} className="border rounded p-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{iface.name}</span>
                    <div className={`w-2 h-2 rounded-full ${iface.is_up ? 'bg-green-500' : 'bg-red-500'}`} />
                  </div>
                  {iface.ip_address && (
                    <p className="text-sm text-muted-foreground font-mono">{iface.ip_address}</p>
                  )}
                  {iface.mac_address && (
                    <p className="text-xs text-muted-foreground font-mono">{iface.mac_address}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // 渲染GPU信息
  const renderGpuInfo = (gpus: GpuInfo[]) => (
    <Card>
      <CardHeader>
        <CardTitle>GPU 信息</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {gpus.map((gpu, index) => (
            <div key={index} className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">{gpu.name}</h4>
              
              <div className="mb-2">
                <div className="flex justify-between mb-1">
                  <span className="text-sm">使用率</span>
                  <span className="text-sm">{gpu.usage_percent.toFixed(1)}%</span>
                </div>
                <Progress value={gpu.usage_percent} className="w-full" />
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">厂商: </span>
                  <span>{gpu.vendor}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">总显存: </span>
                  <span>{formatBytes(gpu.vram_total)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">已用显存: </span>
                  <span>{formatBytes(gpu.vram_used)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">可用显存: </span>
                  <span>{formatBytes(gpu.vram_free)}</span>
                </div>
              </div>
              
              {gpu.temperature && (
                <div className="mt-2">
                  <span className="text-muted-foreground">温度: </span>
                  <span>{gpu.temperature.toFixed(1)}°C</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 控制面板 */}
      <Card>
        <CardHeader>
          <CardTitle>实时监控控制面板</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={isActive}
                onCheckedChange={toggleMonitoring}
              />
              <span>实时监控</span>
            </div>
            
            <Button
              variant={isActive ? "destructive" : "default"}
              onClick={toggleMonitoring}
            >
              {isActive ? '停止监控' : '开始监控'}
            </Button>
            
            <Button
              variant="outline"
              onClick={refreshData}
              disabled={data.isLoading}
            >
              {data.isLoading ? '刷新中...' : '手动刷新'}
            </Button>
            
            <div className="flex items-center space-x-2">
              <span>更新间隔:</span>
              <select
                value={updateInterval}
                onChange={(e) => setUpdateInterval(Number(e.target.value))}
                className="border rounded px-2 py-1"
                disabled={isActive}
              >
                <option value={1000}>1秒</option>
                <option value={2000}>2秒</option>
                <option value={5000}>5秒</option>
                <option value={10000}>10秒</option>
                <option value={30000}>30秒</option>
              </select>
            </div>
          </div>
          
          {/* 指标开关 */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(enableMetrics).map(([key, enabled]) => (
              <div key={key} className="flex items-center space-x-2">
                <Switch
                  checked={enabled}
                  onCheckedChange={(checked: boolean) =>
                    setEnableMetrics(prev => ({ ...prev, [key]: checked }))
                  }
                />
                <span className="capitalize">{key}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* 错误提示 */}
      {data.error && (
        <Alert>
          <AlertDescription>{data.error}</AlertDescription>
        </Alert>
      )}
      
      {/* 系统信息网格 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {enableMetrics.cpu && data.cpu && renderCpuInfo(data.cpu)}
        {enableMetrics.memory && data.memory && renderMemoryInfo(data.memory)}
        {enableMetrics.disk && data.disk && renderDiskInfo(data.disk)}
        {enableMetrics.network && data.network && renderNetworkInfo(data.network)}
        {enableMetrics.gpu && data.gpu && renderGpuInfo(data.gpu)}
      </div>
      
      {/* 状态指示器 */}
      <Card>
        <CardHeader>
          <CardTitle>系统状态</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-500'}`} />
              <span>{isActive ? '监控中' : '已暂停'}</span>
            </div>
            {data.lastUpdated && (
              <p className="text-sm text-muted-foreground">
                最后更新: {data.lastUpdated.toLocaleString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeDashboard;