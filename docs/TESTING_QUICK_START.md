# IPC测试框架快速入门指南

本指南将帮助您快速上手使用为Tauri + React项目添加的IPC测试框架。

## 目录

1. [安装与设置](#安装与设置)
2. [运行您的第一个测试](#运行您的第一个测试)
3. [编写测试](#编写测试)
4. [常用测试场景](#常用测试场景)
5. [测试命令参考](#测试命令参考)

## 安装与设置

### 前置条件

确保您的开发环境已安装以下工具：

- Node.js (v18 或更高版本)
- Yarn 或 npm
- Rust 和 Cargo (用于后端测试)

### 安装依赖

```bash
# 安装项目依赖
yarn install

# 安装测试相关依赖（已包含在package.json中）
yarn add --dev jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom
```

### 验证安装

```bash
# 运行所有测试以验证安装
yarn test:all
```

如果所有测试都通过，说明您的测试环境已正确设置。

## 运行您的第一个测试

### 运行现有测试

项目已经包含了一些示例测试，您可以立即运行它们：

```bash
# 运行前端测试
yarn test

# 运行后端测试
yarn test:rust

# 运行所有测试
yarn test:all
```

### 使用测试运行器

测试运行器提供了更友好的测试执行方式：

```bash
# 运行所有测试
yarn test:runner

# 只运行前端测试
yarn test:runner frontend

# 只运行后端测试
yarn test:runner backend
```

## 编写测试

### 前端测试示例

#### 测试API调用

```typescript
// src/lib/api.test.ts
import { SystemMonitorAPI } from './api';
import { IPCTestUtils } from '../test/utils/ipc-test-utils';

describe('SystemMonitorAPI', () => {
  beforeEach(() => {
    // 重置所有模拟
    IPCTestUtils.resetMocks();
  });

  it('应该能够获取系统信息', async () => {
    // 设置模拟返回值
    const mockSystemInfo = IPCTestUtils.getMockSystemInfo();
    IPCTestUtils.mockIPCCommand('get_system_info', mockSystemInfo);

    // 调用API
    const result = await SystemMonitorAPI.getSystemInfo();

    // 验证结果
    expect(result).toEqual(mockSystemInfo);
    expect(result.os_name).toBe('Windows 10');
    
    // 验证IPC调用
    IPCTestUtils.verifyIPCCommandCalled('get_system_info');
  });

  it('应该正确处理错误情况', async () => {
    // 设置模拟抛出错误
    IPCTestUtils.mockIPCCommand('get_system_info', null, true);

    // 验证抛出错误
    await expect(SystemMonitorAPI.getSystemInfo()).rejects.toThrow();
  });
});
```

#### 测试组件

```typescript
// src/components/YourComponent.test.tsx
import { render, screen } from '@testing-library/react';
import YourComponent from './YourComponent';

describe('YourComponent', () => {
  it('应该渲染正确的文本', () => {
    render(<YourComponent />);
    
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### 后端测试示例

#### 基础功能测试

```rust
// src-tauri/tests/basic_test.rs
use serde::{Deserialize, Serialize};
use serde_json;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SystemInfo {
    pub os_name: String,
    pub os_version: String,
    pub hostname: String,
    pub kernel_version: String,
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

        // 测试反序列化
        let deserialized: SystemInfo = serde_json::from_str(&json).unwrap();
        assert_eq!(system_info.os_name, deserialized.os_name);
    }
}
```

## 常用测试场景

### 1. 测试IPC通信

```typescript
// 设置模拟
IPCTestUtils.mockIPCCommand('get_cpu_info', {
  name: 'Test CPU',
  cores: 8,
  usage: 50.0,
});

// 调用API
const cpuInfo = await SystemMonitorAPI.getCpuInfo();

// 验证结果
expect(cpuInfo.name).toBe('Test CPU');
expect(cpuInfo.cores).toBe(8);

// 验证IPC调用
IPCTestUtils.verifyIPCCommandCalled('get_cpu_info');
```

### 2. 测试错误处理

```typescript
// 模拟错误
IPCTestUtils.mockIPCCommand('ping_host', null, true);

// 验证错误抛出
await expect(SystemMonitorAPI.pingHost('8.8.8.8')).rejects.toThrow();
```

### 3. 测试并发调用

```typescript
// 并发调用多个API
const results = await Promise.all([
  SystemMonitorAPI.getSystemInfo(),
  SystemMonitorAPI.getCpuInfo(),
  SystemMonitorAPI.getMemoryInfo(),
]);

// 验证所有结果
expect(results).toHaveLength(3);
results.forEach(result => {
  expect(result).toBeDefined();
});
```

### 4. 测试性能

```typescript
// 测试响应时间
const startTime = Date.now();
await SystemMonitorAPI.getSystemInfo();
const endTime = Date.now();

expect(endTime - startTime).toBeLessThan(100); // 应在100ms内完成
```

### 5. 使用完整模拟环境

```typescript
import { IPCMock, IPCTestEnvironment } from '../test/utils/ipc-mock';

describe('使用完整模拟环境的测试', () => {
  beforeAll(() => {
    IPCTestEnvironment.setup();
  });

  afterAll(() => {
    IPCTestEnvironment.teardown();
  });

  beforeEach(() => {
    IPCMock.reset();
  });

  it('应该能够使用模拟环境', async () => {
    const result = await SystemMonitorAPI.getSystemInfo();
    expect(result.os_name).toBe('Mocked OS');
  });

  it('应该能够模拟网络延迟', async () => {
    // 模拟网络延迟
    IPCMock.simulateNetworkDelay('get_cpu_info', 200);
    
    const startTime = Date.now();
    await SystemMonitorAPI.getCpuInfo();
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeGreaterThanOrEqual(200);
  });
});
```

## 测试命令参考

### 基本测试命令

```bash
# 运行前端测试
yarn test

# 运行前端测试并监听文件变化
yarn test:watch

# 运行前端测试并生成覆盖率报告
yarn test:coverage

# 运行后端测试
yarn test:rust

# 运行所有测试
yarn test:all
```

### 使用测试运行器

```bash
# 运行所有测试
yarn test:runner

# 运行特定类型的测试
yarn test:runner frontend      # 前端测试
yarn test:runner backend       # 后端测试
yarn test:runner integration   # 集成测试
yarn test:runner coverage      # 覆盖率测试
yarn test:runner performance   # 性能测试
yarn test:runner security      # 安全测试
yarn test:runner e2e           # 端到端测试
```

### CI/CD测试

在GitHub Actions中，测试会自动运行。您也可以手动触发CI/CD流程：

```bash
# 本地运行CI/CD测试
yarn test:ci
```

## 下一步

- 阅读完整的[测试文档](./TESTING.md)了解更多高级功能
- 查看[测试配置文件](../test.config.js)了解可用的配置选项
- 探索项目中的[示例测试](../src/test/)了解更多测试模式

## 故障排除

### 常见问题

1. **测试失败**
   ```bash
   # 检查测试环境
   yarn test:runner
   
   # 查看详细错误信息
   yarn test --verbose
   ```

2. **模拟不工作**
   ```typescript
   // 确保正确初始化了模拟
   beforeEach(() => {
     IPCTestUtils.resetMocks();
     IPCTestEnvironment.setup();
   });
   ```

3. **后端测试失败**
   ```bash
   # 检查Rust环境
   cargo --version
   
   # 运行后端测试并查看详细信息
   cd src-tauri && cargo test -- --nocapture
   ```

### 获取帮助

如果您遇到问题：

1. 查看项目的GitHub Issues页面
2. 检查[测试文档](./TESTING.md)中的故障排除部分
3. 联系项目维护者

祝您测试愉快！