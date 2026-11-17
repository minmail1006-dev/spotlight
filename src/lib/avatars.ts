export const AVATAR_CATEGORIES = [
  { id: 'wellness', name: 'Wellness & reset' },
  { id: 'food', name: 'Food & drinks' },
  { id: 'music', name: 'Music & culture' },
  { id: 'movement', name: 'Move & play' },
  { id: 'creative', name: 'Creative & curious' },
  { id: 'outside', name: 'Outside & adventure' },
] as const

export const AVATARS = [
  { id: 'sauna', name: 'Sauna lover', color: '#D7A078', category: 'wellness' },
  { id: 'yoga', name: 'Yoga soul', color: '#B98D9D', category: 'wellness' },
  { id: 'coffee', name: 'Coffee person', color: '#C49B62', category: 'food' },
  { id: 'beer', name: 'Beer lover', color: '#D2A64D', category: 'food' },
  { id: 'cocktail', name: 'Cocktail fan', color: '#8EADA0', category: 'food' },
  { id: 'pastry', name: 'Bakery explorer', color: '#D5A878', category: 'food' },
  { id: 'cooking', name: 'Home chef', color: '#91A58B', category: 'food' },
  { id: 'jazz', name: 'Jazz lover', color: '#C99A3D', category: 'music' },
  { id: 'vinyl', name: 'Vinyl collector', color: '#829FA5', category: 'music' },
  { id: 'dance', name: 'Dancer', color: '#C88791', category: 'music' },
  { id: 'theatre', name: 'Theatre fan', color: '#BD927A', category: 'music' },
  { id: 'cinema', name: 'Film buff', color: '#879EB7', category: 'music' },
  { id: 'cycling', name: 'Cyclist', color: '#91AC91', category: 'movement' },
  { id: 'swimming', name: 'Harbour swimmer', color: '#79AEB7', category: 'movement' },
  { id: 'running', name: 'Runner', color: '#CF895F', category: 'movement' },
  { id: 'tennis', name: 'Tennis player', color: '#B6BD68', category: 'movement' },
  { id: 'kayaking', name: 'Kayaker', color: '#7DAAB5', category: 'outside' },
  { id: 'climbing', name: 'Climber', color: '#8EA58F', category: 'outside' },
  { id: 'gardening', name: 'Gardener', color: '#8FA875', category: 'outside' },
  { id: 'dog', name: 'Dog person', color: '#C59A70', category: 'outside' },
  { id: 'cat', name: 'Cat person', color: '#B98698', category: 'outside' },
  { id: 'camera', name: 'Photographer', color: '#969DB6', category: 'creative' },
  { id: 'books', name: 'Bookworm', color: '#989FB8', category: 'creative' },
  { id: 'art', name: 'Artist', color: '#C889A0', category: 'creative' },
  { id: 'gaming', name: 'Gamer', color: '#7FA894', category: 'creative' },
  { id: 'boardgames', name: 'Game night', color: '#B58D76', category: 'creative' },
] as const

export type AvatarId = (typeof AVATARS)[number]['id']

export function getAvatar(avatarId?: string | null) {
  return AVATARS.find((avatar) => avatar.id === avatarId) ?? AVATARS[0]
}
