/*
 * @Author: Maybe 1913093102@qq.com
 * @Date: 2025-09-02 17:07:48
 * @LastEditors: Maybe 1913093102@qq.com
 * @LastEditTime: 2025-09-04 11:42:40
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
}

// 内存信息类型
export interface MemoryInfo {
  total: number;
  available: number;
  used: number;
  free: number;
  usage_percent: number;
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

// 进程信息类型
export interface ProcessInfo {
  pid: string;
  name: string;
  cmd: string;
  exe: string;
  cpu_usage: string;
  memory_usage: string;
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
}

// 导出所有类型和API服务
export default SystemMonitorAPI;