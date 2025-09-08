import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface DataPoint {
  timestamp: string | Date;
  value: number;
  label?: string;
}

interface RealTimeLineChartProps {
  data: DataPoint[];
  dataKey: string;
  title: string;
  unit?: string;
  color?: string;
  warningThreshold?: number;
  criticalThreshold?: number;
  height?: number;
  maxDataPoints?: number;
}

const RealTimeLineChart: React.FC<RealTimeLineChartProps> = ({
  data,
  dataKey,
  title,
  unit = '',
  color = '#8884d8',
  warningThreshold,
  criticalThreshold,
  height = 300,
  maxDataPoints = 50
}) => {
  // 格式化时间戳
  const formatTimestamp = (timestamp: string | Date) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString();
  };

  // 限制数据点数量
  const limitedData = data.slice(-maxDataPoints);

  // 自定义工具提示
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium">{`${formatTimestamp(label)}`}</p>
          <p className="text-sm" style={{ color }}>
            {`${title}: ${payload[0].value}${unit}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={limitedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={formatTimestamp}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${value}${unit}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
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
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RealTimeLineChart;