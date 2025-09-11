import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Server, Zap } from "lucide-react"
import { useTranslation } from 'react-i18next'

// Simple line chart component
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

export default function DiskPage() {
  const { t } = useTranslation();
  const [diskInfo] = useState([
    {
      name: "Samsung SSD 980 PRO",
      mount_point: "C:",
      total_space: 1000204886016,
      used_space: 850204886016,
      available_space: 150000000000,
      usage_percent: 85,
      file_system: "NTFS"
    },
    {
      name: "WD Black SN850",
      mount_point: "D:",
      total_space: 2000398934016,
      used_space: 1200398934016,
      available_space: 800000000000,
      usage_percent: 60,
      file_system: "NTFS"
    }
  ])
  const [diskHistory] = useState<number[]>([10, 15, 12, 18, 14, 16, 12, 15, 20, 25, 15])

  // 格式化字节数
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  return (
    <>
      <h1 className="text-3xl font-bold mb-6 text-gray-800">{t('disk.title')}</h1>

      {/* Disk Overview Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">{t('disk.storageOverview')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="text-xs text-gray-500 mb-1">{t('disk.totalStorage')}</div>
              <div className="text-2xl font-bold text-gray-800">
                {diskInfo.length > 0 ? formatBytes(diskInfo.reduce((sum, disk) => sum + disk.total_space, 0)) : 'N/A'}
              </div>
              <div className="text-xs text-gray-600">{t('disk.availableSpace')}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="text-xs text-gray-500 mb-1">{t('disk.usedSpace')}</div>
              <div className="text-2xl font-bold text-blue-600">
                {diskInfo.length > 0 ? formatBytes(diskInfo.reduce((sum, disk) => sum + disk.used_space, 0)) : 'N/A'}
              </div>
              <div className="text-xs text-gray-600">{t('disk.utilized')}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="text-xs text-gray-500 mb-1">{t('disk.freeSpace')}</div>
              <div className="text-2xl font-bold text-green-600">
                {diskInfo.length > 0 ? formatBytes(diskInfo.reduce((sum, disk) => sum + disk.available_space, 0)) : 'N/A'}
              </div>
              <div className="text-xs text-gray-600">{t('disk.available')}</div>
            </CardContent>
          </Card>
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="text-xs text-gray-500 mb-1">{t('disk.activeDrives')}</div>
              <div className="text-2xl font-bold text-gray-800">{diskInfo.length}</div>
              <div className="text-xs text-gray-600">{t('disk.allHealthy')}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Individual Drives Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">{t('disk.driveDetails')}</h2>
        <div className="space-y-4">
          {diskInfo.map((disk, index) => (
            <Card key={index} className="bg-white border-gray-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Server className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-800">{disk.name}</div>
                      <div className="text-sm text-gray-600">{disk.mount_point}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Health Status</div>
                    <div className="text-lg font-semibold text-green-600">Excellent</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">{t('disk.capacity')}</div>
                    <div className="text-sm font-semibold text-gray-800">{formatBytes(disk.total_space)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">{t('disk.usedSpace')}</div>
                    <div className="text-sm font-semibold text-gray-800">{formatBytes(disk.used_space)} ({disk.usage_percent.toFixed(1)}%)</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">{t('disk.freeSpace')}</div>
                    <div className="text-sm font-semibold text-gray-800">{formatBytes(disk.available_space)} ({(100 - disk.usage_percent).toFixed(1)}%)</div>
                  </div>
                </div>

                {/* Usage Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{t('disk.diskUsage')}</span>
                    <span>{disk.usage_percent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${disk.usage_percent}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <div className="text-gray-500">{t('disk.interface')}</div>
                    <div className="font-medium">{disk.file_system}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">{t('disk.readSpeed')}</div>
                    <div className="font-medium">7,000 MB/s</div>
                  </div>
                  <div>
                    <div className="text-gray-500">{t('disk.writeSpeed')}</div>
                    <div className="font-medium">5,100 MB/s</div>
                  </div>
                  <div>
                    <div className="text-gray-500">{t('disk.temperature')}</div>
                    <div className="font-medium text-green-600">42°C</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Disk Performance & Tools */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">{t('disk.performanceTools')}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Metrics */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">{t('disk.realTimePerformance')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">{t('disk.readActivity')}</div>
                  <div className="text-lg font-bold text-blue-600">25 MB/s</div>
                  <div className="text-xs text-gray-600">{t('disk.current')}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">{t('disk.writeActivity')}</div>
                  <div className="text-lg font-bold text-green-600">12 MB/s</div>
                  <div className="text-xs text-gray-600">{t('disk.current')}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">{t('disk.queueLength')}</div>
                  <div className="text-lg font-bold text-gray-800">2.1</div>
                  <div className="text-xs text-gray-600">{t('disk.average')}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">{t('disk.responseTime')}</div>
                  <div className="text-lg font-bold text-yellow-600">8ms</div>
                  <div className="text-xs text-gray-600">{t('disk.average')}</div>
                </div>
              </div>

              <div className="pt-4">
                <div className="text-xs text-gray-500 mb-2">{t('disk.diskActivity')}</div>
                <div className="h-16">
                  <MiniChart data={diskHistory} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disk Tools */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">{t('disk.diskManagementTools')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <Button variant="outline" className="justify-start h-auto p-4 bg-transparent">
                  <div className="text-left">
                    <div className="font-medium">{t('disk.diskCleanup')}</div>
                    <div className="text-xs text-gray-500">{t('disk.diskCleanupDesc')}</div>
                  </div>
                </Button>

                <Button variant="outline" className="justify-start h-auto p-4 bg-transparent">
                  <div className="text-left">
                    <div className="font-medium">{t('disk.defragmentDrives')}</div>
                    <div className="text-xs text-gray-500">{t('disk.defragmentDrivesDesc')}</div>
                  </div>
                </Button>

                <Button variant="outline" className="justify-start h-auto p-4 bg-transparent">
                  <div className="text-left">
                    <div className="font-medium">{t('disk.checkDiskHealth')}</div>
                    <div className="text-xs text-gray-500">{t('disk.checkDiskHealthDesc')}</div>
                  </div>
                </Button>

                <Button variant="outline" className="justify-start h-auto p-4 bg-transparent">
                  <div className="text-left">
                    <div className="font-medium">{t('disk.diskProperties')}</div>
                    <div className="text-xs text-gray-500">{t('disk.diskPropertiesDesc')}</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Storage Analysis */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-700">{t('disk.storageAnalysis')}</h2>
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">450GB</div>
                <div className="text-sm text-gray-600 mb-1">{t('disk.systemFiles')}</div>
                <div className="text-xs text-gray-500">{t('disk.systemFilesDesc')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">320GB</div>
                <div className="text-sm text-gray-600 mb-1">{t('disk.documents')}</div>
                <div className="text-xs text-gray-500">{t('disk.documentsDesc')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-2">180GB</div>
                <div className="text-sm text-gray-600 mb-1">{t('disk.applications')}</div>
                <div className="text-xs text-gray-500">{t('disk.applicationsDesc')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-2">85GB</div>
                <div className="text-sm text-gray-600 mb-1">{t('disk.temporary')}</div>
                <div className="text-xs text-gray-500">{t('disk.temporaryDesc')}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}