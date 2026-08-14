import { Suspense } from 'react'
import AdminMainClient from './admin-main-client'

export default function AdminPage() {
  return <Suspense><AdminMainClient /></Suspense>
}
