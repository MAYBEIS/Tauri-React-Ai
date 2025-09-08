use sqlx::{SqlitePool, Row};
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use uuid::Uuid;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

// 历史系统数据结构体
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HistoricalSystemData {
    pub id: String,
    pub timestamp: DateTime<Utc>,
    pub cpu_usage: f32,
    pub memory_usage: f32,
    pub memory_total: i64,
    pub disk_usage: Vec<DiskUsageData>,
    pub network_traffic: NetworkTrafficData,
    pub system_load: f32,
}

// 磁盘使用数据结构体
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DiskUsageData {
    pub mount_point: String,
    pub used_space: i64,
    pub total_space: i64,
    pub usage_percent: f32,
}

// 网络流量数据结构体
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NetworkTrafficData {
    pub bytes_received: i64,
    pub bytes_sent: i64,
    pub packets_received: i64,
    pub packets_sent: i64,
}

// 数据库管理器
pub struct DatabaseManager {
    pool: SqlitePool,
}

impl DatabaseManager {
    /// 创建新的数据库管理器实例
    pub async fn new(app_handle: &AppHandle) -> Result<Self, sqlx::Error> {
        // 获取应用数据目录
        let app_dir = app_handle.path().app_data_dir().unwrap_or_else(|_| {
            PathBuf::from(".")
        });
        
        // 确保目录存在
        std::fs::create_dir_all(&app_dir).unwrap_or_default();
        
        // 数据库文件路径
        let db_path = app_dir.join("system_monitoring.db");
        let db_url = format!("sqlite:{}", db_path.to_string_lossy());
        
        // 创建连接池
        let pool = SqlitePool::connect(&db_url).await?;
        
        let manager = Self { pool };
        
        // 初始化数据库表
        manager.init_tables().await?;
        
        Ok(manager)
    }
    
    /// 初始化数据库表
    async fn init_tables(&self) -> Result<(), sqlx::Error> {
        // 创建历史系统数据表
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS historical_system_data (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                cpu_usage REAL NOT NULL,
                memory_usage REAL NOT NULL,
                memory_total INTEGER NOT NULL,
                system_load REAL NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            "#,
        )
        .execute(&self.pool)
        .await?;
        
        // 创建磁盘使用数据表
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS disk_usage_data (
                id TEXT PRIMARY KEY,
                historical_data_id TEXT NOT NULL,
                mount_point TEXT NOT NULL,
                used_space INTEGER NOT NULL,
                total_space INTEGER NOT NULL,
                usage_percent REAL NOT NULL,
                FOREIGN KEY (historical_data_id) REFERENCES historical_system_data (id) ON DELETE CASCADE
            )
            "#,
        )
        .execute(&self.pool)
        .await?;
        
        // 创建网络流量数据表
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS network_traffic_data (
                id TEXT PRIMARY KEY,
                historical_data_id TEXT NOT NULL,
                bytes_received INTEGER NOT NULL,
                bytes_sent INTEGER NOT NULL,
                packets_received INTEGER NOT NULL,
                packets_sent INTEGER NOT NULL,
                FOREIGN KEY (historical_data_id) REFERENCES historical_system_data (id) ON DELETE CASCADE
            )
            "#,
        )
        .execute(&self.pool)
        .await?;
        
        // 创建索引以提高查询性能
        sqlx::query(
            "CREATE INDEX IF NOT EXISTS idx_historical_data_timestamp ON historical_system_data (timestamp)",
        )
        .execute(&self.pool)
        .await?;
        
        Ok(())
    }
    
    /// 存储历史系统数据
    pub async fn store_historical_data(&self, data: &HistoricalSystemData) -> Result<(), sqlx::Error> {
        let mut tx = self.pool.begin().await?;
        
        // 插入主要历史数据
        sqlx::query(
            r#"
            INSERT INTO historical_system_data (id, timestamp, cpu_usage, memory_usage, memory_total, system_load)
            VALUES (?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&data.id)
        .bind(data.timestamp.to_rfc3339())
        .bind(data.cpu_usage)
        .bind(data.memory_usage)
        .bind(data.memory_total)
        .bind(data.system_load)
        .execute(&mut *tx)
        .await?;
        
        // 插入磁盘使用数据
        for disk_data in &data.disk_usage {
            let disk_id = Uuid::new_v4().to_string();
            sqlx::query(
                r#"
                INSERT INTO disk_usage_data (id, historical_data_id, mount_point, used_space, total_space, usage_percent)
                VALUES (?, ?, ?, ?, ?, ?)
                "#,
            )
            .bind(&disk_id)
            .bind(&data.id)
            .bind(&disk_data.mount_point)
            .bind(disk_data.used_space)
            .bind(disk_data.total_space)
            .bind(disk_data.usage_percent)
            .execute(&mut *tx)
            .await?;
        }
        
        // 插入网络流量数据
        let network_id = Uuid::new_v4().to_string();
        sqlx::query(
            r#"
            INSERT INTO network_traffic_data (id, historical_data_id, bytes_received, bytes_sent, packets_received, packets_sent)
            VALUES (?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&network_id)
        .bind(&data.id)
        .bind(data.network_traffic.bytes_received)
        .bind(data.network_traffic.bytes_sent)
        .bind(data.network_traffic.packets_received)
        .bind(data.network_traffic.packets_sent)
        .execute(&mut *tx)
        .await?;
        
        tx.commit().await?;
        Ok(())
    }
    
    /// 获取历史系统数据
    pub async fn fetch_historical_data(
        &self,
        start_time: DateTime<Utc>,
        end_time: DateTime<Utc>,
    ) -> Result<Vec<HistoricalSystemData>, sqlx::Error> {
        let rows = sqlx::query(
            r#"
            SELECT id, timestamp, cpu_usage, memory_usage, memory_total, system_load
            FROM historical_system_data
            WHERE timestamp BETWEEN ? AND ?
            ORDER BY timestamp ASC
            "#,
        )
        .bind(start_time.to_rfc3339())
        .bind(end_time.to_rfc3339())
        .fetch_all(&self.pool)
        .await?;
        
        let mut historical_data = Vec::new();
        
        for row in rows {
            let id: String = row.get("id");
            let timestamp_str: String = row.get("timestamp");
            let timestamp = DateTime::parse_from_rfc3339(&timestamp_str)
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(|_| Utc::now());
            
            // 获取磁盘使用数据
            let disk_rows = sqlx::query(
                r#"
                SELECT mount_point, used_space, total_space, usage_percent
                FROM disk_usage_data
                WHERE historical_data_id = ?
                "#,
            )
            .bind(&id)
            .fetch_all(&self.pool)
            .await?;
            
            let mut disk_usage = Vec::new();
            for disk_row in disk_rows {
                disk_usage.push(DiskUsageData {
                    mount_point: disk_row.get("mount_point"),
                    used_space: disk_row.get("used_space"),
                    total_space: disk_row.get("total_space"),
                    usage_percent: disk_row.get("usage_percent"),
                });
            }
            
            // 获取网络流量数据
            let network_row = sqlx::query(
                r#"
                SELECT bytes_received, bytes_sent, packets_received, packets_sent
                FROM network_traffic_data
                WHERE historical_data_id = ?
                "#,
            )
            .bind(&id)
            .fetch_one(&self.pool)
            .await?;
            
            let network_traffic = NetworkTrafficData {
                bytes_received: network_row.get("bytes_received"),
                bytes_sent: network_row.get("bytes_sent"),
                packets_received: network_row.get("packets_received"),
                packets_sent: network_row.get("packets_sent"),
            };
            
            historical_data.push(HistoricalSystemData {
                id,
                timestamp,
                cpu_usage: row.get("cpu_usage"),
                memory_usage: row.get("memory_usage"),
                memory_total: row.get("memory_total"),
                disk_usage,
                network_traffic,
                system_load: row.get("system_load"),
            });
        }
        
        Ok(historical_data)
    }
    
    /// 清理历史数据
    pub async fn prune_historical_data(&self, retention_days: i32) -> Result<u64, sqlx::Error> {
        let cutoff_time = Utc::now() - chrono::Duration::days(retention_days as i64);
        
        let result = sqlx::query(
            "DELETE FROM historical_system_data WHERE timestamp < ?",
        )
        .bind(cutoff_time.to_rfc3339())
        .execute(&self.pool)
        .await?;
        
        Ok(result.rows_affected())
    }
    
    /// 导出历史数据为CSV格式
    pub async fn export_historical_data_csv(
        &self,
        start_time: DateTime<Utc>,
        end_time: DateTime<Utc>,
    ) -> Result<String, sqlx::Error> {
        let data = self.fetch_historical_data(start_time, end_time).await?;
        
        let mut csv_output = String::new();
        
        // CSV头部
        csv_output.push_str("timestamp,cpu_usage,memory_usage,memory_total,system_load,disk_usage,network_traffic\n");
        
        // CSV数据行
        for record in data {
            let disk_usage_json = serde_json::to_string(&record.disk_usage).unwrap_or_default();
            let network_traffic_json = serde_json::to_string(&record.network_traffic).unwrap_or_default();
            
            csv_output.push_str(&format!(
                "{},{},{},{},{},{},{}\n",
                record.timestamp.to_rfc3339(),
                record.cpu_usage,
                record.memory_usage,
                record.memory_total,
                record.system_load,
                disk_usage_json,
                network_traffic_json
            ));
        }
        
        Ok(csv_output)
    }
    
    /// 获取数据库统计信息
    pub async fn get_database_stats(&self) -> Result<DatabaseStats, sqlx::Error> {
        let total_records_row = sqlx::query("SELECT COUNT(*) as count FROM historical_system_data")
            .fetch_one(&self.pool)
            .await?;
        
        let total_records: i64 = total_records_row.get("count");
        
        let oldest_record_row = sqlx::query("SELECT MIN(timestamp) as oldest FROM historical_system_data")
            .fetch_one(&self.pool)
            .await?;
        
        let oldest_timestamp_str: Option<String> = oldest_record_row.get("oldest");
        let oldest_timestamp = oldest_timestamp_str
            .and_then(|ts| DateTime::parse_from_rfc3339(&ts).ok())
            .map(|dt| dt.with_timezone(&Utc));
        
        let newest_record_row = sqlx::query("SELECT MAX(timestamp) as newest FROM historical_system_data")
            .fetch_one(&self.pool)
            .await?;
        
        let newest_timestamp_str: Option<String> = newest_record_row.get("newest");
        let newest_timestamp = newest_timestamp_str
            .and_then(|ts| DateTime::parse_from_rfc3339(&ts).ok())
            .map(|dt| dt.with_timezone(&Utc));
        
        Ok(DatabaseStats {
            total_records,
            oldest_timestamp,
            newest_timestamp,
        })
    }
}

// 数据库统计信息
#[derive(Debug, Serialize, Deserialize)]
pub struct DatabaseStats {
    pub total_records: i64,
    pub oldest_timestamp: Option<DateTime<Utc>>,
    pub newest_timestamp: Option<DateTime<Utc>>,
}