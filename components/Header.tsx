
import React, { useState } from 'react';
import { Menu, Bell, LogOut } from 'lucide-react';
import { User, cn } from '../shared';

export default function Header({ user, onMenuToggle, onLogout }: { user: User, onMenuToggle: () => void, onLogout: () => void }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const initials = user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <header className="h-16 bg-[#0b0f1a] border-b border-slate-800/50 flex items-center justify-between px-6 sticky top-0 z-30">
      <button onClick={onMenuToggle} className="lg:hidden p-2 text-slate-400 hover:text-white"><Menu className="w-5 h-5" /></button>
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-400 hover:text-white relative"><Bell className="w-5 h-5" /></button>
        <div className="relative">
          <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center gap-3 hover:bg-slate-800 p-1 rounded-lg transition-all">
            <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center text-white text-xs font-black">{initials}</div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-bold text-white leading-none">{user.nickname || user.full_name}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{user.role}</p>
            </div>
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-[#161b26] border border-slate-800 rounded-xl shadow-2xl py-2 z-50">
              <button onClick={onLogout} className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 flex items-center gap-2 text-sm font-bold"><LogOut className="w-4 h-4" /> Sair</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
