// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Deserialize, Serialize};
use sysinfo::{System, Networks, Disks};
use std::collections::HashMap;
use tauri::{State, Manager};
use std::process::Command;
use cpal::traits::{HostTrait, DeviceTrait};
mod database;
use database::{DatabaseManager, HistoricalSystemData, DiskUsageData, NetworkTrafficData};
use chrono::{DateTime, Utc};
use uuid::Uuid;

// 系统信息结构体
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SystemInfo {
    pub os_name: String,
    pub os_version: String,
    pub hostname: String,
    pub kernel_version: String,
}

// CPU信息结构体
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CpuInfo {
    pub name: String,
    pub vendor_id: String,
    pub brand: String,
    pub cores: usize,
    pub physical_cores: usize,
    pub frequency: u64,
    pub usage: f32,
    pub temperature: Option<f32>,
}

// 内存信息结构体
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MemoryInfo {
    pub total: u64,
    pub available: u64,
    pub used: u64,
    pub free: u64,
    pub usage_percent: f32,
}

// 磁盘信息结构体
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DiskInfo {
    pub name: String,
    pub mount_point: String,
    pub total_space: u64,
    pub available_space: u64,
    pub used_space: u64,
    pub usage_percent: f32,
    pub file_system: String,
    pub is_removable: bool,
}

// 网络接口信息结构体
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NetworkInterface {
    pub name: String,
    pub description: Option<String>,
    pub ip_address: Option<String>,
    pub mac_address: Option<String>,
    pub is_up: bool,
}

// 网络状态结构体
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NetworkStatus {
    pub is_connected: bool,
    pub interfaces: Vec<NetworkInterface>,
    pub local_ip: Option<String>,
    pub public_ip: Option<String>,
}

// 音频设备结构体
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AudioDevice {
    pub name: String,
    pub is_default: bool,
    pub is_input: bool,
    pub is_output: bool,
    pub volume: u32,
    pub is_muted: bool,
}

// GPU信息结构体
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GpuInfo {
    pub name: String,
    pub vendor: String,
    pub vram_total: u64,
    pub vram_used: u64,
    pub vram_free: u64,
    pub usage_percent: f32,
    pub temperature: Option<f32>,
}

// 系统状态结构体
pub struct SystemState {
    pub sys: System,
    pub db_manager: Option<DatabaseManager>,
}

impl Default for SystemState {
    fn default() -> Self {
        let mut sys = System::new_all();
        sys.refresh_all();
        Self {
            sys,
            db_manager: None,
        }
    }
}

impl SystemState {
    pub fn refresh(&mut self) {
        self.sys.refresh_all();
    }
    
    pub async fn init_database(&mut self, app_handle: tauri::AppHandle) -> Result<(), String> {
        match DatabaseManager::new(&app_handle).await {
            Ok(db_manager) => {
                self.db_manager = Some(db_manager);
                Ok(())
            }
            Err(e) => Err(format!("Failed to initialize database: {}", e)),
        }
    }
}

// 基本问候命令
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// 获取系统信息
#[tauri::command]
fn get_system_info(_state: State<SystemState>) -> Result<SystemInfo, String> {
    let os_name = System::name().unwrap_or_else(|| "Unknown".to_string());
    let os_version = System::os_version().unwrap_or_else(|| "Unknown".to_string());
    let hostname = System::host_name().unwrap_or_else(|| "Unknown".to_string());
    let kernel_version = System::kernel_version().unwrap_or_else(|| "Unknown".to_string());
    
    Ok(SystemInfo {
        os_name,
        os_version,
        hostname,
        kernel_version,
    })
}

// 获取CPU信息
#[tauri::command]
fn get_cpu_info(state: State<SystemState>) -> Result<CpuInfo, String> {
    // 直接使用State中的System实例
    let _sys = &state.sys;
    
    // 注意：我们不能直接修改State中的System对象
    // 需要创建一个新的System实例来获取最新信息
    let mut new_sys: System = System::new_all();
    new_sys.refresh_all();
    
    let cpu = new_sys.global_cpu_info();
    let name = cpu.name().to_string();
    let vendor_id = cpu.vendor_id().to_string();
    let brand = cpu.brand().to_string();
    let cores = new_sys.cpus().len();
    let physical_cores = new_sys.physical_core_count().unwrap_or(0);
    let frequency = cpu.frequency();
    let usage = cpu.cpu_usage();
    
    // 添加调试信息
    // println!("CPU Name: {}", name);
    // println!("CPU Vendor ID: {}", vendor_id);
    // println!("CPU Brand: {}", brand);
    // println!("CPU Cores: {}", cores);
    // println!("CPU Physical Cores: {}", physical_cores);
    // println!("CPU Frequency: {}", frequency);
    // println!("CPU Usage: {}", usage);
    
    // 注意：温度信息可能需要特定的库或硬件支持
    let temperature = None;
    
    Ok(CpuInfo {
        name,
        vendor_id,
        brand,
        cores,
        physical_cores,
        frequency,
        usage,
        temperature,
    })
}

// 获取内存信息
#[tauri::command]
fn get_memory_info(state: State<SystemState>) -> Result<MemoryInfo, String> {
    let sys = &state.sys;
    
    let total = sys.total_memory();
    let available = sys.available_memory();
    let used = total - available;
    let free = sys.free_memory();
    let usage_percent = (used as f32 / total as f32) * 100.0;
    
    Ok(MemoryInfo {
        total,
        available,
        used,
        free,
        usage_percent,
    })
}

// 获取磁盘信息
#[tauri::command]
async fn get_disk_info(_state: State<'_, SystemState>) -> Result<Vec<DiskInfo>, String> {
    // 在后台线程执行磁盘信息收集
    let disk_infos = tokio::task::spawn_blocking(|| {
        let disks = Disks::new_with_refreshed_list();
        
        let mut disk_infos = Vec::new();
        
        for disk in disks.list() {
            let total_space = disk.total_space();
            let available_space = disk.available_space();
            let used_space = total_space - available_space;
            let usage_percent = if total_space > 0 {
                (used_space as f32 / total_space as f32) * 100.0
            } else {
                0.0
            };
            
            let disk_info = DiskInfo {
                name: disk.name().to_string_lossy().to_string(),
                mount_point: disk.mount_point().to_string_lossy().to_string(),
                total_space,
                available_space,
                used_space,
                usage_percent,
                file_system: disk.file_system().to_string_lossy().to_string(),
                is_removable: disk.is_removable(),
            };
            
            disk_infos.push(disk_info);
        }
        
        disk_infos
    }).await;
    
    match disk_infos {
        Ok(infos) => Ok(infos),
        Err(e) => Err(format!("获取磁盘信息时发生错误: {}", e)),
    }
}

// 获取网络状态
#[tauri::command]
async fn get_network_status(_state: State<'_, SystemState>) -> Result<NetworkStatus, String> {
    // 在后台线程执行网络信息收集
    let network_status = tokio::task::spawn_blocking(|| {
        let networks = Networks::new_with_refreshed_list();
        
        let mut interfaces = Vec::new();
        let mut is_connected = false;
        let mut local_ip: Option<String> = None;
        
        for (interface_name, _network_data) in networks.iter() {
            // 检查接口是否已连接 (简化处理)
            is_connected = true;
            
            // 获取IP地址 (简化处理)
            let ip_addr_str = Some("192.168.1.100".to_string()); // 示例IP
            
            // 如果还没有本地IP且此接口有IP地址，则使用它
            if local_ip.is_none() && ip_addr_str.is_some() {
                local_ip = ip_addr_str.clone();
            }
            
            let interface = NetworkInterface {
                name: interface_name.clone(),
                description: None,
                ip_address: ip_addr_str,
                mac_address: None,
                is_up: true,
            };
            
            interfaces.push(interface);
        }
        
        NetworkStatus {
            is_connected,
            interfaces,
            local_ip,
            public_ip: None,
        }
    }).await;
    
    match network_status {
        Ok(status) => Ok(status),
        Err(e) => Err(format!("获取网络状态时发生错误: {}", e)),
    }
}

// 获取音频设备列表
#[tauri::command]
fn get_audio_devices() -> Result<Vec<AudioDevice>, String> {
    let host = cpal::default_host();
    let mut devices = Vec::new();
    
    // 获取输入设备
    if let Ok(input_devices) = host.input_devices() {
        let default_input = host.default_input_device();
        for device in input_devices {
            if let Ok(name) = device.name() {
                let is_default = if let Some(ref default_device) = default_input {
                    default_device.name().unwrap_or_default() == name
                } else {
                    false
                };
                
                devices.push(AudioDevice {
                    name,
                    is_default,
                    is_input: true,
                    is_output: false,
                    volume: 0, // CPAL不直接提供音量信息
                    is_muted: false, // CPAL不直接提供静音状态
                });
            }
        }
    }
    
    // 获取输出设备
    if let Ok(output_devices) = host.output_devices() {
        let default_output = host.default_output_device();
        for device in output_devices {
            if let Ok(name) = device.name() {
                let is_default = if let Some(ref default_device) = default_output {
                    default_device.name().unwrap_or_default() == name
                } else {
                    false
                };
                
                devices.push(AudioDevice {
                    name,
                    is_default,
                    is_input: false,
                    is_output: true,
                    volume: 0, // CPAL不直接提供音量信息
                    is_muted: false, // CPAL不直接提供静音状态
                });
            }
        }
    }
    
    Ok(devices)
}

// Ping主机
#[tauri::command]
async fn ping_host(host: String) -> Result<String, String> {
    // 使用tokio::task::spawn_blocking在后台线程执行阻塞操作
    let result = tokio::task::spawn_blocking(move || {
        // 使用系统命令执行ping
        let output = if cfg!(target_os = "windows") {
            Command::new("ping")
                .args(["-n", "1", "-w", "5000", &host])  // Windows ping命令参数
                .output()
        } else {
            Command::new("ping")
                .args(["-c", "1", "-W", "5", &host])  // Unix/Linux ping命令参数
                .output()
        };
        
        match output {
            Ok(result) => {
                // 添加调试信息
                let stdout_str = String::from_utf8_lossy(&result.stdout);
                let stderr_str = String::from_utf8_lossy(&result.stderr);
                
                if result.status.success() {
                    // 解析ping输出以获取延迟
                    let latency = parse_ping_latency(&stdout_str);
                    Ok(format!("Ping {} 成功: {}", host, latency))
                } else {
                    Err(format!("Ping {} 失败: stdout={}, stderr={}", host, stdout_str, stderr_str))
                }
            },
            Err(e) => Err(format!("无法执行ping命令: {}", e)),
        }
    }).await;
    
    match result {
        Ok(res) => res,
        Err(e) => Err(format!("执行ping任务时发生错误: {}", e)),
    }
}

// 解析ping输出以获取延迟
fn parse_ping_latency(output: &str) -> String {
    // 在Windows上查找类似 "时间=15ms" 的模式
    if let Some(pos) = output.find("时间=") {
        if let Some(end_pos) = output[pos..].find("ms") {
            // 确保索引不会越界
            let start = pos + 3; // "时间=".len()
            if start < pos + end_pos {
                return output[start..pos + end_pos].to_string();
            }
        }
    }
    
    // 在Unix/Linux上查找类似 "time=15.2 ms" 的模式
    if let Some(pos) = output.find("time=") {
        if let Some(end_pos) = output[pos..].find(" ms") {
            // 确保索引不会越界
            let start = pos + 5; // "time=".len()
            if start < pos + end_pos {
                return output[start..pos + end_pos].to_string();
            }
        }
    }
    
    // 如果没有找到预期的模式，返回原始输出的一部分用于调试
    if output.len() > 100 {
        format!("(output: {}...)", &output[..100])
    } else {
        format!("(output: {})", output)
    }
}

// 获取系统运行时间
#[tauri::command]
fn get_uptime(_state: State<SystemState>) -> Result<u64, String> {
    Ok(System::uptime())
}

// 网络连接信息结构体
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NetworkConnectionInfo {
    pub local_address: String,
    pub local_port: u16,
    pub remote_address: Option<String>,
    pub remote_port: Option<u16>,
    pub protocol: String,
    pub state: String,
    pub pid: Option<u32>,
    pub process_name: Option<String>,
}

// 网络诊断结果结构体
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NetworkDiagnosticsResult {
    pub success: bool,
    pub message: String,
    pub latency_ms: Option<f64>,
    pub packet_loss_percent: Option<f32>,
    pub hops: Option<Vec<NetworkHop>>,
}

// 网络跃点信息结构体
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NetworkHop {
    pub hop_number: u32,
    pub address: String,
    pub hostname: Option<String>,
    pub latency_ms: Option<f64>,
    pub packet_loss_percent: Option<f32>,
}

// 获取网络连接列表
#[tauri::command]
async fn get_network_connections(_state: State<'_, SystemState>) -> Result<Vec<NetworkConnectionInfo>, String> {
    // 在后台线程执行网络连接信息收集
    let connections = tokio::task::spawn_blocking(|| {
        let mut connections = Vec::new();
        
        // 使用系统命令获取网络连接信息
        let output = if cfg!(target_os = "windows") {
            Command::new("netstat")
                .args(["-ano"])
                .output()
        } else {
            // Unix/Linux系统
            Command::new("netstat")
                .args(["-tunlp"])
                .output()
        };
        
        match output {
            Ok(result) => {
                if result.status.success() {
                    let stdout_str = String::from_utf8_lossy(&result.stdout);
                    connections = parse_network_connections(&stdout_str);
                }
            },
            Err(_) => {
                // 如果无法执行命令，返回空向量
            }
        }
        
        connections
    }).await;
    
    match connections {
        Ok(conns) => Ok(conns),
        Err(e) => Err(format!("获取网络连接列表时发生错误: {}", e)),
    }
}

// 解析网络连接信息
fn parse_network_connections(output: &str) -> Vec<NetworkConnectionInfo> {
    let mut connections = Vec::new();
    let lines: Vec<&str> = output.lines().collect();
    
    // 跳过标题行
    for line in lines.iter().skip(4) {
        let trimmed_line = line.trim();
        if trimmed_line.is_empty() {
            continue;
        }
        
        // Windows netstat -ano 输出格式
        if cfg!(target_os = "windows") {
            if let Some(connection) = parse_windows_netstat_line(trimmed_line) {
                connections.push(connection);
            }
        } else {
            // Unix/Linux netstat -tunlp 输出格式
            if let Some(connection) = parse_unix_netstat_line(trimmed_line) {
                connections.push(connection);
            }
        }
    }
    
    connections
}

// 解析Windows netstat行
fn parse_windows_netstat_line(line: &str) -> Option<NetworkConnectionInfo> {
    let parts: Vec<&str> = line.split_whitespace().collect();
    if parts.len() < 4 {
        return None;
    }
    
    let protocol = parts[0].to_string();
    let local_address_parts: Vec<&str> = parts[1].split(':').collect();
    let remote_address_parts: Vec<&str> = parts[2].split(':').collect();
    let state = parts[3].to_string();
    let pid = parts.get(4).and_then(|s| s.parse::<u32>().ok());
    
    let local_address = local_address_parts.get(0).unwrap_or(&"").to_string();
    let local_port = local_address_parts.get(1).unwrap_or(&"0").parse::<u16>().unwrap_or(0);
    
    let remote_address = if remote_address_parts.len() > 0 && !remote_address_parts[0].is_empty() {
        Some(remote_address_parts.get(0).unwrap_or(&"").to_string())
    } else {
        None
    };
    
    let remote_port = if remote_address_parts.len() > 1 {
        remote_address_parts.get(1).unwrap_or(&"0").parse::<u16>().ok()
    } else {
        None
    };
    
    Some(NetworkConnectionInfo {
        local_address,
        local_port,
        remote_address,
        remote_port,
        protocol,
        state,
        pid,
        process_name: None, // 需要额外查询进程名称
    })
}

// 解析Unix/Linux netstat行
fn parse_unix_netstat_line(line: &str) -> Option<NetworkConnectionInfo> {
    let parts: Vec<&str> = line.split_whitespace().collect();
    if parts.len() < 6 {
        return None;
    }
    
    let protocol = parts[0].to_string();
    let (local_address, local_port) = parse_address_port(parts[3]);
    let (remote_address, remote_port) = parse_address_port(parts[4]);
    let state = parts[5].to_string();
    
    // 解析PID和进程名称
    let mut pid = None;
    let mut process_name = None;
    
    if let Some(pid_program) = parts.get(6) {
        if let Some(pid_str) = pid_program.split('/').next() {
            pid = pid_str.parse::<u32>().ok();
            process_name = pid_program.strip_prefix(pid_str).map(|s| s.trim_start_matches('/').to_string());
        }
    }
    
    Some(NetworkConnectionInfo {
        local_address,
        local_port,
        remote_address: Some(remote_address),
        remote_port: Some(remote_port),
        protocol,
        state,
        pid,
        process_name,
    })
}

// 解析地址和端口
fn parse_address_port(addr_port: &str) -> (String, u16) {
    let parts: Vec<&str> = addr_port.split(':').collect();
    if parts.len() >= 2 {
        let address = parts[0..parts.len()-1].join(":");
        let port = parts[parts.len()-1].parse::<u16>().unwrap_or(0);
        (address, port)
    } else {
        (addr_port.to_string(), 0)
    }
}

// 执行网络诊断（Ping）
#[tauri::command]
async fn diagnose_network_ping(_state: State<'_, SystemState>, host: String, count: Option<u32>) -> Result<NetworkDiagnosticsResult, String> {
    let ping_count = count.unwrap_or(4);
    
    // 在后台线程执行网络诊断
    let result = tokio::task::spawn_blocking(move || {
        let output = if cfg!(target_os = "windows") {
            Command::new("ping")
                .args(["-n", &ping_count.to_string(), "-w", "5000", &host])
                .output()
        } else {
            Command::new("ping")
                .args(["-c", &ping_count.to_string(), "-W", "5", &host])
                .output()
        };
        
        match output {
            Ok(result) => {
                if result.status.success() {
                    let stdout_str = String::from_utf8_lossy(&result.stdout);
                    parse_ping_result(&stdout_str, ping_count)
                } else {
                    let stderr_str = String::from_utf8_lossy(&result.stderr);
                    Ok(NetworkDiagnosticsResult {
                        success: false,
                        message: format!("Ping失败: {}", stderr_str),
                        latency_ms: None,
                        packet_loss_percent: None,
                        hops: None,
                    })
                }
            },
            Err(e) => Ok(NetworkDiagnosticsResult {
                success: false,
                message: format!("无法执行ping命令: {}", e),
                latency_ms: None,
                packet_loss_percent: None,
                hops: None,
            })
        }
    }).await;
    
    match result {
        Ok(res) => res,
        Err(e) => Err(format!("执行网络诊断时发生错误: {}", e)),
    }
}

// 解析ping结果
fn parse_ping_result(output: &str, _count: u32) -> Result<NetworkDiagnosticsResult, String> {
    // 在Windows上查找类似 "平均 = 15ms" 的模式
    if cfg!(target_os = "windows") {
        if let Some(avg_latency) = extract_windows_ping_avg_latency(output) {
            let packet_loss = extract_windows_ping_packet_loss(output).unwrap_or(0.0);
            
            return Ok(NetworkDiagnosticsResult {
                success: true,
                message: "Ping成功".to_string(),
                latency_ms: Some(avg_latency),
                packet_loss_percent: Some(packet_loss),
                hops: None,
            });
        }
    }
    
    // 在Unix/Linux上查找类似 "rtt min/avg/max/mdev = 10.123/15.456/20.789/5.123 ms" 的模式
    if let Some(avg_latency) = extract_unix_ping_avg_latency(output) {
        let packet_loss = extract_unix_ping_packet_loss(output).unwrap_or(0.0);
        
        return Ok(NetworkDiagnosticsResult {
            success: true,
            message: "Ping成功".to_string(),
            latency_ms: Some(avg_latency),
            packet_loss_percent: Some(packet_loss),
            hops: None,
        });
    }
    
    // 如果无法解析，返回原始输出
    Err(format!("无法解析ping结果: {}", &output[..100.min(output.len())]))
}

// 提取Windows ping平均延迟
fn extract_windows_ping_avg_latency(output: &str) -> Option<f64> {
    if let Some(pos) = output.find("平均 = ") {
        if let Some(end_pos) = output[pos..].find("ms") {
            let latency_str = &output[pos + 5..pos + end_pos];
            return latency_str.trim().parse::<f64>().ok();
        }
    }
    None
}

// 提取Windows ping丢包率
fn extract_windows_ping_packet_loss(output: &str) -> Option<f32> {
    if let Some(pos) = output.find("(") {
        if let Some(end_pos) = output[pos..].find("%") {
            let loss_str = &output[pos + 1..pos + end_pos];
            return loss_str.trim().parse::<f32>().ok();
        }
    }
    None
}

// 提取Unix/Linux ping平均延迟
fn extract_unix_ping_avg_latency(output: &str) -> Option<f64> {
    if let Some(pos) = output.find("rtt min/avg/max/mdev = ") {
        if let Some(end_pos) = output[pos..].find(" ms") {
            let rtt_part = &output[pos + 21..pos + end_pos];
            let parts: Vec<&str> = rtt_part.split('/').collect();
            if parts.len() >= 2 {
                return parts[1].trim().parse::<f64>().ok();
            }
        }
    }
    None
}

// 提取Unix/Linux ping丢包率
fn extract_unix_ping_packet_loss(output: &str) -> Option<f32> {
    if let Some(pos) = output.find("packet loss") {
        let before = &output[..pos];
        if let Some(last_space) = before.rfind(' ') {
            let loss_str = &before[last_space + 1..];
            return loss_str.trim_end_matches('%').parse::<f32>().ok();
        }
    }
    None
}

// 执行网络诊断（Traceroute）
#[tauri::command]
async fn diagnose_network_traceroute(_state: State<'_, SystemState>, host: String) -> Result<NetworkDiagnosticsResult, String> {
    // 在后台线程执行网络诊断
    let result = tokio::task::spawn_blocking(move || {
        let output = if cfg!(target_os = "windows") {
            Command::new("tracert")
                .args([&host])
                .output()
        } else {
            Command::new("traceroute")
                .args([&host])
                .output()
        };
        
        match output {
            Ok(result) => {
                let stdout_str = String::from_utf8_lossy(&result.stdout);
                let stderr_str = String::from_utf8_lossy(&result.stderr);
                
                if result.status.success() || !stdout_str.is_empty() {
                    parse_traceroute_result(&stdout_str)
                } else {
                    Ok(NetworkDiagnosticsResult {
                        success: false,
                        message: format!("Traceroute失败: {}", stderr_str),
                        latency_ms: None,
                        packet_loss_percent: None,
                        hops: None,
                    })
                }
            },
            Err(e) => Ok(NetworkDiagnosticsResult {
                success: false,
                message: format!("无法执行traceroute命令: {}", e),
                latency_ms: None,
                packet_loss_percent: None,
                hops: None,
            })
        }
    }).await;
    
    match result {
        Ok(res) => res,
        Err(e) => Err(format!("执行网络诊断时发生错误: {}", e)),
    }
}

// 解析traceroute结果
fn parse_traceroute_result(output: &str) -> Result<NetworkDiagnosticsResult, String> {
    let mut hops = Vec::new();
    let lines: Vec<&str> = output.lines().collect();
    
    for line in lines.iter() {
        if let Some(hop) = parse_traceroute_hop(line) {
            hops.push(hop);
        }
    }
    
    if hops.is_empty() {
        return Err(format!("无法解析traceroute结果: {}", &output[..100.min(output.len())]));
    }
    
    Ok(NetworkDiagnosticsResult {
        success: true,
        message: "Traceroute成功".to_string(),
        latency_ms: None,
        packet_loss_percent: None,
        hops: Some(hops),
    })
}

// 解析traceroute跃点
fn parse_traceroute_hop(line: &str) -> Option<NetworkHop> {
    let trimmed_line = line.trim();
    if trimmed_line.is_empty() {
        return None;
    }
    
    // Windows tracert格式
    if cfg!(target_os = "windows") {
        if let Some(hop_number) = extract_windows_tracert_hop_number(trimmed_line) {
            let (address, hostname, latency) = extract_windows_tracert_hop_info(trimmed_line);
            
            return Some(NetworkHop {
                hop_number,
                address,
                hostname,
                latency_ms: latency,
                packet_loss_percent: None,
            });
        }
    }
    
    // Unix/Linux traceroute格式
    if let Some(hop_number) = extract_unix_traceroute_hop_number(trimmed_line) {
        let (address, hostname, latency) = extract_unix_traceroute_hop_info(trimmed_line);
        
        return Some(NetworkHop {
            hop_number,
            address,
            hostname,
            latency_ms: latency,
            packet_loss_percent: None,
        });
    }
    
    None
}

// 提取Windows tracert跃点编号
fn extract_windows_tracert_hop_number(line: &str) -> Option<u32> {
    let parts: Vec<&str> = line.split_whitespace().collect();
    if parts.len() >= 2 {
        return parts[0].parse::<u32>().ok();
    }
    None
}

// 提取Windows tracert跃点信息
fn extract_windows_tracert_hop_info(line: &str) -> (String, Option<String>, Option<f64>) {
    let parts: Vec<&str> = line.split_whitespace().collect();
    
    if parts.len() >= 3 {
        let address = parts[1].to_string();
        let hostname = if parts.len() >= 4 && !parts[2].starts_with('[') {
            Some(parts[2].to_string())
        } else {
            None
        };
        
        // 查找延迟信息
        let latency = parts.iter()
            .find(|p| p.ends_with("ms"))
            .and_then(|p| p.replace("ms", "").parse::<f64>().ok());
        
        (address, hostname, latency)
    } else {
        ("unknown".to_string(), None, None)
    }
}

// 提取Unix/Linux traceroute跃点编号
fn extract_unix_traceroute_hop_number(line: &str) -> Option<u32> {
    let parts: Vec<&str> = line.split_whitespace().collect();
    if parts.len() >= 2 {
        return parts[0].parse::<u32>().ok();
    }
    None
}

// 提取Unix/Linux traceroute跃点信息
fn extract_unix_traceroute_hop_info(line: &str) -> (String, Option<String>, Option<f64>) {
    let parts: Vec<&str> = line.split_whitespace().collect();
    
    if parts.len() >= 3 {
        let address = parts[1].to_string();
        let hostname = if parts.len() >= 4 && parts[2].starts_with('(') && parts[2].ends_with(')') {
            Some(parts[2].trim_start_matches('(').trim_end_matches(')').to_string())
        } else {
            None
        };
        
        // 查找延迟信息
        let latency = parts.iter()
            .find(|p| p.ends_with("ms"))
            .and_then(|p| p.replace("ms", "").parse::<f64>().ok());
        
        (address, hostname, latency)
    } else {
        ("unknown".to_string(), None, None)
    }
}

// 重新导出数据库模块中的类型
pub use database::{AlertConfiguration, AlertHistory};

// 获取所有警报配置
#[tauri::command]
async fn get_alert_configurations(
    state: State<'_, SystemState>,
) -> Result<Vec<AlertConfiguration>, String> {
    let db_manager = state.db_manager.as_ref()
        .ok_or_else(|| "Database not initialized".to_string())?;
    
    db_manager.get_alert_configurations()
        .await
        .map_err(|e| format!("Failed to get alert configurations: {}", e))
}

// 添加警报配置
#[tauri::command]
async fn add_alert_configuration(
    state: State<'_, SystemState>,
    config: AlertConfiguration,
) -> Result<String, String> {
    let db_manager = state.db_manager.as_ref()
        .ok_or_else(|| "Database not initialized".to_string())?;
    
    db_manager.add_alert_configuration(&config)
        .await
        .map_err(|e| format!("Failed to add alert configuration: {}", e))
}

// 更新警报配置
#[tauri::command]
async fn update_alert_configuration(
    state: State<'_, SystemState>,
    id: String,
    config: AlertConfiguration,
) -> Result<(), String> {
    let db_manager = state.db_manager.as_ref()
        .ok_or_else(|| "Database not initialized".to_string())?;
    
    db_manager.update_alert_configuration(&id, &config)
        .await
        .map_err(|e| format!("Failed to update alert configuration: {}", e))
}

// 删除警报配置
#[tauri::command]
async fn delete_alert_configuration(
    state: State<'_, SystemState>,
    id: String,
) -> Result<(), String> {
    let db_manager = state.db_manager.as_ref()
        .ok_or_else(|| "Database not initialized".to_string())?;
    
    db_manager.delete_alert_configuration(&id)
        .await
        .map_err(|e| format!("Failed to delete alert configuration: {}", e))
}

// 获取警报历史
#[tauri::command]
async fn get_alert_history(
    state: State<'_, SystemState>,
    limit: Option<u32>,
    offset: Option<u32>,
) -> Result<Vec<AlertHistory>, String> {
    let db_manager = state.db_manager.as_ref()
        .ok_or_else(|| "Database not initialized".to_string())?;
    
    db_manager.get_alert_history(limit.unwrap_or(100), offset.unwrap_or(0))
        .await
        .map_err(|e| format!("Failed to get alert history: {}", e))
}

// 确认警报
#[tauri::command]
async fn acknowledge_alert(
    state: State<'_, SystemState>,
    id: String,
    acknowledged_by: String,
) -> Result<(), String> {
    let db_manager = state.db_manager.as_ref()
        .ok_or_else(|| "Database not initialized".to_string())?;
    
    db_manager.acknowledge_alert(&id, &acknowledged_by)
        .await
        .map_err(|e| format!("Failed to acknowledge alert: {}", e))
}

// 检查警报
#[tauri::command]
async fn check_alerts(
    state: State<'_, SystemState>,
    cpu_usage: f32,
    memory_usage: f32,
    disk_usage: f32,
    network_traffic: f64,
) -> Result<Vec<AlertHistory>, String> {
    let db_manager = state.db_manager.as_ref()
        .ok_or_else(|| "Database not initialized".to_string())?;
    
    db_manager.check_alerts(cpu_usage, memory_usage, disk_usage, network_traffic)
        .await
        .map_err(|e| format!("Failed to check alerts: {}", e))
}

// 进程详细信息结构体
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProcessDetails {
    pub pid: String,
    pub name: String,
    pub path: Option<String>,
    pub command_line: String,
    pub exe: Option<String>,
    pub cpu_usage_percent: f32,
    pub memory_usage_bytes: u64,
    pub thread_count: u32,
    pub priority: i32,
    pub status: String,
    pub start_time: Option<String>,
    pub user: Option<String>,
    pub parent_pid: Option<String>,
    pub working_directory: Option<String>,
}

// 进程排序选项
#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessSortOptions {
    pub sort_by: String,
    pub sort_order: String, // "asc" or "desc"
    pub filter_name: Option<String>,
    pub filter_user: Option<String>,
    pub min_cpu_usage: Option<f32>,
    pub max_memory_usage: Option<u64>,
}

// 获取进程列表（增强版）
#[tauri::command]
async fn get_processes_enhanced(
    _state: State<'_, SystemState>,
    sort_options: Option<ProcessSortOptions>,
) -> Result<Vec<ProcessDetails>, String> {
    // 在后台线程执行进程信息收集
    let processes = tokio::task::spawn_blocking(move || {
        let mut sys = System::new_all();
        sys.refresh_all();
        
        let mut processes = Vec::new();
        
        for (pid, process) in sys.processes() {
            let process_details = ProcessDetails {
                pid: pid.as_u32().to_string(),
                name: process.name().to_string(),
                path: process.exe().map(|p| p.to_string_lossy().to_string()),
                command_line: process.cmd().join(" "),
                exe: process.exe().map(|p| p.to_string_lossy().to_string()),
                cpu_usage_percent: process.cpu_usage(),
                memory_usage_bytes: process.memory(),
                thread_count: 0, // sysinfo crate doesn't have threads() method in Process
                priority: 0, // sysinfo crate doesn't have priority() method in Process
                status: format!("{:?}", process.status()),
                start_time: Some(process.start_time().to_string()),
                user: process.user_id().map(|uid| uid.to_string()),
                parent_pid: process.parent().map(|p| p.as_u32().to_string()),
                working_directory: process.cwd().map(|p| p.to_string_lossy().to_string()),
            };
            
            processes.push(process_details);
        }
        
        // 应用过滤和排序
        if let Some(options) = sort_options {
            // 过滤
            if let Some(filter_name) = &options.filter_name {
                processes.retain(|p| p.name.to_lowercase().contains(&filter_name.to_lowercase()));
            }
            
            if let Some(filter_user) = &options.filter_user {
                processes.retain(|p| p.user.as_ref().map_or(false, |user| user.contains(filter_user)));
            }
            
            if let Some(min_cpu) = options.min_cpu_usage {
                processes.retain(|p| p.cpu_usage_percent >= min_cpu);
            }
            
            if let Some(max_memory) = options.max_memory_usage {
                processes.retain(|p| p.memory_usage_bytes <= max_memory);
            }
            
            // 排序
            match options.sort_by.as_str() {
                "name" => {
                    if options.sort_order == "desc" {
                        processes.sort_by(|a, b| b.name.cmp(&a.name));
                    } else {
                        processes.sort_by(|a, b| a.name.cmp(&b.name));
                    }
                },
                "cpu" => {
                    if options.sort_order == "desc" {
                        processes.sort_by(|a, b| b.cpu_usage_percent.partial_cmp(&a.cpu_usage_percent).unwrap_or(std::cmp::Ordering::Equal));
                    } else {
                        processes.sort_by(|a, b| a.cpu_usage_percent.partial_cmp(&b.cpu_usage_percent).unwrap_or(std::cmp::Ordering::Equal));
                    }
                },
                "memory" => {
                    if options.sort_order == "desc" {
                        processes.sort_by(|a, b| b.memory_usage_bytes.cmp(&a.memory_usage_bytes));
                    } else {
                        processes.sort_by(|a, b| a.memory_usage_bytes.cmp(&b.memory_usage_bytes));
                    }
                },
                "pid" => {
                    if options.sort_order == "desc" {
                        processes.sort_by(|a, b| b.pid.cmp(&a.pid));
                    } else {
                        processes.sort_by(|a, b| a.pid.cmp(&b.pid));
                    }
                },
                _ => {
                    // 默认按CPU使用率降序排序
                    processes.sort_by(|a, b| b.cpu_usage_percent.partial_cmp(&a.cpu_usage_percent).unwrap_or(std::cmp::Ordering::Equal));
                }
            }
        }
        
        processes
    }).await;
    
    match processes {
        Ok(procs) => Ok(procs),
        Err(e) => Err(format!("获取进程列表时发生错误: {}", e)),
    }
}

// 获取进程详细信息
#[tauri::command]
async fn get_process_details(_state: State<'_, SystemState>, pid: String) -> Result<ProcessDetails, String> {
    // 在后台线程执行进程详细信息收集
    let process_details = tokio::task::spawn_blocking(move || {
        let mut sys = System::new_all();
        sys.refresh_all();
        
        // 解析PID
        let pid_num = pid.parse::<u32>().map_err(|_| "Invalid PID format".to_string())?;
        let pid = sysinfo::Pid::from_u32(pid_num);
        
        // 查找进程
        if let Some(process) = sys.process(pid) {
            Ok(ProcessDetails {
                pid: pid.as_u32().to_string(),
                name: process.name().to_string(),
                path: process.exe().map(|p| p.to_string_lossy().to_string()),
                command_line: process.cmd().join(" "),
                exe: process.exe().map(|p| p.to_string_lossy().to_string()),
                cpu_usage_percent: process.cpu_usage(),
                memory_usage_bytes: process.memory(),
                thread_count: 0, // sysinfo crate doesn't have threads() method in Process
                priority: 0, // sysinfo crate doesn't have priority() method in Process
                status: format!("{:?}", process.status()),
                start_time: Some(process.start_time().to_string()),
                user: process.user_id().map(|uid| uid.to_string()),
                parent_pid: process.parent().map(|p| p.as_u32().to_string()),
                working_directory: process.cwd().map(|p| p.to_string_lossy().to_string()),
            })
        } else {
            Err(format!("Process with PID {} not found", pid))
        }
    }).await;
    
    match process_details {
        Ok(details) => details,
        Err(e) => Err(format!("获取进程详细信息时发生错误: {}", e)),
    }
}

// 终止进程
#[tauri::command]
async fn terminate_process(_state: State<'_, SystemState>, pid: String, force: bool) -> Result<String, String> {
    // 在后台线程执行进程终止
    let result = tokio::task::spawn_blocking(move || {
        // 解析PID
        let pid_num = pid.parse::<u32>().map_err(|_| "Invalid PID format".to_string())?;
        
        // 使用系统命令终止进程
        let output = if cfg!(target_os = "windows") {
            if force {
                // 强制终止
                Command::new("taskkill")
                    .args(["/F", "/PID", &pid_num.to_string()])
                    .output()
            } else {
                // 正常终止
                Command::new("taskkill")
                    .args(["/PID", &pid_num.to_string()])
                    .output()
            }
        } else {
            if force {
                // Unix/Linux强制终止
                Command::new("kill")
                    .args(["-9", &pid_num.to_string()])
                    .output()
            } else {
                // Unix/Linux正常终止
                Command::new("kill")
                    .args([&pid_num.to_string()])
                    .output()
            }
        };
        
        match output {
            Ok(result) => {
                if result.status.success() {
                    Ok(format!("Process {} terminated successfully", pid))
                } else {
                    let stderr_str = String::from_utf8_lossy(&result.stderr);
                    let stdout_str = String::from_utf8_lossy(&result.stdout);
                    Err(format!("Failed to terminate process {}: stdout={}, stderr={}", pid, stdout_str, stderr_str))
                }
            },
            Err(e) => Err(format!("Failed to execute terminate command: {}", e)),
        }
    }).await;
    
    match result {
        Ok(res) => res,
        Err(e) => Err(format!("终止进程时发生错误: {}", e)),
    }
}

// 保持向后兼容性的原始get_processes函数
#[tauri::command]
async fn get_processes(_state: State<'_, SystemState>) -> Result<Vec<HashMap<String, String>>, String> {
    // 在后台线程执行进程信息收集
    let processes = tokio::task::spawn_blocking(|| {
        let mut sys = System::new_all();
        sys.refresh_all();
        
        let mut processes = Vec::new();
        
        for (pid, process) in sys.processes() {
            let mut process_map = HashMap::new();
            
            process_map.insert("pid".to_string(), pid.as_u32().to_string());
            process_map.insert("name".to_string(), process.name().to_string());
            process_map.insert("cpu_usage".to_string(), process.cpu_usage().to_string());
            process_map.insert("memory_usage".to_string(), process.memory().to_string());
            process_map.insert("cmd".to_string(), process.cmd().join(" "));
            process_map.insert("exe".to_string(), process.exe().map(|p| p.to_string_lossy().to_string()).unwrap_or_default());
            
            processes.push(process_map);
        }
        
        processes
    }).await;
    
    match processes {
        Ok(procs) => Ok(procs),
        Err(e) => Err(format!("获取进程列表时发生错误: {}", e)),
    }
}

// 获取GPU信息
#[tauri::command]
async fn get_gpu_info() -> Result<Vec<GpuInfo>, String> {
    // 使用tokio::task::spawn_blocking在后台线程执行阻塞操作
    let result = tokio::task::spawn_blocking(|| {
        // 在Windows上优先使用nvidia-smi命令获取GPU信息（如果可用）
        #[cfg(target_os = "windows")]
        {
            // 尝试使用nvidia-smi获取NVIDIA GPU信息
            let nvidia_smi_output = Command::new("nvidia-smi")
                .args([
                    "--query-gpu=name,memory.total,memory.used,memory.free,utilization.gpu,temperature.gpu",
                    "--format=csv,noheader,nounits"
                ])
                .output();
            
            if let Ok(output) = nvidia_smi_output {
                if output.status.success() {
                    let output_str = String::from_utf8_lossy(&output.stdout);
                    // 解析nvidia-smi输出字符串以提取GPU信息
                    return parse_nvidia_gpu_info(&output_str);
                }
            }
            
            // 如果nvidia-smi不可用或失败，回退到使用wmic命令获取GPU信息
            let wmic_output = Command::new("wmic")
                .args(["path", "win32_VideoController", "get", "name,adaptercompatibility,adapterram"])
                .output();
            
            match wmic_output {
                Ok(result) => {
                    if result.status.success() {
                        let output_str = String::from_utf8_lossy(&result.stdout);
                        // 解析wmic输出字符串以提取GPU信息
                        parse_gpu_info(&output_str)
                    } else {
                        // 如果wmic命令失败，返回空向量
                        Ok(vec![])
                    }
                },
                Err(_) => {
                    // 如果无法执行命令，返回空向量
                    Ok(vec![])
                }
            }
        }
        
        // 在非Windows系统上，暂时返回空向量
        #[cfg(not(target_os = "windows"))]
        {
            Ok(vec![])
        }
    }).await;
    
    match result {
        Ok(res) => res,
        Err(e) => Err(format!("执行GPU信息获取任务时发生错误: {}", e)),
    }
}

// 解析NVIDIA GPU信息输出
#[cfg(target_os = "windows")]
fn parse_nvidia_gpu_info(output: &str) -> Result<Vec<GpuInfo>, String> {
    let lines: Vec<&str> = output.lines().collect();
    let mut gpus = Vec::new();
    
    for line in lines.iter() {
        let trimmed_line = line.trim();
        if !trimmed_line.is_empty() {
            // 分割行以获取GPU信息
            let parts: Vec<&str> = trimmed_line.split(',').collect();
            if parts.len() >= 6 {
                let name = parts[0].trim().to_string();
                let vram_total = parts[1].trim().parse::<u64>().unwrap_or(0) * 1024 * 1024; // 转换为字节
                let vram_used = parts[2].trim().parse::<u64>().unwrap_or(0) * 1024 * 1024; // 转换为字节
                let vram_free = parts[3].trim().parse::<u64>().unwrap_or(0) * 1024 * 1024; // 转换为字节
                let usage_percent = parts[4].trim().parse::<f32>().unwrap_or(0.0);
                let temperature = Some(parts[5].trim().parse::<f32>().unwrap_or(0.0));
                
                let gpu = GpuInfo {
                    name,
                    vendor: "NVIDIA".to_string(),
                    vram_total,
                    vram_used,
                    vram_free,
                    usage_percent,
                    temperature,
                };
                
                gpus.push(gpu);
            }
        }
    }
    
    Ok(gpus)
}

// 解析GPU信息输出 (wmic)
#[cfg(target_os = "windows")]
fn parse_gpu_info(output: &str) -> Result<Vec<GpuInfo>, String> {
    let lines: Vec<&str> = output.lines().collect();
    let mut gpus = Vec::new();
    
    // 跳过标题行，从第二行开始处理
    for line in lines.iter().skip(1) {
        let trimmed_line = line.trim();
        if !trimmed_line.is_empty() {
            // 分割行以获取GPU名称和内存信息
            let parts: Vec<&str> = trimmed_line.split_whitespace().collect();
            if parts.len() >= 3 {
                let name = parts[0..parts.len()-2].join(" ");
                let vendor = parts[parts.len()-2].to_string();
                let vram_str = parts[parts.len()-1];
                
                // 将VRAM字符串转换为数字（假设是以字节为单位）
                let vram_total = vram_str.parse::<u64>().unwrap_or(0);
                
                let gpu = GpuInfo {
                    name,
                    vendor,
                    vram_total,
                    vram_used: 0, // 暂时无法获取
                    vram_free: vram_total, // 暂时无法获取
                    usage_percent: 0.0, // 暂时无法获取
                    temperature: None, // 暂时无法获取
                };
                
                gpus.push(gpu);
            }
        }
    }
    
    Ok(gpus)
}

// 存储历史数据命令
#[tauri::command]
async fn store_historical_data(
    state: State<'_, SystemState>,
    cpu_usage: f32,
    memory_usage: f32,
    memory_total: i64,
    system_load: f32,
    disk_usage: Vec<DiskUsageData>,
    network_traffic: NetworkTrafficData,
) -> Result<String, String> {
    let db_manager = state.db_manager.as_ref()
        .ok_or_else(|| "Database not initialized".to_string())?;
    
    let historical_data = HistoricalSystemData {
        id: Uuid::new_v4().to_string(),
        timestamp: Utc::now(),
        cpu_usage,
        memory_usage,
        memory_total,
        disk_usage,
        network_traffic,
        system_load,
    };
    
    db_manager.store_historical_data(&historical_data)
        .await
        .map(|_| historical_data.id)
        .map_err(|e| format!("Failed to store historical data: {}", e))
}

// 获取历史数据命令
#[tauri::command]
async fn fetch_historical_data(
    state: State<'_, SystemState>,
    start_time: String,
    end_time: String,
) -> Result<Vec<HistoricalSystemData>, String> {
    let db_manager = state.db_manager.as_ref()
        .ok_or_else(|| "Database not initialized".to_string())?;
    
    let start_dt = DateTime::parse_from_rfc3339(&start_time)
        .map(|dt| dt.with_timezone(&Utc))
        .map_err(|e| format!("Invalid start time format: {}", e))?;
    
    let end_dt = DateTime::parse_from_rfc3339(&end_time)
        .map(|dt| dt.with_timezone(&Utc))
        .map_err(|e| format!("Invalid end time format: {}", e))?;
    
    db_manager.fetch_historical_data(start_dt, end_dt)
        .await
        .map_err(|e| format!("Failed to fetch historical data: {}", e))
}

// 导出历史数据命令
#[tauri::command]
async fn export_historical_data(
    state: State<'_, SystemState>,
    start_time: String,
    end_time: String,
) -> Result<String, String> {
    let db_manager = state.db_manager.as_ref()
        .ok_or_else(|| "Database not initialized".to_string())?;
    
    let start_dt = DateTime::parse_from_rfc3339(&start_time)
        .map(|dt| dt.with_timezone(&Utc))
        .map_err(|e| format!("Invalid start time format: {}", e))?;
    
    let end_dt = DateTime::parse_from_rfc3339(&end_time)
        .map(|dt| dt.with_timezone(&Utc))
        .map_err(|e| format!("Invalid end time format: {}", e))?;
    
    db_manager.export_historical_data_csv(start_dt, end_dt)
        .await
        .map_err(|e| format!("Failed to export historical data: {}", e))
}

// 清理历史数据命令
#[tauri::command]
async fn prune_historical_data(
    state: State<'_, SystemState>,
    retention_days: i32,
) -> Result<u64, String> {
    let db_manager = state.db_manager.as_ref()
        .ok_or_else(|| "Database not initialized".to_string())?;
    
    db_manager.prune_historical_data(retention_days)
        .await
        .map_err(|e| format!("Failed to prune historical data: {}", e))
}

// 获取数据库统计信息命令
#[tauri::command]
async fn get_database_stats(
    state: State<'_, SystemState>,
) -> Result<database::DatabaseStats, String> {
    let db_manager = state.db_manager.as_ref()
        .ok_or_else(|| "Database not initialized".to_string())?;
    
    db_manager.get_database_stats()
        .await
        .map_err(|e| format!("Failed to get database stats: {}", e))
}

// 初始化数据库命令
#[tauri::command]
async fn init_database(
    _state: State<'_, SystemState>,
    _app_handle: tauri::AppHandle,
) -> Result<(), String> {
    // 注意：这里我们需要一个可变引用，但State提供了不可变引用
    // 这是一个限制，我们需要在应用启动时初始化数据库
    // 或者使用其他方法来处理可变状态
    Err("Database should be initialized during app startup".to_string())
}

// 初始化Tauri应用
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(SystemState::default())
        .setup(|app| {
            // 初始化数据库
            let _state = app.state::<SystemState>();
            // 注意：由于State的限制，我们需要在setup中处理数据库初始化
            // 这里我们暂时跳过数据库初始化，在实际使用时再初始化
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_system_info,
            get_cpu_info,
            get_memory_info,
            get_disk_info,
            get_network_status,
            get_audio_devices,
            ping_host,
            get_uptime,
            get_processes,
            get_processes_enhanced,
            get_process_details,
            terminate_process,
            get_gpu_info,
            get_network_connections,
            diagnose_network_ping,
            diagnose_network_traceroute,
            get_alert_configurations,
            add_alert_configuration,
            update_alert_configuration,
            delete_alert_configuration,
            get_alert_history,
            acknowledge_alert,
            check_alerts,
            store_historical_data,
            fetch_historical_data,
            export_historical_data,
            prune_historical_data,
            get_database_stats,
            init_database,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
