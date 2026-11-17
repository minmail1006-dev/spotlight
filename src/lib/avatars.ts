export const AVATAR_CATEGORIES = [
  { id: 'wellness', name: 'Wellness & reset' },
  { id: 'food', name: 'Food & drinks' },
  { id: 'mind', name: 'Mind & creativity' },
  { id: 'movement', name: 'Move & play' },
  { id: 'outside', name: 'Outside & adventure' },
  { id: 'culture', name: 'Culture & good times' },
] as const

export const AVATARS = [
  { id: 'sauna', emoji: '🧖', name: 'Sauna lover', color: '#F3B28D', category: 'wellness' },
  { id: 'yoga', emoji: '🧘', name: 'Yoga soul', color: '#C8B6E8', category: 'wellness' },
  { id: 'meditation', emoji: '🪷', name: 'Mindful', color: '#E8B5CC', category: 'wellness' },
  { id: 'spa', emoji: '🫧', name: 'Spa day', color: '#A9DDE0', category: 'wellness' },
  { id: 'gym', emoji: '💪', name: 'Gym energy', color: '#F1C36E', category: 'wellness' },
  { id: 'coffee', emoji: '☕', name: 'Coffee person', color: '#CBA88B', category: 'food' },
  { id: 'beer', emoji: '🍺', name: 'Beer buddy', color: '#F2D16B', category: 'food' },
  { id: 'cocktail', emoji: '🍸', name: 'Cocktail fan', color: '#B9D9C7', category: 'food' },
  { id: 'wine', emoji: '🍷', name: 'Wine lover', color: '#D99BAA', category: 'food' },
  { id: 'brunch', emoji: '🥐', name: 'Brunch fan', color: '#EBC69A', category: 'food' },
  { id: 'pizza', emoji: '🍕', name: 'Pizza lover', color: '#F2A77B', category: 'food' },
  { id: 'sushi', emoji: '🍣', name: 'Sushi fan', color: '#F0B4A9', category: 'food' },
  { id: 'chef', emoji: '👨‍🍳', name: 'Home chef', color: '#C8D7B5', category: 'food' },
  { id: 'brain', emoji: '🧠', name: 'Big thinker', color: '#E9A9C4', category: 'mind' },
  { id: 'books', emoji: '📚', name: 'Bookworm', color: '#B9C7E8', category: 'mind' },
  { id: 'art', emoji: '🎨', name: 'Creative', color: '#E7B0D2', category: 'mind' },
  { id: 'camera', emoji: '📸', name: 'Photographer', color: '#C5C6D9', category: 'mind' },
  { id: 'music', emoji: '🎧', name: 'Music head', color: '#B8B5E8', category: 'mind' },
  { id: 'vinyl', emoji: '💿', name: 'Vinyl collector', color: '#B6C7D1', category: 'mind' },
  { id: 'gaming', emoji: '🎮', name: 'Gamer', color: '#A9D4B4', category: 'mind' },
  { id: 'coding', emoji: '💻', name: 'Tech brain', color: '#B5CDEB', category: 'mind' },
  { id: 'running', emoji: '🏃', name: 'Runner', color: '#F1B77B', category: 'movement' },
  { id: 'cycling', emoji: '🚴', name: 'Cyclist', color: '#B7D6C2', category: 'movement' },
  { id: 'swimming', emoji: '🏊', name: 'Swimmer', color: '#9CCFE4', category: 'movement' },
  { id: 'football', emoji: '⚽', name: 'Football fan', color: '#B6D6A1', category: 'movement' },
  { id: 'tennis', emoji: '🎾', name: 'Tennis player', color: '#D8E28B', category: 'movement' },
  { id: 'dance', emoji: '💃', name: 'Dancer', color: '#E9A7C5', category: 'movement' },
  { id: 'hiking', emoji: '🥾', name: 'Hiker', color: '#C7B99D', category: 'outside' },
  { id: 'camping', emoji: '⛺', name: 'Camper', color: '#AFC9A4', category: 'outside' },
  { id: 'surfing', emoji: '🏄', name: 'Surfer', color: '#9ED3D8', category: 'outside' },
  { id: 'ocean', emoji: '🌊', name: 'Ocean person', color: '#91C5E4', category: 'outside' },
  { id: 'plants', emoji: '🪴', name: 'Plant parent', color: '#B5D19B', category: 'outside' },
  { id: 'travel', emoji: '✈️', name: 'Explorer', color: '#B8C8E8', category: 'outside' },
  { id: 'dog', emoji: '🐶', name: 'Dog person', color: '#DDBB96', category: 'outside' },
  { id: 'cat', emoji: '🐱', name: 'Cat person', color: '#E8B4C8', category: 'outside' },
  { id: 'party', emoji: '🪩', name: 'Dance floor', color: '#D8B5E8', category: 'culture' },
  { id: 'dj', emoji: '🎛️', name: 'DJ vibes', color: '#B9B8E8', category: 'culture' },
  { id: 'film', emoji: '🎬', name: 'Film buff', color: '#AFC3D8', category: 'culture' },
  { id: 'comedy', emoji: '🎤', name: 'Comedy fan', color: '#F0C77D', category: 'culture' },
  { id: 'boardgames', emoji: '🎲', name: 'Game night', color: '#D6B6A0', category: 'culture' },
  { id: 'fashion', emoji: '👟', name: 'Sneakerhead', color: '#C4C9D8', category: 'culture' },
] as const

export type AvatarId = (typeof AVATARS)[number]['id']

export function getAvatar(avatarId?: string | null) {
  return AVATARS.find((avatar) => avatar.id === avatarId) ?? AVATARS[0]
}
