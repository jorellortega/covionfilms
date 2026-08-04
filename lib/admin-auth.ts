import { getAuthenticatedUser } from '@/lib/get-authenticated-user'

export async function requireAdmin(request: Request) {
  const user = await getAuthenticatedUser(request)

  if (!user || user.role !== 'admin') {
    return null
  }

  return user
}
