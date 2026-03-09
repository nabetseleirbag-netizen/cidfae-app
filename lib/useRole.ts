'use client'

import { useStore } from './store'

const permissions = {
  administrador: {
    manageDepartments: true, manageTechnicians: true, manageProjects: true,
    createTasks: true, updateAllTasks: true, sendNotifications: true,
    viewConfig: true, manageUsers: true,
  },
  jefe_proyecto: {
    manageDepartments: false, manageTechnicians: false, manageProjects: true,
    createTasks: true, updateAllTasks: true, sendNotifications: true,
    viewConfig: false, manageUsers: false,
  },
  tecnico: {
    manageDepartments: false, manageTechnicians: false, manageProjects: false,
    createTasks: false, updateAllTasks: false, sendNotifications: false,
    viewConfig: false, manageUsers: false,
  },
} as const

type Permission = keyof (typeof permissions)['administrador']

export function useRole() {
  const { currentUser } = useStore()
  const rol = currentUser.rol as keyof typeof permissions
  const perms = permissions[rol] ?? permissions.tecnico

  return {
    rol,
    isAdmin: rol === 'administrador',
    isJefe: rol === 'jefe_proyecto',
    isTecnico: rol === 'tecnico',
    can: (action: Permission) => perms[action] ?? false,
  }
}
