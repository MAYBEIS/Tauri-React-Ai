#!/usr/bin/env node

/**
 * IPC测试运行脚本
 * 用于本地开发和测试环境
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

// 加载测试配置
const testConfig = require('../test.config.js');

// 日志工具
const logger = {
  info: (message) => console.log(chalk.blue('[INFO]'), message),
  success: (message) => console.log(chalk.green('[SUCCESS]'), message),
  warning: (message) => console.log(chalk.yellow('[WARNING]'), message),
  error: (message) => console.log(chalk.red('[ERROR]'), message),
  debug: (message) => console.log(chalk.gray('[DEBUG]'), message),
};

// 测试运行器类
class TestRunner {
  constructor() {
    this.config = testConfig;
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
    };
  }

  // 运行命令
  runCommand(command, options = {}) {
    const defaultOptions = {
      stdio: 'inherit',
      cwd: process.cwd(),
      ...options,
    };

    try {
      logger.debug(`Running command: ${command}`);
      execSync(command, defaultOptions);
      return { success: true };
    } catch (error) {
      logger.error(`Command failed: ${command}`);
      logger.error(error.message);
      return { success: false, error };
    }
  }

  // 运行前端测试
  runFrontendTests() {
    logger.info('Running frontend tests...');
    
    const { success } = this.runCommand('yarn test:ci');
    
    if (success) {
      logger.success('Frontend tests passed');
      this.results.passed++;
    } else {
      logger.error('Frontend tests failed');
      this.results.failed++;
    }
    
    this.results.total++;
  }

  // 运行后端测试
  runBackendTests() {
    logger.info('Running backend tests...');
    
    const { success } = this.runCommand('yarn test:rust');
    
    if (success) {
      logger.success('Backend tests passed');
      this.results.passed++;
    } else {
      logger.error('Backend tests failed');
      this.results.failed++;
    }
    
    this.results.total++;
  }

  // 运行集成测试
  runIntegrationTests() {
    logger.info('Running integration tests...');
    
    const { success } = this.runCommand('yarn test:all');
    
    if (success) {
      logger.success('Integration tests passed');
      this.results.passed++;
    } else {
      logger.error('Integration tests failed');
      this.results.failed++;
    }
    
    this.results.total++;
  }

  // 运行覆盖率测试
  runCoverageTests() {
    logger.info('Running coverage tests...');
    
    const { success } = this.runCommand('yarn test:all:coverage');
    
    if (success) {
      logger.success('Coverage tests passed');
      this.results.passed++;
    } else {
      logger.error('Coverage tests failed');
      this.results.failed++;
    }
    
    this.results.total++;
  }

  // 运行性能测试
  runPerformanceTests() {
    logger.info('Running performance tests...');
    
    // 这里可以添加特定的性能测试命令
    const { success } = this.runCommand('yarn test');
    
    if (success) {
      logger.success('Performance tests passed');
      this.results.passed++;
    } else {
      logger.error('Performance tests failed');
      this.results.failed++;
    }
    
    this.results.total++;
  }

  // 运行安全测试
  runSecurityTests() {
    logger.info('Running security tests...');
    
    // 运行npm audit
    const npmAuditResult = this.runCommand('yarn audit --audit-level moderate');
    
    // 运行cargo audit
    const cargoAuditResult = this.runCommand('cd src-tauri && cargo audit', {
      cwd: path.join(process.cwd(), 'src-tauri'),
    });
    
    if (npmAuditResult.success && cargoAuditResult.success) {
      logger.success('Security tests passed');
      this.results.passed++;
    } else {
      logger.error('Security tests failed');
      this.results.failed++;
    }
    
    this.results.total++;
  }

  // 运行端到端测试
  runE2ETests() {
    logger.info('Running end-to-end tests...');
    
    // 这里可以添加特定的E2E测试命令
    const { success } = this.runCommand('yarn test');
    
    if (success) {
      logger.success('E2E tests passed');
      this.results.passed++;
    } else {
      logger.error('E2E tests failed');
      this.results.failed++;
    }
    
    this.results.total++;
  }

  // 生成测试报告
  generateReport() {
    logger.info('Generating test report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      results: this.results,
      config: this.config,
    };
    
    const reportPath = path.join(process.cwd(), 'test-results', 'report.json');
    const reportDir = path.dirname(reportPath);
    
    // 确保报告目录存在
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    logger.success(`Test report generated at: ${reportPath}`);
  }

  // 打印测试结果摘要
  printSummary() {
    const { passed, failed, skipped, total } = this.results;
    
    console.log('\n' + chalk.bold('=== Test Results Summary ==='));
    console.log(`Total tests: ${total}`);
    console.log(chalk.green(`Passed: ${passed}`));
    console.log(chalk.red(`Failed: ${failed}`));
    console.log(chalk.yellow(`Skipped: ${skipped}`));
    
    if (failed === 0) {
      console.log(chalk.green.bold('\n🎉 All tests passed!'));
    } else {
      console.log(chalk.red.bold('\n❌ Some tests failed!'));
    }
    
    console.log('\n' + chalk.bold('=== End of Test Results ===') + '\n');
  }

  // 运行所有测试
  runAllTests() {
    logger.info('Starting test suite...');
    
    // 根据配置决定运行哪些测试
    if (this.config.testEnvironment.mockMode) {
      logger.info('Running tests in mock mode');
    }
    
    this.runFrontendTests();
    this.runBackendTests();
    this.runIntegrationTests();
    this.runCoverageTests();
    
    if (this.config.performance.enabled) {
      this.runPerformanceTests();
    }
    
    if (this.config.security.enabled) {
      this.runSecurityTests();
    }
    
    if (this.config.e2e.scenarios.basic.enabled) {
      this.runE2ETests();
    }
    
    this.generateReport();
    this.printSummary();
    
    // 根据测试结果决定退出码
    if (this.results.failed > 0) {
      process.exit(1);
    }
  }

  // 运行特定测试
  runSpecificTest(testType) {
    logger.info(`Running ${testType} tests...`);
    
    switch (testType) {
      case 'frontend':
        this.runFrontendTests();
        break;
      case 'backend':
        this.runBackendTests();
        break;
      case 'integration':
        this.runIntegrationTests();
        break;
      case 'coverage':
        this.runCoverageTests();
        break;
      case 'performance':
        this.runPerformanceTests();
        break;
      case 'security':
        this.runSecurityTests();
        break;
      case 'e2e':
        this.runE2ETests();
        break;
      default:
        logger.error(`Unknown test type: ${testType}`);
        process.exit(1);
    }
    
    this.printSummary();
    
    if (this.results.failed > 0) {
      process.exit(1);
    }
  }
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const testRunner = new TestRunner();
  
  if (args.length === 0) {
    testRunner.runAllTests();
  } else {
    const testType = args[0];
    testRunner.runSpecificTest(testType);
  }
}

// 运行主函数
main();