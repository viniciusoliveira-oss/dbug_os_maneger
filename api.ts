
import { format } from 'date-fns';

// --- TYPES & INTERFACES ---
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
  password?: string;
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

// --- MOCK DATABASE CONFIG ---
const STORAGE = {
  ORDERS: 'os_db_orders',
  USERS: 'os_db_users',
  LOGS: 'os_db_logs',
  ME: 'os_db_me'
};

const defaultUsers: User[] = [
  { id: 'u_vini', full_name: 'Vinicius Oliveira', email: 'vinicius.oliveira@dbug.com.br', role: 'manager', is_active: true, nickname: 'Vini', password: '07/02/2008' },
  { id: 'u_master', full_name: 'Master Admin', email: 'master@gmail.com', role: 'manager', is_active: true, password: 'admin' }
];

const get = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
const set = (key: string, val: any) => localStorage.setItem(key, JSON.stringify(val));

// Initialize Database
if (get(STORAGE.USERS).length === 0) {
  set(STORAGE.USERS, defaultUsers);
}

// --- API SERVICE ---
export const api = {
  auth: {
    me: async () => JSON.parse(localStorage.getItem(STORAGE.ME) || 'null'),
    login: async (email: string, pass: string) => {
      const users = get(STORAGE.USERS);
      const user = users.find((u: User) => u.email === email && u.password === pass);
      if (!user) throw new Error('E-mail ou senha inválidos');
      if (!user.is_active) throw new Error('Conta desativada');
      localStorage.setItem(STORAGE.ME, JSON.stringify(user));
      return user;
    },
    logout: () => localStorage.removeItem(STORAGE.ME),
    updateProfile: async (data: Partial<User>) => {
      const current = JSON.parse(localStorage.getItem(STORAGE.ME) || 'null');
      const users = get(STORAGE.USERS);
      const idx = users.findIndex((u: User) => u.id === current.id);
      users[idx] = { ...users[idx], ...data };
      set(STORAGE.USERS, users);
      localStorage.setItem(STORAGE.ME, JSON.stringify(users[idx]));
      return users[idx];
    }
  },
  users: {
    list: async () => get(STORAGE.USERS),
    create: async (data: any) => {
      const users = get(STORAGE.USERS);
      const newUser = { ...data, id: 'u_' + Math.random().toString(36).substr(2, 9), is_active: true };
      users.push(newUser);
      set(STORAGE.USERS, users);
      return newUser;
    },
    update: async (id: string, data: Partial<User>) => {
      const users = get(STORAGE.USERS);
      const idx = users.findIndex((u: User) => u.id === id);
      if (idx === -1) throw new Error('Usuário não encontrado');
      users[idx] = { ...users[idx], ...data };
      set(STORAGE.USERS, users);
      return users[idx];
    },
    delete: async (id: string) => {
      const users = get(STORAGE.USERS);
      set(STORAGE.USERS, users.filter((u: User) => u.id !== id));
    }
  },
  orders: {
    list: async () => get(STORAGE.ORDERS),
    create: async (data: any) => {
      const orders = get(STORAGE.ORDERS);
      const newOrder = { ...data, id: Math.random().toString(36).substr(2, 9), created_date: new Date().toISOString() };
      orders.push(newOrder);
      set(STORAGE.ORDERS, orders);
      return newOrder;
    },
    update: async (id: string, data: any) => {
      const orders = get(STORAGE.ORDERS);
      const idx = orders.findIndex((o: any) => o.id === id);
      orders[idx] = { ...orders[idx], ...data };
      set(STORAGE.ORDERS, orders);
      return orders[idx];
    },
    delete: async (id: string) => set(STORAGE.ORDERS, get(STORAGE.ORDERS).filter((o: any) => o.id !== id))
  },
  logs: {
    list: async () => get(STORAGE.LOGS).reverse(),
    add: async (log: Partial<ActivityLog>) => {
      const logs = get(STORAGE.LOGS);
      logs.push({ ...log, id: Date.now().toString(), created_date: new Date().toISOString() });
      set(STORAGE.LOGS, logs);
    }
  }
};

export const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
