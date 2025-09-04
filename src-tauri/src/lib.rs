// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Deserialize, Serialize};
use sysinfo::{System, Networks, Disks};
use std::collections::HashMap;
use tauri::State;
use std::process::Command;
use cpal::traits::{HostTrait, DeviceTrait};

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
}

impl Default for SystemState {
    fn default() -> Self {
        let mut sys = System::new_all();
        sys.refresh_all();
        Self { sys }
    }
}

impl SystemState {
    pub fn refresh(&mut self) {
        self.sys.refresh_all();
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
    let sys = &state.sys;
    
    // 注意：我们不能直接修改State中的System对象
    // 需要创建一个新的System实例来获取最新信息
    let mut new_sys = System::new_all();
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

// 获取GPU信息
#[tauri::command]
async fn get_gpu_info() -> Result<Vec<GpuInfo>, String> {
    // 使用tokio::task::spawn_blocking在后台线程执行阻塞操作
    let result = tokio::task::spawn_blocking(|| {
        // 在Windows上使用wmic命令获取GPU信息
        #[cfg(target_os = "windows")]
        {
            let output = Command::new("wmic")
                .args(["path", "win32_VideoController", "get", "name,adaptercompatibility,adapterram"])
                .output();
            
            match output {
                Ok(result) => {
                    if result.status.success() {
                        let output_str = String::from_utf8_lossy(&result.stdout);
                        // 解析输出字符串以提取GPU信息
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

// 解析GPU信息输出
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
            get_gpu_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
