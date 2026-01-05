
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { 
  Plus, 
  Search, 
  Filter,
  Edit2,
  Trash2,
  ClipboardList,
  Loader2,
  X,
  AlertTriangle,
  User as UserIcon
} from 'lucide-react';
import { base44 } from '../api/base44Client';
import { ServiceOrder, User, OSPriority, OSStatus } from '../types';
import StatusBadge from '../components/ui/StatusBadge';
import { cn } from '../utils';

const emptyOrder: Partial<ServiceOrder> = {
  os_number: '',
  title: '',
  description: '',
  client_name: '',
  client_contact: '',
  status: 'agendado',
  priority: 'media',
  scheduled_date: '',
  category: '',
  assigned_to: '',
  notes: ''
};

const priorityLabels: Record<OSPriority, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente'
};

const priorityColors: Record<OSPriority, string> = {
  baixa: 'text-slate-400',
  media: 'text-blue-400',
  alta: 'text-orange-400',
  urgente: 'text-red-400'
};

export default function ServiceOrders() {
  const [user, setUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [formData, setFormData] = useState<Partial<ServiceOrder>>(emptyOrder);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['serviceOrders'],
    queryFn: () => base44.entities.ServiceOrder.list('-created_date', 500)
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<ServiceOrder>) => base44.entities.ServiceOrder.create(data),
    onSuccess: async (newOrder, variables) => {
      queryClient.invalidateQueries({ queryKey: ['serviceOrders'] });
      await base44.entities.ActivityLog.create({
        action_type: 'create',
        entity_type: 'ServiceOrder',
        entity_id: newOrder.id,
        user_email: user?.email || '',
        user_name: user?.full_name || '',
        description: `Ordem de serviço criada: ${variables.title}`,
        new_value: JSON.stringify(variables),
        severity: 'info'
      });
      handleCloseModal();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<ServiceOrder> }) => base44.entities.ServiceOrder.update(id, data),
    onSuccess: async (updatedOrder, variables) => {
      queryClient.invalidateQueries({ queryKey: ['serviceOrders'] });
      const oldOrder = orders.find(o => o.id === variables.id);
      await base44.entities.ActivityLog.create({
        action_type: 'update',
        entity_type: 'ServiceOrder',
        entity_id: variables.id,
        user_email: user?.email || '',
        user_name: user?.full_name || '',
        description: `Ordem de serviço atualizada: ${variables.data.title || oldOrder?.title}`,
        old_value: JSON.stringify(oldOrder),
        new_value: JSON.stringify(variables.data),
        severity: 'info'
      });
      handleCloseModal();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => base44.entities.ServiceOrder.delete(id),
    onSuccess: async (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['serviceOrders'] });
      const deletedOrder = orders.find(o => o.id === deletedId);
      await base44.entities.ActivityLog.create({
        action_type: 'delete',
        entity_type: 'ServiceOrder',
        entity_id: deletedId,
        user_email: user?.email || '',
        user_name: user?.full_name || '',
        description: `Ordem de serviço excluída: ${deletedOrder?.title}`,
        old_value: JSON.stringify(deletedOrder),
        severity: 'warning'
      });
      setShowDeleteDialog(false);
      setSelectedOrder(null);
    }
  });

  const userRole = user?.role || 'user';
  const canCreate = ['manager', 'admin', 'user'].includes(userRole);
  const canEdit = ['manager', 'admin'].includes(userRole);
  const canDelete = ['manager', 'admin'].includes(userRole);
  const canChangeStatus = ['manager', 'admin', 'analist'].includes(userRole);

  const handleOpenModal = (order: ServiceOrder | null = null) => {
    if (order) {
      setFormData({
        ...emptyOrder,
        ...order,
        scheduled_date: order.scheduled_date ? order.scheduled_date.split('T')[0] : ''
      });
      setSelectedOrder(order);
    } else {
      setFormData(emptyOrder);
      setSelectedOrder(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData(emptyOrder);
    setSelectedOrder(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedOrder) {
      updateMutation.mutate({ id: selectedOrder.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleStatusChange = async (order: ServiceOrder, newStatus: OSStatus) => {
    const oldStatus = order.status;
    await base44.entities.ActivityLog.create({
      action_type: 'status_change',
      entity_type: 'ServiceOrder',
      entity_id: order.id,
      user_email: user?.email || '',
      user_name: user?.full_name || '',
      description: `Status alterado de "${oldStatus}" para "${newStatus}" - ${order.title}`,
      old_value: JSON.stringify({ status: oldStatus }),
      new_value: JSON.stringify({ status: newStatus }),
      severity: 'info'
    });
    updateMutation.mutate({ id: order.id, data: { ...order, status: newStatus } });
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.os_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-white flex items-center gap-3 lg:gap-4">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-xl shadow-cyan-500/20 flex-shrink-0">
              <ClipboardList className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            Ordens de Serviço
          </h1>
          <p className="text-slate-400 mt-1 lg:mt-2 font-medium text-xs lg:text-sm">
            Painel administrativo de controle de demandas
          </p>
        </div>

        {canCreate && (
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-600/20 transition-all duration-300 active:scale-95 text-sm"
          >
            <Plus className="w-4 h-4" />
            Nova Ordem
          </button>
        )}
      </div>

      <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl lg:rounded-2xl p-3 lg:p-4 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row gap-3 lg:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              placeholder="Buscar título ou cliente..."
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

      <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl lg:rounded-3xl overflow-hidden backdrop-blur-sm shadow-2xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 lg:py-24">
            <Loader2 className="w-10 h-10 lg:w-12 lg:h-12 text-cyan-500 animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 lg:py-24 text-slate-500">
            <ClipboardList className="w-12 h-12 lg:w-16 lg:h-16 text-slate-700 mx-auto mb-4 opacity-30" />
            <p className="text-base lg:text-lg font-bold">Nenhum registro encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-700">
                  <th className="px-4 lg:px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Nº OS</th>
                  <th className="px-4 lg:px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Título</th>
                  <th className="px-4 lg:px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Cliente</th>
                  <th className="px-4 lg:px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-4 lg:px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Prioridade</th>
                  <th className="px-4 lg:px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Agendado</th>
                  <th className="px-4 lg:px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-700/30 transition-colors group">
                    <td className="px-4 lg:px-6 py-4 text-cyan-400 font-mono font-black text-xs lg:text-sm">{order.os_number || '-'}</td>
                    <td className="px-4 lg:px-6 py-4 min-w-[200px]">
                      <p className="text-white font-bold group-hover:text-cyan-400 transition-colors text-sm">{order.title}</p>
                      <p className="text-[10px] text-slate-500 mt-1 truncate max-w-[200px]">{order.description}</p>
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-slate-300 font-medium text-sm">{order.client_name}</td>
                    <td className="px-4 lg:px-6 py-4">
                      {canChangeStatus ? (
                        <select 
                          value={order.status} 
                          onChange={(e) => handleStatusChange(order, e.target.value as OSStatus)}
                          className="bg-transparent text-white text-[10px] lg:text-xs border border-slate-700 rounded-lg p-1.5 focus:outline-none hover:border-cyan-500 cursor-pointer"
                        >
                          <option value="agendado">Agendado</option>
                          <option value="executado">Executado</option>
                          <option value="pendente">Pendente</option>
                          <option value="atrasado">Atrasado</option>
                        </select>
                      ) : (
                        <StatusBadge status={order.status} size="sm" />
                      )}
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <span className={cn("font-black text-[10px] uppercase tracking-wider", priorityColors[order.priority])}>
                        {priorityLabels[order.priority] || 'Média'}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-slate-400 text-[11px] lg:text-sm font-medium">
                      {order.scheduled_date ? format(parseISO(order.scheduled_date), 'dd/MM/yyyy') : '-'}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 lg:gap-2 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                        {canEdit && (
                          <button
                            onClick={() => handleOpenModal(order)}
                            className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowDeleteDialog(true);
                            }}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={handleCloseModal} />
          <div className="relative bg-[#0b0f1a] border border-slate-800/50 w-full max-w-2xl rounded-[1rem] shadow-2xl max-h-[95vh] lg:max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-8 py-6 flex items-center justify-between border-b border-slate-800/50">
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                {selectedOrder ? 'EDITAR OS' : 'NOVA OS'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nº OS (10 DÍGITOS)</label>
                  <input
                    value={formData.os_number}
                    maxLength={10}
                    onChange={(e) => setFormData({...formData, os_number: e.target.value.replace(/\D/g, '')})}
                    className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-lg text-white font-mono text-sm focus:border-cyan-500/50 focus:outline-none transition-all"
                    placeholder=""
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TÍTULO *</label>
                  <input
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder=""
                    className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-lg text-white text-sm focus:border-cyan-500/50 focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CLIENTE *</label>
                  <input
                    required
                    value={formData.client_name}
                    onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                    placeholder=""
                    className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-lg text-white text-sm focus:border-cyan-500/50 focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CONTATO</label>
                  <input
                    value={formData.client_contact}
                    onChange={(e) => setFormData({...formData, client_contact: e.target.value})}
                    placeholder=""
                    className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-lg text-white text-sm focus:border-cyan-500/50 focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">STATUS</label>
                  <select 
                    value={formData.status} 
                    onChange={(e) => setFormData({...formData, status: e.target.value as OSStatus})}
                    className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-lg text-white text-sm focus:border-cyan-500/50 focus:outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="agendado">Agendado</option>
                    <option value="executado">Executado</option>
                    <option value="pendente">Pendente</option>
                    <option value="atrasado">Atrasado</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">PRIORIDADE</label>
                  <select 
                    value={formData.priority} 
                    onChange={(e) => setFormData({...formData, priority: e.target.value as OSPriority})}
                    className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-lg text-white text-sm focus:border-cyan-500/50 focus:outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">DATA AGENDADA</label>
                  <input
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-lg text-white text-sm focus:border-cyan-500/50 focus:outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CATEGORIA</label>
                  <input
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder=""
                    className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800 rounded-lg text-white text-sm focus:border-cyan-500/50 focus:outline-none transition-all"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">RESPONSÁVEL</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      value={formData.assigned_to}
                      onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
                      placeholder=""
                      className="w-full pl-11 pr-4 py-3 bg-slate-950/40 border border-slate-800 rounded-lg text-white text-sm focus:border-cyan-500/50 focus:outline-none transition-all"
                    />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">DESCRIÇÃO</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder=""
                    className="w-full px-4 py-4 bg-slate-950/40 border border-slate-800 rounded-lg text-white text-sm min-h-[120px] focus:border-cyan-500/50 focus:outline-none transition-all resize-none"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 border border-slate-700 text-slate-300 font-bold rounded-lg hover:bg-slate-800 text-xs transition-all uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-8 py-2.5 bg-[#06b6d4] hover:bg-[#0891b2] text-white font-black rounded-lg flex items-center justify-center gap-2 text-xs transition-all uppercase tracking-widest"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  )}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={() => setShowDeleteDialog(false)} />
          <div className="relative bg-slate-900 border border-red-500/30 w-full max-w-md rounded-2xl p-6 lg:p-8 shadow-2xl">
            <div className="flex items-center gap-4 mb-6 text-red-500">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 lg:w-6 lg:h-6" />
              </div>
              <h3 className="text-lg lg:text-xl font-black text-white">Excluir Registro</h3>
            </div>
            <p className="text-slate-400 font-medium mb-8 text-sm lg:text-base">
              Deseja excluir a ordem <span className="text-white font-bold">"{selectedOrder?.title}"</span>? A ação é permanente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 px-4 py-3 border border-slate-700 text-slate-300 font-bold rounded-xl text-sm"
              >
                Manter
              </button>
              <button
                onClick={() => selectedOrder && deleteMutation.mutate(selectedOrder.id)}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
