import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SystemMonitorAPI from '@/lib/api';

interface TestResult {
  functionName: string;
  input: any;
  output: any;
  success: boolean;
  error?: string;
}

const TestPage = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    
    if (typeof value === 'string') {
      return value;
    }
    
    if (typeof value === 'number') {
      return value.toString();
    }
    
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return '[]';
      }
      return `[${value.length} items]`;
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    
    return String(value);
  };

  const testAllCommands = async () => {
    setLoading(true);
    const results: TestResult[] = [];
    
    // 测试greet命令
    try {
      const input = 'Test User';
      const output = await SystemMonitorAPI.greet(input);
      results.push({
        functionName: 'greet',
        input,
        output,
        success: true
      });
    } catch (err) {
      results.push({
        functionName: 'greet',
        input: 'Test User',
        output: null,
        success: false,
        error: String(err)
      });
    }
    
    // 测试系统信息命令
    try {
      const input = null;
      const output = await SystemMonitorAPI.getSystemInfo();
      results.push({
        functionName: 'getSystemInfo',
        input,
        output,
        success: true
      });
    } catch (err) {
      results.push({
        functionName: 'getSystemInfo',
        input: null,
        output: null,
        success: false,
        error: String(err)
      });
    }
    
    // 测试CPU信息命令
    try {
      const input = null;
      const output = await SystemMonitorAPI.getCpuInfo();
      results.push({
        functionName: 'getCpuInfo',
        input,
        output,
        success: true
      });
    } catch (err) {
      results.push({
        functionName: 'getCpuInfo',
        input: null,
        output: null,
        success: false,
        error: String(err)
      });
    }
    
    // 测试内存信息命令
    try {
      const input = null;
      const output = await SystemMonitorAPI.getMemoryInfo();
      results.push({
        functionName: 'getMemoryInfo',
        input,
        output,
        success: true
      });
    } catch (err) {
      results.push({
        functionName: 'getMemoryInfo',
        input: null,
        output: null,
        success: false,
        error: String(err)
      });
    }
    
    // 测试磁盘信息命令
    try {
      const input = null;
      const output = await SystemMonitorAPI.getDiskInfo();
      results.push({
        functionName: 'getDiskInfo',
        input,
        output,
        success: true
      });
    } catch (err) {
      results.push({
        functionName: 'getDiskInfo',
        input: null,
        output: null,
        success: false,
        error: String(err)
      });
    }
    
    // 测试网络状态命令
    try {
      const input = null;
      const output = await SystemMonitorAPI.getNetworkStatus();
      results.push({
        functionName: 'getNetworkStatus',
        input,
        output,
        success: true
      });
    } catch (err) {
      results.push({
        functionName: 'getNetworkStatus',
        input: null,
        output: null,
        success: false,
        error: String(err)
      });
    }
    
    // 测试音频设备命令
    try {
      const input = null;
      const output = await SystemMonitorAPI.getAudioDevices();
      results.push({
        functionName: 'getAudioDevices',
        input,
        output,
        success: true
      });
    } catch (err) {
      results.push({
        functionName: 'getAudioDevices',
        input: null,
        output: null,
        success: false,
        error: String(err)
      });
    }
    
    // 测试系统运行时间命令
    try {
      const input = null;
      const output = await SystemMonitorAPI.getUptime();
      results.push({
        functionName: 'getUptime',
        input,
        output,
        success: true
      });
    } catch (err) {
      results.push({
        functionName: 'getUptime',
        input: null,
        output: null,
        success: false,
        error: String(err)
      });
    }
    
    // 测试进程列表命令
    try {
      const input = null;
      const output = await SystemMonitorAPI.getProcesses();
      results.push({
        functionName: 'getProcesses',
        input,
        output,
        success: true
      });
    } catch (err) {
      results.push({
        functionName: 'getProcesses',
        input: null,
        output: null,
        success: false,
        error: String(err)
      });
    }
    
    // 测试ping命令
    try {
      const input = 'google.com';
      const output = await SystemMonitorAPI.pingHost(input);
      results.push({
        functionName: 'pingHost',
        input,
        output,
        success: true
      });
    } catch (err) {
      results.push({
        functionName: 'pingHost',
        input: 'google.com',
        output: null,
        success: false,
        error: String(err)
      });
    }
    
    setTestResults(results);
    setLoading(false);
  };

  useEffect(() => {
    testAllCommands();
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">IPC 功能测试</h1>
        
        <div className="mb-6">
          <Button
            onClick={testAllCommands}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {loading ? '测试中...' : '重新测试所有命令'}
          </Button>
        </div>

        <div className="space-y-4">
          {testResults.map((result, index) => (
            <Card key={index} className={result.success ? 'border-green-200' : 'border-red-200'}>
              <CardHeader className={`pb-2 ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{result.functionName}</span>
                  <span className={`text-sm px-2 py-1 rounded ${result.success ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {result.success ? '成功' : '失败'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">函数名</h3>
                    <div className="p-2 bg-gray-100 rounded font-mono text-sm">
                      {result.functionName}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">输入</h3>
                    <div className="p-2 bg-gray-100 rounded font-mono text-sm">
                      {formatValue(result.input)}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700 mb-2">输出</h3>
                    <div className="p-2 bg-gray-100 rounded font-mono text-sm max-h-40 overflow-y-auto">
                      {result.success ? formatValue(result.output) : 'N/A'}
                    </div>
                  </div>
                </div>
                {!result.success && result.error && (
                  <div className="mt-4">
                    <h3 className="font-medium text-gray-700 mb-2">错误信息</h3>
                    <div className="p-2 bg-red-100 rounded font-mono text-sm text-red-700">
                      {result.error}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestPage;