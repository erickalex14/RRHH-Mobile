import { User } from "@/types/api";

/**
 * Verifica si un usuario tiene rol de administrador.
 * Maneja tanto snake_case (del backend Laravel) como camelCase.
 */
export function isUserAdmin(user: User | null | undefined): boolean {
  if (!user) return false;

  // Intentar obtener employeeDetail en camelCase o snake_case
  const employeeDetail =
    user.employeeDetail ??
    (user as unknown as Record<string, unknown>).employee_detail;

  if (!employeeDetail || typeof employeeDetail !== "object") return false;

  // Intentar obtener role del employeeDetail
  const role = (employeeDetail as Record<string, unknown>).role;

  if (!role || typeof role !== "object") return false;

  // Verificar si el rol es admin
  return Boolean((role as Record<string, unknown>).admin);
}

/**
 * Obtiene el nombre del rol del usuario.
 */
export function getUserRoleName(user: User | null | undefined): string | null {
  if (!user) return null;

  const employeeDetail =
    user.employeeDetail ??
    (user as unknown as Record<string, unknown>).employee_detail;

  if (!employeeDetail || typeof employeeDetail !== "object") return null;

  const role = (employeeDetail as Record<string, unknown>).role;

  if (!role || typeof role !== "object") return null;

  return ((role as Record<string, unknown>).name as string) ?? null;
}
