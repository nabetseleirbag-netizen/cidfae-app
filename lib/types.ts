export type UserRole = 'administrador' | 'jefe_proyecto' | 'tecnico'
export type TaskStatus = 'pendiente' | 'en_progreso' | 'en_revision' | 'completado'
export type TaskPriority = 'alta' | 'media' | 'baja'
export type ProjectStatus = 'planificacion' | 'en_ejecucion' | 'pausado' | 'finalizado'
export type TechnicianStatus = string   // ahora es dinámico (activo, inactivo, vacaciones, etc.)

export interface Department {
  id: string
  nombre: string
  color: string
  icon: string
  descripcion: string
}

export interface Technician {
  id: string
  nombre: string
  cargo: string
  departamento_id: string
  especialidad: string
  email: string
  telefono: string
  estado: TechnicianStatus
  avatar: string
  iniciales: string
}

export interface Project {
  id: string
  nombre: string
  codigo: string
  descripcion: string
  departamento_id: string
  responsable_id: string
  fecha_inicio: string
  fecha_fin: string
  estado: ProjectStatus
  color: string
  tecnicos_ids: string[]
}

export interface ChecklistItem {
  id: string
  texto: string
  completado: boolean
}

export interface Comment {
  id: string
  autor_id: string
  texto: string
  fecha: string
}

export interface Task {
  id: string
  titulo: string
  descripcion: string
  proyecto_id: string
  departamento_id: string
  tecnico_id: string
  prioridad: TaskPriority
  estado: TaskStatus
  fecha_inicio: string
  fecha_limite: string
  checklist: ChecklistItem[]
  comentarios: Comment[]
  adjuntos: string[]
  tags: string[]
  // campos de envío
  enviada?: boolean
  fecha_envio?: string
}

export interface Notification {
  id: string
  tarea_id: string
  destinatario_id: string   // id del técnico receptor
  remitente_id: string      // id de quien envía
  titulo: string
  mensaje: string
  leida: boolean
  fecha: string
}

export interface WeeklyStats {
  semana: string
  completadas: number
  pendientes: number
  en_progreso: number
}

export interface User {
  id: string
  nombre: string
  rol: UserRole
  email: string
  departamento_id: string
  avatar: string
}
