"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  BarChart3,
  Monitor,
  Wifi,
  Volume2,
  Keyboard,
  Globe,
  Server,
  Zap,
  Mic,
  MicOff,
  Headphones,
  Speaker,
  Settings,
  Plus,
  Trash2,
  Edit3,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"
import { useState, useEffect, ChangeEvent } from "react"
import reactLogo from "./assets/react.svg"
import { invoke } from "@tauri-apps/api/core"
import "./App.css"
import { useTranslation } from 'react-i18next'

// Simple line chart component
function MiniChart({ data }: { data: number[] }) {
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

function AudioLevelMeter({ level, label }: { level: number; label: string }) {
  const getBarColor = (index: number, level: number) => {
    const normalizedLevel = level / 100
    const barThreshold = index / 20

    if (barThreshold <= normalizedLevel) {
      if (index < 12) return "bg-green-500"
      if (index < 16) return "bg-yellow-500"
      return "bg-red-500"
    }
    return "bg-gray-200"
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700">{label}</div>
      <div className="flex items-center gap-1">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className={`w-2 h-6 rounded-sm ${getBarColor(i, level)}`} />
        ))}
        <span className="ml-2 text-sm text-gray-600 w-10">{level}%</span>
      </div>
    </div>
  )
}

function HotkeyCapture({ onCapture, currentHotkey }: { onCapture: (hotkey: string) => void; currentHotkey: string }) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedKeys, setCapturedKeys] = useState<string[]>([])

  useEffect(() => {
    if (!isCapturing) return

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      const keys = []

      if (e.ctrlKey) keys.push("Ctrl")
      if (e.altKey) keys.push("Alt")
      if (e.shiftKey) keys.push("Shift")
      if (e.metaKey) keys.push("Win")

      if (e.key && !["Control", "Alt", "Shift", "Meta"].includes(e.key)) {
        keys.push(e.key.toUpperCase())
      }

      setCapturedKeys(keys)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (capturedKeys.length > 1) {
        const hotkey = capturedKeys.join(" + ")
        onCapture(hotkey)
        setIsCapturing(false)
        setCapturedKeys([])
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [isCapturing, capturedKeys, onCapture])

  return (
    <div className="flex gap-2 items-center">
      <Input
        value={isCapturing ? capturedKeys.join(" + ") || "Press keys..." : currentHotkey}
        readOnly
        placeholder="No hotkey set"
        className={`flex-1 ${isCapturing ? "border-blue-500 bg-blue-50" : ""}`}
      />
      <Button
        variant={isCapturing ? "destructive" : "outline"}
        size="sm"
        onClick={() => {
          if (isCapturing) {
            setIsCapturing(false)
            setCapturedKeys([])
          } else {
            setIsCapturing(true)
          }
        }}
      >
        {isCapturing ? "Cancel" : "Capture"}
      </Button>
    </div>
  )
}

export default function App() {
  const { t, i18n } = useTranslation();
  const [currentPage, setCurrentPage] = useState("performance")
  const [pingTarget, setPingTarget] = useState("google.com")
  const [pingResult, setPingResult] = useState<string | null>(null)
  const [proxyEnabled, setProxyEnabled] = useState(false)
  const [proxyHost, setProxyHost] = useState("127.0.0.1")
  const [proxyPort, setProxyPort] = useState("8080")
  const [dnsServers, setDnsServers] = useState(["8.8.8.8", "8.8.4.4"])

  const [micEnabled, setMicEnabled] = useState(true)
  const [micLevel, setMicLevel] = useState(45)
  const [outputLevel, setOutputLevel] = useState(75)
  const [micVolume, setMicVolume] = useState([80])
  const [outputVolume, setOutputVolume] = useState([65])
  const [selectedMicDevice, setSelectedMicDevice] = useState("Default Microphone")
  const [selectedOutputDevice, setSelectedOutputDevice] = useState("Default Speakers")

  const [customHotkeys, setCustomHotkeys] = useState([
    { id: 1, hotkey: "Ctrl + Shift + T", action: "Open Task Manager", enabled: true },
    { id: 2, hotkey: "Ctrl + Alt + L", action: "Lock Screen", enabled: true },
    { id: 3, hotkey: "Win + Shift + S", action: "Screenshot Tool", enabled: false },
  ])
  const [newHotkeyAction, setNewHotkeyAction] = useState("")
  const [newHotkey, setNewHotkey] = useState("")
  const [editingHotkey, setEditingHotkey] = useState<number | null>(null)

  const [networkSpeed, setNetworkSpeed] = useState({ download: 150, upload: 25 })
  const [networkUsage, setNetworkUsage] = useState({ sent: 2.4, received: 15.8 })

  const [language, setLanguage] = useState("English")
  const [fontSize, setFontSize] = useState([14])
  const [theme, setTheme] = useState("Light")
  const [autoStart, setAutoStart] = useState(true)
  const [minimizeToTray, setMinimizeToTray] = useState(false)
  const [showNotifications, setShowNotifications] = useState(true)
  const [updateFrequency, setUpdateFrequency] = useState([1000])
  const [temperatureUnit, setTemperatureUnit] = useState("Celsius")
  const [dataRetention, setDataRetention] = useState([7])

  const systemHotkeys = [
    { hotkey: "Ctrl + C", action: "Copy", source: "System", enabled: true },
    { hotkey: "Ctrl + V", action: "Paste", source: "System", enabled: true },
    { hotkey: "Ctrl + Z", action: "Undo", source: "System", enabled: true },
    { hotkey: "Alt + Tab", action: "Switch Windows", source: "System", enabled: true },
    { hotkey: "Win + L", action: "Lock Computer", source: "System", enabled: true },
    { hotkey: "Ctrl + Shift + Esc", action: "Task Manager", source: "System", enabled: true },
    { hotkey: "Win + D", action: "Show Desktop", source: "System", enabled: true },
    { hotkey: "Win + R", action: "Run Dialog", source: "System", enabled: true },
  ]

  const applicationHotkeys = [
    { hotkey: "Ctrl + T", action: "New Tab", source: "Chrome", enabled: true },
    { hotkey: "Ctrl + W", action: "Close Tab", source: "Chrome", enabled: true },
    { hotkey: "Ctrl + N", action: "New Window", source: "File Explorer", enabled: true },
    { hotkey: "F5", action: "Refresh", source: "Browser", enabled: true },
    { hotkey: "Ctrl + S", action: "Save", source: "Applications", enabled: true },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      if (micEnabled) {
        setMicLevel(Math.floor(Math.random() * 60) + 20)
      } else {
        setMicLevel(0)
      }
      setOutputLevel(Math.floor(Math.random() * 40) + 30)

      // Update network usage
      setNetworkUsage({
        sent: Math.random() * 5 + 1,
        received: Math.random() * 20 + 5,
      })
    }, 500)

    return () => clearInterval(interval)
  }, [micEnabled])

  // Sample data for charts
  const cpuData = [20, 25, 30, 22, 28, 35, 25, 30, 45, 35, 25]
  const gpuData = [35, 40, 45, 38, 42, 35, 30, 25, 35, 40, 38]
  const ramData = [55, 60, 65, 58, 62, 70, 65, 45, 55, 60, 58]
  const diskData = [10, 15, 12, 18, 14, 16, 12, 15, 20, 25, 15]

  const navigationItems = [
    { id: "performance", label: t('navigation.performance'), icon: BarChart3 },
    { id: "network", label: t('navigation.network'), icon: Wifi },
    { id: "audio", label: t('navigation.audio'), icon: Volume2 },
    { id: "hotkeys", label: t('navigation.hotkeys'), icon: Keyboard },
    { id: "disk", label: t('navigation.disk'), icon: Server },
    { id: "settings", label: t('navigation.settings'), icon: Settings },
  ]

  const handlePing = async () => {
    setPingResult("Pinging...")
    // Simulate ping request
    setTimeout(() => {
      const latency = Math.floor(Math.random() * 100) + 10
      setPingResult(`Reply from ${pingTarget}: time=${latency}ms TTL=64`)
    }, 1000)
  }

  const addDnsServer = () => {
    setDnsServers([...dnsServers, ""])
  }

  const updateDnsServer = (index: number, value: string) => {
    const newServers = [...dnsServers]
    newServers[index] = value
    setDnsServers(newServers)
  }

  const removeDnsServer = (index: number) => {
    setDnsServers(dnsServers.filter((_, i) => i !== index))
  }

  const addCustomHotkey = () => {
    if (newHotkey && newHotkeyAction) {
      const newId = Math.max(...customHotkeys.map((h) => h.id), 0) + 1
      setCustomHotkeys([
        ...customHotkeys,
        {
          id: newId,
          hotkey: newHotkey,
          action: newHotkeyAction,
          enabled: true,
        },
      ])
      setNewHotkey("")
      setNewHotkeyAction("")
    }
  }

  const removeCustomHotkey = (id: number) => {
    setCustomHotkeys(customHotkeys.filter((h) => h.id !== id))
  }

  const toggleHotkey = (id: number) => {
    setCustomHotkeys(customHotkeys.map((h) => (h.id === id ? { ...h, enabled: !h.enabled } : h)))
  }

  const updateHotkey = (id: number, hotkey: string, action: string) => {
    setCustomHotkeys(customHotkeys.map((h) => (h.id === id ? { ...h, hotkey, action } : h)))
    setEditingHotkey(null)
  }

  const checkHotkeyConflict = (hotkey: string) => {
    const allHotkeys = [
      ...systemHotkeys.map((h) => h.hotkey),
      ...applicationHotkeys.map((h) => h.hotkey),
      ...customHotkeys.map((h) => h.hotkey),
    ]
    return allHotkeys.filter((h) => h === hotkey).length > 1
  }

  return (
    <div className="h-screen bg-gray-50 text-gray-900 overflow-hidden">
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-64 bg-white h-full p-4 border-r border-gray-200 shadow-sm flex-shrink-0">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-md">
              <Monitor className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-gray-800">System Monitor</span>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPage === item.id
              return (
                <div
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-600 border border-blue-200"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </div>
              )
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
          {currentPage === "performance" && (
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
                      <div className="text-2xl font-bold mb-2 text-gray-800">25%</div>
                      <div className="h-8">
                        <MiniChart data={cpuData} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* GPU Card */}
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
                        <MiniChart data={gpuData} />
                      </div>
                    </CardContent>
                  </Card>

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
                      <div className="text-2xl font-bold mb-2 text-gray-800">60%</div>
                      <div className="h-8">
                        <MiniChart data={ramData} />
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
                      <div className="text-2xl font-bold mb-2 text-gray-800">15%</div>
                      <div className="h-8">
                        <MiniChart data={diskData} />
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
                      <div className="text-lg font-bold mb-2 text-gray-800">{networkSpeed.download}Mbps</div>
                      <div className="text-xs text-gray-500">{networkUsage.received.toFixed(1)} MB/s</div>
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
                      <div className="text-lg font-bold mb-2 text-gray-800">{networkSpeed.upload}Mbps</div>
                      <div className="text-xs text-gray-500">{networkUsage.sent.toFixed(1)} MB/s</div>
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
                          <div className="text-sm font-semibold text-gray-800">Intel i9-12900K</div>
                          <div className="text-xs text-gray-600">16 Cores, 24 Threads, 3.2GHz</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Graphics Card</div>
                          <div className="text-sm font-semibold text-gray-800">NVIDIA RTX 3080</div>
                          <div className="text-xs text-gray-600">10GB GDDR6X, 8704 CUDA Cores</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Memory</div>
                          <div className="text-sm font-semibold text-gray-800">32GB DDR4</div>
                          <div className="text-xs text-gray-600">3200MHz, Dual Channel</div>
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
                          <div className="text-sm font-semibold text-gray-800">Windows 11 Pro</div>
                          <div className="text-xs text-gray-600">Build 22000.1, 64-bit</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Motherboard</div>
                          <div className="text-sm font-semibold text-gray-800">ASUS ROG Z690</div>
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
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Primary Drive</div>
                          <div className="text-sm font-semibold text-gray-800">Samsung 980 PRO 1TB</div>
                          <div className="text-xs text-gray-600">NVMe SSD, 7000MB/s Read</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Secondary Drive</div>
                          <div className="text-sm font-semibold text-gray-800">Seagate Barracuda 2TB</div>
                          <div className="text-xs text-gray-600">7200RPM HDD, SATA III</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Total Storage</div>
                          <div className="text-sm font-semibold text-gray-800">3TB Available</div>
                          <div className="text-xs text-gray-600">1.2TB Used (40%)</div>
                        </div>
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
                      <div className="text-lg font-bold text-green-600">52°C</div>
                      <div className="text-xs text-gray-600">Normal</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-500 mb-1">{t('performance.gpuTemp')}</div>
                      <div className="text-lg font-bold text-yellow-600">68°C</div>
                      <div className="text-xs text-gray-600">Warm</div>
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
                      <div className="text-lg font-bold text-gray-800">2d 14h</div>
                      <div className="text-xs text-gray-600">Stable</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}

          {/* Network Page */}
          {currentPage === "network" && (
            <>
              <h1 className="text-4xl font-bold mb-8 text-gray-800">{t('network.title')}</h1>

              {/* Network Status Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-6 text-gray-700">{t('network.connectionStatus')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Connection Status */}
                  <Card className="bg-white border-gray-200 shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Wifi className="w-4 h-4" />
                        {t('network.connection')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600 mb-2">Connected</div>
                      <div className="text-sm text-gray-500">Wi-Fi Network</div>
                    </CardContent>
                  </Card>

                  {/* Local IP */}
                  <Card className="bg-white border-gray-200 shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Server className="w-4 h-4" />
                        {t('network.localIP')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold text-gray-800 mb-2">192.168.1.105</div>
                      <div className="text-sm text-gray-500">Private Address</div>
                    </CardContent>
                  </Card>

                  {/* Public IP */}
                  <Card className="bg-white border-gray-200 shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        {t('network.publicIP')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold text-gray-800 mb-2">203.0.113.45</div>
                      <div className="text-sm text-gray-500">ISP: Comcast</div>
                    </CardContent>
                  </Card>

                  {/* Network Speed */}
                  <Card className="bg-white border-gray-200 shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        {t('network.speed')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-lg font-bold text-gray-800 mb-2">↓ 150 Mbps</div>
                      <div className="text-sm text-gray-500">↑ 25 Mbps</div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Ping Tool Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-6 text-gray-700">{t('network.networkPingTool')}</h2>
                <Card className="bg-white border-gray-200 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex gap-4 items-end mb-4">
                      <div className="flex-1">
                        <Label htmlFor="ping-target" className="text-sm font-medium text-gray-700">
                          {t('network.targetHost')}
                        </Label>
                        <Input
                          id="ping-target"
                          value={pingTarget}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setPingTarget(e.target.value)}
                          placeholder="Enter domain or IP address"
                          className="mt-1"
                        />
                      </div>
                      <Button onClick={handlePing} className="bg-blue-500 hover:bg-blue-600">
                        Ping
                      </Button>
                    </div>
                    {pingResult && <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm">{pingResult}</div>}
                  </CardContent>
                </Card>
              </div>

              {/* Proxy Settings Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-6 text-gray-700">{t('network.proxyConfiguration')}</h2>
                <Card className="bg-white border-gray-200 shadow-md">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="proxy-enabled"
                          checked={proxyEnabled}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setProxyEnabled(e.target.checked)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <Label htmlFor="proxy-enabled" className="text-sm font-medium text-gray-700">
                          {t('network.enableHTTPProxy')}
                        </Label>
                      </div>

                      {proxyEnabled && (
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <Label htmlFor="proxy-host" className="text-sm font-medium text-gray-700">
                              {t('network.proxyHost')}
                            </Label>
                            <Input
                              id="proxy-host"
                              value={proxyHost}
                              onChange={(e: ChangeEvent<HTMLInputElement>) => setProxyHost(e.target.value)}
                              placeholder="127.0.0.1"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="proxy-port" className="text-sm font-medium text-gray-700">
                              {t('network.port')}
                            </Label>
                            <Input
                              id="proxy-port"
                              value={proxyPort}
                              onChange={(e: ChangeEvent<HTMLInputElement>) => setProxyPort(e.target.value)}
                              placeholder="8080"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      )}

                      <Button className="bg-green-500 hover:bg-green-600">{t('network.applyProxySettings')}</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* DNS Settings Section */}
              <div>
                <h2 className="text-2xl font-semibold mb-6 text-gray-700">{t('network.dnsConfiguration')}</h2>
                <Card className="bg-white border-gray-200 shadow-md">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <Label className="text-sm font-medium text-gray-700">{t('network.dnsServers')}</Label>
                      {dnsServers.map((server, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <Input
                            value={server}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => updateDnsServer(index, e.target.value)}
                            placeholder="8.8.8.8"
                            className="flex-1"
                          />
                          {dnsServers.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeDnsServer(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              {t('hotkeys.remove')}
                            </Button>
                          )}
                        </div>
                      ))}

                      <div className="flex gap-2">
                        <Button variant="outline" onClick={addDnsServer}>
                          {t('network.addDNSServer')}
                        </Button>
                        <Button className="bg-blue-500 hover:bg-blue-600">{t('network.applyDNSSettings')}</Button>
                      </div>

                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm text-blue-800">
                          <strong>{t('network.quickDNSPresets')}:</strong>
                          <div className="mt-2 space-x-2">
                            <Button variant="outline" size="sm" onClick={() => setDnsServers(["8.8.8.8", "8.8.4.4"])}>
                              {t('network.googleDNS')}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setDnsServers(["1.1.1.1", "1.0.0.1"])}>
                              {t('network.cloudflareDNS')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDnsServers(["208.67.222.222", "208.67.220.220"])}
                            >
                              {t('network.openDNS')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Audio Page */}
          {currentPage === "audio" && (
            <>
              <h1 className="text-4xl font-bold mb-8 text-gray-800">{t('audio.title')}</h1>

              {/* Audio Device Status Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-6 text-gray-700">{t('audio.deviceStatus')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Microphone Status */}
                  <Card className="bg-white border-gray-200 shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        {micEnabled ? (
                          <Mic className="w-4 h-4 text-green-600" />
                        ) : (
                          <MicOff className="w-4 h-4 text-red-500" />
                        )}
                        {t('audio.microphone')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold mb-2 ${micEnabled ? "text-green-600" : "text-red-500"}`}>
                        {micEnabled ? "Active" : "Muted"}
                      </div>
                      <div className="text-sm text-gray-500">Input Level: {micLevel}%</div>
                    </CardContent>
                  </Card>

                  {/* Output Device Status */}
                  <Card className="bg-white border-gray-200 shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Speaker className="w-4 h-4 text-blue-600" />
                        {t('audio.output')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600 mb-2">Active</div>
                      <div className="text-sm text-gray-500">Level: {outputLevel}%</div>
                    </CardContent>
                  </Card>

                  {/* Audio Quality */}
                  <Card className="bg-white border-gray-200 shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Headphones className="w-4 h-4" />
                        {t('audio.quality')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-800 mb-2">48kHz</div>
                      <div className="text-sm text-gray-500">16-bit Stereo</div>
                    </CardContent>
                  </Card>

                  {/* Audio Latency */}
                  <Card className="bg-white border-gray-200 shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        {t('audio.latency')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-gray-800 mb-2">12ms</div>
                      <div className="text-sm text-gray-500">Low Latency</div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Real-time Audio Levels */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-6 text-gray-700">{t('audio.realTimeAudioLevels')}</h2>
                <Card className="bg-white border-gray-200 shadow-md">
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <AudioLevelMeter level={micLevel} label={t('audio.microphoneInput')} />
                      <AudioLevelMeter level={outputLevel} label={t('audio.speakerOutput')} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Audio Controls */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-6 text-gray-700">{t('audio.audioControls')}</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Microphone Controls */}
                  <Card className="bg-white border-gray-200 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Mic className="w-5 h-5" />
                        {t('audio.microphoneSettings')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-gray-700">{t('audio.enableMicrophone')}</Label>
                        <Button
                          variant={micEnabled ? "default" : "outline"}
                          size="sm"
                          onClick={() => setMicEnabled(!micEnabled)}
                          className={micEnabled ? "bg-green-500 hover:bg-green-600" : ""}
                        >
                          {micEnabled ? t('audio.enabled') : t('audio.disabled')}
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">{t('audio.microphoneVolume')}: {micVolume[0]}%</Label>
                        <Slider
                          value={micVolume}
                          onValueChange={setMicVolume}
                          max={100}
                          step={1}
                          className="w-full"
                          disabled={!micEnabled}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">{t('audio.inputDevice')}</Label>
                        <select
                          value={selectedMicDevice}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedMicDevice(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option>{t('audio.defaultMicrophone')}</option>
                          <option>{t('audio.usbMicrophone')}</option>
                          <option>{t('audio.headsetMicrophone')}</option>
                          <option>{t('audio.builtInMicrophone')}</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Output Controls */}
                  <Card className="bg-white border-gray-200 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Speaker className="w-5 h-5" />
                        {t('audio.outputSettings')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">{t('audio.masterVolume')}: {outputVolume[0]}%</Label>
                        <Slider
                          value={outputVolume}
                          onValueChange={setOutputVolume}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">{t('audio.outputDevice')}</Label>
                        <select
                          value={selectedOutputDevice}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedOutputDevice(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option>{t('audio.defaultSpeakers')}</option>
                          <option>{t('audio.headphones')}</option>
                          <option>{t('audio.usbSpeakers')}</option>
                          <option>{t('audio.bluetoothHeadphones')}</option>
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          {t('audio.testAudio')}
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          <Settings className="w-4 h-4 mr-1" />
                          {t('audio.advanced')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Audio Applications */}
              <div>
                <h2 className="text-2xl font-semibold mb-6 text-gray-700">{t('audio.activeAudioApplications')}</h2>
                <Card className="bg-white border-gray-200 shadow-md">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {[
                        { name: "Chrome", volume: 85, icon: "🌐" },
                        { name: "Spotify", volume: 70, icon: "🎵" },
                        { name: "Discord", volume: 60, icon: "💬" },
                        { name: "System Sounds", volume: 45, icon: "🔊" },
                      ].map((app, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                          <div className="text-2xl">{app.icon}</div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">{app.name}</div>
                            <div className="text-sm text-gray-500">Volume: {app.volume}%</div>
                          </div>
                          <div className="w-32">
                            <Slider value={[app.volume]} max={100} step={1} className="w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Hotkeys Page */}
          {currentPage === "hotkeys" && (
            <>
              <h1 className="text-4xl font-bold mb-8 text-gray-800">{t('hotkeys.title')}</h1>

              {/* Hotkey Statistics */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-6 text-gray-700">{t('hotkeys.hotkeyOverview')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-white border-gray-200 shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Keyboard className="w-4 h-4" />
                        {t('hotkeys.customHotkeys')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600 mb-2">{customHotkeys.length}</div>
                      <div className="text-sm text-gray-500">
                        {customHotkeys.filter((h) => h.enabled).length} Active
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-gray-200 shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        {t('hotkeys.systemHotkeys')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-800 mb-2">{systemHotkeys.length}</div>
                      <div className="text-sm text-gray-500">Built-in</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-gray-200 shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        {t('hotkeys.appHotkeys')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-800 mb-2">{applicationHotkeys.length}</div>
                      <div className="text-sm text-gray-500">Application</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white border-gray-200 shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        {t('hotkeys.conflicts')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-500 mb-2">0</div>
                      <div className="text-sm text-gray-500">No Issues</div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Add New Hotkey */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-6 text-gray-700">{t('hotkeys.createNewHotkey')}</h2>
                <Card className="bg-white border-gray-200 shadow-md">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">{t('hotkeys.hotkeyCombination')}</Label>
                        <HotkeyCapture currentHotkey={newHotkey} onCapture={setNewHotkey} />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">{t('hotkeys.actionDescription')}</Label>
                        <Input
                          value={newHotkeyAction}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setNewHotkeyAction(e.target.value)}
                          placeholder={t('hotkeys.enterActionDescription')}
                        />
                      </div>
                      <Button
                        onClick={addCustomHotkey}
                        disabled={!newHotkey || !newHotkeyAction}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {t('hotkeys.addHotkey')}
                      </Button>
                    </div>
                    {newHotkey && checkHotkeyConflict(newHotkey) && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                       <span className="text-sm text-red-700">
                         {t('hotkeys.warningConflict')}
                       </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Custom Hotkeys */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-6 text-gray-700">{t('hotkeys.customHotkeys')}</h2>
                <Card className="bg-white border-gray-200 shadow-md">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {customHotkeys.map((hotkey) => (
                        <div key={hotkey.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={hotkey.enabled}
                              onChange={() => toggleHotkey(hotkey.id)}
                              className="w-4 h-4 text-blue-600"
                            />
                            {hotkey.enabled ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                            )}
                          </div>

                          <div className="flex-1 grid grid-cols-2 gap-4">
                            {editingHotkey === hotkey.id ? (
                              <>
                                <HotkeyCapture
                                  currentHotkey={hotkey.hotkey}
                                  onCapture={(newHotkey) => updateHotkey(hotkey.id, newHotkey, hotkey.action)}
                                />
                                <Input
                                  defaultValue={hotkey.action}
                                  onBlur={(e: ChangeEvent<HTMLInputElement>) => updateHotkey(hotkey.id, hotkey.hotkey, e.target.value)}
                                />
                              </>
                            ) : (
                              <>
                                <div>
                                  <div className="font-mono text-sm bg-white px-2 py-1 rounded border">
                                    {hotkey.hotkey}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-700">{hotkey.action}</div>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingHotkey(editingHotkey === hotkey.id ? null : hotkey.id)}
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeCustomHotkey(hotkey.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {customHotkeys.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          {t('hotkeys.noCustomHotkeys')}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* System Hotkeys */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-6 text-gray-700">{t('hotkeys.systemHotkeys')}</h2>
                <Card className="bg-white border-gray-200 shadow-md">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {systemHotkeys.map((hotkey, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="font-mono text-sm bg-white px-2 py-1 rounded border">{hotkey.hotkey}</div>
                            <div className="text-sm text-gray-700">{hotkey.action}</div>
                          </div>
                          <div className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">{hotkey.source}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Application Hotkeys */}
              <div>
                <h2 className="text-2xl font-semibold mb-6 text-gray-700">{t('hotkeys.applicationHotkeys')}</h2>
                <Card className="bg-white border-gray-200 shadow-md">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {applicationHotkeys.map((hotkey, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="font-mono text-sm bg-white px-2 py-1 rounded border">{hotkey.hotkey}</div>
                            <div className="text-sm text-gray-700">{hotkey.action}</div>
                          </div>
                          <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">{hotkey.source}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Disk Page */}
          {currentPage === "disk" && (
            <>
              <h1 className="text-3xl font-bold mb-6 text-gray-800">{t('disk.title')}</h1>

              {/* Disk Overview Section */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">{t('disk.storageOverview')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-500 mb-1">{t('disk.totalStorage')}</div>
                      <div className="text-2xl font-bold text-gray-800">3TB</div>
                      <div className="text-xs text-gray-600">{t('disk.availableSpace')}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-500 mb-1">{t('disk.usedSpace')}</div>
                      <div className="text-2xl font-bold text-blue-600">1.2TB</div>
                      <div className="text-xs text-gray-600">{t('disk.utilized')}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-500 mb-1">{t('disk.freeSpace')}</div>
                      <div className="text-2xl font-bold text-green-600">1.8TB</div>
                      <div className="text-xs text-gray-600">{t('disk.available')}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-500 mb-1">{t('disk.activeDrives')}</div>
                      <div className="text-2xl font-bold text-gray-800">3</div>
                      <div className="text-xs text-gray-600">{t('disk.allHealthy')}</div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Individual Drives Section */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">{t('disk.driveDetails')}</h2>
                <div className="space-y-4">
                  {/* Drive C: - Primary SSD */}
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Server className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-gray-800">Drive C: (System)</div>
                            <div className="text-sm text-gray-600">Samsung 980 PRO 1TB NVMe SSD</div>
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
                          <div className="text-sm font-semibold text-gray-800">1TB (931GB)</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">{t('disk.usedSpace')}</div>
                          <div className="text-sm font-semibold text-gray-800">650GB (70%)</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">{t('disk.freeSpace')}</div>
                          <div className="text-sm font-semibold text-gray-800">281GB (30%)</div>
                        </div>
                      </div>

                      {/* Usage Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{t('disk.diskUsage')}</span>
                          <span>70%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: "70%" }}></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <div className="text-gray-500">{t('disk.interface')}</div>
                          <div className="font-medium">NVMe PCIe 4.0</div>
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

                  {/* Drive D: - Secondary HDD */}
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <Server className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-gray-800">Drive D: (Storage)</div>
                            <div className="text-sm text-gray-600">Seagate Barracuda 2TB HDD</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Health Status</div>
                          <div className="text-lg font-semibold text-green-600">Good</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">{t('disk.capacity')}</div>
                          <div className="text-sm font-semibold text-gray-800">2TB (1.86TB)</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">{t('disk.usedSpace')}</div>
                          <div className="text-sm font-semibold text-gray-800">580GB (30%)</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">{t('disk.freeSpace')}</div>
                          <div className="text-sm font-semibold text-gray-800">1.28TB (70%)</div>
                        </div>
                      </div>

                      {/* Usage Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{t('disk.diskUsage')}</span>
                          <span>30%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: "30%" }}></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <div className="text-gray-500">{t('disk.interface')}</div>
                          <div className="font-medium">SATA III</div>
                        </div>
                        <div>
                          <div className="text-gray-500">{t('disk.rpm')}</div>
                          <div className="font-medium">7,200 RPM</div>
                        </div>
                        <div>
                          <div className="text-gray-500">{t('disk.cache')}</div>
                          <div className="font-medium">256MB</div>
                        </div>
                        <div>
                          <div className="text-gray-500">{t('disk.temperature')}</div>
                          <div className="font-medium text-green-600">38°C</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Drive E: - External USB */}
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Server className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-gray-800">Drive E: (External)</div>
                            <div className="text-sm text-gray-600">SanDisk Extreme Portable 1TB</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">Health Status</div>
                          <div className="text-lg font-semibold text-green-600">Excellent</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <div className="text-gray-500">{t('disk.interface')}</div>
                          <div className="font-medium">USB 3.2</div>
                        </div>
                        <div>
                          <div className="text-gray-500">{t('disk.readSpeed')}</div>
                          <div className="font-medium">1,050 MB/s</div>
                        </div>
                        <div>
                          <div className="text-gray-500">{t('disk.writeSpeed')}</div>
                          <div className="font-medium">1,000 MB/s</div>
                        </div>
                        <div>
                          <div className="text-gray-500">{t('disk.status')}</div>
                          <div className="font-medium text-blue-600">{t('disk.removable')}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
                          <MiniChart data={diskData} />
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
          )}

          {/* Settings Page */}
          {currentPage === "settings" && (
            <>
              <h1 className="text-3xl font-bold mb-6 text-gray-800">{t('settings.title')}</h1>

              {/* General Settings Section */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">{t('settings.generalSettings')}</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Language & Display */}
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-800">{t('settings.languageDisplay')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">{t('settings.language')}</Label>
                        <select
                          value={language}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                            setLanguage(e.target.value);
                            i18n.changeLanguage(e.target.value === 'English' ? 'en' : 'zh');
                          }}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option>English</option>
                          <option>中文 (Chinese)</option>
                          <option>日本語 (Japanese)</option>
                          <option>한국어 (Korean)</option>
                          <option>Español (Spanish)</option>
                          <option>Français (French)</option>
                          <option>Deutsch (German)</option>
                          <option>Русский (Russian)</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">{t('settings.fontSize')}: {fontSize[0]}px</Label>
                        <Slider
                          value={fontSize}
                          onValueChange={setFontSize}
                          min={10}
                          max={24}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{t('settings.small')}</span>
                          <span>{t('settings.medium')}</span>
                          <span>{t('settings.large')}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">{t('settings.theme')}</Label>
                        <select
                          value={theme}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) => setTheme(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option>{t('settings.light')}</option>
                          <option>{t('settings.dark')}</option>
                          <option>{t('settings.auto')}</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Application Behavior */}
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-800">{t('settings.applicationBehavior')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">{t('settings.startWithWindows')}</Label>
                          <div className="text-xs text-gray-500">{t('settings.startWithWindowsDesc')}</div>
                        </div>
                        <Button
                          variant={autoStart ? "default" : "outline"}
                          size="sm"
                          onClick={() => setAutoStart(!autoStart)}
                          className={autoStart ? "bg-blue-500 hover:bg-blue-600" : ""}
                        >
                          {autoStart ? t('settings.enabled') : t('settings.disabled')}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">{t('settings.minimizeToTray')}</Label>
                          <div className="text-xs text-gray-500">{t('settings.minimizeToTrayDesc')}</div>
                        </div>
                        <Button
                          variant={minimizeToTray ? "default" : "outline"}
                          size="sm"
                          onClick={() => setMinimizeToTray(!minimizeToTray)}
                          className={minimizeToTray ? "bg-blue-500 hover:bg-blue-600" : ""}
                        >
                          {minimizeToTray ? t('settings.enabled') : t('settings.disabled')}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">{t('settings.showNotifications')}</Label>
                          <div className="text-xs text-gray-500">{t('settings.showNotificationsDesc')}</div>
                        </div>
                        <Button
                          variant={showNotifications ? "default" : "outline"}
                          size="sm"
                          onClick={() => setShowNotifications(!showNotifications)}
                          className={showNotifications ? "bg-blue-500 hover:bg-blue-600" : ""}
                        >
                          {showNotifications ? t('settings.enabled') : t('settings.disabled')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Performance Settings Section */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">{t('settings.performanceMonitoring')}</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Update Settings */}
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-800">{t('settings.updateFrequency')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          {t('settings.refreshRate')}: {updateFrequency[0]}ms
                        </Label>
                        <Slider
                          value={updateFrequency}
                          onValueChange={setUpdateFrequency}
                          min={250}
                          max={5000}
                          step={250}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{t('settings.fast')}</span>
                          <span>{t('settings.normal')}</span>
                          <span>{t('settings.slow')}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          {t('settings.dataRetention')}: {dataRetention[0]} {t('settings.days')}
                        </Label>
                        <Slider
                          value={dataRetention}
                          onValueChange={setDataRetention}
                          min={1}
                          max={30}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>1 {t('settings.day')}</span>
                          <span>7 {t('settings.days')}</span>
                          <span>30 {t('settings.days')}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">{t('settings.temperatureUnit')}</Label>
                        <select
                          value={temperatureUnit}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) => setTemperatureUnit(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option>{t('settings.celsius')}</option>
                          <option>{t('settings.fahrenheit')}</option>
                          <option>{t('settings.kelvin')}</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Alert Settings */}
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-800">{t('settings.alertThresholds')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium text-gray-700">{t('settings.cpuUsageAlert')}</Label>
                          <div className="text-sm text-gray-600">85%</div>
                        </div>
                        <Slider value={[85]} max={100} step={5} className="w-full" />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium text-gray-700">{t('settings.memoryUsageAlert')}</Label>
                          <div className="text-sm text-gray-600">90%</div>
                        </div>
                        <Slider value={[90]} max={100} step={5} className="w-full" />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium text-gray-700">{t('settings.diskSpaceAlert')}</Label>
                          <div className="text-sm text-gray-600">95%</div>
                        </div>
                        <Slider value={[95]} max={100} step={5} className="w-full" />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium text-gray-700">{t('settings.temperatureAlert')}</Label>
                          <div className="text-sm text-gray-600">80°C</div>
                        </div>
                        <Slider value={[80]} min={50} max={100} step={5} className="w-full" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Advanced Settings Section */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">{t('settings.advancedSettings')}</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Data Export */}
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-800">{t('settings.dataManagement')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <div className="text-left">
                            <div className="font-medium">{t('settings.exportPerformanceData')}</div>
                            <div className="text-xs text-gray-500">{t('settings.exportPerformanceDataDesc')}</div>
                          </div>
                        </Button>

                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <div className="text-left">
                            <div className="font-medium">{t('settings.importSettings')}</div>
                            <div className="text-xs text-gray-500">{t('settings.importSettingsDesc')}</div>
                          </div>
                        </Button>

                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <div className="text-left">
                            <div className="font-medium">{t('settings.exportSettings')}</div>
                            <div className="text-xs text-gray-500">{t('settings.exportSettingsDesc')}</div>
                          </div>
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full justify-start text-red-600 hover:text-red-700 bg-transparent"
                        >
                          <div className="text-left">
                            <div className="font-medium">{t('settings.clearAllData')}</div>
                            <div className="text-xs text-gray-500">{t('settings.clearAllDataDesc')}</div>
                          </div>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* System Integration */}
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-800">{t('settings.systemIntegration')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <div className="text-left">
                            <div className="font-medium">{t('settings.windowsPerformanceToolkit')}</div>
                            <div className="text-xs text-gray-500">{t('settings.windowsPerformanceToolkitDesc')}</div>
                          </div>
                        </Button>

                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <div className="text-left">
                            <div className="font-medium">{t('settings.hardwareMonitoring')}</div>
                            <div className="text-xs text-gray-500">{t('settings.hardwareMonitoringDesc')}</div>
                          </div>
                        </Button>

                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <div className="text-left">
                            <div className="font-medium">{t('settings.registryMonitoring')}</div>
                            <div className="text-xs text-gray-500">{t('settings.registryMonitoringDesc')}</div>
                          </div>
                        </Button>

                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <div className="text-left">
                            <div className="font-medium">{t('settings.serviceManagement')}</div>
                            <div className="text-xs text-gray-500">{t('settings.serviceManagementDesc')}</div>
                          </div>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* About & Support Section */}
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-700">{t('settings.aboutSupport')}</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Application Info */}
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-800">{t('settings.applicationInformation')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">{t('settings.version')}</span>
                          <span className="text-sm font-medium">2.1.4</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">{t('settings.buildDate')}</span>
                          <span className="text-sm font-medium">2024-01-15</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">{t('settings.license')}</span>
                          <span className="text-sm font-medium">MIT License</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">{t('settings.platform')}</span>
                          <span className="text-sm font-medium">Windows 11</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <Button className="w-full bg-blue-500 hover:bg-blue-600">{t('settings.checkForUpdates')}</Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Support & Help */}
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-800">{t('settings.supportHelp')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <div className="text-left">
                            <div className="font-medium">{t('settings.userManual')}</div>
                            <div className="text-xs text-gray-500">{t('settings.userManualDesc')}</div>
                          </div>
                        </Button>

                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <div className="text-left">
                            <div className="font-medium">{t('settings.keyboardShortcuts')}</div>
                            <div className="text-xs text-gray-500">{t('settings.keyboardShortcutsDesc')}</div>
                          </div>
                        </Button>

                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <div className="text-left">
                            <div className="font-medium">{t('settings.reportIssue')}</div>
                            <div className="text-xs text-gray-500">{t('settings.reportIssueDesc')}</div>
                          </div>
                        </Button>

                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <div className="text-left">
                            <div className="font-medium">{t('settings.resetToDefaults')}</div>
                            <div className="text-xs text-gray-500">{t('settings.resetToDefaultsDesc')}</div>
                          </div>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}

          {/* Placeholder for other pages */}
          {currentPage !== "performance" &&
            currentPage !== "network" &&
            currentPage !== "audio" &&
            currentPage !== "hotkeys" &&
            currentPage !== "disk" &&
            currentPage !== "settings" && (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="text-6xl mb-4">🚧</div>
                  <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                    {navigationItems.find((item) => item.id === currentPage)?.label} Page
                  </h2>
                  <p className="text-gray-500">This page is under construction</p>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  )
}
