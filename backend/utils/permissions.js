const ROLE_PERMISSIONS = {
  admin: {
    tasks: ['create', 'read', 'update', 'delete', 'assign'],
    users: ['create', 'read', 'update', 'delete', 'changeRole'],
    auditLogs: ['read'],
    dashboard: ['read'],
    organization: ['read', 'update'],
    notifications: ['read', 'update'],
    reports: ['read'],
  },
  manager: {
    tasks: ['create', 'read', 'update', 'assign'],
    users: ['read'],
    auditLogs: ['read'],
    dashboard: ['read'],
    notifications: ['read', 'update'],
    reports: ['read'],
  },
  member: {
    tasks: ['create', 'read', 'update'],
    users: ['read'],
    dashboard: ['read'],
    notifications: ['read', 'update'],
    reports: ['read'],
  },
};

function getPermissions(role) {
  return ROLE_PERMISSIONS[role] || {};
}

module.exports = { getPermissions, ROLE_PERMISSIONS };
