import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { useState, useEffect, ChangeEvent, useRef } from "react"
import { Keyboard, Settings, Monitor, AlertTriangle, CheckCircle, Plus, Trash2, Edit3 } from "lucide-react"
import { useTranslation } from 'react-i18next'

// Hotkey capture component
const HotkeyCapture = ({ onCapture, currentHotkey }: { onCapture: (hotkey: string) => void; currentHotkey: string }) => {
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

    const handleKeyUp = (_e: KeyboardEvent) => {
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

export default function HotkeysPage() {
  const { t } = useTranslation();
  const [customHotkeys, setCustomHotkeys] = useState([
    { id: 1, hotkey: "Ctrl + Shift + T", action: "Open Task Manager", enabled: true },
    { id: 2, hotkey: "Ctrl + Alt + L", action: "Lock Screen", enabled: true },
    { id: 3, hotkey: "Win + Shift + S", action: "Screenshot Tool", enabled: false },
  ])
  const [newHotkeyAction, setNewHotkeyAction] = useState("")
  const [newHotkey, setNewHotkey] = useState("")
  const [editingHotkey, setEditingHotkey] = useState<number | null>(null)

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

  const addCustomHotkey = () => {
    if (newHotkey && newHotkeyAction) {
      const newId = Math.max(...customHotkeys.map((h) => h.id), 0) + 1
      setCustomHotkeys(prev => [
        ...prev,
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
    setCustomHotkeys(prev => prev.filter((h) => h.id !== id))
  }

  const toggleHotkey = (id: number) => {
    setCustomHotkeys(prev => prev.map((h) => (h.id === id ? { ...h, enabled: !h.enabled } : h)))
  }

  const updateHotkey = (id: number, hotkey: string, action: string) => {
    setCustomHotkeys(prev => prev.map((h) => (h.id === id ? { ...h, hotkey, action } : h)))
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
  )
}