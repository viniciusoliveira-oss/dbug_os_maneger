
import React from 'react';
import { AlertCircle, LogOut, ArrowRight } from 'lucide-react';

interface UserNotRegisteredErrorProps {
  onLogout: () => void;
}

export default function UserNotRegisteredError({ onLogout }: UserNotRegisteredErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 px-6 py-12">
      <div className="max-w-md w-full relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-orange-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
        <div className="relative bg-slate-900 border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-8 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500 animate-bounce">
                <AlertCircle className="w-10 h-10" />
            </div>
            
            <h1 className="text-3xl font-black text-white mb-4 tracking-tight">Acesso Bloqueado</h1>
            <p className="text-slate-400 font-medium mb-10 leading-relaxed">
                Sua conta está inativa ou você não possui permissões suficientes. Por favor, entre em contato com a administração.
            </p>

            <div className="p-6 bg-slate-950/60 rounded-3xl text-left space-y-4 mb-10 border border-slate-800">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Próximos Passos</p>
                <ul className="space-y-3">
                   <li className="flex items-start gap-3 text-sm font-bold text-slate-300">
                      <ArrowRight className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                      Valide se o e-mail logado é o corporativo
                   </li>
                   <li className="flex items-start gap-3 text-sm font-bold text-slate-300">
                      <ArrowRight className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                      Solicite a ativação no portal de TI
                   </li>
                </ul>
            </div>

            <button 
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl shadow-xl shadow-red-600/20 transition-all duration-300 active:scale-95"
            >
                <LogOut className="w-5 h-5" />
                Sair do Sistema
            </button>
        </div>
      </div>
    </div>
  );
}
