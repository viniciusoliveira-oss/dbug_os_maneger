
import React from 'react';
import { cn } from "../../utils";

const statusConfig = {
  agendado: {
    label: 'Agendado',
    bgColor: 'bg-blue-500/20',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30'
  },
  executado: {
    label: 'Executado',
    bgColor: 'bg-emerald-500/20',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30'
  },
  pendente: {
    label: 'Pendente',
    bgColor: 'bg-orange-500/20',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500/30'
  },
  atrasado: {
    label: 'Atrasado',
    bgColor: 'bg-red-500/20',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/30'
  }
};

interface StatusBadgeProps {
  status: 'agendado' | 'executado' | 'pendente' | 'atrasado';
  size?: 'default' | 'sm';
}

export default function StatusBadge({ status, size = 'default' }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pendente;
  
  return (
    <span className={cn(
      "inline-flex items-center rounded-full border font-medium whitespace-nowrap",
      config.bgColor,
      config.textColor,
      config.borderColor,
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
    )}>
      <span className={cn(
        "rounded-full mr-1.5",
        config.textColor.replace('text-', 'bg-'),
        size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'
      )} />
      {config.label}
    </span>
  );
}
