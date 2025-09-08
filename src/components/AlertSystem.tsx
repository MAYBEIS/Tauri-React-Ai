import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { SystemMonitorAPI, AlertConfiguration, AlertHistory, AlertMetric, AlertCondition, AlertSeverity, NotificationMethod } from '../lib/api';

const AlertSystem: React.FC = () => {
  const [alertConfigurations, setAlertConfigurations] = useState<AlertConfiguration[]>([]);
  const [alertHistory, setAlertHistory] = useState<AlertHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('configurations');
  const [historyLimit, setHistoryLimit] = useState<number>(100);
  const [historyOffset, setHistoryOffset] = useState<number>(0);
  
  // 表单状态
  const [formData, setFormData] = useState<Partial<AlertConfiguration>>({
    id: '',
    metric: AlertMetric.CpuUsage,
    condition: AlertCondition.GreaterThan,
    threshold: 80,
    severity: AlertSeverity.Medium,
    enabled: true,
    notification_methods: [NotificationMethod.Visual]
  });
  
  // 编辑状态
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string>('');

  // 获取警报配置列表
  const fetchAlertConfigurations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await SystemMonitorAPI.getAlertConfigurations();
      setAlertConfigurations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取警报配置列表失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 获取警报历史
  const fetchAlertHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await SystemMonitorAPI.getAlertHistory(historyLimit, historyOffset);
      setAlertHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取警报历史失败');
    } finally {
      setIsLoading(false);
    }
  }, [historyLimit, historyOffset]);

  // 添加或更新警报配置
  const saveAlertConfiguration = useCallback(async () => {
    if (!formData.metric || !formData.condition || formData.threshold === undefined) {
      setError('请填写所有必填字段');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const config: AlertConfiguration = {
        id: isEditing ? editingId : `alert-${Date.now()}`,
        metric: formData.metric!,
        condition: formData.condition!,
        threshold: formData.threshold!,
        severity: formData.severity!,
        enabled: formData.enabled!,
        notification_methods: formData.notification_methods!
      };
      
      if (isEditing) {
        await SystemMonitorAPI.updateAlertConfiguration(editingId, config);
        setSuccess('警报配置更新成功');
      } else {
        const id = await SystemMonitorAPI.addAlertConfiguration(config);
        setSuccess('警报配置添加成功');
      }
      
      // 重置表单
      setFormData({
        id: '',
        metric: AlertMetric.CpuUsage,
        condition: AlertCondition.GreaterThan,
        threshold: 80,
        severity: AlertSeverity.Medium,
        enabled: true,
        notification_methods: [NotificationMethod.Visual]
      });
      
      setIsEditing(false);
      setEditingId('');
      
      // 刷新列表
      fetchAlertConfigurations();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存警报配置失败');
    } finally {
      setIsLoading(false);
    }
  }, [formData, isEditing, editingId, fetchAlertConfigurations]);

  // 删除警报配置
  const deleteAlertConfiguration = useCallback(async (id: string) => {
    if (!window.confirm('确定要删除此警报配置吗？')) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await SystemMonitorAPI.deleteAlertConfiguration(id);
      setSuccess('警报配置删除成功');
      
      // 刷新列表
      fetchAlertConfigurations();
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除警报配置失败');
    } finally {
      setIsLoading(false);
    }
  }, [fetchAlertConfigurations]);

  // 编辑警报配置
  const editAlertConfiguration = useCallback((config: AlertConfiguration) => {
    setFormData(config);
    setIsEditing(true);
    setEditingId(config.id);
  }, []);

  // 确认警报
  const acknowledgeAlert = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await SystemMonitorAPI.acknowledgeAlert(id, 'user');
      setSuccess('警报已确认');
      
      // 刷新历史
      fetchAlertHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : '确认警报失败');
    } finally {
      setIsLoading(false);
    }
  }, [fetchAlertHistory]);

  // 格式化严重程度
  const formatSeverity = (severity: AlertSeverity): string => {
    switch (severity) {
      case AlertSeverity.Low: return '低';
      case AlertSeverity.Medium: return '中';
      case AlertSeverity.High: return '高';
      case AlertSeverity.Critical: return '严重';
      default: return '未知';
    }
  };

  // 获取严重程度颜色
  const getSeverityColor = (severity: AlertSeverity): "default" | "secondary" | "outline" | "destructive" => {
    switch (severity) {
      case AlertSeverity.Low: return 'default';
      case AlertSeverity.Medium: return 'secondary';
      case AlertSeverity.High: return 'outline';
      case AlertSeverity.Critical: return 'destructive';
      default: return 'default';
    }
  };

  // 格式化指标
  const formatMetric = (metric: AlertMetric): string => {
    switch (metric) {
      case AlertMetric.CpuUsage: return 'CPU使用率';
      case AlertMetric.MemoryUsage: return '内存使用率';
      case AlertMetric.DiskUsage: return '磁盘使用率';
      case AlertMetric.NetworkTraffic: return '网络流量';
      default: return '未知';
    }
  };

  // 格式化条件
  const formatCondition = (condition: AlertCondition): string => {
    switch (condition) {
      case AlertCondition.GreaterThan: return '大于';
      case AlertCondition.LessThan: return '小于';
      case AlertCondition.Equals: return '等于';
      default: return '未知';
    }
  };

  // 格式化通知方式
  const formatNotificationMethod = (method: NotificationMethod): string => {
    switch (method) {
      case NotificationMethod.Visual: return '视觉通知';
      case NotificationMethod.Sound: return '声音通知';
      case NotificationMethod.SystemTray: return '系统托盘';
      default: return '未知';
    }
  };

  // 初始化获取警报配置列表
  useEffect(() => {
    fetchAlertConfigurations();
  }, [fetchAlertConfigurations]);

  // 当切换到历史标签页时获取警报历史
  useEffect(() => {
    if (activeTab === 'history') {
      fetchAlertHistory();
    }
  }, [activeTab, fetchAlertHistory]);

  // 处理表单字段变化
  const handleFieldChange = (field: keyof AlertConfiguration, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 处理通知方式变化
  const handleNotificationMethodChange = (method: NotificationMethod, checked: boolean) => {
    const currentMethods = formData.notification_methods || [];
    let newMethods;
    
    if (checked) {
      newMethods = [...currentMethods, method];
    } else {
      newMethods = currentMethods.filter(m => m !== method);
    }
    
    setFormData(prev => ({
      ...prev,
      notification_methods: newMethods
    }));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 错误和成功提示 */}
      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="configurations">警报配置</TabsTrigger>
          <TabsTrigger value="history">警报历史</TabsTrigger>
        </TabsList>
        
        {/* 警报配置标签页 */}
        <TabsContent value="configurations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 配置表单 */}
            <Card>
              <CardHeader>
                <CardTitle>{isEditing ? '编辑警报配置' : '添加警报配置'}</CardTitle>
                <CardDescription>
                  {isEditing ? '修改现有警报配置' : '创建新的警报配置'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metric">监控指标</Label>
                  <Select
                    value={formData.metric}
                    onValueChange={(value) => handleFieldChange('metric', value as AlertMetric)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择监控指标" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={AlertMetric.CpuUsage}>{formatMetric(AlertMetric.CpuUsage)}</SelectItem>
                      <SelectItem value={AlertMetric.MemoryUsage}>{formatMetric(AlertMetric.MemoryUsage)}</SelectItem>
                      <SelectItem value={AlertMetric.DiskUsage}>{formatMetric(AlertMetric.DiskUsage)}</SelectItem>
                      <SelectItem value={AlertMetric.NetworkTraffic}>{formatMetric(AlertMetric.NetworkTraffic)}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="condition">触发条件</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value) => handleFieldChange('condition', value as AlertCondition)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择触发条件" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={AlertCondition.GreaterThan}>{formatCondition(AlertCondition.GreaterThan)}</SelectItem>
                      <SelectItem value={AlertCondition.LessThan}>{formatCondition(AlertCondition.LessThan)}</SelectItem>
                      <SelectItem value={AlertCondition.Equals}>{formatCondition(AlertCondition.Equals)}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="threshold">阈值</Label>
                  <Input
                    id="threshold"
                    type="number"
                    value={formData.threshold}
                    onChange={(e) => handleFieldChange('threshold', parseFloat(e.target.value))}
                    placeholder="输入阈值"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="severity">严重程度</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value) => handleFieldChange('severity', value as AlertSeverity)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择严重程度" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={AlertSeverity.Low}>{formatSeverity(AlertSeverity.Low)}</SelectItem>
                      <SelectItem value={AlertSeverity.Medium}>{formatSeverity(AlertSeverity.Medium)}</SelectItem>
                      <SelectItem value={AlertSeverity.High}>{formatSeverity(AlertSeverity.High)}</SelectItem>
                      <SelectItem value={AlertSeverity.Critical}>{formatSeverity(AlertSeverity.Critical)}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    checked={formData.enabled}
                    onCheckedChange={(checked) => handleFieldChange('enabled', checked)}
                  />
                  <Label htmlFor="enabled">启用警报</Label>
                </div>
                
                <div className="space-y-2">
                  <Label>通知方式</Label>
                  <div className="flex flex-wrap gap-4">
                    {Object.values(NotificationMethod).map((method) => (
                      <div key={method} className="flex items-center space-x-2">
                        <Switch
                          id={`notification-${method}`}
                          checked={(formData.notification_methods || []).includes(method)}
                          onCheckedChange={(checked) => handleNotificationMethodChange(method, checked)}
                        />
                        <Label htmlFor={`notification-${method}`}>
                          {formatNotificationMethod(method)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button onClick={saveAlertConfiguration} disabled={isLoading}>
                    {isLoading ? '保存中...' : (isEditing ? '更新配置' : '添加配置')}
                  </Button>
                  
                  {isEditing && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setEditingId('');
                        setFormData({
                          id: '',
                          metric: AlertMetric.CpuUsage,
                          condition: AlertCondition.GreaterThan,
                          threshold: 80,
                          severity: AlertSeverity.Medium,
                          enabled: true,
                          notification_methods: [NotificationMethod.Visual]
                        });
                      }}
                    >
                      取消编辑
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* 配置列表 */}
            <Card>
              <CardHeader>
                <CardTitle>警报配置列表</CardTitle>
                <CardDescription>
                  显示 {alertConfigurations.length} 个警报配置
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>监控指标</TableHead>
                        <TableHead>条件</TableHead>
                        <TableHead>阈值</TableHead>
                        <TableHead>严重程度</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alertConfigurations.map((config) => (
                        <TableRow key={config.id}>
                          <TableCell>{formatMetric(config.metric)}</TableCell>
                          <TableCell>{formatCondition(config.condition)}</TableCell>
                          <TableCell>{config.threshold}</TableCell>
                          <TableCell>
                            <Badge variant={getSeverityColor(config.severity)}>
                              {formatSeverity(config.severity)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={config.enabled ? 'default' : 'secondary'}>
                              {config.enabled ? '启用' : '禁用'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => editAlertConfiguration(config)}
                              >
                                编辑
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteAlertConfiguration(config.id)}
                              >
                                删除
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                {alertConfigurations.length === 0 && !isLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    没有找到警报配置
                  </div>
                )}
                
                {isLoading && (
                  <div className="text-center py-8 text-muted-foreground">
                    加载警报配置列表中...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* 警报历史标签页 */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>警报历史</CardTitle>
                  <CardDescription>
                    显示 {alertHistory.length} 条警报记录
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Select
                    value={historyLimit.toString()}
                    onValueChange={(value) => setHistoryLimit(Number(value))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10条</SelectItem>
                      <SelectItem value="50">50条</SelectItem>
                      <SelectItem value="100">100条</SelectItem>
                      <SelectItem value="200">200条</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button onClick={fetchAlertHistory} disabled={isLoading}>
                    {isLoading ? '刷新中...' : '刷新'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>时间</TableHead>
                      <TableHead>警报ID</TableHead>
                      <TableHead>消息</TableHead>
                      <TableHead>数值</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertHistory.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>
                          {new Date(alert.triggered_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {alert.alert_id.substring(0, 8)}...
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {alert.message}
                        </TableCell>
                        <TableCell>{alert.value}</TableCell>
                        <TableCell>
                          <Badge variant={alert.acknowledged ? 'default' : 'destructive'}>
                            {alert.acknowledged ? '已确认' : '未确认'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {!alert.acknowledged && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => acknowledgeAlert(alert.id)}
                            >
                              确认
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {alertHistory.length === 0 && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  没有找到警报历史记录
                </div>
              )}
              
              {isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  加载警报历史记录中...
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AlertSystem;