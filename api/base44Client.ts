
import { ServiceOrder, User, ActivityLog, UserRole, Notification } from '../types';

const STORAGE_KEYS = {
  ORDERS: 'os_manager_orders',
  USERS: 'os_manager_users',
  LOGS: 'os_manager_logs',
  NOTIFICATIONS: 'os_manager_notifications',
  CURRENT_USER: 'os_manager_current_user'
};

const defaultUsers: User[] = [
  { id: 'u0', full_name: 'Master Admin', email: 'master@gmail.com', role: 'manager', is_active: true, department: 'TI', nickname: 'Boss' },
  { id: 'u1', full_name: 'Admin Master', email: 'admin@ospro.com', role: 'manager', is_active: true, department: 'Diretoria' },
  { id: 'u2', full_name: 'João Técnico', email: 'joao@ospro.com', role: 'user', is_active: true, department: 'Manutenção' },
  { id: 'u3', full_name: 'Ana Analista', email: 'ana@ospro.com', role: 'analist', is_active: true, department: 'Qualidade' }
];

const initializeStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
    const mockOrders: ServiceOrder[] = [
      {
        id: '1',
        os_number: '1001',
        title: 'Manutenção de Servidor',
        description: 'Verificação periódica dos sistemas',
        client_name: 'Tech Solutions',
        client_contact: '(11) 99999-9999',
        status: 'agendado',
        priority: 'alta',
        scheduled_date: new Date().toISOString().split('T')[0],
        created_date: new Date(Date.now() - 86400000).toISOString(),
        updated_date: new Date().toISOString(),
        category: 'Infra',
        assigned_to: 'João Silva',
        created_by: 'Admin',
        notes: ''
      }
    ];
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(mockOrders));
  }

  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
  }

  if (!localStorage.getItem(STORAGE_KEYS.LOGS)) {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([]));
  }

  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
  }
};

initializeStorage();

export const base44 = {
  auth: {
    me: async (): Promise<User | null> => {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return stored ? JSON.parse(stored) : null;
    },
    login: async (email: string, password?: string): Promise<User> => {
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      const user = users.find((u: User) => u.email === email && u.is_active);
      
      if (!user) throw new Error('Usuário não encontrado ou inativo.');
      
      if (password !== '12345678') {
        throw new Error('Senha incorreta.');
      }
      
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      return user;
    },
    logout: () => {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    },
    // Fix: Added updateProfile method as required by Profile.tsx
    updateProfile: async (data: Partial<User>): Promise<User> => {
      const current = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (!current) throw new Error('Não autenticado');
      const user = JSON.parse(current);
      
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      const index = users.findIndex((u: any) => u.id === user.id);
      if (index === -1) throw new Error('Usuário não encontrado');
      
      const updated = { ...users[index], ...data };
      users[index] = updated;
      
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
      return updated;
    }
  },
  entities: {
    ServiceOrder: {
      list: async (sort?: string, limit?: number): Promise<ServiceOrder[]> => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
        if (sort === '-created_date') {
          data.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
        }
        return limit ? data.slice(0, limit) : data;
      },
      create: async (data: Partial<ServiceOrder>): Promise<ServiceOrder> => {
        const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
        const newOrder = {
          ...data,
          id: Math.random().toString(36).substr(2, 9),
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString(),
        } as ServiceOrder;
        orders.push(newOrder);
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
        
        // Add Notification
        await base44.notifications.add({
          title: 'Nova Demanda',
          message: `O.S. #${newOrder.os_number} foi criada com sucesso.`,
          type: 'info'
        });
        
        return newOrder;
      },
      update: async (id: string, data: Partial<ServiceOrder>): Promise<ServiceOrder> => {
        const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
        const idx = orders.findIndex((o: any) => o.id === id);
        if (idx === -1) throw new Error('Not found');
        
        const oldStatus = orders[idx].status;
        const updated = { ...orders[idx], ...data, updated_date: new Date().toISOString() };
        orders[idx] = updated;
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

        // Status Change Notifications
        if (data.status === 'executado' && oldStatus !== 'executado') {
          await base44.notifications.add({
            title: 'O.S. Executada',
            message: `O.S. #${updated.os_number} foi concluída.`,
            type: 'success'
          });
        } else if (data.status === 'atrasado' && oldStatus !== 'atrasado') {
          await base44.notifications.add({
            title: 'O.S. Atrasada',
            message: `O.S. #${updated.os_number} ultrapassou o prazo.`,
            type: 'error'
          });
        }
        
        return updated;
      },
      delete: async (id: string): Promise<boolean> => {
        const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
        const filtered = orders.filter((o: any) => o.id !== id);
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(filtered));
        return true;
      }
    },
    User: {
      list: async (): Promise<User[]> => {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      },
      update: async (id: string, data: Partial<User>): Promise<User> => {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        const idx = users.findIndex((u: any) => u.id === id);
        if (idx === -1) throw new Error('Not found');
        const updated = { ...users[idx], ...data };
        users[idx] = updated;
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        return updated;
      },
      delete: async (id: string): Promise<boolean> => {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        const filtered = users.filter((u: any) => u.id !== id);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
        return true;
      }
    },
    ActivityLog: {
      list: async (sort?: string, limit?: number): Promise<ActivityLog[]> => {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]');
        if (sort === '-created_date') {
          data.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
        }
        return limit ? data.slice(0, limit) : data;
      },
      create: async (data: Partial<ActivityLog>): Promise<ActivityLog> => {
        const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]');
        const newLog = {
          ...data,
          id: Math.random().toString(36).substr(2, 9),
          created_date: new Date().toISOString()
        } as ActivityLog;
        logs.push(newLog);
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
        return newLog;
      }
    }
  },
  notifications: {
    list: async (): Promise<Notification[]> => {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
      return data.sort((a: any, b: any) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
    },
    add: async (data: Partial<Notification>): Promise<Notification> => {
      const notes = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
      const newNote = {
        id: Math.random().toString(36).substr(2, 9),
        title: data.title || 'Notificação',
        message: data.message || '',
        type: data.type || 'info',
        is_read: false,
        created_date: new Date().toISOString()
      };
      notes.push(newNote);
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notes));
      return newNote;
    },
    markAsRead: async (id: string): Promise<void> => {
      const notes = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
      const idx = notes.findIndex((n: any) => n.id === id);
      if (idx !== -1) {
        notes[idx].is_read = true;
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notes));
      }
    }
  },
  integrations: {
    Core: {
      SendEmail: async (params: { to: string, subject: string, body: string }) => {
        console.log('Sending mock email to:', params.to, params.subject);
        return { success: true };
      }
    }
  }
};