// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Deserialize, Serialize};
use sysinfo::System;
use std::collections::HashMap;
use tauri::State;

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

// 系统状态结构体
pub struct SystemState {
    pub sys: System,
}

impl Default for SystemState {
    fn default() -> Self {
        let mut sys = System::new_all();
        sys.refresh_all();
        Self { sys }
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
    let sys = &state.sys;
    
    let cpu = sys.global_cpu_info();
    let name = cpu.name().to_string();
    let vendor_id = cpu.vendor_id().to_string();
    let brand = cpu.brand().to_string();
    let cores = sys.cpus().len();
    let physical_cores = sys.physical_core_count().unwrap_or(0);
    let frequency = cpu.frequency();
    let usage = cpu.cpu_usage();
    
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
fn get_disk_info(_state: State<SystemState>) -> Result<Vec<DiskInfo>, String> {
    // 暂时返回空列表，因为 sysinfo 库的 API 发生了变化
    Ok(Vec::new())
}

// 获取网络状态
#[tauri::command]
fn get_network_status(_state: State<SystemState>) -> Result<NetworkStatus, String> {
    // 暂时返回空列表，因为 sysinfo 库的 API 发生了变化
    Ok(NetworkStatus {
        is_connected: false,
        interfaces: Vec::new(),
        local_ip: None,
        public_ip: None,
    })
}

// 获取音频设备列表
#[tauri::command]
fn get_audio_devices() -> Result<Vec<AudioDevice>, String> {
    // 注意：Tauri本身不提供音频设备访问功能
    // 这里返回一个模拟的设备列表
    // 实际实现可能需要使用特定于平台的API或第三方库
    
    let mut devices = Vec::new();
    
    // 模拟输入设备
    devices.push(AudioDevice {
        name: "Microphone".to_string(),
        is_default: true,
        is_input: true,
        is_output: false,
        volume: 80,
        is_muted: false,
    });
    
    // 模拟输出设备
    devices.push(AudioDevice {
        name: "Speakers".to_string(),
        is_default: true,
        is_input: false,
        is_output: true,
        volume: 65,
        is_muted: false,
    });
    
    devices.push(AudioDevice {
        name: "Headphones".to_string(),
        is_default: false,
        is_input: false,
        is_output: true,
        volume: 50,
        is_muted: false,
    });
    
    Ok(devices)
}

// Ping主机
#[tauri::command]
fn ping_host(_host: String) -> Result<String, String> {
    // 暂时返回成功消息，因为 ping 库的 API 发生了变化
    Ok("Ping functionality temporarily disabled".to_string())
}

// 获取系统运行时间
#[tauri::command]
fn get_uptime(_state: State<SystemState>) -> Result<u64, String> {
    Ok(System::uptime())
}

// 获取进程列表
#[tauri::command]
fn get_processes(_state: State<SystemState>) -> Result<Vec<HashMap<String, String>>, String> {
    // 暂时返回空列表，因为 sysinfo 库的 API 发生了变化
    Ok(Vec::new())
}

// 初始化Tauri应用
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(SystemState::default())
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
            get_processes
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
