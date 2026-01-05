
export type OSStatus = 'agendado' | 'executado' | 'pendente' | 'atrasado';
export type OSPriority = 'baixa' | 'media' | 'alta' | 'urgente';
export type UserRole = 'manager' | 'admin' | 'user' | 'analist';

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
  notes: string;
  // Audit fields used by the app logic
  created_date: string;
  updated_date: string;
  created_by: string;
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  department?: string;
  phone?: string;
  is_active: boolean;
  nickname?: string;
  // Added description property for user profile
  description?: string;
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
  action_type: 'create' | 'update' | 'delete' | 'status_change' | 'error' | 'login' | 'logout';
  entity_type?: string;
  entity_id?: string;
  user_email: string;
  user_name?: string;
  description: string;
  old_value?: string;
  new_value?: string;
  error_message?: string;
  ip_address?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  created_date: string;
}