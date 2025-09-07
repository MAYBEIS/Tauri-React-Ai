/**
 * IPC测试配置文件
 * 用于本地开发和测试环境配置
 */

module.exports = {
  // 测试环境配置
  testEnvironment: {
    // 是否启用模拟模式
    mockMode: true,
    
    // 模拟延迟（毫秒）
    mockDelay: 0,
    
    // 是否启用错误模拟
    errorSimulation: false,
    
    // 是否启用网络延迟模拟
    networkDelaySimulation: false,
    
    // 网络延迟时间（毫秒）
    networkDelay: 100,
    
    // 是否启用超时模拟
    timeoutSimulation: false,
    
    // 超时时间（毫秒）
    timeout: 5000,
  },

  // 测试覆盖率配置
  coverage: {
    // 覆盖率阈值
    thresholds: {
      global: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
      // 文件特定覆盖率阈值
      fileThresholds: {
        'src/lib/api.ts': {
          statements: 90,
          branches: 85,
          functions: 90,
          lines: 90,
        },
        'src/test/utils/ipc-test-utils.ts': {
          statements: 95,
          branches: 90,
          functions: 95,
          lines: 95,
        },
        'src/test/utils/ipc-mock.ts': {
          statements: 95,
          branches: 90,
          functions: 95,
          lines: 95,
        },
      },
    },
    
    // 覆盖率报告配置
    reportConfig: {
      // 输出目录
      directory: 'coverage',
      
      // 报告格式
      reporters: ['text', 'lcov', 'html'],
      
      // 是否包含所有文件
      includeAllSources: true,
      
      // 排除的文件
      exclude: [
        'src/test/**',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
    },
  },

  // 性能测试配置
  performance: {
    // 并发测试配置
    concurrency: {
      // 并发请求数
      requests: 10,
      
      // 测试持续时间（毫秒）
      duration: 5000,
      
      // 期望的最大响应时间（毫秒）
      maxResponseTime: 1000,
      
      // 期望的最小吞吐量（请求/秒）
      minThroughput: 5,
    },
    
    // 负载测试配置
    load: {
      // 初始用户数
      initialUsers: 1,
      
      // 最大用户数
      maxUsers: 100,
      
      // 用户增长速率（用户/秒）
      rampRate: 10,
      
      // 测试持续时间（秒）
      duration: 60,
      
      // 期望的错误率（百分比）
      maxErrorRate: 1,
    },
  },

  // 集成测试配置
  integration: {
    // 测试超时时间（毫秒）
    timeout: 10000,
    
    // 重试配置
    retry: {
      // 最大重试次数
      maxAttempts: 3,
      
      // 重试间隔（毫秒）
      interval: 1000,
      
      // 需要重试的错误类型
      retryableErrors: [
        'Network Error',
        'Timeout Error',
        'Connection Refused',
      ],
    },
    
    // 测试数据配置
    testData: {
      // 测试主机列表
      testHosts: [
        '127.0.0.1',
        '8.8.8.8',
        '1.1.1.1',
      ],
      
      // 测试用户名
      testUsernames: [
        'test-user',
        'integration-test',
        'e2e-test',
      ],
      
      // 测试文件路径
      testFiles: [
        '/tmp/test-file.txt',
        '/var/log/test.log',
      ],
    },
  },

  // 端到端测试配置
  e2e: {
    // 测试超时时间（毫秒）
    timeout: 30000,
    
    // 测试浏览器配置
    browser: {
      // 浏览器类型
      type: 'chromium',
      
      // 是否启用无头模式
      headless: true,
      
      // 浏览器窗口大小
      viewport: {
        width: 1280,
        height: 720,
      },
      
      // 浏览器启动参数
      launchOptions: {
        slowMo: 0,
        args: [
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
        ],
      },
    },
    
    // 测试场景配置
    scenarios: {
      // 基本功能测试
      basic: {
        enabled: true,
        iterations: 1,
      },
      
      // 性能测试
      performance: {
        enabled: true,
        iterations: 3,
      },
      
      // 负载测试
      load: {
        enabled: false,
        iterations: 10,
        concurrentUsers: 5,
      },
    },
  },

  // 安全测试配置
  security: {
    // 是否启用安全测试
    enabled: true,
    
    // 安全测试规则
    rules: {
      // 输入验证
      inputValidation: {
        enabled: true,
        maxLength: 1000,
        allowedChars: /^[a-zA-Z0-9\s\-_.]+$/,
      },
      
      // SQL注入检测
      sqlInjection: {
        enabled: true,
        patterns: [
          /(\s|^)(OR|AND)\s+\d+\s*=\s*\d+/i,
          /(\s|^)(DROP|DELETE|UPDATE|INSERT)\s+/i,
          /(\s|^)(UNION\s+SELECT)/i,
        ],
      },
      
      // XSS检测
      xss: {
        enabled: true,
        patterns: [
          /<script[^>]*>.*?<\/script>/i,
          /javascript:/i,
          /on\w+\s*=/i,
        ],
      },
    },
  },

  // 报告配置
  reporting: {
    // 测试结果报告
    testResults: {
      // 输出格式
      format: ['json', 'html', 'junit'],
      
      // 输出目录
      outputDir: 'test-results',
      
      // 是否包含失败测试的详细信息
      includeFailureDetails: true,
      
      // 是否包含性能指标
      includeMetrics: true,
    },
    
    // 性能报告
    performance: {
      // 输出格式
      format: ['json', 'html'],
      
      // 输出目录
      outputDir: 'performance-results',
      
      // 是否包含图表
      includeCharts: true,
      
      // 是否包含历史数据对比
      includeHistoricalComparison: true,
    },
    
    // 覆盖率报告
    coverage: {
      // 输出格式
      format: ['lcov', 'html'],
      
      // 输出目录
      outputDir: 'coverage',
      
      // 是否包含源代码
      includeSource: true,
    },
  },

  // 开发环境配置
  development: {
    // 是否启用热重载
    hotReload: true,
    
    // 是否启用调试模式
    debugMode: true,
    
    // 日志级别
    logLevel: 'debug',
    
    // 是否启用源映射
    sourceMaps: true,
    
    // 开发服务器配置
    devServer: {
      port: 1420,
      host: 'localhost',
      https: false,
    },
  },

  // 生产环境配置
  production: {
    // 是否启用优化
    optimization: true,
    
    // 是否启用代码压缩
    minification: true,
    
    // 是否启用源映射
    sourceMaps: false,
    
    // 环境变量
    env: {
      NODE_ENV: 'production',
      RUST_ENV: 'release',
    },
  },
};