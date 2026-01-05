
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { 
  Eye, 
  Search, 
  Filter,
  Clock,
  CalendarCheck,
  Loader2,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { base44 } from '../api/base44Client';
import { ServiceOrder } from '../types';
import StatusBadge from '../components/ui/StatusBadge';
import { cn } from '../utils';

export default function Tracking() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['serviceOrders'],
    queryFn: () => base44.entities.ServiceOrder.list('-created_date', 500)
  });

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getTimelineSteps = (order: ServiceOrder) => {
    return [
      {
        label: 'Abertura',
        date: order.created_date,
        completed: true,
        icon: Clock,
        color: 'text-blue-400'
      },
      {
        label: 'Agendamento',
        date: order.scheduled_date,
        completed: ['agendado', 'pendente', 'executado', 'atrasado'].includes(order.status),
        icon: CalendarCheck,
        color: 'text-cyan-400'
      },
      {
        label: 'Finalização',
        date: order.executed_date,
        completed: order.status === 'executado',
        icon: CheckCircle,
        color: 'text-emerald-400'
      }
    ];
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-white flex items-center gap-3 lg:gap-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-xl shadow-cyan-500/20 flex-shrink-0">
              <Eye className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            Acompanhamento
          </h1>
          <p className="text-slate-400 mt-2 font-medium text-xs lg:text-sm">
            Rastreio de progresso e ciclo de vida das ordens
          </p>
        </div>
      </div>

      <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-3 lg:p-4 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row gap-3 lg:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              placeholder="Pesquisar cliente ou demanda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
             <Filter className="w-4 h-4 text-slate-500" />
             <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-auto bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none"
            >
                <option value="all">Todos os Status</option>
                <option value="agendado">Agendado</option>
                <option value="executado">Executado</option>
                <option value="pendente">Pendente</option>
                <option value="atrasado">Atrasado</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 lg:py-24 bg-slate-800/40 border border-slate-700/60 rounded-3xl">
          <Eye className="w-12 lg:w-16 h-12 lg:h-16 text-slate-700 mx-auto mb-4 opacity-30" />
          <p className="text-base lg:text-lg font-bold text-slate-500">Nada em acompanhamento</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:gap-6">
          {filteredOrders.map(order => {
            const steps = getTimelineSteps(order);
            
            return (
              <div 
                key={order.id} 
                className="bg-slate-800/30 border border-slate-700/60 rounded-2xl lg:rounded-3xl p-5 lg:p-8 hover:bg-slate-800/50 transition-all duration-500 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8 relative z-10">
                  <div className="max-w-md w-full">
                    <div className="flex items-center justify-between sm:justify-start gap-3 mb-2">
                       <StatusBadge status={order.status} size="sm" />
                       <span className="text-[9px] lg:text-[10px] font-black font-mono text-slate-600 uppercase tracking-widest">OS #{order.os_number}</span>
                    </div>
                    <h3 className="text-lg lg:text-2xl font-black text-white group-hover:text-cyan-400 transition-colors mb-2 leading-tight">{order.title}</h3>
                    <p className="text-xs lg:text-sm text-slate-400 font-medium">Cliente: <span className="text-slate-200">{order.client_name}</span></p>
                  </div>

                  {/* Linha do tempo Adaptativa */}
                  <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-center gap-6 sm:gap-8 lg:gap-12 xl:gap-16">
                    {steps.map((step, index) => (
                      <div key={step.label} className="flex flex-row sm:flex-col items-center gap-4 sm:gap-0 relative flex-1 min-w-[140px] w-full">
                        
                        {/* Linha Conectora Desktop */}
                        {index < steps.length - 1 && (
                          <div className="hidden sm:block absolute top-6 left-1/2 w-full h-[2px] bg-slate-800 -z-10">
                            <div 
                                className={cn("h-full bg-cyan-500/40 transition-all duration-1000", step.completed ? "w-full" : "w-0")} 
                            />
                          </div>
                        )}

                        {/* Linha Conectora Mobile (Vertical) */}
                        {index < steps.length - 1 && (
                          <div className="sm:hidden absolute top-10 left-6 w-[2px] h-10 bg-slate-800 -z-10">
                             <div className={cn("w-full bg-cyan-500/40 transition-all", step.completed ? "h-full" : "h-0")} />
                          </div>
                        )}
                        
                        <div className={cn(
                          "w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl flex items-center justify-center border-2 transition-all duration-500 flex-shrink-0",
                          step.completed 
                            ? "bg-cyan-500/10 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                            : "bg-slate-900 border-slate-700"
                        )}>
                          <step.icon className={cn("w-4 h-4 lg:w-5 lg:h-5", step.completed ? "text-cyan-400" : "text-slate-700")} />
                        </div>
                        
                        <div className="text-left sm:text-center mt-0 sm:mt-4">
                          <p className={cn(
                            "text-[10px] font-black uppercase tracking-widest mb-0.5 lg:mb-1",
                            step.completed ? "text-cyan-400" : "text-slate-600"
                          )}>
                            {step.label}
                          </p>
                          {step.date ? (
                            <p className="text-[10px] lg:text-xs text-slate-500 font-bold">
                               {format(parseISO(step.date), 'dd/MM/yyyy')}
                            </p>
                          ) : (
                            <p className="text-[9px] text-slate-700 font-black italic">PENDENTE</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="w-full lg:w-48 pt-5 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-800 lg:pl-8 flex flex-row lg:flex-col justify-between lg:justify-start gap-4 lg:space-y-4">
                     <div>
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Responsável</p>
                        <p className="text-xs font-bold text-slate-300">{order.assigned_to || '-'}</p>
                     </div>
                     <div className="text-right lg:text-left">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Categoria</p>
                        <p className="text-xs font-bold text-slate-300">{order.category || '-'}</p>
                     </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-slate-950/40 rounded-xl lg:rounded-2xl border border-slate-800/50 group-hover:bg-slate-950/60 transition-colors">
                  <p className="text-[11px] lg:text-xs text-slate-500 leading-relaxed font-medium line-clamp-2 lg:line-clamp-none">
                    <span className="font-black text-slate-400 mr-2 uppercase tracking-tighter">Resumo:</span>
                    {order.description || 'Sem descrição detalhada.'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
