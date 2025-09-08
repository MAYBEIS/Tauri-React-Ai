import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Alert, AlertDescription } from './ui/alert';
import { HistoricalAreaChart, RealTimeLineChart } from './charts';
import { SystemMonitorAPI, HistoricalSystemData } from '../lib/api';

interface TimeRangeOption {
  value: '1h' | '24h' | '7d' | '30d';
  label: string;
}

interface MetricOption {
  key: string;
  label: string;
  color: string;
  unit: string;
}

const HistoricalDataViewer: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['cpu_usage', 'memory_usage']);
  const [historicalData, setHistoricalData] = useState<HistoricalSystemData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportPath, setExportPath] = useState<string>('');

  const timeRangeOptions: TimeRangeOption[] = [
    { value: '1h', label: '过去1小时' },
    { value: '24h', label: '过去24小时' },
    { value: '7d', label: '过去7天' },
    { value: '30d', label: '过去30天' },
  ];

  const metricOptions: MetricOption[] = [
    { key: 'cpu_usage', label: 'CPU使用率', color: '#8884d8', unit: '%' },
    { key: 'memory_usage', label: '内存使用率', color: '#82ca9d', unit: '%' },
    { key: 'system_load', label: '系统负载', color: '#ffc658', unit: '' },
  ];

  // 计算时间范围
  const getTimeRangeDates = () => {
    const endTime = new Date();
    const startTime = new Date();
    
    switch (timeRange) {
      case '1h':
        startTime.setHours(startTime.getHours() - 1);
        break;
      case '24h':
        startTime.setHours(startTime.getHours() - 24);
        break;
      case '7d':
        startTime.setDate(startTime.getDate() - 7);
        break;
      case '30d':
        startTime.setDate(startTime.getDate() - 30);
        break;
    }
    
    return {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    };
  };

  // 获取历史数据
  const fetchHistoricalData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { startTime, endTime } = getTimeRangeDates();
      const data = await SystemMonitorAPI.fetchHistoricalData(startTime, endTime);
      setHistoricalData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取历史数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 导出历史数据
  const handleExport = async () => {
    try {
      const { startTime, endTime } = getTimeRangeDates();
      const path = await SystemMonitorAPI.exportHistoricalData(startTime, endTime);
      setExportPath(path);
      
      // 3秒后清除导出路径
      setTimeout(() => setExportPath(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '导出数据失败');
    }
  };

  // 处理指标选择
  const handleMetricChange = (metricKey: string, checked: boolean) => {
    if (checked) {
      setSelectedMetrics(prev => [...prev, metricKey]);
    } else {
      setSelectedMetrics(prev => prev.filter(key => key !== metricKey));
    }
  };

  // 格式化数据用于图表显示
  const formatDataForChart = (metricKey: string) => {
    return historicalData.map(item => ({
      timestamp: item.timestamp,
      value: item[metricKey as keyof HistoricalSystemData] as number,
    }));
  };

  // 初始化时获取数据
  useEffect(() => {
    fetchHistoricalData();
  }, [timeRange]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 控制面板 */}
      <Card>
        <CardHeader>
          <CardTitle>历史数据查看器</CardTitle>
          <CardDescription>查看和分析历史系统性能数据</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            {/* 时间范围选择 */}
            <div className="flex items-center space-x-2">
              <span>时间范围:</span>
              <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeRangeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* 刷新按钮 */}
            <Button onClick={fetchHistoricalData} disabled={isLoading}>
              {isLoading ? '加载中...' : '刷新数据'}
            </Button>
            
            {/* 导出按钮 */}
            <Button variant="outline" onClick={handleExport} disabled={isLoading}>
              导出CSV
            </Button>
          </div>
          
          {/* 指标选择 */}
          <div className="mt-4">
            <span className="text-sm font-medium mb-2 block">选择指标:</span>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {metricOptions.map(metric => (
                <div key={metric.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={metric.key}
                    checked={selectedMetrics.includes(metric.key)}
                    onCheckedChange={(checked) => handleMetricChange(metric.key, checked as boolean)}
                  />
                  <label htmlFor={metric.key} className="text-sm">
                    {metric.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 错误提示 */}
      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* 导出成功提示 */}
      {exportPath && (
        <Alert>
          <AlertDescription>数据已成功导出到: {exportPath}</AlertDescription>
        </Alert>
      )}
      
      {/* 数据统计 */}
      {historicalData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>数据统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">数据点数量</p>
                <p className="text-lg font-semibold">{historicalData.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">最早时间</p>
                <p className="text-sm font-medium">
                  {new Date(historicalData[0].timestamp).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">最晚时间</p>
                <p className="text-sm font-medium">
                  {new Date(historicalData[historicalData.length - 1].timestamp).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">选中的指标</p>
                <div className="flex flex-wrap gap-1">
                  {selectedMetrics.map(metric => {
                    const metricInfo = metricOptions.find(m => m.key === metric);
                    return (
                      <Badge key={metric} variant="secondary">
                        {metricInfo?.label}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 图表区域 */}
      <div className="grid grid-cols-1 gap-6">
        {selectedMetrics.map(metricKey => {
          const metricInfo = metricOptions.find(m => m.key === metricKey);
          if (!metricInfo) return null;
          
          const chartData = formatDataForChart(metricKey);
          
          return (
            <Card key={metricKey}>
              <CardHeader>
                <CardTitle>{metricInfo.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <HistoricalAreaChart
                  data={chartData}
                  dataKey="value"
                  title={metricInfo.label}
                  unit={metricInfo.unit}
                  color={metricInfo.color}
                  fillColor={metricInfo.color}
                  timeRange={timeRange}
                  warningThreshold={metricKey === 'cpu_usage' ? 70 : 
                                metricKey === 'memory_usage' ? 80 : undefined}
                  criticalThreshold={metricKey === 'cpu_usage' ? 90 : 
                                   metricKey === 'memory_usage' ? 95 : undefined}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* 无数据提示 */}
      {!isLoading && historicalData.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">没有找到指定时间范围的历史数据</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HistoricalDataViewer;