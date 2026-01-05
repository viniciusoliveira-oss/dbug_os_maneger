
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users as UsersIcon, 
  Search, 
  Shield,
  Mail,
  Loader2,
  Edit2,
  UserPlus,
  X,
  Trash2,
  AlertTriangle,
  Lock
} from 'lucide-react';
import { api } from '../api';
import { User, UserRole, cn } from '../shared';

const roleConfig: Record<UserRole, { label: string, color: string }> = {
  manager: { label: 'Manager', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  admin: { label: 'Administrador', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  user: { label: 'Usuário', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  analist: { label: 'Analista', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' }
};

export default function Users() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<User>>({});
  const [inviteData, setInviteData] = useState({ email: '', full_name: '', role: 'user' as UserRole, password: '' });

  const queryClient = useQueryClient();

  useEffect(() => {
    api.auth.me().then(setCurrentUser);
  }, []);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.users.list()
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<User> }) => api.users.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowModal(false);
      setSelectedUser(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
        // Mocking delete for users
        const existing = JSON.parse(localStorage.getItem('os_db_users') || '[]');
        const filtered = existing.filter((u: any) => u.id !== id);
        localStorage.setItem('os_db_users', JSON.stringify(filtered));
        return Promise.resolve(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowDeleteDialog(false);
      setSelectedUser(null);
    }
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: typeof inviteData) => {
      const existing = JSON.parse(localStorage.getItem('os_db_users') || '[]');
      const newUser = {
          ...data,
          id: 'u' + Date.now(),
          is_active: true
      };
      existing.push(newUser);
      localStorage.setItem('os_db_users', JSON.stringify(existing));
      return newUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowInviteModal(false);
      setInviteData({ email: '', full_name: '', role: 'user', password: '' });
    }
  });

  const canEditRole = ['manager', 'admin'].includes(currentUser?.role || '');
  const canEditAllRoles = currentUser?.role === 'manager';

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      role: user.role,
      department: user.department || '',
      phone: user.phone || '',
      is_active: user.is_active,
      password: '' // Reset password field on modal open
    });
    setShowModal(true);
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-2xl flex items-center justify-center shadow-xl shadow-cyan-500/20">
              <UsersIcon className="w-6 h-6 text-white" />
            </div>
            Gestão de Equipe
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Controle de acessos e permissões do sistema</p>
        </div>

        {canEditRole && (
          <button 
            onClick={() => setShowInviteModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-600/20 transition-all duration-300 active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            Adicionar Usuário
          </button>
        )}
      </div>

      <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 backdrop-blur-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            placeholder="Buscar por nome ou email corporativo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
        </div>
      </div>

      <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl overflow-hidden backdrop-blur-sm shadow-2xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <UsersIcon className="w-16 h-16 text-slate-700 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-bold">Nenhum usuário localizado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-700">
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Colaborador</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Nível</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Departamento</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-700/30 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 text-cyan-400 font-bold">
                           {getInitials(u.full_name)}
                        </div>
                        <div>
                           <p className="text-white font-bold">{u.full_name}</p>
                           <p className="text-xs text-slate-500 font-medium">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn("px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest", roleConfig[u.role].color)}>
                        {roleConfig[u.role].label}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-slate-400 font-semibold text-sm">{u.department || '-'}</td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", u.is_active ? "bg-emerald-500" : "bg-red-500")} />
                        <span className={cn("text-xs font-bold", u.is_active ? "text-emerald-400" : "text-red-400")}>
                          {u.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         {canEditRole && (
                            <button
                              onClick={() => handleEdit(u)}
                              className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {canEditRole && u.id !== currentUser?.id && (
                            <button
                              onClick={() => {
                                setSelectedUser(u);
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
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="relative bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-black text-white mb-8 uppercase tracking-tight">Editar Perfil</h2>
            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Nível de Acesso</label>
                  <select 
                    value={formData.role} 
                    onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 focus:outline-none"
                  >
                    {canEditAllRoles && <option value="manager">Manager</option>}
                    <option value="admin">Administrador</option>
                    <option value="analist">Analista</option>
                    <option value="user">Usuário</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Departamento</label>
                  <input
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 focus:outline-none"
                  />
               </div>
               
               {/* Campo de Senha para Admin */}
               <div className="space-y-2 pt-4 border-t border-slate-800">
                  <div className="flex items-center gap-2 mb-2">
                     <Lock className="w-3.5 h-3.5 text-cyan-400" />
                     <label className="text-xs font-black text-white uppercase tracking-widest">Redefinir Senha</label>
                  </div>
                  <input
                    type="text"
                    placeholder="Deixe vazio para manter a atual"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 focus:outline-none"
                  />
               </div>

               <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Status da Conta</label>
                  <select 
                    value={formData.is_active ? 'active' : 'inactive'} 
                    onChange={(e) => setFormData({...formData, is_active: e.target.value === 'active'})}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 focus:outline-none"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
               </div>
            </div>
            <div className="flex gap-3 mt-10">
               <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 border border-slate-700 text-slate-300 font-bold rounded-xl hover:bg-slate-800">Cancelar</button>
               <button onClick={() => {
                   const updateData = { ...formData };
                   if (!updateData.password) delete updateData.password;
                   selectedUser && updateMutation.mutate({ id: selectedUser.id, data: updateData });
               }} className="flex-1 px-4 py-3 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-500">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowInviteModal(false)} />
          <div className="relative bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl shadow-2xl p-8">
             <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400">
                    <UserPlus className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Novo Usuário</h2>
             </div>
             <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Nome Completo</label>
                  <input
                    value={inviteData.full_name}
                    onChange={(e) => setInviteData({...inviteData, full_name: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 focus:outline-none"
                    placeholder="Ex: Roberto Silva"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">E-mail</label>
                  <input
                    type="email"
                    value={inviteData.email}
                    onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 focus:outline-none"
                    placeholder="email@ospro.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Nível Inicial</label>
                      <select 
                        value={inviteData.role} 
                        onChange={(e) => setInviteData({...inviteData, role: e.target.value as UserRole})}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 focus:outline-none"
                      >
                        {canEditAllRoles && <option value="manager">Manager</option>}
                        <option value="admin">Administrador</option>
                        <option value="analist">Analista</option>
                        <option value="user">Usuário</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Senha Inicial</label>
                      <input
                        type="text"
                        value={inviteData.password}
                        onChange={(e) => setInviteData({...inviteData, password: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-cyan-500/50 focus:outline-none"
                        placeholder="Mín 6 chars"
                      />
                    </div>
                </div>
             </div>
             <div className="flex gap-3 mt-10">
               <button onClick={() => setShowInviteModal(false)} className="flex-1 px-4 py-3 border border-slate-700 text-slate-300 font-bold rounded-xl hover:bg-slate-800">Cancelar</button>
               <button onClick={() => inviteMutation.mutate(inviteData)} className="flex-1 px-4 py-3 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-500">Cadastrar</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={() => setShowDeleteDialog(false)} />
          <div className="relative bg-slate-900 border border-red-500/30 w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center gap-4 mb-6 text-red-500">
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Excluir Usuário</h3>
            </div>
            <p className="text-slate-400 font-medium mb-8">
              Você tem certeza que deseja excluir o colaborador <span className="text-white font-bold">"{selectedUser?.full_name}"</span>? <br/> Esta ação é irreversível.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 px-4 py-3 border border-slate-700 text-slate-300 font-bold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Manter
              </button>
              <button
                onClick={() => selectedUser && deleteMutation.mutate(selectedUser.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl transition-all disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
