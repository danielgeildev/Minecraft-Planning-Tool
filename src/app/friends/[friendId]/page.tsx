import { FriendProfileView } from '@/components/friends/FriendProfileView'

export default async function FriendProfilePage({
  params,
}: {
  params: Promise<{ friendId: string }>
}) {
  const { friendId } = await params

  return <FriendProfileView friendId={friendId} />
}
