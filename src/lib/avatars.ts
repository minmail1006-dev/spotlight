export const AVATARS = [
  { id: 'spark', emoji: '✨', name: 'Spark', color: '#F7C65B' },
  { id: 'fox', emoji: '🦊', name: 'Fox', color: '#F2A16B' },
  { id: 'cat', emoji: '🐱', name: 'Cat', color: '#E8B4C8' },
  { id: 'frog', emoji: '🐸', name: 'Frog', color: '#A8D5A2' },
  { id: 'bear', emoji: '🐻', name: 'Bear', color: '#C99A76' },
  { id: 'bunny', emoji: '🐰', name: 'Bunny', color: '#E9C8D8' },
  { id: 'tiger', emoji: '🐯', name: 'Tiger', color: '#F4B45F' },
  { id: 'panda', emoji: '🐼', name: 'Panda', color: '#C9D7D4' },
  { id: 'alien', emoji: '👽', name: 'Alien', color: '#B9D99B' },
  { id: 'robot', emoji: '🤖', name: 'Robot', color: '#AFC8E8' },
  { id: 'ghost', emoji: '👻', name: 'Ghost', color: '#D8D0F0' },
  { id: 'octopus', emoji: '🐙', name: 'Octopus', color: '#D9A4D0' },
  { id: 'unicorn', emoji: '🦄', name: 'Unicorn', color: '#D7B9F4' },
  { id: 'dino', emoji: '🦖', name: 'Dino', color: '#9FCB9C' },
  { id: 'owl', emoji: '🦉', name: 'Owl', color: '#C8B7A3' },
  { id: 'bee', emoji: '🐝', name: 'Bee', color: '#F2D36E' },
  { id: 'cherry', emoji: '🍒', name: 'Cherry', color: '#F0A1A7' },
  { id: 'avocado', emoji: '🥑', name: 'Avo', color: '#B8D49B' },
  { id: 'mushroom', emoji: '🍄', name: 'Shroom', color: '#E9A6A0' },
  { id: 'star', emoji: '⭐', name: 'Star', color: '#F6D77C' },
  { id: 'moon', emoji: '🌙', name: 'Moon', color: '#B8C9E8' },
  { id: 'sun', emoji: '🌞', name: 'Sunshine', color: '#F6C56F' },
  { id: 'planet', emoji: '🪐', name: 'Planet', color: '#B9A8D9' },
  { id: 'coffee', emoji: '☕', name: 'Coffee', color: '#CBA88B' },
] as const

export type AvatarId = (typeof AVATARS)[number]['id']

export function getAvatar(avatarId?: string | null) {
  return AVATARS.find((avatar) => avatar.id === avatarId) ?? AVATARS[0]
}
