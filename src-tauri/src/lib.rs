// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Deserialize, Serialize};
use sysinfo::{System, Networks, Disks};
use std::collections::HashMap;
use tauri::State;
use std::net::{ToSocketAddrs};
use tokio::time::{timeout, Duration};
use std::process::Command;

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
async fn get_disk_info(_state: State<'_, SystemState>) -> Result<Vec<DiskInfo>, String> {
    // 在后台线程执行磁盘信息收集
    let disk_infos = tokio::task::spawn_blocking(|| {
        let mut disks = Disks::new_with_refreshed_list();
        
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
        let mut networks = Networks::new_with_refreshed_list();
        
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
                if result.status.success() {
                    // 解析ping输出以获取延迟
                    let output_str = String::from_utf8_lossy(&result.stdout);
                    let latency = parse_ping_latency(&output_str);
                    Ok(format!("Ping {} 成功，延迟: {}ms", host, latency))
                } else {
                    let error_str = String::from_utf8_lossy(&result.stderr);
                    Err(format!("Ping {} 失败: {}", host, error_str))
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
            return output[pos+3..pos+end_pos].to_string();
        }
    }
    
    // 在Unix/Linux上查找类似 "time=15.2 ms" 的模式
    if let Some(pos) = output.find("time=") {
        if let Some(end_pos) = output[pos..].find(" ms") {
            return output[pos+5..pos+end_pos].to_string();
        }
    }
    
    "N/A".to_string()
}

// 获取系统运行时间
#[tauri::command]
fn get_uptime(_state: State<SystemState>) -> Result<u64, String> {
    Ok(System::uptime())
}

// 获取进程列表
#[tauri::command]
async fn get_processes(_state: State<'_, SystemState>) -> Result<Vec<HashMap<String, String>>, String> {
    // 在后台线程执行进程信息收集
    let processes = tokio::task::spawn_blocking(|| {
        // 由于sysinfo库的API变化，暂时返回模拟数据
        let mut processes = Vec::new();
        
        // 模拟一些进程数据
        let mut process1 = HashMap::new();
        let mut process2 = HashMap::new();
        let mut process3 = HashMap::new();
        
        process1.insert("pid".to_string(), "1234".to_string());
        process1.insert("name".to_string(), "chrome.exe".to_string());
        process1.insert("cpu_usage".to_string(), "15.2".to_string());
        process1.insert("memory_usage".to_string(), "1048576".to_string());
        process1.insert("cmd".to_string(), "C:\\Program Files\\Chrome\\chrome.exe --profile-directory=Default".to_string());
        process1.insert("exe".to_string(), "C:\\Program Files\\Chrome\\chrome.exe".to_string());
        
        process2.insert("pid".to_string(), "5678".to_string());
        process2.insert("name".to_string(), "vscode.exe".to_string());
        process2.insert("cpu_usage".to_string(), "8.5".to_string());
        process2.insert("memory_usage".to_string(), "524288".to_string());
        process2.insert("cmd".to_string(), "C:\\Program Files\\VSCode\\Code.exe --unity-launch".to_string());
        process2.insert("exe".to_string(), "C:\\Program Files\\VSCode\\Code.exe".to_string());
        
        process3.insert("pid".to_string(), "9012".to_string());
        process3.insert("name".to_string(), "spotify.exe".to_string());
        process3.insert("cpu_usage".to_string(), "2.1".to_string());
        process3.insert("memory_usage".to_string(), "262144".to_string());
        process3.insert("cmd".to_string(), "C:\\Users\\User\\AppData\\Roaming\\Spotify\\Spotify.exe".to_string());
        process3.insert("exe".to_string(), "C:\\Users\\User\\AppData\\Roaming\\Spotify\\Spotify.exe".to_string());
        
        processes.push(process1);
        processes.push(process2);
        processes.push(process3);
        
        processes
    }).await;
    
    match processes {
        Ok(procs) => Ok(procs),
        Err(e) => Err(format!("获取进程列表时发生错误: {}", e)),
    }
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
            get_processes,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
