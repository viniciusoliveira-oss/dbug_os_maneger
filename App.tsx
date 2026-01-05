
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  LayoutDashboard, ClipboardList, Eye, Users as UsersIcon, FileDown, ScrollText, 
  LogOut, Plus, Edit2, Trash2, AlertTriangle, Clock, User as UserIcon, Save, 
  Loader2, ShieldCheck, ArrowRight, Activity, Calendar, CheckCircle, 
  CheckCircle2, TrendingUp, Zap, FileSpreadsheet, FileText, X, UserPlus, Mail, ShieldAlert,
  Lock
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api, User, OSStatus, UserRole, cn } from './api';

const queryClient = new QueryClient();

// --- ANIMATED PAGE WRAPPER ---
function PageTransition({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={cn(
      "transition-all duration-500 ease-out transform",
      isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    )}>
      {children}
    </div>
  );
}

// --- SHARED UI COMPONENTS ---
function StatusBadge({ status, size = 'default' }: { status: OSStatus; size?: 'default' | 'sm' }) {
  const cfg = {
    agendado: { label: 'Agendado', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    executado: { label: 'Executado', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    pendente: { label: 'Pendente', bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
    atrasado: { label: 'Atrasado', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' }
  }[status] || { label: 'Pendente', bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' };

  return (
    <span className={cn(
      "inline-flex items-center rounded-full border font-bold uppercase tracking-widest whitespace-nowrap",
      cfg.bg, cfg.text, cfg.border,
      size === 'sm' ? 'px-2 py-0.5 text-[8px]' : 'px-3 py-1 text-[10px]'
    )}>
      {cfg.label}
    </span>
  );
}

// --- NAVIGATION ---
function BottomNav({ user, onLogout }: { user: User, onLogout: () => void }) {
  const location = useLocation();
  const menu = [
    { name: 'Home', icon: LayoutDashboard, path: '/dashboard', roles: ['manager', 'admin', 'user', 'analist'] },
    { name: 'O.S.', icon: ClipboardList, path: '/service-orders', roles: ['manager', 'admin', 'user', 'analist'] },
    { name: 'Track', icon: Eye, path: '/tracking', roles: ['manager', 'admin', 'user', 'analist'] },
    { name: 'Equipe', icon: UsersIcon, path: '/users', roles: ['manager', 'admin'] },
    { name: 'Relatórios', icon: FileDown, path: '/reports', roles: ['manager', 'admin', 'analist'] },
    { name: 'Perfil', icon: UserIcon, path: '/profile', roles: ['manager', 'admin', 'user', 'analist'] },
  ].filter(i => i.roles.includes(user.role));

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-2xl px-2 print:hidden">
      <nav className="bg-[#0b0f1a]/95 backdrop-blur-3xl border border-white/10 rounded-full p-1.5 shadow-[0_30px_70px_rgba(0,0,0,0.9)] flex items-center justify-around">
        {menu.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className={cn(
                "relative flex flex-col items-center gap-0.5 p-3 sm:p-3.5 rounded-full transition-all duration-300",
                active ? "text-cyan-400 scale-105" : "text-slate-500 hover:text-slate-300"
              )}
            >
              <item.icon className={cn("w-5 h-5", active ? "drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" : "")} />
              <span className="text-[7px] font-black uppercase tracking-tighter hidden md:block">{item.name}</span>
              {active && <div className="absolute bottom-1 w-1 h-1 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]" />}
            </Link>
          );
        })}
        <div className="w-[1px] h-6 bg-white/5 mx-1" />
        <button 
          onClick={onLogout}
          className="p-3 sm:p-3.5 text-slate-500 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </nav>
    </div>
  );
}

// --- PAGES ---

function Dashboard() {
  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: api.orders.list });
  const stats = useMemo(() => ({
    total: orders.length,
    executado: orders.filter((o: any) => o.status === 'executado').length,
    atrasado: orders.filter((o: any) => o.status === 'atrasado').length,
    pendente: orders.filter((o: any) => ['agendado', 'pendente'].includes(o.status)).length
  }), [orders]);

  return (
    <PageTransition>
      <div className="space-y-6 sm:space-y-8 pb-32">
        <header>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Dashboard</h1>
          <p className="text-cyan-500 font-black text-[9px] sm:text-[10px] uppercase tracking-[0.3em] mt-1">Intelligence Center</p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'Total O.S.', val: stats.total, color: 'text-cyan-400', icon: ClipboardList, glow: 'shadow-cyan-500/10' },
            { label: 'Executado', val: stats.executado, color: 'text-emerald-400', icon: CheckCircle2, glow: 'shadow-emerald-500/10' },
            { label: 'Atrasado', val: stats.atrasado, color: 'text-red-400', icon: AlertTriangle, glow: 'shadow-red-500/10' },
            { label: 'Pendente', val: stats.pendente, color: 'text-orange-400', icon: Clock, glow: 'shadow-orange-500/10' }
          ].map(s => (
            <div key={s.label} className={cn("bg-[#0b0f1a] border border-white/5 p-4 sm:p-6 rounded-[1.2rem] sm:rounded-[2rem] shadow-lg transition-all hover:scale-[1.02]", s.glow)}>
              <s.icon className={cn("w-4 h-4 mb-3 sm:mb-4", s.color)} />
              <p className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">{s.label}</p>
              <h3 className="text-2xl sm:text-3xl font-black text-white mt-1 leading-none">{s.val}</h3>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#0b0f1a] border border-white/5 rounded-[1.2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl">
            <h3 className="text-white font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2 italic leading-none">
              <Activity className="w-4 h-4 text-cyan-500" /> Fluxo Recente
            </h3>
            <div className="space-y-3">
              {orders.slice(-4).reverse().map((o: any) => (
                <div key={o.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between gap-3 hover:border-cyan-500/30 transition-all">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white leading-none truncate">{o.title}</p>
                    <p className="text-[9px] text-slate-500 font-black uppercase mt-1 tracking-tight leading-none">OS #{o.os_number} • {o.client_name}</p>
                  </div>
                  <StatusBadge status={o.status} size="sm" />
                </div>
              ))}
              {orders.length === 0 && <p className="text-center py-10 text-slate-600 text-[10px] font-black uppercase italic tracking-widest">Sem operações registradas</p>}
            </div>
          </div>
          <div className="bg-gradient-to-br from-cyan-600/20 to-transparent border border-cyan-500/20 rounded-[1.2rem] sm:rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-center items-center text-center shadow-xl">
            <Zap className="w-8 h-8 text-cyan-400 mb-4 animate-pulse" />
            <h4 className="text-4xl sm:text-5xl font-black text-white tracking-tighter leading-none">{stats.total > 0 ? Math.round((stats.executado/stats.total)*100) : 0}%</h4>
            <p className="text-cyan-500 font-black text-[9px] uppercase tracking-[0.2em] mt-2 leading-none">Efficiency Rating</p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function ServiceOrdersPage() {
  const qc = useQueryClient();
  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: api.orders.list });
  const [show, setShow] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const initialForm = {
    os_number: '',
    title: '',
    client_name: '',
    client_contact: '',
    status: 'agendado',
    priority: 'media',
    scheduled_date: '',
    category: '',
    assigned_to: '',
    description: ''
  };

  const [form, setForm] = useState(initialForm);

  const mut = useMutation({
    mutationFn: (data: any) => data.id ? api.orders.update(data.id, data) : api.orders.create(data),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['orders'] }); 
      setShow(false);
      setForm(initialForm);
    }
  });

  const handleEdit = (o: any) => {
    setForm(o);
    setIsEditing(true);
    setShow(true);
  };

  const handleNew = () => {
    setForm(initialForm);
    setIsEditing(false);
    setShow(true);
  };

  return (
    <PageTransition>
      <div className="space-y-6 sm:space-y-8 pb-32">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase italic leading-none">O.S.</h1>
            <p className="text-cyan-500 font-black text-[9px] sm:text-[10px] uppercase tracking-[0.3em] mt-1">Order Matrix</p>
          </div>
          <button onClick={handleNew} className="w-12 h-12 bg-cyan-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-cyan-600/20 hover:bg-cyan-500 transition-all active:scale-90">
            <Plus className="w-6 h-6" />
          </button>
        </header>

        <div className="bg-[#0b0f1a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-[9px] font-black text-slate-600 uppercase tracking-widest bg-slate-900/40">
                  <th className="px-6 py-5">Nº OS</th>
                  <th className="px-6 py-5">Operação</th>
                  <th className="px-6 py-5 hidden sm:table-cell">Cliente</th>
                  <th className="px-6 py-5 text-right sm:text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((o: any) => (
                  <tr key={o.id} onClick={() => handleEdit(o)} className="hover:bg-white/[0.02] cursor-pointer transition-all">
                    <td className="px-6 py-5 text-[10px] font-black text-cyan-400 font-mono">#{o.os_number}</td>
                    <td className="px-6 py-5">
                       <p className="font-bold text-white text-xs sm:text-sm leading-tight">{o.title}</p>
                       <p className="text-[8px] text-slate-600 sm:hidden uppercase font-black mt-0.5">{o.client_name}</p>
                    </td>
                    <td className="px-6 py-5 hidden sm:table-cell text-[9px] text-slate-500 font-black uppercase tracking-tight">{o.client_name}</td>
                    <td className="px-6 py-5 text-right sm:text-left">
                       <StatusBadge status={o.status} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {show && (
        <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center min-h-screen w-screen p-4 sm:p-12 backdrop-blur-2xl bg-black/90 transition-all">
          {/* Modal Content: Centralização Absoluta sem Offset manual */}
          <div className="bg-[#0b0f1a] border border-white/10 w-full max-w-4xl rounded-[3rem] shadow-[0_60px_200px_rgba(0,0,0,1)] animate-in zoom-in duration-500 flex flex-col overflow-hidden max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between px-10 py-8 border-b border-white/5 bg-slate-900/40 shrink-0">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">
                {isEditing ? 'ATUALIZAR REGISTRO' : 'NOVA DEMANDA'}
              </h2>
              <button onClick={() => setShow(false)} className="text-slate-500 hover:text-white transition-all p-2 hover:bg-white/5 rounded-2xl active:scale-90">
                <X className="w-8 h-8" />
              </button>
            </div>

            {/* Content Area (A parte "Rosa" expandida) */}
            <div className="flex-1 overflow-y-auto px-10 sm:px-16 py-14 space-y-16 custom-scroll">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-16 gap-y-12">
                
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Código O.S. (10 dígitos)</label>
                  <input 
                    value={form.os_number} 
                    onChange={e => setForm({...form, os_number: e.target.value.replace(/\D/g, '').slice(0, 10)})} 
                    className="w-full bg-[#020617] border border-slate-800 p-5 rounded-2xl text-white outline-none focus:border-cyan-500/50 font-bold text-sm font-mono transition-all placeholder:text-slate-900" 
                    placeholder="0000000000"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Título do Serviço *</label>
                  <input 
                    required
                    value={form.title} 
                    onChange={e => setForm({...form, title: e.target.value})} 
                    className="w-full bg-[#020617] border border-slate-800 p-5 rounded-2xl text-white outline-none focus:border-cyan-500/50 font-bold text-sm transition-all" 
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Cliente / Unidade *</label>
                  <input 
                    required
                    value={form.client_name} 
                    onChange={e => setForm({...form, client_name: e.target.value})} 
                    className="w-full bg-[#020617] border border-slate-800 p-5 rounded-2xl text-white outline-none focus:border-cyan-500/50 font-bold text-sm transition-all" 
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Contato Responsável</label>
                  <input 
                    value={form.client_contact} 
                    onChange={e => setForm({...form, client_contact: e.target.value})} 
                    className="w-full bg-[#020617] border border-slate-800 p-5 rounded-2xl text-white outline-none focus:border-cyan-500/50 font-bold text-sm transition-all" 
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Estado Operacional</label>
                  <select 
                    value={form.status} 
                    onChange={e => setForm({...form, status: e.target.value as any})}
                    className="w-full bg-[#020617] border border-slate-800 p-5 rounded-2xl text-white outline-none focus:border-cyan-500/50 font-bold text-sm appearance-none cursor-pointer"
                  >
                    <option value="agendado">Agendado</option>
                    <option value="executado">Executado</option>
                    <option value="pendente">Pendente</option>
                    <option value="atrasado">Atrasado</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Nível de Prioridade</label>
                  <select 
                    value={form.priority} 
                    onChange={e => setForm({...form, priority: e.target.value as any})}
                    className="w-full bg-[#020617] border border-slate-800 p-5 rounded-2xl text-white outline-none focus:border-cyan-500/50 font-bold text-sm appearance-none cursor-pointer"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Data Programada</label>
                  <input 
                    type="date"
                    value={form.scheduled_date} 
                    onChange={e => setForm({...form, scheduled_date: e.target.value})} 
                    className="w-full bg-[#020617] border border-slate-800 p-5 rounded-2xl text-white outline-none focus:border-cyan-500/50 font-bold text-sm transition-all" 
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Categoria Técnica</label>
                  <input 
                    value={form.category} 
                    onChange={e => setForm({...form, category: e.target.value})} 
                    className="w-full bg-[#020617] border border-slate-800 p-5 rounded-2xl text-white outline-none focus:border-cyan-500/50 font-bold text-sm transition-all" 
                  />
                </div>

                <div className="sm:col-span-2 space-y-4">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Técnico Encarregado</label>
                  <div className="relative">
                    <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700" />
                    <input 
                      value={form.assigned_to} 
                      onChange={e => setForm({...form, assigned_to: e.target.value})} 
                      className="w-full pl-14 pr-6 py-5 bg-[#020617] border border-slate-800 rounded-2xl text-white outline-none focus:border-cyan-500/50 font-bold text-sm transition-all" 
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-4">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Descrição Detalhada</label>
                  <textarea 
                    value={form.description} 
                    onChange={e => setForm({...form, description: e.target.value})} 
                    className="w-full bg-[#020617] border border-slate-800 p-8 rounded-3xl text-white outline-none focus:border-cyan-500/50 font-bold text-sm min-h-[180px] resize-none transition-all leading-relaxed" 
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-10 py-10 border-t border-white/5 bg-slate-950/90 shrink-0 flex items-center justify-end gap-6">
              <button 
                onClick={() => setShow(false)} 
                className="px-10 py-5 border border-slate-800 text-slate-400 font-black uppercase text-[11px] tracking-widest rounded-2xl hover:bg-white/5 hover:text-white transition-all"
              >
                CANCELAR
              </button>
              <button 
                onClick={() => mut.mutate(form)} 
                className="px-20 py-5 bg-cyan-600 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl shadow-[0_20px_50px_rgba(6,182,212,0.4)] hover:scale-105 active:scale-95 transition-all"
              >
                {isEditing ? 'ATUALIZAR' : 'REGISTRAR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}

function TrackingPage() {
  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: api.orders.list });
  return (
    <PageTransition>
      <div className="space-y-6 sm:space-y-8 pb-32">
        <header>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Track</h1>
          <p className="text-cyan-500 font-black text-[9px] sm:text-[10px] uppercase tracking-[0.3em] mt-1">Live Monitor</p>
        </header>
        <div className="grid gap-4">
          {orders.map((o: any) => (
            <div key={o.id} className="p-6 sm:p-8 bg-[#0b0f1a] border border-white/5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 group hover:border-cyan-500/20 transition-all shadow-xl">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <StatusBadge status={o.status} size="sm" />
                  <span className="text-[8px] sm:text-[9px] font-black text-slate-700 font-mono">#{o.os_number}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-cyan-400 transition-colors tracking-tighter leading-tight">{o.title}</h3>
                <p className="text-[9px] sm:text-[10px] text-slate-600 font-black uppercase mt-1 italic leading-none">{o.client_name}</p>
              </div>
              <div className="flex gap-4 sm:gap-10 items-center w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className={cn("w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center border-2 transition-all", i === 0 ? "border-cyan-500 bg-cyan-500/10 text-cyan-400" : "border-white/5 text-slate-800")}>
                      {i === 0 ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>
                  ))}
              </div>
            </div>
          ))}
          {orders.length === 0 && <p className="text-center py-20 text-slate-700 text-[10px] font-black uppercase tracking-widest italic">Sem dados ativos</p>}
        </div>
      </div>
    </PageTransition>
  );
}

function UsersPage() {
  const qc = useQueryClient();
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: api.users.list });
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<User>>({ full_name: '', email: '', role: 'user', department: '', password: '' });

  const mutCreate = useMutation({
    mutationFn: api.users.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setShowModal(false); }
  });

  const mutUpdate = useMutation({
    mutationFn: (data: { id: string, body: Partial<User> }) => api.users.update(data.id, data.body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setShowModal(false); }
  });

  const mutDelete = useMutation({
    mutationFn: api.users.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setShowDelete(null); }
  });

  const handleOpen = (user?: User) => {
    if (user) {
      setSelectedUser(user);
      setForm(user);
    } else {
      setSelectedUser(null);
      setForm({ full_name: '', email: '', role: 'user', department: '', password: '' });
    }
    setShowModal(true);
  };

  const save = () => {
    if (selectedUser) {
      mutUpdate.mutate({ id: selectedUser.id, body: form });
    } else {
      mutCreate.mutate(form);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6 sm:space-y-8 pb-32">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Equipe</h1>
            <p className="text-cyan-500 font-black text-[9px] sm:text-[10px] uppercase tracking-[0.3em] mt-1">Workforce Management</p>
          </div>
          <button onClick={() => handleOpen()} className="w-12 h-12 bg-cyan-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-cyan-600/20 hover:bg-cyan-500 transition-all active:scale-90"><UserPlus className="w-5 h-5" /></button>
        </header>

        <div className="hidden sm:block bg-[#0b0f1a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-[9px] font-black text-slate-600 uppercase tracking-widest bg-slate-900/40">
                <th className="px-8 py-6">Colaborador</th>
                <th className="px-8 py-6">Departamento</th>
                <th className="px-8 py-6">Cargo</th>
                <th className="px-8 py-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((u: any) => (
                <tr key={u.id} className="hover:bg-white/[0.02] group transition-all">
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-white leading-none">{u.full_name}</p>
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-tighter mt-1 leading-none">{u.email}</p>
                  </td>
                  <td className="px-8 py-6 text-xs text-slate-400 font-black uppercase tracking-widest">{u.department || 'Operacional'}</td>
                  <td className="px-8 py-6">
                    <span className="px-2 py-1 bg-white/5 text-cyan-400 rounded-lg text-[8px] font-black uppercase tracking-widest border border-white/10">{u.role}</span>
                  </td>
                  <td className="px-8 py-6 text-right space-x-2">
                    <button onClick={() => handleOpen(u)} className="p-2 text-slate-500 hover:text-white transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => setShowDelete(u.id)} className="p-2 text-slate-500 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:hidden">
           {users.map((u: any) => (
             <div key={u.id} className="bg-[#0b0f1a] border border-white/5 rounded-2xl p-5 space-y-4 shadow-xl">
               <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white leading-none truncate">{u.full_name}</p>
                    <p className="text-[8px] text-slate-500 uppercase font-black mt-1 leading-none">{u.email}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-white/5 text-cyan-400 rounded-md text-[7px] font-black uppercase border border-white/10 flex-shrink-0">{u.role}</span>
               </div>
               <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <span className="text-[8px] font-black text-slate-600 uppercase leading-none">{u.department || 'Operacional'}</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpen(u)} className="p-2 text-slate-500 hover:text-white"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => setShowDelete(u.id)} className="p-2 text-slate-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
               </div>
             </div>
           ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center p-4 sm:p-10 backdrop-blur-xl bg-black/85">
          <div className="bg-[#0b0f1a] border border-white/10 w-full max-w-lg rounded-[2.5rem] p-8 sm:p-12 shadow-[0_40px_150px_rgba(0,0,0,0.95)] animate-in zoom-in duration-300 overflow-y-auto max-h-[82vh] custom-scroll">
            <h2 className="text-xl sm:text-2xl font-black text-white mb-10 uppercase italic tracking-tighter leading-none">{selectedUser ? 'Editar' : 'Novo'} Colaborador</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="sm:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 leading-none">Nome Completo</label>
                <input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="w-full bg-[#020617] border border-slate-800 p-4.5 rounded-2xl text-white outline-none focus:border-cyan-500/60 font-bold text-xs" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 leading-none">E-mail Corporativo</label>
                <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full bg-[#020617] border border-slate-800 p-4.5 rounded-2xl text-white outline-none focus:border-cyan-500/60 font-bold text-xs" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 leading-none">Setor / Departamento</label>
                <input value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="w-full bg-[#020617] border border-slate-800 p-4.5 rounded-2xl text-white outline-none focus:border-cyan-500/60 font-bold text-xs" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 leading-none">Nível Hierárquico</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value as any})} className="w-full bg-[#020617] border border-slate-800 p-4.5 rounded-2xl text-white outline-none focus:border-cyan-500/60 font-bold text-xs appearance-none">
                  <option value="user">Colaborador</option>
                  <option value="analist">Analista</option>
                  <option value="admin">Administrador</option>
                  <option value="manager">Gestor Master</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 leading-none">Senha de Acesso</label>
                <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full bg-[#020617] border border-slate-800 p-4.5 rounded-2xl text-white outline-none focus:border-cyan-500/60 font-bold text-xs" />
              </div>
              <div className="sm:col-span-2 flex flex-col sm:flex-row gap-5 mt-10">
                <button onClick={() => setShowModal(false)} className="order-2 sm:order-1 flex-1 py-5 border border-slate-800 text-slate-500 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-white/5 transition-all">Cancelar</button>
                <button onClick={save} className="order-1 sm:order-2 flex-1 py-5 bg-cyan-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-[0_15px_40px_rgba(6,182,212,0.4)] active:scale-95 transition-all">SALVAR MEMBRO</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDelete && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 backdrop-blur-md bg-black/75">
           <div className="bg-[#0b0f1a] border border-red-500/20 w-full max-w-sm rounded-[2.5rem] p-10 text-center animate-in zoom-in duration-300 shadow-2xl">
              <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-6" />
              <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-4 leading-none">Excluir?</h3>
              <p className="text-xs text-slate-500 font-bold leading-relaxed mb-10 italic">Esta ação é irreversível e removerá o acesso.</p>
              <div className="flex gap-4">
                <button onClick={() => setShowDelete(null)} className="flex-1 py-4.5 border border-white/5 text-slate-500 font-black uppercase text-[10px] rounded-2xl transition-all">Voltar</button>
                <button onClick={() => mutDelete.mutate(showDelete)} className="flex-1 py-4.5 bg-red-600 text-white font-black uppercase text-[10px] rounded-2xl shadow-xl shadow-red-600/20 active:scale-95 transition-all">SIM</button>
              </div>
           </div>
        </div>
      )}
    </PageTransition>
  );
}

function ReportsPage() {
  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: api.orders.list });
  const [isGenerating, setIsGenerating] = useState(false);

  const generateCSV = () => {
    setIsGenerating(true);
    const headers = "ID,OS_Number,Titulo,Cliente,Status,Data_Criacao\n";
    const body = orders.map((o: any) => 
      `${o.id},${o.os_number},${o.title.replace(/,/g, '')},${o.client_name.replace(/,/g, '')},${o.status},${o.created_date}`
    ).join("\n");
    
    const blob = new Blob([headers + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `DBUG_Report_${format(new Date(), 'ddMMyy')}.csv`;
    link.click();
    setTimeout(() => setIsGenerating(false), 1000);
  };

  const generatePDF = () => {
    window.print();
  };

  return (
    <PageTransition>
      <div className="space-y-6 sm:space-y-8 pb-32">
        <header>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Relatórios</h1>
          <p className="text-cyan-500 font-black text-[9px] sm:text-[10px] uppercase tracking-[0.3em] mt-1">Audit Engine</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <button onClick={generateCSV} className="p-10 bg-[#0b0f1a] border border-white/5 rounded-3xl flex flex-col items-center gap-4 hover:border-cyan-500/30 transition-all group">
            <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <FileText className="w-8 h-8" />
            </div>
            <div className="text-center">
              <span className="text-white font-black text-sm uppercase tracking-widest block leading-none">Exportar CSV</span>
              <span className="text-[9px] text-slate-500 font-bold uppercase mt-2 italic tracking-widest leading-none">Data Dump</span>
            </div>
          </button>

          <button onClick={generatePDF} className="p-10 bg-[#0b0f1a] border border-white/5 rounded-3xl flex flex-col items-center gap-4 hover:border-red-500/30 transition-all group">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
              <FileDown className="w-8 h-8" />
            </div>
            <div className="text-center">
              <span className="text-white font-black text-sm uppercase tracking-widest block leading-none">Gerar PDF</span>
              <span className="text-[9px] text-slate-500 font-bold uppercase mt-2 italic tracking-widest leading-none">Printer Optimized</span>
            </div>
          </button>
        </div>
      </div>
    </PageTransition>
  );
}

// --- MAIN APP ---
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.auth.me().then(u => { setUser(u); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
    </div>
  );

  if (!user) return <LoginPage onLoginSuccess={setUser} />;

  const handleLogout = () => { api.auth.logout(); setUser(null); };

  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-cyan-500/30 overflow-x-hidden">
          <main className="px-4 sm:px-10 py-8 sm:py-16 max-w-6xl mx-auto">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/service-orders" element={<ServiceOrdersPage />} />
              <Route path="/tracking" element={<TrackingPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/logs" element={<LogsPage user={user} />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
          <BottomNav user={user} onLogout={handleLogout} />
        </div>
      </HashRouter>
    </QueryClientProvider>
  );
}

// --- LOGS & PROFILE ---

function LogsPage({ user }: { user: User }) {
  const { data: logs = [] } = useQuery({ queryKey: ['logs'], queryFn: api.logs.list });
  if (user.role !== 'manager') return <div className="p-20 text-center font-black uppercase text-red-400 italic text-2xl tracking-tighter">Security Violation</div>;
  return (
    <PageTransition>
      <div className="space-y-8 pb-32">
        <header>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Logs</h1>
          <p className="text-cyan-500 font-black text-[9px] uppercase tracking-[0.3em] mt-1">Audit Stream</p>
        </header>
        <div className="bg-[#0b0f1a] border border-white/5 rounded-3xl overflow-hidden max-h-[600px] overflow-y-auto custom-scroll shadow-2xl">
          {logs.map((l: any) => (
            <div key={l.id} className="p-6 border-b border-white/[0.03] hover:bg-white/[0.02] transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-black text-slate-600 font-mono italic leading-none">{format(parseISO(l.created_date), "HH:mm:ss")}</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-cyan-600 leading-none">{l.severity}</span>
              </div>
              <p className="text-xs font-bold text-slate-400 leading-tight">{l.description}</p>
            </div>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}

function ProfilePage() {
  const [u, setU] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { api.auth.me().then(setU); }, []);

  const save = async () => {
    setSaving(true);
    await api.auth.updateProfile({ nickname: u.nickname, description: u.description, password: u.password });
    setSaving(false);
  };

  if (!u) return null;
  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-8 pb-32">
        <header className="text-center">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter uppercase italic leading-none">Perfil</h1>
          <p className="text-cyan-500 font-black text-[9px] uppercase tracking-[0.3em] mt-1">Operator Profile</p>
        </header>
        <div className="bg-[#0b0f1a] border border-white/5 rounded-3xl p-8 sm:p-12 space-y-8 shadow-2xl">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none ml-1">Nickname</label>
            <input value={u.nickname || ''} onChange={e => setU({...u, nickname: e.target.value})} className="w-full bg-[#020617] border border-slate-800 p-4 rounded-xl text-white outline-none focus:border-cyan-500 font-bold text-xs" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none ml-1">Key</label>
            <input type="password" value={u.password || ''} onChange={e => setU({...u, password: e.target.value})} className="w-full bg-[#020617] border border-slate-800 p-4 rounded-xl text-white outline-none focus:border-cyan-500 font-bold text-xs" />
          </div>
          <button onClick={save} disabled={saving} className="w-full py-5 bg-cyan-600 text-white font-black uppercase text-[10px] tracking-widest rounded-xl flex items-center justify-center gap-3 shadow-[0_15px_40px_rgba(6,182,212,0.3)] active:scale-95 transition-all">
            {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <><Save className="w-4 h-4" /> Sync Records</>}
          </button>
        </div>
      </div>
    </PageTransition>
  );
}

function LoginPage({ onLoginSuccess }: { onLoginSuccess: (u: User) => void }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      const u = await api.auth.login(email, pass);
      onLoginSuccess(u);
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px]" />
      <div className="w-full max-w-md relative animate-in fade-in zoom-in duration-700">
        <div className="bg-[#0b0f1a]/80 backdrop-blur-2xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-cyan-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-cyan-500/20"><ShieldCheck className="w-8 h-8 text-white" /></div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">DBUG <span className="text-cyan-500">O.S.</span></h1>
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] mt-2 leading-none">Industrial Access</p>
          </div>
          <form onSubmit={handle} className="space-y-6">
            {err && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-[9px] font-black text-center uppercase tracking-widest">{err}</div>}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-600 uppercase ml-1 tracking-widest leading-none">Identity</label>
              <div className="relative">
                 <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                 <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-[#020617] border border-slate-800 rounded-xl text-white focus:border-cyan-500 outline-none text-xs font-bold transition-all" placeholder="user@dbug.com.br" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-600 uppercase ml-1 tracking-widest leading-none">Key</label>
              <div className="relative">
                 <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                 <input type="password" required value={pass} onChange={e => setPass(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-[#020617] border border-slate-800 rounded-xl text-white focus:border-cyan-500 outline-none text-xs font-bold transition-all" placeholder="••••••••" />
              </div>
            </div>
            <button disabled={loading} className="w-full py-5 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-xl text-white font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-xl shadow-cyan-600/20 active:scale-95 transition-all">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Access System <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
