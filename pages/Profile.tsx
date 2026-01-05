
import React, { useState, useEffect } from 'react';
import { User as UserIcon, Save, ArrowLeft, Loader2, CheckCircle, Lock } from 'lucide-react';
import { api } from '../api';
import { User, cn } from '../shared';

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState('');
  const [description, setDescription] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.auth.me().then(u => {
      if (u) {
        setUser(u);
        setNickname(u.nickname || '');
        setDescription(u.description || '');
      }
    });
  }, []);

  const wordCount = description.trim() ? description.trim().split(/\s+/).length : 0;
  const isDescriptionValid = wordCount <= 100;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isDescriptionValid) {
      setError('Descrição excede o limite de 100 palavras.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsSaving(true);
    try {
      const updateData: Partial<User> = { nickname, description };
      if (newPassword) {
        updateData.password = newPassword;
      }
      
      const updated = await api.auth.updateProfile(updateData);
      setUser(updated);
      setSaved(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar alterações');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 p-4 lg:p-8 flex items-center justify-center">
      <div className="w-full max-w-2xl relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-3xl blur opacity-50" />
        
        <div className="relative bg-[#0b0f1a] border border-slate-800 p-8 lg:p-10 rounded-3xl shadow-2xl">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 bg-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <UserIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white uppercase tracking-tight">Meu Perfil</h1>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{user.full_name}</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-8">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold text-center">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Apelido (Nickname)</label>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Como quer ser chamado..."
                  className="w-full px-5 py-4 bg-[#050811] border border-slate-800 rounded-2xl text-white placeholder:text-slate-800 focus:outline-none focus:border-cyan-500/50 transition-all text-sm font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">E-mail</label>
                <input
                  disabled
                  value={user.email}
                  className="w-full px-5 py-4 bg-[#050811] border border-slate-800 rounded-2xl text-slate-600 text-sm font-bold cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-800">
               <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  <p className="text-[10px] font-black text-white uppercase tracking-widest">Segurança (Alterar Senha)</p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Nova Senha</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Deixe em branco para não alterar"
                      className="w-full px-5 py-4 bg-[#050811] border border-slate-800 rounded-2xl text-white placeholder:text-slate-800 focus:outline-none focus:border-cyan-500/50 transition-all text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Confirmar Senha</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="w-full px-5 py-4 bg-[#050811] border border-slate-800 rounded-2xl text-white placeholder:text-slate-800 focus:outline-none focus:border-cyan-500/50 transition-all text-sm font-bold"
                    />
                  </div>
               </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end ml-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Descrição do Perfil</label>
                <span className={cn(
                  "text-[10px] font-bold tracking-tight",
                  isDescriptionValid ? "text-slate-600" : "text-red-500"
                )}>
                  {wordCount}/100 palavras
                </span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Conte um pouco sobre você..."
                className={cn(
                  "w-full px-5 py-4 bg-[#050811] border border-slate-800 rounded-2xl text-white placeholder:text-slate-800 focus:outline-none transition-all text-sm min-h-[120px] leading-relaxed",
                  !isDescriptionValid && "border-red-500/50"
                )}
              />
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="flex-1 px-8 py-4 bg-slate-900 border border-slate-800 text-slate-400 font-black text-xs uppercase tracking-widest rounded-2xl hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
              
              <button
                type="submit"
                disabled={isSaving || !isDescriptionValid}
                className="flex-[2] relative group overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl shadow-xl shadow-cyan-500/10 disabled:opacity-50"
              >
                <div className="relative flex items-center justify-center gap-3 py-4 px-8 text-white font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98]">
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : saved ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Salvo com Sucesso!
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar Alterações
                    </>
                  )}
                </div>
              </button>
            </div>
          </form>
        </div>

        <p className="mt-8 text-center text-slate-700 text-[10px] font-black uppercase tracking-widest">
          Sistema de Gestão Industrial • v1.0.5
        </p>
      </div>
    </div>
  );
}
