import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SystemMonitorAPI, {
  SystemInfo,
  CpuInfo,
  MemoryInfo,
  DiskInfo,
  NetworkStatus,
  AudioDevice,
  ProcessInfo
} from '@/lib/api';

const TestPage = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [cpuInfo, setCpuInfo] = useState<CpuInfo | null>(null);
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
  const [diskInfo, setDiskInfo] = useState<DiskInfo[]>([]);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [uptime, setUptime] = useState<number>(0);
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [pingResult, setPingResult] = useState<string>('');
  const [greetResult, setGreetResult] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const testAllCommands = async () => {
    setLoading(true);
    setError('');
    
    try {
      // 测试greet命令
      const greet = await SystemMonitorAPI.greet('Test User');
      setGreetResult(greet);

      // 测试系统信息命令
      const sysInfo = await SystemMonitorAPI.getSystemInfo();
      setSystemInfo(sysInfo);

      // 测试CPU信息命令
      const cpu = await SystemMonitorAPI.getCpuInfo();
      setCpuInfo(cpu);

      // 测试内存信息命令
      const memInfo = await SystemMonitorAPI.getMemoryInfo();
      setMemoryInfo(memInfo);

      // 测试磁盘信息命令
      const disk = await SystemMonitorAPI.getDiskInfo();
      setDiskInfo(disk);

      // 测试网络状态命令
      const netStatus = await SystemMonitorAPI.getNetworkStatus();
      setNetworkStatus(netStatus);

      // 测试音频设备命令
      const audio = await SystemMonitorAPI.getAudioDevices();
      setAudioDevices(audio);

      // 测试系统运行时间命令
      const up = await SystemMonitorAPI.getUptime();
      setUptime(up);

      // 测试进程列表命令
      const procs = await SystemMonitorAPI.getProcesses();
      setProcesses(procs);

      // 测试ping命令
      const ping = await SystemMonitorAPI.pingHost('google.com');
      setPingResult(ping);
    } catch (err) {
      console.error('Test failed:', err);
      setError(`Test failed: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testAllCommands();
  }, []);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  };

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

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            <h2 className="font-bold mb-2">错误</h2>
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Greet 命令结果 */}
          <Card>
            <CardHeader>
              <CardTitle>Greet 命令</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{greetResult || '等待测试...'}</p>
            </CardContent>
          </Card>

          {/* Ping 命令结果 */}
          <Card>
            <CardHeader>
              <CardTitle>Ping 命令</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{pingResult || '等待测试...'}</p>
            </CardContent>
          </Card>

          {/* 系统信息 */}
          <Card>
            <CardHeader>
              <CardTitle>系统信息</CardTitle>
            </CardHeader>
            <CardContent>
              {systemInfo ? (
                <div className="space-y-2">
                  <p><strong>操作系统:</strong> {systemInfo.os_name} {systemInfo.os_version}</p>
                  <p><strong>主机名:</strong> {systemInfo.hostname}</p>
                  <p><strong>内核版本:</strong> {systemInfo.kernel_version}</p>
                </div>
              ) : (
                <p>等待测试...</p>
              )}
            </CardContent>
          </Card>

          {/* CPU 信息 */}
          <Card>
            <CardHeader>
              <CardTitle>CPU 信息</CardTitle>
            </CardHeader>
            <CardContent>
              {cpuInfo ? (
                <div className="space-y-2">
                  <p><strong>名称:</strong> {cpuInfo.brand}</p>
                  <p><strong>核心数:</strong> {cpuInfo.cores} ({cpuInfo.physical_cores} 物理核心)</p>
                  <p><strong>频率:</strong> {(cpuInfo.frequency / 1000).toFixed(1)} GHz</p>
                  <p><strong>使用率:</strong> {cpuInfo.usage.toFixed(1)}%</p>
                  {cpuInfo.temperature && <p><strong>温度:</strong> {cpuInfo.temperature}°C</p>}
                </div>
              ) : (
                <p>等待测试...</p>
              )}
            </CardContent>
          </Card>

          {/* 内存信息 */}
          <Card>
            <CardHeader>
              <CardTitle>内存信息</CardTitle>
            </CardHeader>
            <CardContent>
              {memoryInfo ? (
                <div className="space-y-2">
                  <p><strong>总量:</strong> {formatBytes(memoryInfo.total)}</p>
                  <p><strong>已用:</strong> {formatBytes(memoryInfo.used)} ({memoryInfo.usage_percent.toFixed(1)}%)</p>
                  <p><strong>可用:</strong> {formatBytes(memoryInfo.available)}</p>
                  <p><strong>空闲:</strong> {formatBytes(memoryInfo.free)}</p>
                </div>
              ) : (
                <p>等待测试...</p>
              )}
            </CardContent>
          </Card>

          {/* 系统运行时间 */}
          <Card>
            <CardHeader>
              <CardTitle>系统运行时间</CardTitle>
            </CardHeader>
            <CardContent>
              {uptime > 0 ? (
                <p>{formatUptime(uptime)}</p>
              ) : (
                <p>等待测试...</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 磁盘信息 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>磁盘信息</CardTitle>
          </CardHeader>
          <CardContent>
            {diskInfo.length > 0 ? (
              <div className="space-y-4">
                {diskInfo.map((disk, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">{disk.name}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <p><strong>挂载点:</strong> {disk.mount_point}</p>
                      <p><strong>总容量:</strong> {formatBytes(disk.total_space)}</p>
                      <p><strong>已用:</strong> {formatBytes(disk.used_space)} ({disk.usage_percent.toFixed(1)}%)</p>
                      <p><strong>可用:</strong> {formatBytes(disk.available_space)}</p>
                      <p><strong>文件系统:</strong> {disk.file_system}</p>
                      <p><strong>可移动:</strong> {disk.is_removable ? '是' : '否'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>等待测试...</p>
            )}
          </CardContent>
        </Card>

        {/* 网络状态 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>网络状态</CardTitle>
          </CardHeader>
          <CardContent>
            {networkStatus ? (
              <div className="space-y-4">
                <p><strong>连接状态:</strong> {networkStatus.is_connected ? '已连接' : '未连接'}</p>
                <p><strong>本地IP:</strong> {networkStatus.local_ip || 'N/A'}</p>
                <p><strong>公网IP:</strong> {networkStatus.public_ip || 'N/A'}</p>
                
                <h3 className="font-semibold mt-2">网络接口</h3>
                <div className="space-y-2">
                  {networkStatus.interfaces.map((iface, index) => (
                    <div key={index} className="p-2 border rounded">
                      <p><strong>名称:</strong> {iface.name}</p>
                      <p><strong>IP地址:</strong> {iface.ip_address || 'N/A'}</p>
                      <p><strong>MAC地址:</strong> {iface.mac_address || 'N/A'}</p>
                      <p><strong>状态:</strong> {iface.is_up ? '启用' : '禁用'}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p>等待测试...</p>
            )}
          </CardContent>
        </Card>

        {/* 音频设备 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>音频设备</CardTitle>
          </CardHeader>
          <CardContent>
            {audioDevices.length > 0 ? (
              <div className="space-y-4">
                {audioDevices.map((device, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">{device.name}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <p><strong>默认:</strong> {device.is_default ? '是' : '否'}</p>
                      <p><strong>输入:</strong> {device.is_input ? '是' : '否'}</p>
                      <p><strong>输出:</strong> {device.is_output ? '是' : '否'}</p>
                      <p><strong>音量:</strong> {device.volume}%</p>
                      <p><strong>静音:</strong> {device.is_muted ? '是' : '否'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>等待测试...</p>
            )}
          </CardContent>
        </Card>

        {/* 进程列表 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>进程列表 (前10个)</CardTitle>
          </CardHeader>
          <CardContent>
            {processes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPU使用率</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">内存使用</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {processes.slice(0, 10).map((process, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{process.pid}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{process.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{process.cpu_usage}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatBytes(parseInt(process.memory_usage))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>等待测试...</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestPage;