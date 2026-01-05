
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../utils';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Eye, 
  Users, 
  FileDown,
  LogOut,
  ChevronLeft,
  Menu,
  ScrollText
} from 'lucide-react';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'dashboard', roles: ['manager', 'admin', 'user', 'analist'] },
  { name: 'Ordens de Serviço', icon: ClipboardList, page: 'service-orders', roles: ['manager', 'admin', 'user', 'analist'] },
  { name: 'Acompanhamento', icon: Eye, page: 'tracking', roles: ['manager', 'admin', 'user', 'analist'] },
  { name: 'Usuários', icon: Users, page: 'users', roles: ['manager', 'admin'] },
  { name: 'Relatórios', icon: FileDown, page: 'reports', roles: ['manager', 'admin', 'analist'] },
  { name: 'Logs', icon: ScrollText, page: 'logs', roles: ['manager'] },
];

interface SidebarProps {
  userRole: string;
  collapsed: boolean;
  onToggle: () => void;
  onLogout: () => void;
}

export default function Sidebar({ 
  userRole, 
  collapsed, 
  onToggle,
  onLogout 
}: SidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname.replace('/', '');

  const filteredMenu = menuItems.filter(item => 
    item.roles.includes(userRole || 'user')
  );

  return (
    <>
      <div 
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity",
          collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
        onClick={onToggle}
      />
      
      <aside className={cn(
        "fixed left-0 top-0 h-full bg-slate-900 border-r border-slate-800 z-50 transition-all duration-300 flex flex-col",
        collapsed ? "w-0 lg:w-20 -translate-x-full lg:translate-x-0" : "w-64"
      )}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          {!collapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-8 bg-white rounded flex items-center justify-center shadow-lg">
                <span className="text-[#06b6d4] font-black text-[10px]">DBUG</span>
              </div>
              <span className="font-bold text-white tracking-tight uppercase text-[10px]">DBUG O.S. MANEGER</span>
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg hidden lg:flex transition-colors"
          >
            {collapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {filteredMenu.map((item) => {
            const isActive = currentPath === item.page;
            return (
              <Link
                key={item.name}
                to={`/${item.page}`}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                )}
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110", collapsed && "mx-auto")} />
                {!collapsed && <span className="font-medium text-sm">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 mt-auto border-t border-slate-800">
          <button
            onClick={onLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors",
              collapsed ? "justify-center" : "justify-start"
            )}
          >
            <LogOut className="w-5 h-5" />
            {!collapsed && <span className="font-medium text-sm">Sair</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
