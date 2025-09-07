# IPC测试框架文档

本文档描述了为Tauri + React项目添加的IPC测试框架的架构、功能和使用方法。

## 目录

1. [概述](#概述)
2. [架构设计](#架构设计)
3. [前端测试框架](#前端测试框架)
4. [后端测试框架](#后端测试框架)
5. [IPC测试工具](#ipc测试工具)
6. [测试类型](#测试类型)
7. [运行测试](#运行测试)
8. [配置选项](#配置选项)
9. [最佳实践](#最佳实践)
10. [故障排除](#故障排除)

## 概述

本项目实现了一个全面的IPC测试框架，用于测试Tauri应用程序的前端和后端之间的通信。该框架提供了以下功能：

- 前端单元测试和集成测试
- 后端Rust单元测试
- IPC通信模拟和验证
- 端到端测试支持
- 性能测试支持
- 测试覆盖率报告
- CI/CD集成

## 架构设计

### 整体架构

```
┌─────────────────┐    ┌─────────────────┐
│   前端测试框架   │    │   后端测试框架   │
│  (Jest + React)  │    │    (Rust)        │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────┬───────────┘
                     │
         ┌─────────────────┐
         │   IPC测试工具    │
         │ (模拟和验证)     │
         └─────────────────┘
                     │
         ┌─────────────────┐
         │   测试运行器    │
         │ (统一执行)      │
         └─────────────────┘
```

### 组件说明

1. **前端测试框架**：基于Jest和React Testing Library，用于测试前端组件和API调用。
2. **后端测试框架**：基于Rust内置测试框架，用于测试后端逻辑和数据处理。
3. **IPC测试工具**：提供IPC调用的模拟和验证功能，包括`IPCTestUtils`和`IPCMock`类。
4. **测试运行器**：统一的测试执行脚本，支持运行不同类型的测试。

## 前端测试框架

### 技术栈

- **Jest**：JavaScript测试框架，提供测试运行、断言和模拟功能。
- **React Testing Library**：用于测试React组件的工具库。
- **@testing-library/user-event**：模拟用户交互事件。

### 文件结构

```
src/
├── test/
│   ├── setup.ts                 # 测试设置文件
│   ├── utils/
│   │   ├── ipc-test-utils.ts    # IPC测试工具
│   │   └── ipc-mock.ts         # IPC模拟器
│   ├── unit/
│   │   └── ipc-communication.test.ts  # 单元测试
│   ├── integration/
│   │   └── ipc-integration.test.ts    # 集成测试
│   └── e2e/
│       └── ipc-e2e.test.ts      # 端到端测试
└── lib/
    └── api.test.ts              # API测试
```

### 配置

Jest配置文件`jest.config.ts`：

```typescript
import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import { compilerOptions } from './tsconfig.json';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  modulePaths: [compilerOptions.baseUrl],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/__tests__/**/*.tsx',
    '**/?(*.)+(spec|test).ts',
    '**/?(*.)+(spec|test).tsx',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 10000,
  verbose: true,
};

export default config;
```

## 后端测试框架

### 技术栈

- **Rust内置测试框架**：提供单元测试和集成测试支持。
- **tokio-test**：用于异步代码测试。
- **mockall**：用于创建模拟对象。
- **serial_test**：用于串行测试执行。

### 文件结构

```
src-tauri/
├── tests/
│   ├── basic_test.rs            # 基础功能测试
│   └── common/
│       └── mod.rs               # 测试公共模块
└── Cargo.toml                  # Rust项目配置
```

### 配置

在`Cargo.toml`中添加测试依赖：

```toml
[dev-dependencies]
tokio-test = "0.4"
mockall = "0.12"
serial_test = "3.0"
```

## IPC测试工具

### IPCTestUtils

`IPCTestUtils`类提供了一系列用于测试IPC调用的工具方法：

```typescript
// 设置模拟的IPC调用
IPCTestUtils.mockIPCCommand(command, returnValue, throwError);

// 重置所有模拟
IPCTestUtils.resetMocks();

// 清除所有模拟调用记录
IPCTestUtils.clearMocks();

// 验证IPC命令是否被调用
IPCTestUtils.verifyIPCCommandCalled(command, times);

// 验证IPC命令是否被调用特定的参数
IPCTestUtils.verifyIPCCommandCalledWith(command, args);

// 获取模拟数据
const mockSystemInfo = IPCTestUtils.getMockSystemInfo();
const mockCpuInfo = IPCTestUtils.getMockCpuInfo();
// ... 其他模拟数据
```

### IPCMock

`IPCMock`类提供了完整的IPC调用模拟环境：

```typescript
// 初始化IPC模拟器
IPCMock.init();

// 清理IPC模拟器
IPCMock.cleanup();

// 注册模拟处理器
IPCMock.registerHandler(command, handler);

// 模拟延迟响应
IPCMock.delayedResponse(delay, response);

// 模拟错误响应
IPCMock.simulateError(command, errorMessage);

// 模拟网络延迟
IPCMock.simulateNetworkDelay(command, delay);

// 模拟网络错误
IPCMock.simulateNetworkError(command);
```

### IPCTestEnvironment

`IPCTestEnvironment`类提供了测试环境的设置和清理：

```typescript
// 初始化测试环境
IPCTestEnvironment.setup();

// 清理测试环境
IPCTestEnvironment.teardown();

// 在测试用例中使用
beforeEach(() => IPCTestEnvironment.beforeEach());
afterEach(() => IPCTestEnvironment.afterEach());
```

## 测试类型

### 单元测试

单元测试用于测试单个函数或组件的功能。在本项目中，单元测试包括：

1. **API函数测试**：测试`SystemMonitorAPI`类中的每个方法。
2. **IPC通信测试**：测试IPC调用的正确性和错误处理。
3. **数据处理测试**：测试数据结构和数据处理逻辑。

示例：

```typescript
describe('SystemMonitorAPI', () => {
  it('应该正确调用greet命令', async () => {
    IPCTestUtils.mockIPCCommand('greet', 'Hello, Test!');
    const result = await SystemMonitorAPI.greet('Test');
    expect(result).toBe('Hello, Test!');
    IPCTestUtils.verifyIPCCommandCalledWith('greet', { name: 'Test' });
  });
});
```

### 集成测试

集成测试用于测试多个组件或系统之间的交互。在本项目中，集成测试包括：

1. **前端-后端集成测试**：测试前端API调用和后端处理的集成。
2. **IPC通信集成测试**：测试完整的IPC通信流程。
3. **数据流集成测试**：测试数据在不同组件间的流动。

示例：

```typescript
describe('IPC集成测试', () => {
  it('应该能够完成完整的系统信息收集流程', async () => {
    const systemInfo = await SystemMonitorAPI.getSystemInfo();
    const cpuInfo = await SystemMonitorAPI.getCpuInfo();
    const memoryInfo = await SystemMonitorAPI.getMemoryInfo();
    
    expect(systemInfo).toBeDefined();
    expect(cpuInfo).toBeDefined();
    expect(memoryInfo).toBeDefined();
  });
});
```

### 端到端测试

端到端测试用于模拟真实用户操作，测试整个应用程序的功能。在本项目中，端到端测试包括：

1. **用户流程测试**：测试完整的用户操作流程。
2. **错误处理测试**：测试应用程序在各种错误情况下的行为。
3. **性能测试**：测试应用程序的性能表现。

示例：

```typescript
describe('IPC端到端测试', () => {
  it('应该能够处理高频率的IPC调用', async () => {
    const callCount = 20;
    const promises = Array(callCount).fill(null).map(() => 
      SystemMonitorAPI.getSystemInfo()
    );

    const startTime = Date.now();
    const results = await Promise.all(promises);
    const endTime = Date.now();

    expect(results).toHaveLength(callCount);
    expect(endTime - startTime).toBeLessThan(1000);
  });
});
```

## 运行测试

### 使用npm脚本

项目提供了多个npm脚本来运行不同类型的测试：

```bash
# 运行所有前端测试
yarn test

# 运行前端测试并生成覆盖率报告
yarn test:coverage

# 运行后端测试
yarn test:rust

# 运行所有测试
yarn test:all

# 使用测试运行器
yarn test:runner                    # 运行所有测试
yarn test:runner frontend            # 只运行前端测试
yarn test:runner backend             # 只运行后端测试
yarn test:runner integration         # 只运行集成测试
yarn test:runner coverage            # 只运行覆盖率测试
yarn test:runner performance         # 只运行性能测试
yarn test:runner security            # 只运行安全测试
yarn test:runner e2e                 # 只运行端到端测试
```

### 直接使用测试运行器

```bash
# 运行所有测试
node scripts/test-runner.js

# 运行特定类型的测试
node scripts/test-runner.js frontend
node scripts/test-runner.js backend
node scripts/test-runner.js integration
# ... 其他测试类型
```

### 在CI/CD环境中运行

测试已配置为在GitHub Actions中自动运行。当代码被推送到`main`或`develop`分支，或者创建pull request时，会自动运行所有测试。

## 配置选项

### 测试配置文件

测试配置文件`test.config.js`提供了全面的测试配置选项：

```javascript
module.exports = {
  // 测试环境配置
  testEnvironment: {
    mockMode: true,
    mockDelay: 0,
    errorSimulation: false,
    networkDelaySimulation: false,
    networkDelay: 100,
    timeoutSimulation: false,
    timeout: 5000,
  },
  
  // 测试覆盖率配置
  coverage: {
    thresholds: {
      global: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
    reportConfig: {
      directory: 'coverage',
      reporters: ['text', 'lcov', 'html'],
    },
  },
  
  // 性能测试配置
  performance: {
    concurrency: {
      requests: 10,
      duration: 5000,
      maxResponseTime: 1000,
      minThroughput: 5,
    },
  },
  
  // 其他配置...
};
```

### 环境变量

可以通过环境变量来配置测试行为：

```bash
# 设置测试模式
export TEST_MODE=mock|real

# 设置测试超时时间
export TEST_TIMEOUT=10000

# 设置测试日志级别
export TEST_LOG_LEVEL=debug|info|warn|error
```

## 最佳实践

### 编写测试

1. **测试命名**：使用描述性的测试名称，清楚地说明测试的目的。
2. **测试结构**：遵循AAA模式（Arrange-Act-Assert）组织测试代码。
3. **测试隔离**：确保每个测试都是独立的，不依赖于其他测试的状态。
4. **模拟数据**：使用模拟数据而不是真实数据，确保测试的可重复性。
5. **错误测试**：不仅要测试成功情况，还要测试错误情况。

示例：

```typescript
describe('SystemMonitorAPI.getCpuInfo', () => {
  // Arrange
  beforeEach(() => {
    IPCTestUtils.resetMocks();
    IPCTestUtils.mockIPCCommand('get_cpu_info', IPCTestUtils.getMockCpuInfo());
  });

  it('应该返回正确的CPU信息', async () => {
    // Act
    const result = await SystemMonitorAPI.getCpuInfo();

    // Assert
    expect(result).toBeDefined();
    expect(result.name).toBe('Mocked CPU');
    expect(result.cores).toBe(8);
    IPCTestUtils.verifyIPCCommandCalled('get_cpu_info');
  });

  it('应该正确处理错误情况', async () => {
    // Arrange
    IPCTestUtils.mockIPCCommand('get_cpu_info', null, true);

    // Act & Assert
    await expect(SystemMonitorAPI.getCpuInfo()).rejects.toThrow();
  });
});
```

### 使用模拟

1. **合理使用模拟**：只模拟外部依赖，不模拟业务逻辑。
2. **模拟行为而非实现**：关注模拟的行为，而不是具体的实现细节。
3. **验证模拟调用**：验证模拟的方法是否被正确调用。

示例：

```typescript
// 好的模拟：关注行为
IPCMock.registerHandler('get_system_info', async () => {
  return {
    os_name: 'Mocked OS',
    os_version: '1.0.0',
    hostname: 'mocked-host',
    kernel_version: '1.0.0-mock',
  };
});

// 不好的模拟：过于具体
IPCMock.registerHandler('get_system_info', async () => {
  return {
    os_name: 'Mocked OS',
    os_version: '1.0.0',
    hostname: 'mocked-host',
    kernel_version: '1.0.0-mock',
    some_internal_field: 'some_value', // 不必要的内部字段
  };
});
```

### 性能测试

1. **定义性能指标**：明确定义性能指标，如响应时间、吞吐量等。
2. **使用真实数据量**：使用接近真实场景的数据量进行测试。
3. **多次运行取平均**：多次运行测试并取平均值，减少偶然性。

示例：

```typescript
describe('性能测试', () => {
  it('应该能够在合理时间内完成单个IPC调用', async () => {
    const iterations = 10;
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      await SystemMonitorAPI.getSystemInfo();
      const endTime = Date.now();
      times.push(endTime - startTime);
    }

    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    expect(averageTime).toBeLessThan(100); // 平均响应时间应小于100ms
  });
});
```

## 故障排除

### 常见问题

1. **测试失败**
   - 检查测试环境是否正确设置
   - 确认模拟数据是否正确
   - 查看测试日志以获取更多信息

2. **模拟不工作**
   - 确认是否正确初始化了模拟器
   - 检查模拟命令名称是否正确
   - 确认是否在测试后正确清理了模拟

3. **性能问题**
   - 检查是否有不必要的等待时间
   - 确认是否使用了适当的并发级别
   - 检查是否有内存泄漏

4. **CI/CD问题**
   - 检查CI/CD配置是否正确
   - 确认所有依赖是否正确安装
   - 查看CI/CD日志以获取更多信息

### 调试技巧

1. **使用调试日志**
   ```javascript
   // 在测试配置中启用调试日志
   module.exports = {
     testEnvironment: {
       logLevel: 'debug',
     },
   };
   ```

2. **使用断点**
   ```javascript
   // 在测试代码中添加断点
   debugger; // 测试会在此处暂停
   await SystemMonitorAPI.getSystemInfo();
   ```

3. **检查模拟状态**
   ```javascript
   // 检查模拟调用记录
   console.log(IPCTestUtils.getMockInvoke().mock.calls);
   ```

### 获取帮助

如果遇到问题，可以：

1. 查看项目的GitHub Issues页面
2. 检查文档是否有相关说明
3. 联系项目维护者

## 贡献

欢迎为测试框架贡献代码！在提交代码之前，请确保：

1. 所有测试都通过
2. 代码符合项目的编码规范
3. 添加了适当的测试用例
4. 更新了相关文档

## 许可证

本测试框架遵循与主项目相同的许可证。