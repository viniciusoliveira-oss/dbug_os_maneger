
import React from 'react';

// --- TYPES ---
export type OSStatus = 'agendado' | 'executado' | 'pendente' | 'atrasado';
export type OSPriority = 'baixa' | 'media' | 'alta' | 'urgente';
export type UserRole = 'manager' | 'admin' | 'user' | 'analist';

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department?: string;
  phone?: string;
  is_active: boolean;
  nickname?: string;
  password?: string; // Campo de senha adicionado
  description?: string;
}

export interface ServiceOrder {
  id: string;
  os_number: string;
  title: string;
  description: string;
  client_name: string;
  client_contact: string;
  status: OSStatus;
  priority: OSPriority;
  scheduled_date: string;
  executed_date?: string;
  category: string;
  assigned_to: string;
  created_date: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  is_read: boolean;
  created_date: string;
}

export interface ActivityLog {
  id: string;
  action_type: string;
  user_email: string;
  user_name?: string;
  description: string;
  old_value?: string;
  new_value?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  created_date: string;
}

// --- UTILS ---
export const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

// --- UI COMPONENTS ---
const statusConfig = {
  agendado: { label: 'Agendado', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  executado: { label: 'Executado', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  pendente: { label: 'Pendente', bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  atrasado: { label: 'Atrasado', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' }
};

export function StatusBadge({ status, size = 'default' }: { status: OSStatus; size?: 'default' | 'sm' }) {
  const cfg = statusConfig[status] || statusConfig.pendente;
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border font-bold whitespace-nowrap",
      cfg.bg, cfg.text, cfg.border,
      size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", cfg.text.replace('text-', 'bg-'))} />
      {cfg.label}
    </span>
  );
}
