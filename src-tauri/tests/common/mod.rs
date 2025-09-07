//! 测试公共模块
//! 提供测试工具和辅助函数

use std::sync::Arc;
use tokio::sync::Mutex;
use tauri_react_ai_lib::*;

/// 测试用的系统状态管理器
pub struct TestSystemState {
    state: Arc<Mutex<SystemState>>,
}

impl TestSystemState {
    /// 创建新的测试系统状态
    pub fn new() -> Self {
        Self {
            state: Arc::new(Mutex::new(SystemState::default())),
        }
    }

    /// 获取系统状态的引用
    pub fn get_state(&self) -> tauri::State<'_, SystemState> {
        // 注意：这里需要根据实际的Tauri状态管理进行调整
        // 在实际测试中可能需要使用不同的方法来创建State
        tauri::State::new(&*self.state.blocking_lock())
    }

    /// 刷新系统状态
    pub async fn refresh(&self) {
        let mut state = self.state.lock().await;
        state.refresh();
    }
}

impl Default for TestSystemState {
    fn default() -> Self {
        Self::new()
    }
}

/// 测试用的模拟数据生成器
pub struct MockDataGenerator;

impl MockDataGenerator {
    /// 生成模拟的系统信息
    pub fn system_info() -> SystemInfo {
        SystemInfo {
            os_name: "Test OS".to_string(),
            os_version: "1.0.0".to_string(),
            hostname: "test-host".to_string(),
            kernel_version: "1.0.0-test".to_string(),
        }
    }

    /// 生成模拟的CPU信息
    pub fn cpu_info() -> CpuInfo {
        CpuInfo {
            name: "Test CPU".to_string(),
            vendor_id: "TestVendor".to_string(),
            brand: "Test CPU Brand".to_string(),
            cores: 8,
            physical_cores: 4,
            frequency: 3000,
            usage: 50.0,
            temperature: Some(45.0),
        }
    }

    /// 生成模拟的内存信息
    pub fn memory_info() -> MemoryInfo {
        MemoryInfo {
            total: 8589934592, // 8GB
            available: 4294967296, // 4GB
            used: 4294967296, // 4GB
            free: 2147483648, // 2GB
            usage_percent: 50.0,
        }
    }

    /// 生成模拟的磁盘信息
    pub fn disk_info() -> Vec<DiskInfo> {
        vec![DiskInfo {
            name: "Test Disk".to_string(),
            mount_point: "/test".to_string(),
            total_space: 107374182400, // 100GB
            available_space: 53687091200, // 50GB
            used_space: 53687091200, // 50GB
            usage_percent: 50.0,
            file_system: "ext4".to_string(),
            is_removable: false,
        }]
    }

    /// 生成模拟的网络状态
    pub fn network_status() -> NetworkStatus {
        NetworkStatus {
            is_connected: true,
            interfaces: vec![NetworkInterface {
                name: "eth0".to_string(),
                description: Some("Test Ethernet".to_string()),
                ip_address: Some("192.168.1.100".to_string()),
                mac_address: Some("00:11:22:33:44:55".to_string()),
                is_up: true,
            }],
            local_ip: Some("192.168.1.100".to_string()),
            public_ip: Some("203.0.113.1".to_string()),
        }
    }

    /// 生成模拟的音频设备
    pub fn audio_devices() -> Vec<AudioDevice> {
        vec![
            AudioDevice {
                name: "Test Speaker".to_string(),
                is_default: true,
                is_input: false,
                is_output: true,
                volume: 75,
                is_muted: false,
            },
            AudioDevice {
                name: "Test Microphone".to_string(),
                is_default: true,
                is_input: true,
                is_output: false,
                volume: 80,
                is_muted: false,
            },
        ]
    }

    /// 生成模拟的GPU信息
    pub fn gpu_info() -> Vec<GpuInfo> {
        vec![GpuInfo {
            name: "Test GPU".to_string(),
            vendor: "Test Vendor".to_string(),
            vram_total: 4294967296, // 4GB
            vram_used: 2147483648, // 2GB
            vram_free: 2147483648, // 2GB
            usage_percent: 60.0,
            temperature: Some(70.0),
        }]
    }

    /// 生成模拟的进程列表
    pub fn processes() -> Vec<std::collections::HashMap<String, String>> {
        let mut process = std::collections::HashMap::new();
        process.insert("pid".to_string(), "1234".to_string());
        process.insert("name".to_string(), "test-process".to_string());
        process.insert("cpu_usage".to_string(), "10.5".to_string());
        process.insert("memory_usage".to_string(), "1048576".to_string());
        process.insert("cmd".to_string(), "/usr/bin/test-process".to_string());
        process.insert("exe".to_string(), "/usr/bin/test-process".to_string());
        vec![process]
    }
}

/// 测试辅助函数
pub mod test_helpers {
    use super::*;

    /// 比较两个浮点数是否在允许的误差范围内相等
    pub fn approx_eq(a: f32, b: f32, epsilon: f32) -> bool {
        (a - b).abs() < epsilon
    }

    /// 验证系统信息的基本结构
    pub fn validate_system_info(info: &SystemInfo) -> bool {
        !info.os_name.is_empty() 
            && !info.os_version.is_empty() 
            && !info.hostname.is_empty()
    }

    /// 验证CPU信息的基本结构
    pub fn validate_cpu_info(info: &CpuInfo) -> bool {
        !info.name.is_empty() 
            && !info.vendor_id.is_empty() 
            && info.cores > 0
            && info.frequency > 0
            && info.usage >= 0.0
            && info.usage <= 100.0
    }

    /// 验证内存信息的基本结构
    pub fn validate_memory_info(info: &MemoryInfo) -> bool {
        info.total > 0 
            && info.available > 0 
            && info.used > 0
            && info.free > 0
            && info.usage_percent >= 0.0
            && info.usage_percent <= 100.0
    }

    /// 验证磁盘信息的基本结构
    pub fn validate_disk_info(disks: &[DiskInfo]) -> bool {
        disks.iter().all(|disk| {
            !disk.name.is_empty() 
                && !disk.mount_point.is_empty() 
                && disk.total_space > 0
                && disk.usage_percent >= 0.0
                && disk.usage_percent <= 100.0
        })
    }

    /// 验证网络状态的基本结构
    pub fn validate_network_status(status: &NetworkStatus) -> bool {
        status.interfaces.iter().all(|interface| {
            !interface.name.is_empty()
        })
    }

    /// 验证音频设备的基本结构
    pub fn validate_audio_devices(devices: &[AudioDevice]) -> bool {
        devices.iter().all(|device| {
            !device.name.is_empty() 
                && (device.is_input || device.is_output)
        })
    }

    /// 验证GPU信息的基本结构
    pub fn validate_gpu_info(gpus: &[GpuInfo]) -> bool {
        gpus.iter().all(|gpu| {
            !gpu.name.is_empty() 
                && !gpu.vendor.is_empty() 
                && gpu.vram_total >= 0
                && gpu.usage_percent >= 0.0
                && gpu.usage_percent <= 100.0
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_mock_data_generation() {
        let system_info = MockDataGenerator::system_info();
        assert!(test_helpers::validate_system_info(&system_info));

        let cpu_info = MockDataGenerator::cpu_info();
        assert!(test_helpers::validate_cpu_info(&cpu_info));

        let memory_info = MockDataGenerator::memory_info();
        assert!(test_helpers::validate_memory_info(&memory_info));

        let disk_info = MockDataGenerator::disk_info();
        assert!(test_helpers::validate_disk_info(&disk_info));

        let network_status = MockDataGenerator::network_status();
        assert!(test_helpers::validate_network_status(&network_status));

        let audio_devices = MockDataGenerator::audio_devices();
        assert!(test_helpers::validate_audio_devices(&audio_devices));

        let gpu_info = MockDataGenerator::gpu_info();
        assert!(test_helpers::validate_gpu_info(&gpu_info));
    }

    #[test]
    fn test_approx_eq() {
        assert!(test_helpers::approx_eq(1.0, 1.0, 0.001));
        assert!(test_helpers::approx_eq(1.0, 1.001, 0.01));
        assert!(!test_helpers::approx_eq(1.0, 1.1, 0.01));
    }
}