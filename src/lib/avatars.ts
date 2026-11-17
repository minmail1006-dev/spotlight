export const AVATAR_CATEGORIES = [
  { id: 'wellness', name: 'Wellness & reset' },
  { id: 'food', name: 'Food & drinks' },
  { id: 'music', name: 'Music & culture' },
  { id: 'movement', name: 'Move & play' },
  { id: 'creative', name: 'Creative & curious' },
  { id: 'outside', name: 'Outside & adventure' },
] as const

export const AVATARS = [
  { id: 'sauna', name: 'Sauna lover', color: '#E8B68F', category: 'wellness' },
  { id: 'yoga', name: 'Yoga soul', color: '#D8B9C7', category: 'wellness' },
  { id: 'coffee', name: 'Coffee person', color: '#D8B88A', category: 'food' },
  { id: 'beer', name: 'Beer lover', color: '#E3C36C', category: 'food' },
  { id: 'cocktail', name: 'Cocktail fan', color: '#B8D0BE', category: 'food' },
  { id: 'pastry', name: 'Bakery explorer', color: '#E9C99B', category: 'food' },
  { id: 'cooking', name: 'Home chef', color: '#B9C7A5', category: 'food' },
  { id: 'jazz', name: 'Jazz lover', color: '#D9B45D', category: 'music' },
  { id: 'vinyl', name: 'Vinyl collector', color: '#AFC2C7', category: 'music' },
  { id: 'dance', name: 'Dancer', color: '#E0A6B7', category: 'music' },
  { id: 'theatre', name: 'Theatre fan', color: '#D8B6A1', category: 'music' },
  { id: 'cinema', name: 'Film buff', color: '#B5C5D8', category: 'music' },
  { id: 'cycling', name: 'Cyclist', color: '#B9D0B6', category: 'movement' },
  { id: 'swimming', name: 'Harbour swimmer', color: '#A7CED5', category: 'movement' },
  { id: 'running', name: 'Runner', color: '#E6B28B', category: 'movement' },
  { id: 'tennis', name: 'Tennis player', color: '#D4D98C', category: 'movement' },
  { id: 'kayaking', name: 'Kayaker', color: '#A8C9D3', category: 'outside' },
  { id: 'climbing', name: 'Climber', color: '#B9C8B4', category: 'outside' },
  { id: 'gardening', name: 'Gardener', color: '#B6C89D', category: 'outside' },
  { id: 'dog', name: 'Dog person', color: '#D9B894', category: 'outside' },
  { id: 'cat', name: 'Cat person', color: '#D8B5C3', category: 'outside' },
  { id: 'camera', name: 'Photographer', color: '#C1C4D3', category: 'creative' },
  { id: 'books', name: 'Bookworm', color: '#C2C6D9', category: 'creative' },
  { id: 'art', name: 'Artist', color: '#E0B1C4', category: 'creative' },
  { id: 'gaming', name: 'Gamer', color: '#A9C9B7', category: 'creative' },
  { id: 'boardgames', name: 'Game night', color: '#D5B9A4', category: 'creative' },
] as const

export type AvatarId = (typeof AVATARS)[number]['id']

export function getAvatar(avatarId?: string | null) {
  return AVATARS.find((avatar) => avatar.id === avatarId) ?? AVATARS[0]
}
