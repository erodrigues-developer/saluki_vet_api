import { ForbiddenException } from '@nestjs/common';
export const REPORT_PERMISSIONS: Record<string, string[]> = {
  REVENUE_BY_PERIOD: ['financeiro.sales.view', 'financeiro.payments.view'],
  OPEN_ACCOUNTS_RECEIVABLE: ['financeiro.accounts_receivable.view'],
  ACCOUNTS_PAYABLE_BY_DUE_DATE: ['financeiro.accounts_payable.view'],
  APPOINTMENTS_AND_CONSULTATIONS_BY_PERIOD: ['atendimentos.appointments.view', 'atendimentos.consultations.view'],
  STOCK_MOVEMENT_AND_POSITION: ['estoque.movements.view', 'estoque.balances.view'],
};
export function hasPermission(user: any, p: string) {
  return (user.roles || []).some((r: any) => r.code === 'ADMIN') || (user.permissions || []).includes(p);
}
export function assertReportAccess(user: any, type: string, owner: number) {
  if (!REPORT_PERMISSIONS[type]?.every((p) => hasPermission(user,p))) throw new ForbiddenException();
  if (Number(user.userId) !== Number(owner) && !(user.roles || []).some((r: any) => r.code === 'ADMIN')) throw new ForbiddenException();
}
export function protectedFileUrl(key: string) { return `/api/v1/files/download?key=${encodeURIComponent(key)}`; }
