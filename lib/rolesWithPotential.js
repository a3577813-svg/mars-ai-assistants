import { roles as baseRoles, roleList as baseRoleList } from './roles';
import { potentialRole } from './potentialRole';

export const roles = { ...baseRoles, potential: potentialRole };
export const roleList = [...baseRoleList, potentialRole];

export function getRole(roleId) {
  return roles[roleId] || null;
}
