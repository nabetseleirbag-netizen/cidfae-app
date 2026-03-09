import { create } from 'zustand'
import { Department, Technician, Project, Task, TaskStatus, User, Notification } from './types'
import { DEPARTMENTS, TECHNICIANS, PROJECTS, TASKS, CURRENT_USER } from './data'

interface AppState {
  // Auth
  currentUser: User
  // Data
  departments: Department[]
  technicians: Technician[]
  projects: Project[]
  tasks: Task[]
  notifications: Notification[]
  customStatuses: string[]
  // UI
  darkMode: boolean
  sidebarCollapsed: boolean
  // Actions - Technicians
  addTechnician: (t: Omit<Technician, 'id'>) => void
  updateTechnician: (id: string, t: Partial<Technician>) => void
  deleteTechnician: (id: string) => void
  // Actions - Statuses
  addStatus: (status: string) => void
  removeStatus: (status: string) => void
  // Actions - Departments
  addDepartment: (d: Omit<Department, 'id'>) => void
  updateDepartment: (id: string, d: Partial<Department>) => void
  deleteDepartment: (id: string) => void
  // Actions - Projects
  addProject: (p: Omit<Project, 'id'>) => void
  updateProject: (id: string, p: Partial<Project>) => void
  deleteProject: (id: string) => void
  // Actions - Tasks
  addTask: (t: Omit<Task, 'id'>) => void
  updateTask: (id: string, t: Partial<Task>) => void
  deleteTask: (id: string) => void
  moveTask: (taskId: string, newStatus: TaskStatus) => void
  toggleChecklistItem: (taskId: string, itemId: string) => void
  addComment: (taskId: string, text: string) => void
  sendTaskNotification: (taskId: string) => void
  // Actions - Notifications
  markNotificationRead: (id: string) => void
  markAllRead: () => void
  // Actions - UI
  toggleDarkMode: () => void
  toggleSidebar: () => void
  // Actions - Setters (for Supabase sync)
  setCurrentUser: (user: User) => void
  setDepartments: (deps: Department[]) => void
  setTechnicians: (techs: Technician[]) => void
  setProjects: (projs: Project[]) => void
  setTasks: (tasks: Task[]) => void
  setNotifications: (notifs: Notification[]) => void
  setCustomStatuses: (statuses: string[]) => void
}

const uid = () => `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export const useStore = create<AppState>((set, get) => ({
  currentUser: CURRENT_USER,
  departments: DEPARTMENTS,
  technicians: TECHNICIANS,
  projects: PROJECTS,
  tasks: TASKS,
  notifications: [],
  customStatuses: ['activo', 'inactivo', 'vacaciones', 'baja_medica'],
  darkMode: false,
  sidebarCollapsed: false,

  addTechnician: (t) => set((s) => ({ technicians: [...s.technicians, { ...t, id: uid() }] })),
  updateTechnician: (id, t) => set((s) => ({ technicians: s.technicians.map((x) => x.id === id ? { ...x, ...t } : x) })),
  deleteTechnician: (id) => set((s) => ({ technicians: s.technicians.filter((x) => x.id !== id) })),

  addStatus: (status) => set((s) => {
    const norm = status.trim().toLowerCase()
    if (!norm || s.customStatuses.includes(norm)) return s
    return { customStatuses: [...s.customStatuses, norm] }
  }),
  removeStatus: (status) => set((s) => ({ customStatuses: s.customStatuses.filter(st => st !== status) })),

  addDepartment: (d) => set(s => ({ departments: [...s.departments, { ...d, id: uid() }] })),
  updateDepartment: (id, d) => set(s => ({ departments: s.departments.map(x => x.id === id ? { ...x, ...d } : x) })),
  deleteDepartment: (id) => set(s => ({ departments: s.departments.filter(x => x.id !== id) })),

  addProject: (p) => set((s) => ({ projects: [...s.projects, { ...p, id: uid() }] })),
  updateProject: (id, p) => set((s) => ({ projects: s.projects.map((x) => x.id === id ? { ...x, ...p } : x) })),
  deleteProject: (id) => set((s) => ({ projects: s.projects.filter((x) => x.id !== id) })),

  addTask: (t) => set((s) => ({ tasks: [...s.tasks, { ...t, id: uid() }] })),
  updateTask: (id, t) => set((s) => ({ tasks: s.tasks.map((x) => x.id === id ? { ...x, ...t } : x) })),
  deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((x) => x.id !== id) })),
  moveTask: (taskId, newStatus) => set((s) => ({ tasks: s.tasks.map((x) => x.id === taskId ? { ...x, estado: newStatus } : x) })),
  toggleChecklistItem: (taskId, itemId) => set((s) => ({
    tasks: s.tasks.map((t) => t.id === taskId
      ? { ...t, checklist: t.checklist.map((c) => c.id === itemId ? { ...c, completado: !c.completado } : c) }
      : t
    )
  })),
  addComment: (taskId, text) => set((s) => ({
    tasks: s.tasks.map((t) => t.id === taskId
      ? { ...t, comentarios: [...t.comentarios, { id: uid(), autor_id: s.currentUser.id, texto: text, fecha: new Date().toISOString() }] }
      : t
    )
  })),

  sendTaskNotification: (taskId) => set((s) => {
    const task = s.tasks.find(t => t.id === taskId)
    if (!task || !task.tecnico_id) return s
    const tech = s.technicians.find(t => t.id === task.tecnico_id)
    const notification: Notification = {
      id: uid(),
      tarea_id: taskId,
      destinatario_id: task.tecnico_id,
      remitente_id: s.currentUser.id,
      titulo: `Nueva tarea asignada`,
      mensaje: `Tienes una nueva tarea asignada: "${task.titulo}". Prioridad: ${task.prioridad}. Fecha límite: ${task.fecha_limite}.`,
      leida: false,
      fecha: new Date().toISOString(),
    }
    return {
      tasks: s.tasks.map(t => t.id === taskId ? { ...t, enviada: true, fecha_envio: new Date().toISOString() } : t),
      notifications: [...s.notifications, notification],
    }
  }),

  markNotificationRead: (id) => set((s) => ({
    notifications: s.notifications.map(n => n.id === id ? { ...n, leida: true } : n)
  })),
  markAllRead: () => set((s) => ({
    notifications: s.notifications.map(n => ({ ...n, leida: true }))
  })),

  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  setCurrentUser: (user) => set({ currentUser: user }),
  setDepartments: (deps) => set({ departments: deps }),
  setTechnicians: (techs) => set({ technicians: techs }),
  setProjects: (projs) => set({ projects: projs }),
  setTasks: (tasks) => set({ tasks }),
  setNotifications: (notifs) => set({ notifications: notifs }),
  setCustomStatuses: (statuses) => set({ customStatuses: statuses }),
}))
