import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { SystemMonitorAPI, ProcessDetails, ProcessSortOptions } from '../lib/api';

const ProcessManager: React.FC = () => {
  const [processes, setProcesses] = useState<ProcessDetails[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<ProcessDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(5000);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [sortOptions, setSortOptions] = useState<ProcessSortOptions>({
    sort_by: 'cpu',
    sort_order: 'desc',
    filter_name: '',
    filter_user: '',
    min_cpu_usage: undefined,
    max_memory_usage: undefined,
  });
  const [showTerminationDialog, setShowTerminationDialog] = useState<boolean>(false);
  const [terminationPid, setTerminationPid] = useState<string>('');
  const [terminationForce, setTerminationForce] = useState<boolean>(false);
  const [terminationResult, setTerminationResult] = useState<string>('');

  // 获取进程列表
  const fetchProcesses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await SystemMonitorAPI.getProcessesEnhanced(sortOptions);
      setProcesses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取进程列表失败');
    } finally {
      setIsLoading(false);
    }
  }, [sortOptions]);

  // 获取进程详细信息
  const fetchProcessDetails = useCallback(async (pid: string) => {
    try {
      const details = await SystemMonitorAPI.getProcessDetails(pid);
      setSelectedProcess(details);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取进程详细信息失败');
    }
  }, []);

  // 终止进程
  const handleTerminateProcess = useCallback(async () => {
    try {
      const result = await SystemMonitorAPI.terminateProcess(terminationPid, terminationForce);
      setTerminationResult(result);
      setShowTerminationDialog(false);
      
      // 刷新进程列表
      fetchProcesses();
      
      // 3秒后清除结果
      setTimeout(() => setTerminationResult(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '终止进程失败');
    }
  }, [terminationPid, terminationForce, fetchProcesses]);

  // 打开终止进程对话框
  const openTerminationDialog = useCallback((pid: string) => {
    setTerminationPid(pid);
    setTerminationForce(false);
    setShowTerminationDialog(true);
  }, []);

  // 更新排序选项
  const updateSortOption = useCallback((key: keyof ProcessSortOptions, value: any) => {
    setSortOptions(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // 格式化字节大小
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化进程状态
  const formatStatus = (status: string): string => {
    return status.replace('ProcessStatus::', '');
  };

  // 初始化获取进程列表
  useEffect(() => {
    fetchProcesses();
  }, [fetchProcesses]);

  // 自动刷新
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (autoRefresh && refreshInterval > 0) {
      intervalId = setInterval(() => {
        fetchProcesses();
      }, refreshInterval);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, refreshInterval, fetchProcesses]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 控制面板 */}
      <Card>
        <CardHeader>
          <CardTitle>进程管理器</CardTitle>
          <CardDescription>查看和管理系统进程</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <Button onClick={fetchProcesses} disabled={isLoading}>
              {isLoading ? '加载中...' : '刷新进程列表'}
            </Button>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={(checked) => setAutoRefresh(checked as boolean)}
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
                  <SelectItem value="1000">1秒</SelectItem>
                  <SelectItem value="2000">2秒</SelectItem>
                  <SelectItem value="5000">5秒</SelectItem>
                  <SelectItem value="10000">10秒</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* 排序和过滤选项 */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <span className="text-sm font-medium mb-1 block">排序字段</span>
              <Select
                value={sortOptions.sort_by}
                onValueChange={(value) => updateSortOption('sort_by', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">名称</SelectItem>
                  <SelectItem value="cpu">CPU使用率</SelectItem>
                  <SelectItem value="memory">内存使用量</SelectItem>
                  <SelectItem value="pid">PID</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <span className="text-sm font-medium mb-1 block">排序顺序</span>
              <Select
                value={sortOptions.sort_order}
                onValueChange={(value) => updateSortOption('sort_order', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">升序</SelectItem>
                  <SelectItem value="desc">降序</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <span className="text-sm font-medium mb-1 block">名称过滤</span>
              <Input
                placeholder="进程名称"
                value={sortOptions.filter_name || ''}
                onChange={(e) => updateSortOption('filter_name', e.target.value)}
              />
            </div>
            
            <div>
              <span className="text-sm font-medium mb-1 block">用户过滤</span>
              <Input
                placeholder="用户名"
                value={sortOptions.filter_user || ''}
                onChange={(e) => updateSortOption('filter_user', e.target.value)}
              />
            </div>
            
            <div>
              <span className="text-sm font-medium mb-1 block">最小CPU使用率</span>
              <Input
                type="number"
                placeholder="0"
                min="0"
                max="100"
                value={sortOptions.min_cpu_usage?.toString() || ''}
                onChange={(e) => updateSortOption('min_cpu_usage', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>
            
            <div>
              <span className="text-sm font-medium mb-1 block">最大内存使用量</span>
              <Input
                type="number"
                placeholder="0"
                min="0"
                value={sortOptions.max_memory_usage?.toString() || ''}
                onChange={(e) => updateSortOption('max_memory_usage', e.target.value ? Number(e.target.value) : undefined)}
              />
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
      
      {/* 终止进程结果提示 */}
      {terminationResult && (
        <Alert>
          <AlertDescription>{terminationResult}</AlertDescription>
        </Alert>
      )}
      
      {/* 进程列表 */}
      <Card>
        <CardHeader>
          <CardTitle>进程列表</CardTitle>
          <CardDescription>
            显示 {processes.length} 个进程
            {autoRefresh && ` (自动刷新: ${refreshInterval / 1000}秒)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PID</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead>CPU使用率</TableHead>
                  <TableHead>内存使用量</TableHead>
                  <TableHead>线程数</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>用户</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processes.map((process) => (
                  <TableRow key={process.pid}>
                    <TableCell className="font-medium">{process.pid}</TableCell>
                    <TableCell>{process.name}</TableCell>
                    <TableCell>{process.cpu_usage_percent.toFixed(1)}%</TableCell>
                    <TableCell>{formatBytes(process.memory_usage_bytes)}</TableCell>
                    <TableCell>{process.thread_count}</TableCell>
                    <TableCell>
                      <Badge variant={
                        process.status.includes('Running') ? 'default' :
                        process.status.includes('Sleep') ? 'secondary' :
                        process.status.includes('Stop') ? 'destructive' : 'outline'
                      }>
                        {formatStatus(process.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{process.user || '-'}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchProcessDetails(process.pid)}
                        >
                          详情
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openTerminationDialog(process.pid)}
                        >
                          终止
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {processes.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              没有找到符合条件的进程
            </div>
          )}
          
          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              加载进程列表中...
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 进程详情对话框 */}
      {selectedProcess && (
        <Dialog open={!!selectedProcess} onOpenChange={() => setSelectedProcess(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>进程详情 - {selectedProcess.name} (PID: {selectedProcess.pid})</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">进程ID</p>
                <p>{selectedProcess.pid}</p>
              </div>
              <div>
                <p className="text-sm font-medium">进程名称</p>
                <p>{selectedProcess.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium">CPU使用率</p>
                <p>{selectedProcess.cpu_usage_percent.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm font-medium">内存使用量</p>
                <p>{formatBytes(selectedProcess.memory_usage_bytes)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">线程数</p>
                <p>{selectedProcess.thread_count}</p>
              </div>
              <div>
                <p className="text-sm font-medium">优先级</p>
                <p>{selectedProcess.priority}</p>
              </div>
              <div>
                <p className="text-sm font-medium">状态</p>
                <p>{formatStatus(selectedProcess.status)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">用户</p>
                <p>{selectedProcess.user || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">父进程ID</p>
                <p>{selectedProcess.parent_pid || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">启动时间</p>
                <p>{selectedProcess.start_time || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium">可执行文件</p>
                <p className="text-sm truncate">{selectedProcess.exe || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium">命令行</p>
                <p className="text-sm break-all">{selectedProcess.command_line || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium">工作目录</p>
                <p className="text-sm truncate">{selectedProcess.working_directory || '-'}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* 终止进程对话框 */}
      <Dialog open={showTerminationDialog} onOpenChange={setShowTerminationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>终止进程</DialogTitle>
            <DialogDescription>
              您确定要终止进程 PID: {terminationPid} 吗？此操作可能会导致数据丢失。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="force-terminate"
                checked={terminationForce}
                onCheckedChange={(checked) => setTerminationForce(checked as boolean)}
              />
              <label htmlFor="force-terminate">强制终止 (不保存数据)</label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowTerminationDialog(false)}>
                取消
              </Button>
              <Button variant="destructive" onClick={handleTerminateProcess}>
                终止进程
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProcessManager;