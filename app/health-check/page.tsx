export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'

export default function HealthCheckPage() {
  return (
    <div style={{ padding: '40px', fontFamily: 'monospace' }}>
      <h1>OK</h1>
      <p>Service healthy</p>
    </div>
  )
}
