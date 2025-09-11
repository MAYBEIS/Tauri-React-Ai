import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { useState, ChangeEvent } from "react"
import { useTranslation } from 'react-i18next'

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState("中文 (Chinese)")
  const [fontSize, setFontSize] = useState([14])
  const [theme, setTheme] = useState("Light")
  const [autoStart, setAutoStart] = useState(true)
  const [minimizeToTray, setMinimizeToTray] = useState(false)
  const [showNotifications, setShowNotifications] = useState(true)
  const [updateFrequency, setUpdateFrequency] = useState([1000])
  const [temperatureUnit, setTemperatureUnit] = useState("Celsius")
  const [dataRetention, setDataRetention] = useState([7])
  const [systemInfo] = useState({
    os_name: "Windows",
    os_version: "11 Pro",
    kernel_version: "22H2"
  })

  return (
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
                  <span className="text-sm font-medium">
                    {systemInfo ? `${systemInfo.os_name} ${systemInfo.os_version}` : 'Loading...'}
                  </span>
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
  )
}