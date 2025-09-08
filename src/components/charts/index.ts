/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-09-08 10:26:39
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-09-08 10:27:51
 * @FilePath: \Tauri-React-Ai\src\components\charts\index.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
export { default as RealTimeLineChart } from './RealTimeLineChart';
export { default as HistoricalAreaChart } from './HistoricalAreaChart';

// 类型定义
export interface DataPoint {
  timestamp: string | Date;
  value: number;
  label?: string;
}

export interface RealTimeLineChartProps {
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

export interface HistoricalAreaChartProps {
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