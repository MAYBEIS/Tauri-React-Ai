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
    { id: "performance", label: "Performance", icon: BarChart3 },
    { id: "network", label: "Network", icon: Wifi },
    { id: "audio", label: "Audio", icon: Volume2 },
    { id: "hotkeys", label: "Hotkeys", icon: Keyboard },
    { id: "disk", label: "Disk", icon: Server },
    { id: "settings", label: "Settings", icon: Settings },
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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white min-h-screen p-4 border-r border-gray-200 shadow-sm">
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
        <div className="flex-1 p-6 bg-gray-50">
          {currentPage === "performance" && (
            <>
              <h1 className="text-3xl font-bold mb-6 text-gray-800">Performance Monitor</h1>

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Real-time Performance</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {/* CPU Card */}
                  <Card className="bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2 px-4 pt-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-medium text-gray-600">CPU</CardTitle>
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
                        <CardTitle className="text-xs font-medium text-gray-600">GPU</CardTitle>
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
                        <CardTitle className="text-xs font-medium text-gray-600">RAM</CardTitle>
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
                        <CardTitle className="text-xs font-medium text-gray-600">Disk I/O</CardTitle>
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
                        <CardTitle className="text-xs font-medium text-gray-600">Download</CardTitle>
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
                        <CardTitle className="text-xs font-medium text-gray-600">Upload</CardTitle>
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
                <h2 className="text-xl font-semibold mb-4 text-gray-700">System Information</h2>
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
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Temperature & Power</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-500 mb-1">CPU Temp</div>
                      <div className="text-lg font-bold text-green-600">52°C</div>
                      <div className="text-xs text-gray-600">Normal</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-500 mb-1">GPU Temp</div>
                      <div className="text-lg font-bold text-yellow-600">68°C</div>
                      <div className="text-xs text-gray-600">Warm</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-500 mb-1">System Fan</div>
                      <div className="text-lg font-bold text-blue-600">1200RPM</div>
                      <div className="text-xs text-gray-600">Auto</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-500 mb-1">Power Draw</div>
                      <div className="text-lg font-bold text-orange-600">285W</div>
                      <div className="text-xs text-gray-600">Moderate</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-500 mb-1">Battery</div>
                      <div className="text-lg font-bold text-green-600">N/A</div>
                      <div className="text-xs text-gray-600">Desktop</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-500 mb-1">Uptime</div>
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
              <h1 className="text-4xl font-bold mb-8 text-gray-800">Network Monitor</h1>

              {/* Network Status Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-6 text-gray-700">Connection Status</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Connection Status */}
                  <Card className="bg-white border-gray-200 shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Wifi className="w-4 h-4" />
                        Connection
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
                        Local IP
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
                        Public IP
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
                        Speed
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
                <h2 className="text-2xl font-semibold mb-6 text-gray-700">Network Ping Tool</h2>
                <Card className="bg-white border-gray-200 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex gap-4 items-end mb-4">
                      <div className="flex-1">
                        <Label htmlFor="ping-target" className="text-sm font-medium text-gray-700">
                          Target Host
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
                <h2 className="text-2xl font-semibold mb-6 text-gray-700">Proxy Configuration</h2>
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
                          Enable HTTP Proxy
                        </Label>
                      </div>

                      {proxyEnabled && (
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <Label htmlFor="proxy-host" className="text-sm font-medium text-gray-700">
                              Proxy Host
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
                              Port
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

                      <Button className="bg-green-500 hover:bg-green-600">Apply Proxy Settings</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* DNS Settings Section */}
              <div>
                <h2 className="text-2xl font-semibold mb-6 text-gray-700">DNS Configuration</h2>
                <Card className="bg-white border-gray-200 shadow-md">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <Label className="text-sm font-medium text-gray-700">DNS Servers</Label>
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
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}

                      <div className="flex gap-2">
                        <Button variant="outline" onClick={addDnsServer}>
                          Add DNS Server
                        </Button>
                        <Button className="bg-blue-500 hover:bg-blue-600">Apply DNS Settings</Button>
                      </div>

                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm text-blue-800">
                          <strong>Quick DNS Presets:</strong>
                          <div className="mt-2 space-x-2">
                            <Button variant="outline" size="sm" onClick={() => setDnsServers(["8.8.8.8", "8.8.4.4"])}>
                              Google DNS
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setDnsServers(["1.1.1.1", "1.0.0.1"])}>
                              Cloudflare DNS
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDnsServers(["208.67.222.222", "208.67.220.220"])}
                            >
                              OpenDNS
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
              <h1 className="text-4xl font-bold mb-8 text-gray-800">Audio Monitor</h1>

              {/* Audio Device Status Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-6 text-gray-700">Device Status</h2>
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
                        Microphone
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
                        Output
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
                        Quality
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
                        Latency
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
                <h2 className="text-2xl font-semibold mb-6 text-gray-700">Real-time Audio Levels</h2>
                <Card className="bg-white border-gray-200 shadow-md">
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <AudioLevelMeter level={micLevel} label="Microphone Input" />
                      <AudioLevelMeter level={outputLevel} label="Speaker Output" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Audio Controls */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-6 text-gray-700">Audio Controls</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Microphone Controls */}
                  <Card className="bg-white border-gray-200 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Mic className="w-5 h-5" />
                        Microphone Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-gray-700">Enable Microphone</Label>
                        <Button
                          variant={micEnabled ? "default" : "outline"}
                          size="sm"
                          onClick={() => setMicEnabled(!micEnabled)}
                          className={micEnabled ? "bg-green-500 hover:bg-green-600" : ""}
                        >
                          {micEnabled ? "Enabled" : "Disabled"}
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Microphone Volume: {micVolume[0]}%</Label>
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
                        <Label className="text-sm font-medium text-gray-700">Input Device</Label>
                        <select
                          value={selectedMicDevice}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedMicDevice(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option>Default Microphone</option>
                          <option>USB Microphone (Blue Yeti)</option>
                          <option>Headset Microphone</option>
                          <option>Built-in Microphone</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Output Controls */}
                  <Card className="bg-white border-gray-200 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Speaker className="w-5 h-5" />
                        Output Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Master Volume: {outputVolume[0]}%</Label>
                        <Slider
                          value={outputVolume}
                          onValueChange={setOutputVolume}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Output Device</Label>
                        <select
                          value={selectedOutputDevice}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedOutputDevice(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option>Default Speakers</option>
                          <option>Headphones (Realtek Audio)</option>
                          <option>USB Speakers</option>
                          <option>Bluetooth Headphones</option>
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          Test Audio
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          <Settings className="w-4 h-4 mr-1" />
                          Advanced
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Audio Applications */}
              <div>
                <h2 className="text-2xl font-semibold mb-6 text-gray-700">Active Audio Applications</h2>
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
              <h1 className="text-4xl font-bold mb-8 text-gray-800">Hotkey Manager</h1>

              {/* Hotkey Statistics */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-6 text-gray-700">Hotkey Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-white border-gray-200 shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Keyboard className="w-4 h-4" />
                        Custom Hotkeys
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
                        System Hotkeys
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
                        App Hotkeys
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
                        Conflicts
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
                <h2 className="text-2xl font-semibold mb-6 text-gray-700">Create New Hotkey</h2>
                <Card className="bg-white border-gray-200 shadow-md">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Hotkey Combination</Label>
                        <HotkeyCapture currentHotkey={newHotkey} onCapture={setNewHotkey} />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Action Description</Label>
                        <Input
                          value={newHotkeyAction}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setNewHotkeyAction(e.target.value)}
                          placeholder="Enter action description"
                        />
                      </div>
                      <Button
                        onClick={addCustomHotkey}
                        disabled={!newHotkey || !newHotkeyAction}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Hotkey
                      </Button>
                    </div>
                    {newHotkey && checkHotkeyConflict(newHotkey) && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-700">
                          Warning: This hotkey conflicts with existing bindings
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Custom Hotkeys */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-6 text-gray-700">Custom Hotkeys</h2>
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
                          No custom hotkeys configured. Create one above to get started.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* System Hotkeys */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-6 text-gray-700">System Hotkeys</h2>
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
                <h2 className="text-2xl font-semibold mb-6 text-gray-700">Application Hotkeys</h2>
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
              <h1 className="text-3xl font-bold mb-6 text-gray-800">Disk Management</h1>

              {/* Disk Overview Section */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Storage Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-500 mb-1">Total Storage</div>
                      <div className="text-2xl font-bold text-gray-800">3TB</div>
                      <div className="text-xs text-gray-600">Available Space</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-500 mb-1">Used Space</div>
                      <div className="text-2xl font-bold text-blue-600">1.2TB</div>
                      <div className="text-xs text-gray-600">40% Utilized</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-500 mb-1">Free Space</div>
                      <div className="text-2xl font-bold text-green-600">1.8TB</div>
                      <div className="text-xs text-gray-600">60% Available</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-500 mb-1">Active Drives</div>
                      <div className="text-2xl font-bold text-gray-800">3</div>
                      <div className="text-xs text-gray-600">All Healthy</div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Individual Drives Section */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Drive Details</h2>
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
                          <div className="text-xs text-gray-500 mb-1">Capacity</div>
                          <div className="text-sm font-semibold text-gray-800">1TB (931GB)</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Used Space</div>
                          <div className="text-sm font-semibold text-gray-800">650GB (70%)</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Free Space</div>
                          <div className="text-sm font-semibold text-gray-800">281GB (30%)</div>
                        </div>
                      </div>

                      {/* Usage Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Disk Usage</span>
                          <span>70%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: "70%" }}></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <div className="text-gray-500">Interface</div>
                          <div className="font-medium">NVMe PCIe 4.0</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Read Speed</div>
                          <div className="font-medium">7,000 MB/s</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Write Speed</div>
                          <div className="font-medium">5,100 MB/s</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Temperature</div>
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
                          <div className="text-xs text-gray-500 mb-1">Capacity</div>
                          <div className="text-sm font-semibold text-gray-800">2TB (1.86TB)</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Used Space</div>
                          <div className="text-sm font-semibold text-gray-800">580GB (30%)</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Free Space</div>
                          <div className="text-sm font-semibold text-gray-800">1.28TB (70%)</div>
                        </div>
                      </div>

                      {/* Usage Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Disk Usage</span>
                          <span>30%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{ width: "30%" }}></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <div className="text-gray-500">Interface</div>
                          <div className="font-medium">SATA III</div>
                        </div>
                        <div>
                          <div className="text-gray-500">RPM</div>
                          <div className="font-medium">7,200 RPM</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Cache</div>
                          <div className="font-medium">256MB</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Temperature</div>
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
                          <div className="text-gray-500">Interface</div>
                          <div className="font-medium">USB 3.2</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Read Speed</div>
                          <div className="font-medium">1,050 MB/s</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Write Speed</div>
                          <div className="font-medium">1,000 MB/s</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Status</div>
                          <div className="font-medium text-blue-600">Removable</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Disk Performance & Tools */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Performance & Tools</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Performance Metrics */}
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-800">Real-time Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Read Activity</div>
                          <div className="text-lg font-bold text-blue-600">25 MB/s</div>
                          <div className="text-xs text-gray-600">Current</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Write Activity</div>
                          <div className="text-lg font-bold text-green-600">12 MB/s</div>
                          <div className="text-xs text-gray-600">Current</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Queue Length</div>
                          <div className="text-lg font-bold text-gray-800">2.1</div>
                          <div className="text-xs text-gray-600">Average</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Response Time</div>
                          <div className="text-lg font-bold text-yellow-600">8ms</div>
                          <div className="text-xs text-gray-600">Average</div>
                        </div>
                      </div>

                      <div className="pt-4">
                        <div className="text-xs text-gray-500 mb-2">Disk Activity (Last 60s)</div>
                        <div className="h-16">
                          <MiniChart data={diskData} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Disk Tools */}
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-800">Disk Management Tools</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-3">
                        <Button variant="outline" className="justify-start h-auto p-4 bg-transparent">
                          <div className="text-left">
                            <div className="font-medium">Disk Cleanup</div>
                            <div className="text-xs text-gray-500">Remove temporary files and free up space</div>
                          </div>
                        </Button>

                        <Button variant="outline" className="justify-start h-auto p-4 bg-transparent">
                          <div className="text-left">
                            <div className="font-medium">Defragment Drives</div>
                            <div className="text-xs text-gray-500">Optimize drive performance (HDD only)</div>
                          </div>
                        </Button>

                        <Button variant="outline" className="justify-start h-auto p-4 bg-transparent">
                          <div className="text-left">
                            <div className="font-medium">Check Disk Health</div>
                            <div className="text-xs text-gray-500">Run SMART diagnostics and health check</div>
                          </div>
                        </Button>

                        <Button variant="outline" className="justify-start h-auto p-4 bg-transparent">
                          <div className="text-left">
                            <div className="font-medium">Disk Properties</div>
                            <div className="text-xs text-gray-500">View detailed drive information</div>
                          </div>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Storage Analysis */}
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Storage Analysis</h2>
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-2">450GB</div>
                        <div className="text-sm text-gray-600 mb-1">System Files</div>
                        <div className="text-xs text-gray-500">Windows, Programs, Updates</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 mb-2">320GB</div>
                        <div className="text-sm text-gray-600 mb-1">Documents</div>
                        <div className="text-xs text-gray-500">Photos, Videos, Files</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600 mb-2">180GB</div>
                        <div className="text-sm text-gray-600 mb-1">Applications</div>
                        <div className="text-xs text-gray-500">Installed Programs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600 mb-2">85GB</div>
                        <div className="text-sm text-gray-600 mb-1">Temporary</div>
                        <div className="text-xs text-gray-500">Cache, Temp Files</div>
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
              <h1 className="text-3xl font-bold mb-6 text-gray-800">Application Settings</h1>

              {/* General Settings Section */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">General Settings</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Language & Display */}
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-800">Language & Display</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Language</Label>
                        <select
                          value={language}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) => setLanguage(e.target.value)}
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
                        <Label className="text-sm font-medium text-gray-700">Font Size: {fontSize[0]}px</Label>
                        <Slider
                          value={fontSize}
                          onValueChange={setFontSize}
                          min={10}
                          max={24}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Small (10px)</span>
                          <span>Medium (14px)</span>
                          <span>Large (24px)</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Theme</Label>
                        <select
                          value={theme}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) => setTheme(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option>Light</option>
                          <option>Dark</option>
                          <option>Auto (System)</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Application Behavior */}
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-800">Application Behavior</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Start with Windows</Label>
                          <div className="text-xs text-gray-500">Launch automatically when system starts</div>
                        </div>
                        <Button
                          variant={autoStart ? "default" : "outline"}
                          size="sm"
                          onClick={() => setAutoStart(!autoStart)}
                          className={autoStart ? "bg-blue-500 hover:bg-blue-600" : ""}
                        >
                          {autoStart ? "Enabled" : "Disabled"}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Minimize to System Tray</Label>
                          <div className="text-xs text-gray-500">Hide in system tray when minimized</div>
                        </div>
                        <Button
                          variant={minimizeToTray ? "default" : "outline"}
                          size="sm"
                          onClick={() => setMinimizeToTray(!minimizeToTray)}
                          className={minimizeToTray ? "bg-blue-500 hover:bg-blue-600" : ""}
                        >
                          {minimizeToTray ? "Enabled" : "Disabled"}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Show Notifications</Label>
                          <div className="text-xs text-gray-500">Display system alerts and warnings</div>
                        </div>
                        <Button
                          variant={showNotifications ? "default" : "outline"}
                          size="sm"
                          onClick={() => setShowNotifications(!showNotifications)}
                          className={showNotifications ? "bg-blue-500 hover:bg-blue-600" : ""}
                        >
                          {showNotifications ? "Enabled" : "Disabled"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Performance Settings Section */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Performance & Monitoring</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Update Settings */}
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-800">Update Frequency</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Refresh Rate: {updateFrequency[0]}ms
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
                          <span>Fast (250ms)</span>
                          <span>Normal (1s)</span>
                          <span>Slow (5s)</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Data Retention: {dataRetention[0]} days
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
                          <span>1 day</span>
                          <span>7 days</span>
                          <span>30 days</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Temperature Unit</Label>
                        <select
                          value={temperatureUnit}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) => setTemperatureUnit(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option>Celsius (°C)</option>
                          <option>Fahrenheit (°F)</option>
                          <option>Kelvin (K)</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Alert Settings */}
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-800">Alert Thresholds</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium text-gray-700">CPU Usage Alert</Label>
                          <div className="text-sm text-gray-600">85%</div>
                        </div>
                        <Slider value={[85]} max={100} step={5} className="w-full" />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium text-gray-700">Memory Usage Alert</Label>
                          <div className="text-sm text-gray-600">90%</div>
                        </div>
                        <Slider value={[90]} max={100} step={5} className="w-full" />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium text-gray-700">Disk Space Alert</Label>
                          <div className="text-sm text-gray-600">95%</div>
                        </div>
                        <Slider value={[95]} max={100} step={5} className="w-full" />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium text-gray-700">Temperature Alert</Label>
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
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Advanced Settings</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Data Export */}
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-800">Data Management</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <div className="text-left">
                            <div className="font-medium">Export Performance Data</div>
                            <div className="text-xs text-gray-500">Save monitoring data to CSV file</div>
                          </div>
                        </Button>

                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <div className="text-left">
                            <div className="font-medium">Import Settings</div>
                            <div className="text-xs text-gray-500">Load configuration from backup file</div>
                          </div>
                        </Button>

                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <div className="text-left">
                            <div className="font-medium">Export Settings</div>
                            <div className="text-xs text-gray-500">Save current configuration as backup</div>
                          </div>
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full justify-start text-red-600 hover:text-red-700 bg-transparent"
                        >
                          <div className="text-left">
                            <div className="font-medium">Clear All Data</div>
                            <div className="text-xs text-gray-500">Remove all stored performance data</div>
                          </div>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* System Integration */}
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-800">System Integration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <div className="text-left">
                            <div className="font-medium">Windows Performance Toolkit</div>
                            <div className="text-xs text-gray-500">Enable advanced system monitoring</div>
                          </div>
                        </Button>

                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <div className="text-left">
                            <div className="font-medium">Hardware Monitoring</div>
                            <div className="text-xs text-gray-500">Access sensor data and temperatures</div>
                          </div>
                        </Button>

                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <div className="text-left">
                            <div className="font-medium">Registry Monitoring</div>
                            <div className="text-xs text-gray-500">Track system configuration changes</div>
                          </div>
                        </Button>

                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <div className="text-left">
                            <div className="font-medium">Service Management</div>
                            <div className="text-xs text-gray-500">Monitor and control Windows services</div>
                          </div>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* About & Support Section */}
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-700">About & Support</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Application Info */}
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-800">Application Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Version</span>
                          <span className="text-sm font-medium">2.1.4</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Build Date</span>
                          <span className="text-sm font-medium">2024-01-15</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">License</span>
                          <span className="text-sm font-medium">MIT License</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Platform</span>
                          <span className="text-sm font-medium">Windows 11</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <Button className="w-full bg-blue-500 hover:bg-blue-600">Check for Updates</Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Support & Help */}
                  <Card className="bg-white border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-800">Support & Help</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <div className="text-left">
                            <div className="font-medium">User Manual</div>
                            <div className="text-xs text-gray-500">Complete guide and documentation</div>
                          </div>
                        </Button>

                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <div className="text-left">
                            <div className="font-medium">Keyboard Shortcuts</div>
                            <div className="text-xs text-gray-500">View all available hotkeys</div>
                          </div>
                        </Button>

                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <div className="text-left">
                            <div className="font-medium">Report Issue</div>
                            <div className="text-xs text-gray-500">Submit bug reports and feedback</div>
                          </div>
                        </Button>

                        <Button variant="outline" className="w-full justify-start bg-transparent">
                          <div className="text-left">
                            <div className="font-medium">Reset to Defaults</div>
                            <div className="text-xs text-gray-500">Restore all settings to default values</div>
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
