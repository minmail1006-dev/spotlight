import { AVATARS } from '../lib/avatars'

type Props = { avatarId?: string | null; size?: number; className?: string }

export function AvatarArtwork({ avatarId = 'cycling', size = 48, className = '' }: Props) {
  const avatar = AVATARS.find((item) => item.id === avatarId) ?? AVATARS[0]

  return (
    <img
      className={className}
      src={`/avatars/${avatar.id}.webp`}
      width={size}
      height={size}
      alt={`${avatar.name} illustration`}
      style={{
        display: 'block',
        width: size,
        height: size,
        objectFit: 'cover',
        borderRadius: '50%',
        flex: 'none',
      }}
    />
  )
}
