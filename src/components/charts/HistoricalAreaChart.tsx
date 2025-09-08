import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';

interface DataPoint {
  timestamp: string | Date;
  value: number;
  [key: string]: any;
}

interface HistoricalAreaChartProps {
  data: DataPoint[];
  dataKey: string;
  title: string;
  unit?: string;
  color?: string;
  fillColor?: string;
  warningThreshold?: number;
  criticalThreshold?: number;
  height?: number;
  showLegend?: boolean;
  timeRange?: '1h' | '24h' | '7d' | '30d';
}

const HistoricalAreaChart: React.FC<HistoricalAreaChartProps> = ({
  data,
  dataKey,
  title,
  unit = '',
  color = '#8884d8',
  fillColor = '#8884d8',
  warningThreshold,
  criticalThreshold,
  height = 300,
  showLegend = true,
  timeRange = '24h'
}) => {
  // 格式化时间戳
  const formatTimestamp = (timestamp: string | Date) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    
    switch (timeRange) {
      case '1h':
        return date.toLocaleTimeString();
      case '24h':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case '7d':
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      case '30d':
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      default:
        return date.toLocaleString();
    }
  };

  // 自定义工具提示
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium">{`${formatTimestamp(label)}`}</p>
          {payload.map((entry: any, index: number) => (
            <p 
              key={index} 
              className="text-sm" 
              style={{ color: entry.color || entry.stroke }}
            >
              {`${entry.name}: ${entry.value}${unit}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // 计算Y轴范围
  const calculateYAxisDomain = () => {
    if (data.length === 0) return [0, 100];
    
    const values = data.map(d => d[dataKey]);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    
    // 添加一些边距
    const range = maxValue - minValue;
    const padding = range * 0.1;
    
    return [Math.max(0, minValue - padding), maxValue + padding];
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`color${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={fillColor} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={fillColor} stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={formatTimestamp}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            domain={calculateYAxisDomain()}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${value}${unit}`}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            fillOpacity={1}
            fill={`url(#color${dataKey})`}
            strokeWidth={2}
            isAnimationActive={false}
          />
          {warningThreshold && (
            <ReferenceLine
              y={warningThreshold}
              stroke="#f59e0b"
              strokeDasharray="5 5"
              label={{ value: `警告: ${warningThreshold}${unit}`, position: 'top' }}
            />
          )}
          {criticalThreshold && (
            <ReferenceLine
              y={criticalThreshold}
              stroke="#ef4444"
              strokeDasharray="5 5"
              label={{ value: `严重: ${criticalThreshold}${unit}`, position: 'top' }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HistoricalAreaChart;