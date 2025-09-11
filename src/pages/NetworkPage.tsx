import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, ChangeEvent } from "react"
import { Wifi, Server, Globe, Zap, Plus, AlertTriangle } from "lucide-react"
import { useTranslation } from 'react-i18next'

export default function NetworkPage() {
  const { t } = useTranslation();
  const [pingTarget, setPingTarget] = useState("google.com")
  const [pingResult, setPingResult] = useState<string | null>(null)
  const [proxyEnabled, setProxyEnabled] = useState(false)
  const [proxyHost, setProxyHost] = useState("127.0.0.1")
  const [proxyPort, setProxyPort] = useState("8080")
  const [dnsServers, setDnsServers] = useState(["8.8.8.8", "8.8.4.4"])
  const [networkStatus, setNetworkStatus] = useState({
    is_connected: true,
    local_ip: "192.168.1.100",
    public_ip: "203.0.113.25"
  })

  const handlePing = async () => {
    setPingResult("Pinging...")
    // 模拟ping操作
    setTimeout(() => {
      setPingResult(`Reply from ${pingTarget}: bytes=32 time=42ms TTL=128`)
    }, 1000)
  }

  const addDnsServer = () => {
    setDnsServers(prev => [...prev, ""])
  }

  const updateDnsServer = (index: number, value: string) => {
    setDnsServers(prev => {
      const newServers = [...prev]
      newServers[index] = value
      return newServers
    })
  }

  const removeDnsServer = (index: number) => {
    setDnsServers(prev => prev.filter((_, i) => i !== index))
  }

  return (
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
              <div className={`text-2xl font-bold mb-2 ${networkStatus?.is_connected ? 'text-green-600' : 'text-red-500'}`}>
                {networkStatus?.is_connected ? 'Connected' : 'Disconnected'}
              </div>
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
              <div className="text-lg font-bold text-gray-800 mb-2">
                {networkStatus?.local_ip || 'N/A'}
              </div>
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
              <div className="text-lg font-bold text-gray-800 mb-2">
                {networkStatus?.public_ip || 'N/A'}
              </div>
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
                    <Button variant="outline" size="sm" onClick={() => setDnsServers(["8.8.8.8", "8.8.4.4"])}>{t('network.googleDNS')}</Button>
                    <Button variant="outline" size="sm" onClick={() => setDnsServers(["1.1.1.1", "1.0.0.1"])}>{t('network.cloudflareDNS')}</Button>
                    <Button variant="outline" size="sm" onClick={() => setDnsServers(["208.67.222.222", "208.67.220.220"])}>{t('network.openDNS')}</Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}