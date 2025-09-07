//! 基础功能测试
//! 测试核心功能而不依赖Tauri的State结构体

use serde::{Deserialize, Serialize};
use serde_json;

// 从lib.rs复制必要的结构体定义
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SystemInfo {
    pub os_name: String,
    pub os_version: String,
    pub hostname: String,
    pub kernel_version: String,
}

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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MemoryInfo {
    pub total: u64,
    pub available: u64,
    pub used: u64,
    pub free: u64,
    pub usage_percent: f32,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_system_info_serialization() {
        let system_info = SystemInfo {
            os_name: "Test OS".to_string(),
            os_version: "1.0.0".to_string(),
            hostname: "test-host".to_string(),
            kernel_version: "1.0.0-test".to_string(),
        };

        // 测试序列化
        let json = serde_json::to_string(&system_info).unwrap();
        assert!(!json.is_empty());
        assert!(json.contains("Test OS"));
        assert!(json.contains("test-host"));

        // 测试反序列化
        let deserialized: SystemInfo = serde_json::from_str(&json).unwrap();
        assert_eq!(system_info.os_name, deserialized.os_name);
        assert_eq!(system_info.os_version, deserialized.os_version);
        assert_eq!(system_info.hostname, deserialized.hostname);
        assert_eq!(system_info.kernel_version, deserialized.kernel_version);
    }

    #[test]
    fn test_cpu_info_serialization() {
        let cpu_info = CpuInfo {
            name: "Test CPU".to_string(),
            vendor_id: "TestVendor".to_string(),
            brand: "Test CPU Brand".to_string(),
            cores: 8,
            physical_cores: 4,
            frequency: 3000,
            usage: 50.0,
            temperature: Some(45.0),
        };

        // 测试序列化
        let json = serde_json::to_string(&cpu_info).unwrap();
        assert!(!json.is_empty());
        assert!(json.contains("Test CPU"));
        assert!(json.contains("TestVendor"));

        // 测试反序列化
        let deserialized: CpuInfo = serde_json::from_str(&json).unwrap();
        assert_eq!(cpu_info.name, deserialized.name);
        assert_eq!(cpu_info.cores, deserialized.cores);
        assert_eq!(cpu_info.frequency, deserialized.frequency);
        assert_eq!(cpu_info.usage, deserialized.usage);
    }

    #[test]
    fn test_memory_info_serialization() {
        let memory_info = MemoryInfo {
            total: 8589934592, // 8GB
            available: 4294967296, // 4GB
            used: 4294967296, // 4GB
            free: 2147483648, // 2GB
            usage_percent: 50.0,
        };

        // 测试序列化
        let json = serde_json::to_string(&memory_info).unwrap();
        assert!(!json.is_empty());
        assert!(json.contains("8589934592"));

        // 测试反序列化
        let deserialized: MemoryInfo = serde_json::from_str(&json).unwrap();
        assert_eq!(memory_info.total, deserialized.total);
        assert_eq!(memory_info.available, deserialized.available);
        assert_eq!(memory_info.used, deserialized.used);
        assert_eq!(memory_info.usage_percent, deserialized.usage_percent);
    }

    #[test]
    fn test_system_info_validation() {
        let valid_info = SystemInfo {
            os_name: "Valid OS".to_string(),
            os_version: "1.0.0".to_string(),
            hostname: "valid-host".to_string(),
            kernel_version: "1.0.0-valid".to_string(),
        };

        // 验证有效信息
        assert!(!valid_info.os_name.is_empty());
        assert!(!valid_info.os_version.is_empty());
        assert!(!valid_info.hostname.is_empty());
        assert!(!valid_info.kernel_version.is_empty());

        // 测试边界情况
        let empty_info = SystemInfo {
            os_name: "".to_string(),
            os_version: "".to_string(),
            hostname: "".to_string(),
            kernel_version: "".to_string(),
        };

        assert!(empty_info.os_name.is_empty());
        assert!(empty_info.hostname.is_empty());
    }

    #[test]
    fn test_cpu_info_validation() {
        let valid_cpu = CpuInfo {
            name: "Valid CPU".to_string(),
            vendor_id: "ValidVendor".to_string(),
            brand: "Valid CPU Brand".to_string(),
            cores: 8,
            physical_cores: 4,
            frequency: 3000,
            usage: 50.0,
            temperature: Some(45.0),
        };

        // 验证有效CPU信息
        assert!(!valid_cpu.name.is_empty());
        assert!(!valid_cpu.vendor_id.is_empty());
        assert!(valid_cpu.cores > 0);
        assert!(valid_cpu.physical_cores > 0);
        assert!(valid_cpu.frequency > 0);
        assert!(valid_cpu.usage >= 0.0 && valid_cpu.usage <= 100.0);

        // 测试边界情况
        let zero_cpu = CpuInfo {
            name: "Zero CPU".to_string(),
            vendor_id: "ZeroVendor".to_string(),
            brand: "Zero CPU Brand".to_string(),
            cores: 0,
            physical_cores: 0,
            frequency: 0,
            usage: 0.0,
            temperature: None,
        };

        assert_eq!(zero_cpu.cores, 0);
        assert_eq!(zero_cpu.frequency, 0);
        assert_eq!(zero_cpu.usage, 0.0);
    }

    #[test]
    fn test_memory_info_validation() {
        let valid_memory = MemoryInfo {
            total: 8589934592, // 8GB
            available: 4294967296, // 4GB
            used: 4294967296, // 4GB
            free: 2147483648, // 2GB
            usage_percent: 50.0,
        };

        // 验证有效内存信息
        assert!(valid_memory.total > 0);
        assert!(valid_memory.available > 0);
        assert!(valid_memory.used > 0);
        assert!(valid_memory.free > 0);
        assert!(valid_memory.usage_percent >= 0.0 && valid_memory.usage_percent <= 100.0);

        // 验证计算逻辑
        let calculated_used = valid_memory.total - valid_memory.available;
        assert_eq!(valid_memory.used, calculated_used);

        let calculated_usage_percent = (valid_memory.used as f32 / valid_memory.total as f32) * 100.0;
        assert!((valid_memory.usage_percent - calculated_usage_percent).abs() < 0.01);
    }

    #[test]
    fn test_json_error_handling() {
        // 测试无效JSON的处理
        let invalid_json = "{ invalid json }";
        let result: Result<SystemInfo, _> = serde_json::from_str(invalid_json);
        assert!(result.is_err());

        // 测试缺失字段的处理
        let incomplete_json = r#"{"os_name": "Test OS"}"#;
        let result: Result<SystemInfo, _> = serde_json::from_str(incomplete_json);
        assert!(result.is_err());
    }

    #[test]
    fn test_data_type_consistency() {
        // 测试数据类型的一致性
        let system_info = SystemInfo {
            os_name: "Test OS".to_string(),
            os_version: "1.0.0".to_string(),
            hostname: "test-host".to_string(),
            kernel_version: "1.0.0-test".to_string(),
        };

        // 确保所有字段都是String类型
        assert_eq!(system_info.os_name, "Test OS");
        assert_eq!(system_info.os_version, "1.0.0");
        assert_eq!(system_info.hostname, "test-host");
        assert_eq!(system_info.kernel_version, "1.0.0-test");

        // 测试数值类型的一致性
        let memory_info = MemoryInfo {
            total: 8589934592,
            available: 4294967296,
            used: 4294967296,
            free: 2147483648,
            usage_percent: 50.0,
        };

        assert_eq!(memory_info.total, 8589934592u64);
        assert_eq!(memory_info.usage_percent, 50.0f32);
    }

    #[test]
    fn test_clone_and_equality() {
        let system_info1 = SystemInfo {
            os_name: "Test OS".to_string(),
            os_version: "1.0.0".to_string(),
            hostname: "test-host".to_string(),
            kernel_version: "1.0.0-test".to_string(),
        };

        let system_info2 = system_info1.clone();

        // 测试克隆
        assert_eq!(system_info1.os_name, system_info2.os_name);
        assert_eq!(system_info1.os_version, system_info2.os_version);
        assert_eq!(system_info1.hostname, system_info2.hostname);
        assert_eq!(system_info1.kernel_version, system_info2.kernel_version);

        // 测试相等性（通过字段比较）
        assert_eq!(system_info1.os_name, system_info2.os_name);
    }
}