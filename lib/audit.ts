import { getAdminClient } from '@/lib/supabase-admin'

interface AuditParams {
  userId: string
  action: string
  resourceType: string
  resourceId?: string
  description?: string
  ip?: string
  userAgent?: string
  sensitiveData?: boolean
}

export async function logAudit(params: AuditParams) {
  try {
    const admin = getAdminClient()
    await (admin as any).rpc('log_audit_action', {
      p_user_id: params.userId,
      p_action: params.action,
      p_resource_type: params.resourceType,
      p_resource_id: params.resourceId ?? null,
      p_description: params.description ?? null,
      p_changes: null,
      p_accessed_sensitive: params.sensitiveData ?? false,
      p_sensitive_fields: null,
      p_ip_address: params.ip ?? 'unknown',
      p_user_agent: params.userAgent ?? 'unknown',
    })
  } catch {
    // Audit failures must never break the main flow
  }
}
