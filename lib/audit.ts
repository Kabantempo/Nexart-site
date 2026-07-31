import { getAdminClient } from './supabase-admin'

type AuditAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'DECRYPT'

interface AuditParams {
  userId: string
  action: AuditAction
  resourceType: string
  resourceId?: string
  description?: string
  changes?: Record<string, unknown>
  accessedSensitiveData?: boolean
  sensitiveFields?: string[]
  ipAddress?: string
  userAgent?: string
}

export async function logAudit(params: AuditParams): Promise<void> {
  try {
    const admin = getAdminClient()
    await (admin as any).rpc('log_audit_action', {
      p_user_id: params.userId,
      p_action: params.action,
      p_resource_type: params.resourceType,
      p_resource_id: params.resourceId ?? null,
      p_description: params.description ?? null,
      p_changes: params.changes ?? null,
      p_accessed_sensitive: params.accessedSensitiveData ?? false,
      p_sensitive_fields: params.sensitiveFields ?? null,
      p_ip_address: params.ipAddress ?? null,
      p_user_agent: params.userAgent ?? null,
    })
  } catch (err) {
    // Non-blocking — audit failure must never break the main action
    console.error('[audit] log_audit_action failed:', err)
  }
}

export function getRequestMeta(req: Request): { ip: string; userAgent: string } {
  const ip =
    (req.headers as any).get('x-forwarded-for')?.split(',')[0] ||
    (req.headers as any).get('x-real-ip') ||
    'unknown'
  const userAgent = (req.headers as any).get('user-agent') || 'unknown'
  return { ip, userAgent }
}
