import type { CurrentUser } from '@/lib/api'
import AdminDashboard from './AdminDashboard'
import GuardianPortalPage from '@/features/guardian/GuardianPortalPage'

interface Props {
  user: CurrentUser
  role: string
}

export default function DashboardPage({ user, role }: Props) {
  const isGuardian = role === 'guardian_primary' || role === 'guardian_secondary'
  if (isGuardian) return <GuardianPortalPage />
  return <AdminDashboard user={user} />
}
