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
import { SystemMonitorAPI, NetworkConnectionInfo, NetworkDiagnosticsResult, NetworkHop } from '../lib/api';

const NetworkDiagnostics: React.FC = () => {
  const [connections, setConnections] = useState<NetworkConnectionInfo[]>([]);
  const [pingResult, setPingResult] = useState<NetworkDiagnosticsResult | null>(null);
  const [tracerouteResult, setTracerouteResult] = useState<NetworkDiagnosticsResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pingHost, setPingHost] = useState<string>('8.8.8.8');
  const [pingCount, setPingCount] = useState<number>(4);
  const [tracerouteHost, setTracerouteHost] = useState<string>('8.8.8.8');
  const [refreshInterval, setRefreshInterval] = useState<number>(10000);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [connectionFilter, setConnectionFilter] = useState<string>('all');

  // 获取网络连接列表
  const fetchConnections = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await SystemMonitorAPI.getNetworkConnections();
      setConnections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取网络连接列表失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 执行Ping诊断
  const executePing = useCallback(async () => {
    if (!pingHost.trim()) {
      setError('请输入有效的主机名或IP地址');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await SystemMonitorAPI.diagnoseNetworkPing(pingHost, pingCount);
      setPingResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '执行Ping诊断失败');
    } finally {
      setIsLoading(false);
    }
  }, [pingHost, pingCount]);

  // 执行Traceroute诊断
  const executeTraceroute = useCallback(async () => {
    if (!tracerouteHost.trim()) {
      setError('请输入有效的主机名或IP地址');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await SystemMonitorAPI.diagnoseNetworkTraceroute(tracerouteHost);
      setTracerouteResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '执行Traceroute诊断失败');
    } finally {
      setIsLoading(false);
    }
  }, [tracerouteHost]);

  // 过滤连接
  const filteredConnections = connections.filter(connection => {
    if (connectionFilter === 'all') return true;
    if (connectionFilter === 'tcp') return connection.protocol.toLowerCase() === 'tcp';
    if (connectionFilter === 'udp') return connection.protocol.toLowerCase() === 'udp';
    if (connectionFilter === 'listening') return connection.state.toLowerCase().includes('listen');
    if (connectionFilter === 'established') return connection.state.toLowerCase().includes('establish');
    return true;
  });

  // 格式化协议
  const formatProtocol = (protocol: string): string => {
    return protocol.toUpperCase();
  };

  // 格式化状态
  const formatState = (state: string): string => {
    return state.charAt(0).toUpperCase() + state.slice(1).toLowerCase();
  };

  // 获取状态颜色
  const getStateColor = (state: string): "default" | "secondary" | "destructive" | "outline" => {
    const lowerState = state.toLowerCase();
    if (lowerState.includes('listen')) return 'default';
    if (lowerState.includes('establish')) return 'default';
    if (lowerState.includes('time_wait')) return 'secondary';
    if (lowerState.includes('close')) return 'destructive';
    return 'outline';
  };

  // 初始化获取网络连接列表
  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // 自动刷新
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (autoRefresh && refreshInterval > 0) {
      intervalId = setInterval(() => {
        fetchConnections();
      }, refreshInterval);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, refreshInterval, fetchConnections]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 控制面板 */}
      <Card>
        <CardHeader>
          <CardTitle>网络诊断工具</CardTitle>
          <CardDescription>查看网络连接状态并执行网络诊断</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <Button onClick={fetchConnections} disabled={isLoading}>
              {isLoading ? '加载中...' : '刷新连接列表'}
            </Button>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="auto-refresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="auto-refresh">自动刷新</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <span>刷新间隔:</span>
              <Select
                value={refreshInterval.toString()}
                onValueChange={(value) => setRefreshInterval(Number(value))}
                disabled={autoRefresh}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5000">5秒</SelectItem>
                  <SelectItem value="10000">10秒</SelectItem>
                  <SelectItem value="30000">30秒</SelectItem>
                  <SelectItem value="60000">60秒</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <span>连接过滤:</span>
              <Select
                value={connectionFilter}
                onValueChange={(value) => setConnectionFilter(value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="tcp">TCP</SelectItem>
                  <SelectItem value="udp">UDP</SelectItem>
                  <SelectItem value="listening">监听中</SelectItem>
                  <SelectItem value="established">已建立</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 错误提示 */}
      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="connections" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connections">网络连接</TabsTrigger>
          <TabsTrigger value="ping">Ping诊断</TabsTrigger>
          <TabsTrigger value="traceroute">Traceroute诊断</TabsTrigger>
        </TabsList>
        
        {/* 网络连接标签页 */}
        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>网络连接列表</CardTitle>
              <CardDescription>
                显示 {filteredConnections.length} 个网络连接
                {autoRefresh && ` (自动刷新: ${refreshInterval / 1000}秒)`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>协议</TableHead>
                      <TableHead>本地地址</TableHead>
                      <TableHead>远程地址</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>PID</TableHead>
                      <TableHead>进程</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConnections.map((connection, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge variant="outline">
                            {formatProtocol(connection.protocol)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {connection.local_address}:{connection.local_port}
                        </TableCell>
                        <TableCell>
                          {connection.remote_address && connection.remote_port
                            ? `${connection.remote_address}:${connection.remote_port}`
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStateColor(connection.state)}>
                            {formatState(connection.state)}
                          </Badge>
                        </TableCell>
                        <TableCell>{connection.pid || '-'}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {connection.process_name || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {filteredConnections.length === 0 && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  没有找到符合条件的网络连接
                </div>
              )}
              
              {isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  加载网络连接列表中...
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Ping诊断标签页 */}
        <TabsContent value="ping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ping诊断</CardTitle>
              <CardDescription>测试与目标主机的网络连接</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="主机名或IP地址"
                    value={pingHost}
                    onChange={(e) => setPingHost(e.target.value)}
                  />
                </div>
                
                <div className="w-32">
                  <Select
                    value={pingCount.toString()}
                    onValueChange={(value) => setPingCount(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1次</SelectItem>
                      <SelectItem value="4">4次</SelectItem>
                      <SelectItem value="10">10次</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button onClick={executePing} disabled={isLoading}>
                  {isLoading ? '诊断中...' : '执行Ping'}
                </Button>
              </div>
              
              {pingResult && (
                <div className="mt-4">
                  <div className={`p-4 rounded-md ${pingResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-5 w-5 ${pingResult.success ? 'text-green-400' : 'text-red-400'}`}>
                        {pingResult.success ? '✓' : '✗'}
                      </div>
                      <div className="ml-3">
                        <h3 className={`text-sm font-medium ${pingResult.success ? 'text-green-800' : 'text-red-800'}`}>
                          {pingResult.message}
                        </h3>
                        <div className="mt-2 text-sm">
                          {pingResult.latency_ms !== undefined && (
                            <p>平均延迟: <span className="font-medium">{pingResult.latency_ms.toFixed(2)} ms</span></p>
                          )}
                          {pingResult.packet_loss_percent !== undefined && (
                            <p>丢包率: <span className="font-medium">{pingResult.packet_loss_percent.toFixed(1)}%</span></p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Traceroute诊断标签页 */}
        <TabsContent value="traceroute" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Traceroute诊断</CardTitle>
              <CardDescription>追踪到目标主机的网络路径</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="主机名或IP地址"
                    value={tracerouteHost}
                    onChange={(e) => setTracerouteHost(e.target.value)}
                  />
                </div>
                
                <Button onClick={executeTraceroute} disabled={isLoading}>
                  {isLoading ? '诊断中...' : '执行Traceroute'}
                </Button>
              </div>
              
              {tracerouteResult && (
                <div className="mt-4">
                  <div className={`p-4 rounded-md ${tracerouteResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-5 w-5 ${tracerouteResult.success ? 'text-green-400' : 'text-red-400'}`}>
                        {tracerouteResult.success ? '✓' : '✗'}
                      </div>
                      <div className="ml-3">
                        <h3 className={`text-sm font-medium ${tracerouteResult.success ? 'text-green-800' : 'text-red-800'}`}>
                          {tracerouteResult.message}
                        </h3>
                      </div>
                    </div>
                  </div>
                  
                  {tracerouteResult.hops && tracerouteResult.hops.length > 0 && (
                    <div className="mt-4 rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>跃点</TableHead>
                            <TableHead>地址</TableHead>
                            <TableHead>主机名</TableHead>
                            <TableHead>延迟</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tracerouteResult.hops.map((hop, index) => (
                            <TableRow key={index}>
                              <TableCell>{hop.hop_number}</TableCell>
                              <TableCell>{hop.address}</TableCell>
                              <TableCell>{hop.hostname || '-'}</TableCell>
                              <TableCell>
                                {hop.latency_ms !== undefined
                                  ? `${hop.latency_ms.toFixed(2)} ms`
                                  : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NetworkDiagnostics;