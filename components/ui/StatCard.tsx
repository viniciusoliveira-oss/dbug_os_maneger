
import React from 'react';
import { cn } from "../../utils";
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: number;
  trendValue?: string;
  iconBgColor?: string;
  iconColor?: string;
}

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue,
  iconBgColor = 'bg-cyan-500/20',
  iconColor = 'text-cyan-400'
}: StatCardProps) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 hover:border-cyan-500/30 transition-all duration-300">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-slate-400 text-sm font-medium">{title}</p>
        </div>
        <div className={cn("p-2 rounded-lg", iconBgColor)}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
      </div>
      
      <div className="space-y-1">
        <p className="text-3xl font-bold text-white">{value}</p>
        
        {(trend !== undefined || subtitle) && (
          <div className="flex items-center gap-2">
            {trend !== undefined && (
              <span className={cn(
                "flex items-center text-sm font-medium",
                trend >= 0 ? "text-emerald-400" : "text-red-400"
              )}>
                {trend >= 0 ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1" />
                )}
                {trend >= 0 ? '+' : ''}{trendValue || trend}%
              </span>
            )}
            {subtitle && (
              <span className="text-slate-500 text-sm">{subtitle}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
