
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ClipboardCheck, 
  Clock, 
  Users,
  RefreshCw,
  Calendar,
  Loader2,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  PlayCircle
} from 'lucide-react';
import { base44 } from '../api/base44Client';
import StatusBadge from '../components/ui/StatusBadge';
import { cn } from '../utils';

export default function Dashboard() {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [quickFilter, setQuickFilter] = useState('month');

  const { data: orders = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['serviceOrders'],
    queryFn: () => base44.entities.ServiceOrder.list('-created_date', 1000)
  });

  const filteredOrders = orders.filter(order => {
    if (!order.created_date) return true;
    const orderDate = parseISO(order.created_date);
    return isWithinInterval(orderDate, { start: dateRange.from, end: dateRange.to });
  });

  const stats = {
    total: filteredOrders.length,
    agendado: filteredOrders.filter(o => o.status === 'agendado').length,
    executado: filteredOrders.filter(o => o.status === 'executado').length,
    pendente: filteredOrders.filter(o => o.status === 'pendente').length,
    atrasado: filteredOrders.filter(o => o.status === 'atrasado').length
  };

  const handleQuickFilter = (filter: string) => {
    setQuickFilter(filter);
    const today = new Date();
    
    switch (filter) {
      case 'today':
        setDateRange({ from: today, to: today });
        break;
      case 'week':
        setDateRange({ from: subDays(today, 7), to: today });
        break;
      case 'month':
        setDateRange({ from: startOfMonth(today), to: endOfMonth(today) });
        break;
    }
  };

  const recentOrders = [...filteredOrders]
    .sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header Adaptativo */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 border border-cyan-500/20 rounded-2xl lg:rounded-3xl p-5 lg:p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9nPjwvc3ZnPg==')] opacity-10" />
        
        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 lg:gap-4 mb-4">
              <div className="w-12 h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-2xl shadow-cyan-500/40 transform -rotate-3 hover:rotate-0 transition-transform duration-300 flex-shrink-0">
                <Activity className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl lg:text-3xl font-bold text-white tracking-tight leading-tight">Central de Controle</h1>
                <p className="text-cyan-300/80 text-[10px] lg:text-sm font-medium mt-0.5">
                  {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {['today', 'week', 'month'].map((f) => (
                <button
                  key={f}
                  onClick={() => handleQuickFilter(f)}
                  className={cn(
                    "px-3 py-1.5 lg:px-5 lg:py-2 rounded-lg lg:rounded-xl text-xs lg:text-sm font-semibold transition-all duration-300",
                    quickFilter === f 
                      ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' 
                      : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-slate-700/50'
                  )}
                >
                  {f === 'today' ? 'Hoje' : f === 'week' ? '7 Dias' : 'Este Mês'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row xl:flex-col gap-3">
            <div className="flex items-center justify-center lg:justify-start gap-3 bg-slate-900/60 backdrop-blur-md rounded-xl px-4 py-3 border border-slate-700/50">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-200 text-xs lg:text-sm font-medium">
                {format(dateRange.from, "dd/MM")} — {format(dateRange.to, "dd/MM/yy")}
              </span>
            </div>
            <button 
              onClick={() => refetch()}
              disabled={isRefetching}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-600/20 transition-all duration-300 active:scale-95 disabled:opacity-50 text-sm"
            >
              <RefreshCw className={cn("w-4 h-4", isRefetching && "animate-spin")} />
              Atualizar
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Card Principal de Resumo */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-2xl lg:rounded-3xl p-6 lg:p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-40 lg:w-80 h-40 lg:h-80 bg-cyan-500/5 rounded-full blur-[60px] lg:blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-cyan-500/10 transition-colors duration-500" />
          
          <div className="relative">
            <div className="flex items-start justify-between mb-6 lg:mb-8">
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2 lg:mb-3">Resumo do Período</p>
                <div className="flex items-baseline gap-3">
                  <h2 className="text-4xl lg:text-6xl font-black text-white">{stats.total}</h2>
                  <p className="text-slate-400 font-medium text-sm lg:text-base">Demandas</p>
                </div>
              </div>
              <div className="p-3 lg:p-5 bg-cyan-500/10 rounded-2xl lg:rounded-3xl border border-cyan-500/20">
                <ClipboardCheck className="w-6 h-6 lg:w-10 lg:h-10 text-cyan-400" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
              <div className="bg-slate-900/40 rounded-xl lg:rounded-2xl p-4 lg:p-5 border border-slate-800 hover:border-blue-500/40 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <PlayCircle className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Agendadas</span>
                </div>
                <p className="text-3xl lg:text-4xl font-black text-blue-400">{stats.agendado}</p>
              </div>

              <div className="bg-slate-900/40 rounded-xl lg:rounded-2xl p-4 lg:p-5 border border-slate-800 hover:border-emerald-500/40 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Concluídas</span>
                </div>
                <p className="text-3xl lg:text-4xl font-black text-emerald-400">{stats.executado}</p>
              </div>

              <div className="bg-slate-900/40 rounded-xl lg:rounded-2xl p-4 lg:p-5 border border-slate-800 hover:border-red-500/40 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Atenção</span>
                </div>
                <p className="text-3xl lg:text-4xl font-black text-red-400">{stats.pendente + stats.atrasado}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card de Performance */}
        <div className="bg-gradient-to-br from-emerald-950/30 to-slate-900 border border-emerald-500/30 rounded-2xl lg:rounded-3xl p-6 lg:p-8 relative overflow-hidden flex flex-col justify-between min-h-[200px]">
          <div className="absolute top-0 right-0 w-32 lg:w-40 h-32 lg:h-40 bg-emerald-500/10 rounded-full blur-[40px] lg:blur-[60px]" />
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-400" />
              </div>
              <p className="text-slate-200 font-bold text-sm lg:text-base">Performance</p>
            </div>
            
            <div className="mb-6 lg:mb-10">
              <h3 className="text-4xl lg:text-6xl font-black text-emerald-400 mb-1 lg:mb-2">
                {stats.total > 0 ? Math.round((stats.executado / stats.total) * 100) : 0}%
              </h3>
              <p className="text-emerald-400/60 text-[10px] lg:text-sm font-semibold uppercase tracking-wide">
                Taxa de Conclusão Global
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-2">
                  <span>PROGRESSO ATUAL</span>
                  <span className="text-emerald-400">{stats.executado} / {stats.total}</span>
                </div>
                <div className="h-2.5 lg:h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-300 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                    style={{ width: `${stats.total > 0 ? (stats.executado / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Ultimas Atualizações com Scroll Mobile */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl lg:rounded-3xl overflow-hidden backdrop-blur-sm">
          <div className="bg-slate-900/60 p-4 lg:p-6 border-b border-slate-700/60 flex items-center justify-between">
            <h3 className="text-sm lg:text-lg font-bold text-white flex items-center gap-3">
              <ClipboardCheck className="w-4 h-4 lg:w-5 lg:h-5 text-cyan-400" />
              Atividades Recentes
            </h3>
            <button className="text-[10px] lg:text-xs text-cyan-400 font-bold hover:underline">Ver todas</button>
          </div>
          
          <div className="p-3 lg:p-4 space-y-3 lg:space-y-4 max-h-[400px] lg:max-h-[420px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <Activity className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-30" />
                <p className="text-xs font-medium">Sem dados para exibir</p>
              </div>
            ) : (
              recentOrders.map(order => (
                <div 
                  key={order.id}
                  className="bg-slate-900/40 border border-slate-800 rounded-xl lg:rounded-2xl p-4 lg:p-5 hover:bg-slate-900/80 transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between gap-3 lg:gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white text-sm lg:text-base font-bold truncate group-hover:text-cyan-400">
                        {order.title}
                      </h4>
                      <p className="text-[9px] lg:text-[10px] text-slate-500 font-mono mt-0.5 lg:mt-1 font-bold">OS #{order.os_number}</p>
                    </div>
                    <StatusBadge status={order.status} size="sm" />
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 text-[10px] lg:text-xs text-slate-500 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3 h-3 text-slate-400" />
                      {order.client_name}
                    </span>
                    {order.created_date && (
                      <span className="flex items-center gap-1.5 ml-auto sm:ml-0">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {format(parseISO(order.created_date), "dd/MM, HH:mm", { locale: ptBR })}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Distribuição Mobile Friendly */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl lg:rounded-3xl overflow-hidden backdrop-blur-sm">
          <div className="bg-slate-900/60 p-4 lg:p-6 border-b border-slate-700/60 flex items-center justify-between">
            <h3 className="text-sm lg:text-lg font-bold text-white flex items-center gap-3">
              <Activity className="w-4 h-4 lg:w-5 lg:h-5 text-cyan-400" />
              Fila de Status
            </h3>
          </div>
          
          <div className="p-5 lg:p-8 space-y-4 lg:space-y-6">
            {[
              { status: 'agendado', count: stats.agendado, label: 'Agendado', color: 'bg-blue-500', icon: PlayCircle },
              { status: 'executado', count: stats.executado, label: 'Executado', color: 'bg-emerald-500', icon: CheckCircle2 },
              { status: 'pendente', count: stats.pendente, label: 'Pendente', color: 'bg-orange-500', icon: Clock },
              { status: 'atrasado', count: stats.atrasado, label: 'Atrasado', color: 'bg-red-500', icon: AlertCircle }
            ].map(item => {
              const Icon = item.icon;
              const percentage = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0;
              return (
                <div key={item.status} className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={cn("p-1.5 rounded-lg", item.color.replace('bg-', 'bg-') + '/10')}>
                         <Icon className={cn("w-3.5 h-3.5", item.color.replace('bg-', 'text-'))} />
                      </div>
                      <span className="text-xs lg:text-sm text-slate-300 font-bold">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3 lg:gap-4">
                      <span className="text-white font-black text-base lg:text-lg">{item.count}</span>
                      <span className="text-[10px] lg:text-xs text-slate-500 font-bold w-10 text-right">{percentage}%</span>
                    </div>
                  </div>
                  <div className="h-2 lg:h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                    <div 
                      className={cn("h-full rounded-full transition-all duration-1000", item.color)}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
