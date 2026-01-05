
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, subDays } from 'date-fns';
import { 
  ScrollText, 
  Search, 
  AlertCircle,
  AlertTriangle,
  Info,
  Zap,
  User,
  RefreshCw,
  Loader2,
  Eye,
  X
} from 'lucide-react';
import { base44 } from '../api/base44Client';
import { ActivityLog, User as AppUser } from '../types';
import { cn } from '../utils';

const severityConfig = {
  info: { label: 'Info', icon: Info, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  warning: { label: 'Aviso', icon: AlertTriangle, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  error: { label: 'Erro', icon: AlertCircle, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  critical: { label: 'Crítico', icon: Zap, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' }
};

const actionLabels: Record<string, string> = {
  create: 'Criação',
  update: 'Atualização',
  delete: 'Exclusão',
  status_change: 'Mudança de Status',
  error: 'Erro',
  login: 'Login',
  logout: 'Logout'
};

export default function Logs() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('7days');
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser);
  }, []);

  const { data: logs = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['activityLogs'],
    queryFn: () => base44.entities.ActivityLog.list('-created_date', 500),
    enabled: !!currentUser && currentUser.role === 'manager'
  });

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    
    let matchesDate = true;
    if (log.created_date) {
      const logDate = parseISO(log.created_date);
      const now = new Date();
      const filterDays = dateFilter === 'today' ? 0 : dateFilter === '7days' ? 7 : 30;
      matchesDate = logDate >= subDays(now, filterDays);
    }
    
    return matchesSearch && matchesSeverity && matchesDate;
  });

  if (!currentUser || currentUser.role !== 'manager') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-black text-white">Acesso Restrito</h2>
        <p className="text-slate-400 max-w-sm mt-2">Esta página é exclusiva para gestores com permissão de auditoria de logs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-2xl flex items-center justify-center shadow-xl shadow-cyan-500/20">
              <ScrollText className="w-6 h-6 text-white" />
            </div>
            Auditoria de Logs
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Histórico transacional completo da plataforma</p>
        </div>

        <button 
          onClick={() => refetch()}
          disabled={isRefetching}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4", isRefetching && "animate-spin")} />
          Atualizar Histórico
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 backdrop-blur-sm">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                    placeholder="Filtrar por descrição, usuário ou evento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
            </div>
        </div>
        <div className="flex gap-4">
            <select 
                value={severityFilter} 
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="flex-1 bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
                <option value="all">Severidade: Todas</option>
                <option value="info">Info</option>
                <option value="warning">Aviso</option>
                <option value="error">Erro</option>
                <option value="critical">Crítico</option>
            </select>
            <select 
                value={dateFilter} 
                onChange={(e) => setDateFilter(e.target.value)}
                className="flex-1 bg-slate-800/40 border border-slate-700/60 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            >
                <option value="today">Hoje</option>
                <option value="7days">7 Dias</option>
                <option value="30days">30 Dias</option>
            </select>
        </div>
      </div>

      <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl overflow-hidden backdrop-blur-sm shadow-2xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-24 text-slate-500 font-bold uppercase tracking-widest text-xs">
            Nenhum evento registrado no sistema
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-700">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Horário</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Nível</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Usuário</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Evento</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredLogs.map(log => {
                  const severity = (severityConfig as any)[log.severity] || severityConfig.info;
                  return (
                    <tr key={log.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-5 text-slate-500 font-mono text-xs font-bold">
                        {format(parseISO(log.created_date), 'HH:mm:ss dd/MM')}
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn("px-2 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-widest flex items-center gap-1 w-fit", severity.color)}>
                          <severity.icon className="w-2.5 h-2.5" />
                          {severity.label}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800">
                                <User className="w-3.5 h-3.5 text-slate-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate max-w-[120px]">{log.user_name || 'Sistema'}</p>
                                <p className="text-[9px] text-slate-600 font-bold truncate max-w-[120px]">{log.user_email || 'daemon@system'}</p>
                            </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                         <p className="text-slate-300 font-bold text-xs truncate max-w-[250px]">{log.description}</p>
                         <p className="text-[9px] text-slate-600 font-black uppercase mt-1 tracking-tighter">
                            AÇÃO: {actionLabels[log.action_type] || log.action_type}
                         </p>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button 
                            onClick={() => setSelectedLog(log)}
                            className="p-2 text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setSelectedLog(null)} />
           <div className="relative bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="text-xl font-black text-white">Auditoria Detalhada</h3>
                    <button onClick={() => setSelectedLog(null)} className="p-2 text-slate-500 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-8 space-y-8 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Identificador</p>
                            <p className="text-sm font-bold text-cyan-400 font-mono">#{selectedLog.id}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Timestamp</p>
                            <p className="text-sm font-bold text-slate-300 font-mono">{format(parseISO(selectedLog.created_date), 'dd/MM/yyyy HH:mm:ss.SSS')}</p>
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Descrição do Evento</p>
                        <p className="text-sm font-bold text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-2xl border border-slate-800">{selectedLog.description}</p>
                    </div>

                    {selectedLog.old_value && (
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-red-500/60 uppercase tracking-widest">Snapshot Anterior</p>
                            <pre className="bg-slate-950/80 p-4 rounded-2xl border border-red-500/10 text-[10px] font-mono text-red-400 overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(JSON.parse(selectedLog.old_value), null, 2)}
                            </pre>
                        </div>
                    )}

                    {selectedLog.new_value && (
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest">Novo Snapshot</p>
                            <pre className="bg-slate-950/80 p-4 rounded-2xl border border-emerald-500/10 text-[10px] font-mono text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                                {JSON.stringify(JSON.parse(selectedLog.new_value), null, 2)}
                            </pre>
                        </div>
                    )}

                    {selectedLog.error_message && (
                        <div className="space-y-1">
                             <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Stack Trace / Erro</p>
                             <div className="bg-red-500/5 p-4 rounded-2xl border border-red-500/20">
                                <p className="text-xs font-mono text-red-400 leading-relaxed">{selectedLog.error_message}</p>
                             </div>
                        </div>
                    )}
                </div>
           </div>
        </div>
      )}
    </div>
  );
}
