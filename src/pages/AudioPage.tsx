import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { useState, useEffect, ChangeEvent } from "react"
import { Mic, MicOff, Speaker, Headphones, Zap, Settings } from "lucide-react"
import { useTranslation } from 'react-i18next'

// Audio level meter component
const AudioLevelMeter = ({ level, label }: { level: number; label: string }) => {
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

export default function AudioPage() {
  const { t } = useTranslation();
  const [micEnabled, setMicEnabled] = useState(true)
  const [micLevel, setMicLevel] = useState(45)
  const [outputLevel, setOutputLevel] = useState(75)
  const [micVolume, setMicVolume] = useState([80])
  const [outputVolume, setOutputVolume] = useState([65])
  const [selectedMicDevice, setSelectedMicDevice] = useState("Default Microphone")
  const [selectedOutputDevice, setSelectedOutputDevice] = useState("Default Speakers")
  const [audioDevices, setAudioDevices] = useState([
    { name: "Default Microphone", is_input: true, is_default: true },
    { name: "USB Microphone", is_input: true, is_default: false },
    { name: "Default Speakers", is_output: true, is_default: true },
    { name: "Bluetooth Headphones", is_output: true, is_default: false }
  ])

  // 模拟音频数据变化
  useEffect(() => {
    const interval = setInterval(() => {
      if (micEnabled) {
        setMicLevel(prev => prev !== 0 ? Math.floor(Math.random() * 60) + 20 : 0)
      } else {
        setMicLevel(0)
      }
      setOutputLevel(prev => {
        const newValue = Math.floor(Math.random() * 40) + 30;
        return Math.abs(prev - newValue) > 5 ? newValue : prev;
      })
    }, 500)

    return () => clearInterval(interval)
  }, [micEnabled])

  return (
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
              <div className="text-sm text-gray-600">16-bit Stereo</div>
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
              <div className="text-sm text-gray-600">Low Latency</div>
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
                  {audioDevices
                    .filter(device => device.is_input)
                    .map(device => (
                      <option key={device.name} value={device.name}>
                        {device.name} {device.is_default ? '(Default)' : ''}
                      </option>
                    ))}
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
                  {audioDevices
                    .filter(device => device.is_output)
                    .map(device => (
                      <option key={device.name} value={device.name}>
                        {device.name} {device.is_default ? '(Default)' : ''}
                      </option>
                    ))}
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
  )
}