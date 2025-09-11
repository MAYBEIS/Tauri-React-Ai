"use client"

import { useState } from "react"
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  Monitor,
  Wifi,
  Volume2,
  Keyboard,
  Server,
  Settings,
  Bug,
  Activity,
} from "lucide-react"
import "./App.css"
import { useTranslation } from 'react-i18next'

// 页面组件
import PerformancePage from "@/pages/PerformancePage"
import MonitoringPage from "@/pages/MonitoringPage"
import NetworkPage from "@/pages/NetworkPage"
import AudioPage from "@/pages/AudioPage"
import HotkeysPage from "@/pages/HotkeysPage"
import DiskPage from "@/pages/DiskPage"
import SettingsPage from "@/pages/SettingsPage"
import TestPage from "@/components/TestPage"

// Sidebar 组件
const Sidebar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(location.pathname);

  const navigationItems = [
    { id: "/", label: t('navigation.performance'), icon: BarChart3 },
    { id: "/monitoring", label: t('navigation.monitoring'), icon: Activity },
    { id: "/network", label: t('navigation.network'), icon: Wifi },
    { id: "/audio", label: t('navigation.audio'), icon: Volume2 },
    { id: "/hotkeys", label: t('navigation.hotkeys'), icon: Keyboard },
    { id: "/disk", label: t('navigation.disk'), icon: Server },
    { id: "/settings", label: t('navigation.settings'), icon: Settings },
    { id: "/test", label: "IPC Test", icon: Bug },
  ]

  const handleNavigation = (path: string) => {
    setCurrentPage(path);
    window.history.pushState({}, '', path);
  }

  return (
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
              onClick={() => handleNavigation(item.id)}
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
  )
}

// 主应用组件
const AppContent = () => {
  return (
    <div className="h-screen bg-gray-50 text-gray-900 overflow-hidden">
      <div className="flex h-full">
        <Sidebar />
        <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
          <Routes>
            <Route path="/" element={<PerformancePage />} />
            <Route path="/monitoring" element={<MonitoringPage />} />
            <Route path="/network" element={<NetworkPage />} />
            <Route path="/audio" element={<AudioPage />} />
            <Route path="/hotkeys" element={<HotkeysPage />} />
            <Route path="/disk" element={<DiskPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/test" element={<TestPage />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

// 主应用包装器
export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}
