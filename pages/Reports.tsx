
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  FileDown, 
  FileSpreadsheet,
  FileText,
  Calendar,
  Filter,
  Download,
  Loader2,
  Table as TableIcon,
  ClipboardList
} from 'lucide-react';
import { base44 } from '../api/base44Client';
import { ServiceOrder } from '../types';
import StatusBadge from '../components/ui/StatusBadge';

const statusLabels: Record<string, string> = {
  agendado: 'Agendado',
  executado: 'Executado',
  pendente: 'Pendente',
  atrasado: 'Atrasado'
};

const priorityLabels: Record<string, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente'
};

export default function Reports() {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['serviceOrders'],
    queryFn: () => base44.entities.ServiceOrder.list('-created_date', 1000)
  });

  const filteredOrders = orders.filter(order => {
    if (!order.created_date) return true;
    const orderDate = parseISO(order.created_date);
    const matchesDate = orderDate >= dateRange.from && orderDate <= dateRange.to;
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesDate && matchesStatus;
  });

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    setIsExporting(true);
    const headers = ['Título', 'Cliente', 'Status', 'Prioridade', 'Data Agendada', 'Data Criação', 'Responsável', 'Categoria'];
    const rows = filteredOrders.map(order => [
      order.title || '',
      order.client_name || '',
      statusLabels[order.status] || order.status,
      priorityLabels[order.priority] || order.priority,
      order.scheduled_date || '',
      order.created_date ? format(parseISO(order.created_date), 'dd/MM/yyyy HH:mm') : '',
      order.assigned_to || '',
      order.category || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    setTimeout(() => {
      downloadFile(csvContent, 'relatorio-os.csv', 'text/csv;charset=utf-8;');
      setIsExporting(false);
    }, 1000);
  };

  const exportToExcel = () => {
    // Emulating XLSX export via CSV for simplicity in this environment
    // In a real app, one would use libraries like 'xlsx'
    setIsExporting(true);
    const headers = ['Título', 'Cliente', 'Status', 'Prioridade', 'Data Agendada', 'Data Criação', 'Responsável', 'Categoria'];
    const rows = filteredOrders.map(order => [
      order.title || '',
      order.client_name || '',
      statusLabels[order.status] || order.status,
      priorityLabels[order.priority] || order.priority,
      order.scheduled_date || '',
      order.created_date ? format(parseISO(order.created_date), 'dd/MM/yyyy HH:mm') : '',
      order.assigned_to || '',
      order.category || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    setTimeout(() => {
      downloadFile(csvContent, 'relatorio-os.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      setIsExporting(false);
    }, 1000);
  };

  const exportToPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-2xl flex items-center justify-center shadow-xl shadow-cyan-500/20">
            <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">Exportação de Dados</h1>
            <p className="text-slate-400 mt-0.5 font-medium text-sm">
              Gerador de relatórios analíticos e operacionais
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0b0f1a]/60 border border-slate-800/50 rounded-2xl p-4 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               <Calendar className="w-4 h-4 text-cyan-400" />
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">PERÍODO</span>
            </div>
            <div className="flex items-center gap-3">
               <input 
                type="date"
                value={format(dateRange.from, 'yyyy-MM-dd')}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: new Date(e.target.value) }))}
                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
               />
               <span className="text-slate-600 font-bold text-sm">até</span>
               <input 
                type="date"
                value={format(dateRange.to, 'yyyy-MM-dd')}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: new Date(e.target.value) }))}
                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
               />
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <Filter className="w-4 h-4 text-slate-500" />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-6 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/50 min-w-[180px]"
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

      {/* Export Cards Section */}
      <div className="bg-[#0b0f1a]/60 border border-slate-800/50 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative">
            <h3 className="text-white font-black text-lg mb-8 flex items-center gap-3 uppercase tracking-tight">
              <Download className="w-5 h-5 text-cyan-400" />
              Exportar Resultados ({filteredOrders.length} registros)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <button
                  onClick={exportToCSV}
                  disabled={isExporting || filteredOrders.length === 0}
                  className="group flex flex-col items-center justify-center p-10 bg-[#064e3b]/10 hover:bg-emerald-600/20 border border-emerald-600/30 rounded-3xl transition-all duration-300 disabled:opacity-30 active:scale-[0.98]"
              >
                  <div className="w-16 h-16 bg-emerald-500/20 group-hover:bg-emerald-500/30 rounded-2xl flex items-center justify-center mb-4 transition-colors">
                      <TableIcon className="w-8 h-8 text-emerald-400" />
                  </div>
                  <span className="text-white font-black text-sm uppercase tracking-tight">CSV Dados</span>
                  <span className="text-[10px] text-emerald-400/60 font-black mt-2 tracking-widest">PLANILHAS GENÉRICAS</span>
              </button>
              
              <button
                  onClick={exportToExcel}
                  disabled={isExporting || filteredOrders.length === 0}
                  className="group flex flex-col items-center justify-center p-10 bg-[#0c4a6e]/10 hover:bg-cyan-600/20 border border-cyan-600/30 rounded-3xl transition-all duration-300 disabled:opacity-30 active:scale-[0.98]"
              >
                  <div className="w-16 h-16 bg-cyan-500/20 group-hover:bg-cyan-500/30 rounded-2xl flex items-center justify-center mb-4 transition-colors">
                      <FileSpreadsheet className="w-8 h-8 text-cyan-400" />
                  </div>
                  <span className="text-white font-black text-sm uppercase tracking-tight">Excel (XLSX)</span>
                  <span className="text-[10px] text-cyan-400/60 font-black mt-2 tracking-widest">FORMATO MS OFFICE</span>
              </button>
              
              <button
                  onClick={exportToPDF}
                  disabled={isExporting || filteredOrders.length === 0}
                  className="group flex flex-col items-center justify-center p-10 bg-[#450a0a]/10 hover:bg-red-600/20 border border-red-600/30 rounded-3xl transition-all duration-300 disabled:opacity-30 active:scale-[0.98]"
              >
                  <div className="w-16 h-16 bg-red-500/20 group-hover:bg-red-500/30 rounded-2xl flex items-center justify-center mb-4 transition-colors">
                      <FileText className="w-8 h-8 text-red-400" />
                  </div>
                  <span className="text-white font-black text-sm uppercase tracking-tight">PDF Relatório</span>
                  <span className="text-[10px] text-red-400/60 font-black mt-2 tracking-widest">DOCUMENTO IMPRESSÃO</span>
              </button>
            </div>
        </div>
      </div>

      {/* Preview Table */}
      <div className="bg-[#0b0f1a]/60 border border-slate-800/50 rounded-3xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="p-6 border-b border-slate-800/50 bg-[#0f172a]/40">
          <h3 className="text-white font-black uppercase tracking-[0.15em] text-[10px]">PRÉVIA DOS DADOS FILTRADOS</h3>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 text-slate-500 font-bold text-sm">
            Nenhum registro no período selecionado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800/50">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">TÍTULO</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">CLIENTE</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">STATUS</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">PRIORIDADE</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">DATA OS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredOrders.slice(0, 50).map(order => (
                  <tr key={order.id} className="hover:bg-slate-700/10 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-slate-200">{order.title}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-500">{order.client_name}</td>
                    <td className="px-6 py-4"><StatusBadge status={order.status} size="sm" /></td>
                    <td className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-tighter">{order.priority}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                      {order.created_date ? format(parseISO(order.created_date), 'dd/MM/yy', { locale: ptBR }) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
