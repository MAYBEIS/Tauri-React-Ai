import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect, useCallback, useRef } from "react"
import SystemMonitorAPI, {
  SystemInfo,
  CpuInfo,
  MemoryInfo,
  DiskInfo,
  GpuInfo,
  ProcessInfo
} from "@/lib/api"
import { BarChart3, Server, Zap, Activity } from "lucide-react"
import { useTranslation } from 'react-i18next'

// Simple line chart component - 使用 memo 避免不必要的重新渲染
const MiniChart = ({ data }: { data: number[] }) => {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100
      const y = 100 - ((value - min) / range) * 100
      return `${x},${y}`
    })
    .join(" ")

  return (
    <svg className="w-full h-16" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline fill="none" stroke="#3b82f6" strokeWidth="2" points={points} className="drop-shadow-sm" />
    </svg>
  )
}

export default function PerformancePage() {
  const { t } = useTranslation();
  const [updateFrequency, setUpdateFrequency] = useState([1000])
  
  // 系统数据状态
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [cpuInfo, setCpuInfo] = useState<CpuInfo | null>(null)
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null)
  const [diskInfo, setDiskInfo] = useState<DiskInfo[]>([])
  const [gpuInfo, setGpuInfo] = useState<GpuInfo[]>([])
  const [uptime, setUptime] = useState<number>(0)
  const [processes, setProcesses] = useState<ProcessInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 历史数据
  const [cpuHistory, setCpuHistory] = useState<number[]>([20, 25, 30, 22, 28, 35, 25, 30, 45, 35, 25])
  const [memoryHistory, setMemoryHistory] = useState<number[]>([55, 60, 65, 58, 62, 70, 65, 45, 55, 60, 58])
  const [diskHistory, setDiskHistory] = useState<number[]>([10, 15, 12, 18, 14, 16, 12, 15, 20, 25, 15])

  // 使用防抖函数减少频繁更新
  const debounce = useCallback((func: Function, wait: number) => {
    const timeout = useRef<NodeJS.Timeout | null>(null);
    
    return (...args: any[]) => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
      
      timeout.current = setTimeout(() => {
        func(...args);
      }, wait);
    };
  }, []);

  // 获取系统数据
  const fetchSystemData = useCallback(async () => {
    try {
      // 只在第一次加载时设置 loading 状态
      if (systemInfo === null) {
        setLoading(true)
      }
      setError(null)

      // 并行获取所有系统数据
      const [
        systemInfoData,
        cpuInfoData,
        memoryInfoData,
        diskInfoData,
        gpuInfoData,
        uptimeData,
        processesData
      ] = await Promise.all([
        SystemMonitorAPI.getSystemInfo(),
        SystemMonitorAPI.getCpuInfo(),
        SystemMonitorAPI.getMemoryInfo(),
        SystemMonitorAPI.getDiskInfo(),
        SystemMonitorAPI.getGpuInfo(),
        SystemMonitorAPI.getUptime(),
        SystemMonitorAPI.getProcesses()
      ])

      // 使用函数式更新，避免不必要的重新渲染
      setSystemInfo(prev => JSON.stringify(prev) !== JSON.stringify(systemInfoData) ? systemInfoData : prev)
      setCpuInfo(prev => JSON.stringify(prev) !== JSON.stringify(cpuInfoData) ? cpuInfoData : prev)
      setMemoryInfo(prev => JSON.stringify(prev) !== JSON.stringify(memoryInfoData) ? memoryInfoData : prev)
      setDiskInfo(prev => JSON.stringify(prev) !== JSON.stringify(diskInfoData) ? diskInfoData : prev)
      setGpuInfo(prev => JSON.stringify(prev) !== JSON.stringify(gpuInfoData) ? gpuInfoData : prev)
      setUptime(prev => prev !== uptimeData ? uptimeData : prev)
      setProcesses(prev => JSON.stringify(prev) !== JSON.stringify(processesData) ? processesData : prev)

      // 更新历史数据
      setCpuHistory(prev => [...prev.slice(1), cpuInfoData.usage])
      setMemoryHistory(prev => [...prev.slice(1), memoryInfoData.usage_percent])
      if (diskInfoData.length > 0) {
        setDiskHistory(prev => [...prev.slice(1), diskInfoData[0].usage_percent])
      }

      setLoading(false)
    } catch (err) {
      console.error("Failed to fetch system data:", err)
      setError("Failed to fetch system data. Please try again.")
      setLoading(false)
    }
  }, [systemInfo])

  // 使用防抖包装的 fetchSystemData
  const debouncedFetchSystemData = debounce(fetchSystemData, 200)

  // 初始化获取数据
  useEffect(() => {
    fetchSystemData()
  }, [])

  // 定时刷新数据
  useEffect(() => {
    const interval = setInterval(() => {
      debouncedFetchSystemData()
    }, updateFrequency[0])

    return () => clearInterval(interval)
  }, [updateFrequency[0], debouncedFetchSystemData])

  // 格式化字节数
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  // 格式化运行时间
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24))
    const hours = Math.floor((seconds % (3600 * 24)) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    return `${days}d ${hours}h ${minutes}m`
  }

  if (loading) {
    return (
      <div className="h-screen bg-gray-50 text-gray-900 overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading system data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-50 text-gray-900 overflow-hidden flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={fetchSystemData} 
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">{t('performance.title')}</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">{t('performance.realTimePerformance')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* CPU Card */}
          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-gray-600">{t('performance.cpu')}</CardTitle>
                <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                  <span>↗</span>
                  <span>+5%</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold mb-2 text-gray-800">
                {cpuInfo ? `${cpuInfo.usage.toFixed(1)}%` : 'N/A'}
              </div>
              <div className="h-8">
                <MiniChart data={cpuHistory} />
              </div>
            </CardContent>
          </Card>

          {/* GPU Cards - 显示所有GPU */}
          {gpuInfo.length > 0 ? (
            gpuInfo.map((gpu, index) => (
              <Card key={index} className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 px-4 pt-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium text-gray-600">
                      {t('performance.gpu')} {gpuInfo.length > 1 ? index + 1 : ''}
                    </CardTitle>
                    <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                      <span>↗</span>
                      <span>+10%</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-2xl font-bold mb-2 text-gray-800">
                    {gpu.usage_percent !== undefined ? `${gpu.usage_percent.toFixed(1)}%` : 'N/A'}
                  </div>
                  <div className="h-8">
                    <MiniChart data={[35, 40, 45, 38, 42, 35, 30, 25, 35, 40, 38]} />
                  </div>
                  {gpu.vram_total > 0 && (
                    <div className="mt-2 text-xs text-gray-600">
                      VRAM: {gpu.vram_used > 0 ? `${(gpu.vram_used / (1024 * 1024 * 1024)).toFixed(1)}GB` : 'N/A'} / {(gpu.vram_total / (1024 * 1024 * 1024)).toFixed(1)}GB
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            // 如果没有GPU信息，显示默认卡片
            <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2 px-4 pt-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium text-gray-600">{t('performance.gpu')}</CardTitle>
                  <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                    <span>↗</span>
                    <span>+10%</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-2xl font-bold mb-2 text-gray-800">40%</div>
                <div className="h-8">
                  <MiniChart data={[35, 40, 45, 38, 42, 35, 30, 25, 35, 40, 38]} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* RAM Card */}
          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-gray-600">{t('performance.ram')}</CardTitle>
                <div className="flex items-center gap-1 text-red-500 text-xs font-medium">
                  <span>↘</span>
                  <span>-5%</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold mb-2 text-gray-800">
                {memoryInfo ? `${memoryInfo.usage_percent.toFixed(1)}%` : 'N/A'}
              </div>
              <div className="h-8">
                <MiniChart data={memoryHistory} />
              </div>
            </CardContent>
          </Card>

          {/* Disk Card */}
          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-gray-600">{t('performance.diskIO')}</CardTitle>
                <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                  <span>↗</span>
                  <span>+2%</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-bold mb-2 text-gray-800">
                {diskInfo.length > 0 ? `${diskInfo[0].usage_percent.toFixed(1)}%` : 'N/A'}
              </div>
              <div className="h-8">
                <MiniChart data={diskHistory} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-gray-600">{t('performance.download')}</CardTitle>
                <div className="flex items-center gap-1 text-blue-600 text-xs font-medium">
                  <span>↓</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-lg font-bold mb-2 text-gray-800">150Mbps</div>
              <div className="text-xs text-gray-500">15.8 MB/s</div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-gray-600">{t('performance.upload')}</CardTitle>
                <div className="flex items-center gap-1 text-blue-600 text-xs font-medium">
                  <span>↑</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-lg font-bold mb-2 text-gray-800">25Mbps</div>
              <div className="text-xs text-gray-500">2.4 MB/s</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">{t('performance.systemInformation')}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Hardware Info Card */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Processor</div>
                  <div className="text-sm font-semibold text-gray-800">
                    {cpuInfo ? cpuInfo.brand : 'Loading...'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {cpuInfo ? `${cpuInfo.cores} Cores, ${cpuInfo.physical_cores} Threads, ${(cpuInfo.frequency / 1000).toFixed(1)}GHz` : 'Loading...'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Graphics Card{gpuInfo.length > 1 ? 's' : ''}</div>
                  {gpuInfo.length > 0 ? (
                    gpuInfo.map((gpu, index) => (
                      <div key={index} className="mb-2 last:mb-0">
                        <div className="text-sm font-semibold text-gray-800">{gpu.name || `GPU ${index + 1}`}</div>
                        <div className="text-xs text-gray-600">
                          {gpu.vram_total ? `${(gpu.vram_total / (1024 * 1024 * 1024)).toFixed(1)}GB VRAM` : 'VRAM info not available'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="text-sm font-semibold text-gray-800">NVIDIA RTX 3080</div>
                      <div className="text-xs text-gray-600">10GB GDDR6X, 8704 CUDA Cores</div>
                    </>
                  )}
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Memory</div>
                  <div className="text-sm font-semibold text-gray-800">
                    {memoryInfo ? formatBytes(memoryInfo.total) : 'Loading...'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {memoryInfo ? 'DDR4, Dual Channel' : 'Loading...'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Info Card */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Operating System</div>
                  <div className="text-sm font-semibold text-gray-800">
                    {systemInfo ? `${systemInfo.os_name} ${systemInfo.os_version}` : 'Loading...'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {systemInfo ? `Build ${systemInfo.kernel_version}, 64-bit` : 'Loading...'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Hostname</div>
                  <div className="text-sm font-semibold text-gray-800">
                    {systemInfo ? systemInfo.hostname : 'Loading...'}
                  </div>
                  <div className="text-xs text-gray-600">BIOS Version 2.1.4</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Network Adapter</div>
                  <div className="text-sm font-semibold text-gray-800">Intel Wi-Fi 6E AX210</div>
                  <div className="text-xs text-gray-600">802.11ax, Bluetooth 5.2</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Storage Info Card */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="space-y-4">
                {diskInfo.length > 0 ? (
                  <>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Primary Drive</div>
                      <div className="text-sm font-semibold text-gray-800">{diskInfo[0].name}</div>
                      <div className="text-xs text-gray-600">
                        {formatBytes(diskInfo[0].total_space)}, {diskInfo[0].file_system}
                      </div>
                    </div>
                    {diskInfo.length > 1 && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Secondary Drive</div>
                        <div className="text-sm font-semibold text-gray-800">{diskInfo[1].name}</div>
                        <div className="text-xs text-gray-600">
                          {formatBytes(diskInfo[1].total_space)}, {diskInfo[1].file_system}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Total Storage</div>
                      <div className="text-sm font-semibold text-gray-800">
                        {formatBytes(diskInfo.reduce((sum, disk) => sum + disk.total_space, 0))}
                      </div>
                      <div className="text-xs text-gray-600">
                        {formatBytes(diskInfo.reduce((sum, disk) => sum + disk.used_space, 0))} Used (
                        {(
                          (diskInfo.reduce((sum, disk) => sum + disk.used_space, 0) /
                            diskInfo.reduce((sum, disk) => sum + disk.total_space, 0)) *
                          100
                        ).toFixed(0)}
                        %)
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-gray-500">Loading disk information...</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-700">{t('performance.temperaturePower')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="text-xs text-gray-500 mb-1">{t('performance.cpuTemp')}</div>
              <div className="text-lg font-bold text-green-600">
                {cpuInfo && cpuInfo.temperature ? `${cpuInfo.temperature}°C` : 'N/A'}
              </div>
              <div className="text-xs text-gray-600">Normal</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="text-xs text-gray-500 mb-1">{t('performance.gpuTemp')}</div>
              <div className="text-lg font-bold text-yellow-600">
                {gpuInfo.length > 0 && gpuInfo[0].temperature ? `${gpuInfo[0].temperature.toFixed(1)}°C` : '68°C'}
              </div>
              <div className="text-xs text-gray-600">
                {gpuInfo.length > 0 && gpuInfo[0].temperature ?
                  gpuInfo[0].temperature > 70 ? 'Hot' : gpuInfo[0].temperature > 60 ? 'Warm' : 'Normal' : 'Warm'}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="text-xs text-gray-500 mb-1">{t('performance.systemFan')}</div>
              <div className="text-lg font-bold text-blue-600">1200RPM</div>
              <div className="text-xs text-gray-600">Auto</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="text-xs text-gray-500 mb-1">{t('performance.powerDraw')}</div>
              <div className="text-lg font-bold text-orange-600">285W</div>
              <div className="text-xs text-gray-600">Moderate</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="text-xs text-gray-500 mb-1">{t('performance.battery')}</div>
              <div className="text-lg font-bold text-green-600">N/A</div>
              <div className="text-xs text-gray-600">Desktop</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="text-xs text-gray-500 mb-1">{t('performance.uptime')}</div>
              <div className="text-lg font-bold text-gray-800">
                {uptime > 0 ? formatUptime(uptime) : 'N/A'}
              </div>
              <div className="text-xs text-gray-600">Stable</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}