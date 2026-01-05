
import React, { useState } from 'react';
import { Mail, Lock, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../api';
import { User } from '../shared';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const user = await api.auth.login(email, password);
      
      // Registrar log de login
      await api.logs.add({
        action_type: 'login',
        user_email: user.email,
        user_name: user.full_name,
        description: `Usuário acessou o sistema`,
        severity: 'info'
      });

      // Atualiza o estado global no App.tsx para transição instantânea
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Falha na autenticação');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-1/2 left-[-20%] w-[60%] h-[60%] bg-cyan-900/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px]" />

      <div className="w-full max-w-md relative animate-in fade-in zoom-in duration-500">
        <div className="relative bg-[#0b0f1a]/80 backdrop-blur-2xl border border-slate-800/50 p-8 sm:p-10 rounded-3xl shadow-2xl">
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 mb-6 rounded-xl bg-cyan-500 shadow-lg shadow-cyan-500/30">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            
            <div className="flex items-center justify-center gap-3 mb-2">
              <h1 className="text-3xl font-black text-white tracking-tight uppercase">
                DBUG O.S. <span className="text-transparent bg-clip-text bg-white">MANEGER</span>
              </h1>
              <div className="w-8 h-8 bg-cyan-400"></div>
            </div>
            
            <p className="text-slate-500 font-medium text-[10px] uppercase tracking-wide">
              Plataforma Inteligente de Gestão Industrial
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold text-center">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Acesso Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@ospro.com"
                  className="w-full pl-12 pr-4 py-4 bg-[#050811] border border-slate-800/50 rounded-xl text-white placeholder:text-slate-800 focus:outline-none focus:border-cyan-500/50 transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Chave de Segurança</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-[#050811] border border-slate-800/50 rounded-xl text-white placeholder:text-slate-800 focus:outline-none focus:border-cyan-500/50 transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative group overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg shadow-lg shadow-cyan-500/20"
            >
              <div className="relative flex items-center justify-center gap-3 py-4 text-white font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Iniciar Sessão
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>
        </div>
        
        <p className="mt-8 text-center text-slate-700 text-[10px] font-bold uppercase tracking-widest">
          © 2024 DBUG O.S. MANEGER • Sistema de Auditoria Ativo
        </p>
      </div>
    </div>
  );
}
