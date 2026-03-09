import { Department, Technician, Project, Task, User } from './types'

export const DEPARTMENTS: Department[] = [
  { id: 'dep-1', nombre: 'Electrónica', color: '#3b82f6', icon: 'Zap', descripcion: 'Diseño y desarrollo de sistemas electrónicos embarcados' },
  { id: 'dep-2', nombre: 'Aeronáutica', color: '#8b5cf6', icon: 'Plane', descripcion: 'Ingeniería aeronáutica y sistemas de vuelo' },
  { id: 'dep-3', nombre: 'Software', color: '#10b981', icon: 'Code2', descripcion: 'Desarrollo de software y sistemas embebidos' },
  { id: 'dep-4', nombre: 'Mecánica', color: '#f59e0b', icon: 'Wrench', descripcion: 'Diseño mecánico y manufactura' },
  { id: 'dep-5', nombre: 'Comunicaciones', color: '#ef4444', icon: 'Radio', descripcion: 'Sistemas de comunicación y redes tácticas' },
  { id: 'dep-6', nombre: 'Operaciones UAV', color: '#06b6d4', icon: 'Navigation', descripcion: 'Operación y mantenimiento de aeronaves no tripuladas' },
  { id: 'dep-7', nombre: 'Investigación', color: '#ec4899', icon: 'FlaskConical', descripcion: 'Investigación científica y desarrollo tecnológico' },
]

export const TECHNICIANS: Technician[] = [
  { id: 'tec-1', nombre: 'Cap. Marco Salazar', cargo: 'Ingeniero Electrónico Senior', departamento_id: 'dep-1', especialidad: 'Diseño PCB / Sistemas Embebidos', email: 'msalazar@cidfae.ec', telefono: '+593 99 123 4567', estado: 'activo', avatar: '', iniciales: 'MS' },
  { id: 'tec-2', nombre: 'Tnte. Ana Vásquez', cargo: 'Ingeniera de Software', departamento_id: 'dep-3', especialidad: 'STM32 / ROS2 / Python', email: 'avasquez@cidfae.ec', telefono: '+593 99 234 5678', estado: 'activo', avatar: '', iniciales: 'AV' },
  { id: 'tec-3', nombre: 'Tnte. Luis Paredes', cargo: 'Piloto UAV / Ingeniero Aeronáutico', departamento_id: 'dep-6', especialidad: 'Sistemas VTOL / Autopiloto', email: 'lparedes@cidfae.ec', telefono: '+593 99 345 6789', estado: 'activo', avatar: '', iniciales: 'LP' },
  { id: 'tec-4', nombre: 'Sgto. Carlos Mora', cargo: 'Técnico en Comunicaciones', departamento_id: 'dep-5', especialidad: 'Radio Frecuencia / SATCOM', email: 'cmora@cidfae.ec', telefono: '+593 99 456 7890', estado: 'activo', avatar: '', iniciales: 'CM' },
  { id: 'tec-5', nombre: 'Ing. Patricia León', cargo: 'Investigadora Principal', departamento_id: 'dep-7', especialidad: 'Visión Computacional / IA', email: 'pleon@cidfae.ec', telefono: '+593 99 567 8901', estado: 'activo', avatar: '', iniciales: 'PL' },
  { id: 'tec-6', nombre: 'Sgto. Diego Muñoz', cargo: 'Técnico Mecánico', departamento_id: 'dep-4', especialidad: 'Manufactura CNC / Diseño 3D', email: 'dmunoz@cidfae.ec', telefono: '+593 99 678 9012', estado: 'activo', avatar: '', iniciales: 'DM' },
  { id: 'tec-7', nombre: 'Cap. Rosa Espinoza', cargo: 'Jefa de Electrónica', departamento_id: 'dep-1', especialidad: 'Control PID / FPGA / Señales', email: 'respinoza@cidfae.ec', telefono: '+593 99 789 0123', estado: 'activo', avatar: '', iniciales: 'RE' },
  { id: 'tec-8', nombre: 'Tnte. Andrés Torres', cargo: 'Ingeniero Aeronáutico', departamento_id: 'dep-2', especialidad: 'Aerodinámica / CFD / FEA', email: 'atorres@cidfae.ec', telefono: '+593 99 890 1234', estado: 'inactivo', avatar: '', iniciales: 'AT' },
]

export const PROJECTS: Project[] = [
  {
    id: 'pro-1',
    nombre: 'UAV VTOL Sky Fury',
    codigo: 'CIDFAE-2025-001',
    descripcion: 'Desarrollo de aeronave no tripulada de despegue vertical con capacidad de vuelo de ala fija para misiones de reconocimiento.',
    departamento_id: 'dep-6',
    responsable_id: 'tec-3',
    fecha_inicio: '2025-01-15',
    fecha_fin: '2025-12-31',
    estado: 'en_ejecucion',
    color: '#06b6d4',
    tecnicos_ids: ['tec-1', 'tec-2', 'tec-3', 'tec-6'],
  },
  {
    id: 'pro-2',
    nombre: 'Sistema EO/IR para UAV',
    codigo: 'CIDFAE-2025-002',
    descripcion: 'Desarrollo de payload electroóptico e infrarrojo para detección y seguimiento de objetivos en aeronaves no tripuladas.',
    departamento_id: 'dep-1',
    responsable_id: 'tec-7',
    fecha_inicio: '2025-02-01',
    fecha_fin: '2025-09-30',
    estado: 'en_ejecucion',
    color: '#3b82f6',
    tecnicos_ids: ['tec-1', 'tec-5', 'tec-7'],
  },
  {
    id: 'pro-3',
    nombre: 'Plataforma SATCOM Táctica',
    codigo: 'CIDFAE-2025-003',
    descripcion: 'Sistema de comunicaciones satelitales de banda Ka para operaciones tácticas en zonas sin cobertura terrestre.',
    departamento_id: 'dep-5',
    responsable_id: 'tec-4',
    fecha_inicio: '2025-03-01',
    fecha_fin: '2025-11-30',
    estado: 'planificacion',
    color: '#ef4444',
    tecnicos_ids: ['tec-4', 'tec-1'],
  },
  {
    id: 'pro-4',
    nombre: 'Controlador de Vuelo STM32',
    codigo: 'CIDFAE-2025-004',
    descripcion: 'Diseño y desarrollo de un controlador de vuelo propietario basado en microcontrolador STM32H7 para UAVs de ala fija.',
    departamento_id: 'dep-3',
    responsable_id: 'tec-2',
    fecha_inicio: '2025-01-10',
    fecha_fin: '2025-08-31',
    estado: 'en_ejecucion',
    color: '#10b981',
    tecnicos_ids: ['tec-2', 'tec-1', 'tec-7'],
  },
  {
    id: 'pro-5',
    nombre: 'I+D Aerodinámica VTOL',
    codigo: 'CIDFAE-2024-005',
    descripcion: 'Investigación en aerodinámica computacional para optimización de perfiles alares en configuraciones VTOL híbridas.',
    departamento_id: 'dep-7',
    responsable_id: 'tec-5',
    fecha_inicio: '2024-09-01',
    fecha_fin: '2025-03-31',
    estado: 'finalizado',
    color: '#ec4899',
    tecnicos_ids: ['tec-5', 'tec-8'],
  },
]

export const TASKS: Task[] = [
  {
    id: 'tsk-1', titulo: 'Diseño PCB del controlador de vuelo', descripcion: 'Diseñar el PCB de 6 capas para el controlador de vuelo con STM32H743 y sensores IMU redundantes.', proyecto_id: 'pro-4', departamento_id: 'dep-1', tecnico_id: 'tec-1', prioridad: 'alta', estado: 'en_progreso', fecha_inicio: '2025-03-01', fecha_limite: '2025-03-15',
    checklist: [{ id: 'c1', texto: 'Esquemático electrónico', completado: true }, { id: 'c2', texto: 'Layout PCB', completado: true }, { id: 'c3', texto: 'Revisión DRC', completado: false }, { id: 'c4', texto: 'Envío a fabricación', completado: false }],
    comentarios: [{ id: 'com1', autor_id: 'tec-1', texto: 'Esquemático completado. Iniciando layout.', fecha: '2025-03-03T10:00:00' }],
    adjuntos: [], tags: ['PCB', 'STM32', 'Electrónica']
  },
  {
    id: 'tsk-2', titulo: 'Programación firmware IMU', descripcion: 'Desarrollar drivers para ICM-42688-P y BMP388 sobre HAL de STM32 con filtro complementario.', proyecto_id: 'pro-4', departamento_id: 'dep-3', tecnico_id: 'tec-2', prioridad: 'alta', estado: 'en_progreso', fecha_inicio: '2025-03-05', fecha_limite: '2025-03-20',
    checklist: [{ id: 'c1', texto: 'Driver SPI para ICM-42688', completado: true }, { id: 'c2', texto: 'Driver I2C para BMP388', completado: false }, { id: 'c3', texto: 'Filtro Mahony/Madgwick', completado: false }],
    comentarios: [],
    adjuntos: [], tags: ['Firmware', 'C++', 'STM32']
  },
  {
    id: 'tsk-3', titulo: 'Pruebas de túnel de viento VTOL', descripcion: 'Validar configuración aerodinámica del UAV Sky Fury en túnel de viento subsónico a 20-80 km/h.', proyecto_id: 'pro-1', departamento_id: 'dep-2', tecnico_id: 'tec-8', prioridad: 'media', estado: 'pendiente', fecha_inicio: '2025-03-10', fecha_limite: '2025-03-25',
    checklist: [{ id: 'c1', texto: 'Preparación del modelo 1:5', completado: false }, { id: 'c2', texto: 'Instrumentación de sensores', completado: false }, { id: 'c3', texto: 'Pruebas a 20 km/h', completado: false }],
    comentarios: [],
    adjuntos: [], tags: ['Aerodinámica', 'Experimental']
  },
  {
    id: 'tsk-4', titulo: 'Integración cámara EO con gimbal 3 ejes', descripcion: 'Integrar cámara Sony IMX477 con gimbal brushless de 3 ejes y control de estabilización.', proyecto_id: 'pro-2', departamento_id: 'dep-1', tecnico_id: 'tec-7', prioridad: 'alta', estado: 'en_revision', fecha_inicio: '2025-02-20', fecha_limite: '2025-03-10',
    checklist: [{ id: 'c1', texto: 'Montaje mecánico gimbal', completado: true }, { id: 'c2', texto: 'Configuración SimpleBGC', completado: true }, { id: 'c3', texto: 'Pruebas de estabilización', completado: true }, { id: 'c4', texto: 'Revisión de calidad de imagen', completado: false }],
    comentarios: [{ id: 'com1', autor_id: 'tec-7', texto: 'Pruebas de estabilización exitosas. Revisión pendiente.', fecha: '2025-03-05T14:30:00' }],
    adjuntos: [], tags: ['EO/IR', 'Gimbal', 'Visión']
  },
  {
    id: 'tsk-5', titulo: 'Fabricación fuselaje fibra de carbono', descripcion: 'Manufacturar fuselaje de UAV Sky Fury en fibra de carbono prepreg mediante molde de aluminio.', proyecto_id: 'pro-1', departamento_id: 'dep-4', tecnico_id: 'tec-6', prioridad: 'alta', estado: 'completado', fecha_inicio: '2025-02-01', fecha_limite: '2025-02-28',
    checklist: [{ id: 'c1', texto: 'Mecanizado de molde', completado: true }, { id: 'c2', texto: 'Laminado de capas', completado: true }, { id: 'c3', texto: 'Curado en autoclave', completado: true }, { id: 'c4', texto: 'Control de calidad', completado: true }],
    comentarios: [{ id: 'com1', autor_id: 'tec-6', texto: 'Fuselaje fabricado exitosamente. Peso final: 1.2 kg.', fecha: '2025-02-27T16:00:00' }],
    adjuntos: [], tags: ['Manufactura', 'Composites', 'Mecánica']
  },
  {
    id: 'tsk-6', titulo: 'Algoritmo de visión para detección de objetivos', descripcion: 'Implementar pipeline de visión computacional YOLOv8 optimizado para Jetson Nano en condiciones de luz variable.', proyecto_id: 'pro-2', departamento_id: 'dep-7', tecnico_id: 'tec-5', prioridad: 'alta', estado: 'en_progreso', fecha_inicio: '2025-02-15', fecha_limite: '2025-04-01',
    checklist: [{ id: 'c1', texto: 'Dataset de entrenamiento', completado: true }, { id: 'c2', texto: 'Entrenamiento YOLOv8', completado: true }, { id: 'c3', texto: 'Optimización TensorRT', completado: false }, { id: 'c4', texto: 'Pruebas en campo', completado: false }],
    comentarios: [],
    adjuntos: [], tags: ['IA', 'Visión', 'Python', 'YOLO']
  },
  {
    id: 'tsk-7', titulo: 'Enlace de datos UAV-GCS 900 MHz', descripcion: 'Configurar enlace de datos bidireccional UAV-Estación de Control en banda de 900 MHz con alcance 50 km.', proyecto_id: 'pro-1', departamento_id: 'dep-5', tecnico_id: 'tec-4', prioridad: 'media', estado: 'pendiente', fecha_inicio: '2025-03-15', fecha_limite: '2025-04-15',
    checklist: [{ id: 'c1', texto: 'Selección de módulos RF', completado: false }, { id: 'c2', texto: 'Diseño de antenas Yagi', completado: false }, { id: 'c3', texto: 'Pruebas de alcance', completado: false }],
    comentarios: [],
    adjuntos: [], tags: ['RF', 'Comunicaciones', '900MHz']
  },
  {
    id: 'tsk-8', titulo: 'Plan de vuelo autónomo Waypoint', descripcion: 'Desarrollar sistema de vuelo autónomo por waypoints con evasión de obstáculos básica usando ArduPlane.', proyecto_id: 'pro-1', departamento_id: 'dep-6', tecnico_id: 'tec-3', prioridad: 'media', estado: 'en_progreso', fecha_inicio: '2025-03-01', fecha_limite: '2025-04-30',
    checklist: [{ id: 'c1', texto: 'Configuración ArduPlane', completado: true }, { id: 'c2', texto: 'Simulación SITL', completado: true }, { id: 'c3', texto: 'Prueba en campo fase 1', completado: false }],
    comentarios: [{ id: 'com1', autor_id: 'tec-3', texto: 'Simulaciones SITL completadas sin errores críticos.', fecha: '2025-03-04T09:00:00' }],
    adjuntos: [], tags: ['Autopiloto', 'ArduPlane', 'GCS']
  },
  {
    id: 'tsk-9', titulo: 'Levantamiento de requisitos SATCOM', descripcion: 'Definir requisitos técnicos y operacionales del sistema de comunicaciones satelitales táctica.', proyecto_id: 'pro-3', departamento_id: 'dep-5', tecnico_id: 'tec-4', prioridad: 'alta', estado: 'completado', fecha_inicio: '2025-03-01', fecha_limite: '2025-03-07',
    checklist: [{ id: 'c1', texto: 'Entrevistas con usuarios', completado: true }, { id: 'c2', texto: 'Documento SRD', completado: true }, { id: 'c3', texto: 'Revisión con jefatura', completado: true }],
    comentarios: [],
    adjuntos: [], tags: ['SATCOM', 'Requisitos', 'Documentación']
  },
  {
    id: 'tsk-10', titulo: 'Sensor IR uncooled LWIR integración', descripcion: 'Integrar sensor infrarrojo LWIR FLIR Lepton 3.5 al payload EO/IR con procesamiento de imagen en tiempo real.', proyecto_id: 'pro-2', departamento_id: 'dep-1', tecnico_id: 'tec-1', prioridad: 'media', estado: 'pendiente', fecha_inicio: '2025-03-20', fecha_limite: '2025-04-20',
    checklist: [{ id: 'c1', texto: 'Integración hardware FLIR Lepton', completado: false }, { id: 'c2', texto: 'Driver SPI', completado: false }, { id: 'c3', texto: 'Fusión EO+IR', completado: false }],
    comentarios: [],
    adjuntos: [], tags: ['IR', 'Infrarrojo', 'FLIR', 'Payload']
  },
]

export const CURRENT_USER: User = {
  id: 'usr-1',
  nombre: 'Crnl. Ramírez',
  rol: 'administrador',
  email: 'jramirez@cidfae.ec',
  departamento_id: 'dep-7',
  avatar: '',
}

export const WEEKLY_STATS = [
  { semana: 'Sem 1', completadas: 3, pendientes: 8, en_progreso: 5 },
  { semana: 'Sem 2', completadas: 5, pendientes: 6, en_progreso: 4 },
  { semana: 'Sem 3', completadas: 7, pendientes: 5, en_progreso: 6 },
  { semana: 'Sem 4', completadas: 4, pendientes: 9, en_progreso: 3 },
  { semana: 'Sem 5', completadas: 8, pendientes: 4, en_progreso: 5 },
  { semana: 'Sem 6', completadas: 6, pendientes: 7, en_progreso: 4 },
]
