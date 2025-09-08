"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  Activity,
  HardDrive,
  Network,
  AlertTriangle,
  Settings,
  Cpu,
  MemoryStick,
  Wifi,
  Router,
  Globe
} from "lucide-react"
import RealTimeDashboard from "./RealTimeDashboard"
import HistoricalDataViewer from "./HistoricalDataViewer"
import ProcessManager from "./ProcessManager"
import NetworkDiagnostics from "./NetworkDiagnostics"
import AlertSystem from "./AlertSystem"
import { useTranslation } from 'react-i18next'

export default function MonitoringApp() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("realtime")

  const monitoringTabs = [
    {
      id: "realtime",
      label: t('monitoring.realTime'),
      icon: Activity,
      component: <RealTimeDashboard />
    },
    {
      id: "historical",
      label: t('monitoring.historical'),
      icon: BarChart3,
      component: <HistoricalDataViewer />
    },
    {
      id: "processes",
      label: t('monitoring.processes'),
      icon: Cpu,
      component: <ProcessManager />
    },
    {
      id: "network",
      label: t('monitoring.network'),
      icon: Network,
      component: <NetworkDiagnostics />
    },
    {
      id: "alerts",
      label: t('monitoring.alerts'),
      icon: AlertTriangle,
      component: <AlertSystem />
    },
    {
      id: "system",
      label: t('monitoring.system'),
      icon: Settings,
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* CPU Overview */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  {t('monitoring.cpu')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-800 mb-2">45%</div>
                <div className="text-xs text-gray-600">8 Cores, 16 Threads</div>
                <div className="text-xs text-gray-600">3.2 GHz Base Frequency</div>
              </CardContent>
            </Card>

            {/* Memory Overview */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <MemoryStick className="w-4 h-4" />
                  {t('monitoring.memory')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-800 mb-2">12.4 GB</div>
                <div className="text-xs text-gray-600">16 GB Total</div>
                <div className="text-xs text-gray-600">DDR4-3200</div>
              </CardContent>
            </Card>

            {/* Storage Overview */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <HardDrive className="w-4 h-4" />
                  {t('monitoring.storage')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-800 mb-2">850 GB</div>
                <div className="text-xs text-gray-600">1 TB Total</div>
                <div className="text-xs text-gray-600">NVMe SSD</div>
              </CardContent>
            </Card>

            {/* Network Overview */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Wifi className="w-4 h-4" />
                  {t('monitoring.network')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-800 mb-2">150 Mbps</div>
                <div className="text-xs text-gray-600">Download</div>
                <div className="text-xs text-gray-600">25 Mbps Upload</div>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  {t('monitoring.health')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 mb-2">Good</div>
                <div className="text-xs text-gray-600">All Systems Normal</div>
                <div className="text-xs text-gray-600">0 Alerts</div>
              </CardContent>
            </Card>

            {/* System Uptime */}
            <Card className="bg-white border-gray-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Router className="w-4 h-4" />
                  {t('monitoring.uptime')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-800 mb-2">7d 14h</div>
                <div className="text-xs text-gray-600">Stable</div>
                <div className="text-xs text-gray-600">Last Reboot: Sep 1</div>
              </CardContent>
            </Card>
          </div>

          {/* Additional System Information */}
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Globe className="w-5 h-5" />
                {t('monitoring.systemInformation')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">{t('monitoring.operatingSystem')}</div>
                  <div className="text-sm text-gray-600">Windows 11 Pro</div>
                  <div className="text-xs text-gray-500">Version 22H2</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">{t('monitoring.processor')}</div>
                  <div className="text-sm text-gray-600">Intel Core i7-12700K</div>
                  <div className="text-xs text-gray-500">12 Cores, 20 Threads</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">{t('monitoring.graphics')}</div>
                  <div className="text-sm text-gray-600">NVIDIA RTX 3080</div>
                  <div className="text-xs text-gray-500">10 GB GDDR6X</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
  ]

  return (
    <div className="h-full bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('monitoring.title')}</h1>
          <p className="text-gray-600">{t('monitoring.subtitle')}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm text-gray-500 mb-1">{t('monitoring.cpu')}</div>
              <div className="text-2xl font-bold text-gray-800">45%</div>
              <div className="text-xs text-green-600">Normal</div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm text-gray-500 mb-1">{t('monitoring.memory')}</div>
              <div className="text-2xl font-bold text-gray-800">77%</div>
              <div className="text-xs text-yellow-600">Moderate</div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm text-gray-500 mb-1">{t('monitoring.disk')}</div>
              <div className="text-2xl font-bold text-gray-800">85%</div>
              <div className="text-xs text-yellow-600">Moderate</div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm text-gray-500 mb-1">{t('monitoring.network')}</div>
              <div className="text-2xl font-bold text-gray-800">Active</div>
              <div className="text-xs text-green-600">Connected</div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm text-gray-500 mb-1">{t('monitoring.alerts')}</div>
              <div className="text-2xl font-bold text-gray-800">2</div>
              <div className="text-xs text-red-600">Active</div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="text-sm text-gray-500 mb-1">{t('monitoring.processes')}</div>
              <div className="text-2xl font-bold text-gray-800">124</div>
              <div className="text-xs text-gray-600">Running</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            {monitoringTabs.map((tab) => {
              const Icon = tab.icon
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          {monitoringTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-0">
              {tab.component}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}