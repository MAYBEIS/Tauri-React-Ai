/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-09-02 17:07:48
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-09-08 09:53:38
 * @FilePath: \Tauri-React-Ai\src\lib\api.ts
 * @Description: API服务层，封装所有IPC调用
 */
import { invoke } from '@tauri-apps/api/core';

// 系统信息类型
export interface SystemInfo {
  os_name: string;
  os_version: string;
  hostname: string;
  kernel_version: string;
  // 实时字段
  uptime?: number;
  system_load?: number;
  last_updated?: Date;
}

// CPU信息类型
export interface CpuInfo {
  name: string;
  vendor_id: string;
  brand: string;
  cores: number;
  physical_cores: number;
  frequency: number;
  usage: number;
  temperature?: number;
  // 实时字段
  usage_per_core?: number[];
  current_frequency?: number;
  process_count?: number;
  thread_count?: number;
  last_updated?: Date;
}

// 内存信息类型
export interface MemoryInfo {
  total: number;
  available: number;
  used: number;
  free: number;
  usage_percent: number;
  // 实时字段
  swap_total?: number;
  swap_used?: number;
  swap_free?: number;
  swap_usage_percent?: number;
  page_faults?: number;
  page_ins?: number;
  page_outs?: number;
  last_updated?: Date;
}

// 磁盘信息类型
export interface DiskInfo {
  name: string;
  mount_point: string;
  total_space: number;
  available_space: number;
  used_space: number;
  usage_percent: number;
  file_system: string;
  is_removable: boolean;
}

// 网络接口类型
export interface NetworkInterface {
  name: string;
  description?: string;
  ip_address?: string;
  mac_address?: string;
  is_up: boolean;
}

// 网络状态类型
export interface NetworkStatus {
  is_connected: boolean;
  interfaces: NetworkInterface[];
  local_ip?: string;
  public_ip?: string;
}

// 音频设备类型
export interface AudioDevice {
  name: string;
  is_default: boolean;
  is_input: boolean;
  is_output: boolean;
  volume: number;
  is_muted: boolean;
}

// GPU信息类型
export interface GpuInfo {
  name: string;
  vendor: string;
  vram_total: number;
  vram_used: number;
  vram_free: number;
  usage_percent: number;
  temperature?: number;
}

// 历史系统数据接口
export interface HistoricalSystemData {
  id: string;
  timestamp: Date;
  cpu_usage: number;
  memory_usage: number;
  memory_total: number;
  disk_usage: DiskUsageData[];
  network_traffic: NetworkTrafficData;
  system_load: number;
}

// 磁盘使用数据接口
export interface DiskUsageData {
  mount_point: string;
  used_space: number;
  total_space: number;
  usage_percent: number;
}

// 网络流量数据接口
export interface NetworkTrafficData {
  bytes_received: number;
  bytes_sent: number;
  packets_received: number;
  packets_sent: number;
}

// 警报配置接口
export interface AlertConfiguration {
  id: string;
  metric: AlertMetric;
  condition: AlertCondition;
  threshold: number;
  severity: AlertSeverity;
  enabled: boolean;
  notification_methods: NotificationMethod[];
}

// 警报指标枚举
export enum AlertMetric {
  CpuUsage = 'cpu_usage',
  MemoryUsage = 'memory_usage',
  DiskUsage = 'disk_usage',
  NetworkTraffic = 'network_traffic'
}

// 警报条件枚举
export enum AlertCondition {
  GreaterThan = 'greater_than',
  LessThan = 'less_than',
  Equals = 'equals'
}

// 警报严重程度枚举
export enum AlertSeverity {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical'
}

// 通知方式枚举
export enum NotificationMethod {
  Visual = 'visual',
  Sound = 'sound',
  SystemTray = 'system_tray'
}

// 进程状态枚举
export enum ProcessStatus {
  Running = 'running',
  Sleeping = 'sleeping',
  Stopped = 'stopped',
  Zombie = 'zombie'
}

// 进程信息类型（扩展）
export interface ProcessInfo {
  pid: string;
  name: string;
  cmd: string;
  exe: string;
  cpu_usage: string;
  memory_usage: string;
  // 扩展字段
  path?: string;
  command_line?: string;
  cpu_usage_percent?: number;
  memory_usage_bytes?: number;
  thread_count?: number;
  priority?: number;
  status?: ProcessStatus;
  start_time?: Date;
  user?: string;
  parent_pid?: string;
  working_directory?: string;
}

// API服务类
export class SystemMonitorAPI {
  // 基本问候命令
  static async greet(name: string): Promise<string> {
    return await invoke('greet', { name });
  }

  // 获取系统信息
  static async getSystemInfo(): Promise<SystemInfo> {
    return await invoke('get_system_info');
  }

  // 获取CPU信息
  static async getCpuInfo(): Promise<CpuInfo> {
    return await invoke('get_cpu_info');
  }

  // 获取内存信息
  static async getMemoryInfo(): Promise<MemoryInfo> {
    return await invoke('get_memory_info');
  }

  // 获取磁盘信息
  static async getDiskInfo(): Promise<DiskInfo[]> {
    return await invoke('get_disk_info');
  }

  // 获取网络状态
  static async getNetworkStatus(): Promise<NetworkStatus> {
    return await invoke('get_network_status');
  }

  // 获取音频设备列表
  static async getAudioDevices(): Promise<AudioDevice[]> {
    return await invoke('get_audio_devices');
  }

  // Ping主机
  static async pingHost(host: string): Promise<string> {
    return await invoke('ping_host', { host });
  }

  // 获取系统运行时间
  static async getUptime(): Promise<number> {
    return await invoke('get_uptime');
  }

  // 获取进程列表
  static async getProcesses(): Promise<ProcessInfo[]> {
    return await invoke('get_processes');
  }

  // 获取GPU信息
  static async getGpuInfo(): Promise<GpuInfo[]> {
    return await invoke('get_gpu_info');
  }

  // 存储历史数据
  static async storeHistoricalData(data: {
    cpu_usage: number;
    memory_usage: number;
    memory_total: number;
    system_load: number;
    disk_usage: DiskUsageData[];
    network_traffic: NetworkTrafficData;
  }): Promise<string> {
    return await invoke('store_historical_data', {
      cpu_usage: data.cpu_usage,
      memory_usage: data.memory_usage,
      memory_total: data.memory_total,
      system_load: data.system_load,
      disk_usage: data.disk_usage,
      network_traffic: data.network_traffic,
    });
  }

  // 获取历史数据
  static async fetchHistoricalData(startTime: string, endTime: string): Promise<HistoricalSystemData[]> {
    return await invoke('fetch_historical_data', {
      start_time: startTime,
      end_time: endTime,
    });
  }

  // 导出历史数据
  static async exportHistoricalData(startTime: string, endTime: string): Promise<string> {
    return await invoke('export_historical_data', {
      start_time: startTime,
      end_time: endTime,
    });
  }

  // 清理历史数据
  static async pruneHistoricalData(retentionDays: number): Promise<number> {
    return await invoke('prune_historical_data', {
      retention_days: retentionDays,
    });
  }

  // 获取数据库统计信息
  static async getDatabaseStats(): Promise<{
    total_records: number;
    oldest_timestamp?: Date;
    newest_timestamp?: Date;
  }> {
    return await invoke('get_database_stats');
  }

  // 初始化数据库
  static async initDatabase(): Promise<void> {
    return await invoke('init_database');
  }
}

// 导出所有类型和API服务
export default SystemMonitorAPI;