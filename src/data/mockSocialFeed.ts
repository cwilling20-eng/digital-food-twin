export type PostType = 'meal' | 'achievement' | 'discovery' | 'recommendation';

export interface MockStory {
  id: string;
  userName: string;
  avatarInitials: string;
  avatarGradient: string;
  hasNewStory: boolean;
  restaurantName?: string;
  dishName?: string;
  timestamp: string;
}

export interface MockDiningSignal {
  id: string;
  userName: string;
  avatarInitials: string;
  avatarGradient: string;
  activatedAgo: string;
}

export interface MockPost {
  id: string;
  type: PostType;
  userName: string;
  avatarInitials: string;
  avatarGradient: string;
  timestamp: string;
  dnaMatch?: number;
  // Meal post
  dishName?: string;
  restaurantName?: string;
  caption?: string;
  imageUrl?: string;
  reactions?: number;
  comments?: number;
  // Achievement
  achievementText?: string;
  // Discovery
  discoveryMatch?: number;
  // Recommendation
  recommendationSource?: string;
}

export const MOCK_STORIES: MockStory[] = [
  { id: 'you', userName: 'Your Story', avatarInitials: '+', avatarGradient: 'from-nm-surface-high to-nm-surface-high', hasNewStory: false },
  { id: 's1', userName: 'Elena', avatarInitials: 'EV', avatarGradient: 'from-nm-signature to-nm-signature-light', hasNewStory: true, restaurantName: 'Osteria Francescana', dishName: 'Truffle Tagliatelle' },
  { id: 's2', userName: 'Marcus', avatarInitials: 'MC', avatarGradient: 'from-nm-accent to-nm-signature', hasNewStory: true, restaurantName: 'Neon Tokyo Lounge', dishName: 'Yuzu Highball' },
  { id: 's3', userName: 'Tamarah', avatarInitials: 'TJ', avatarGradient: 'from-nm-success to-nm-success', hasNewStory: true, restaurantName: "Pappadeaux's", dishName: 'Seafood Platter' },
  { id: 's4', userName: 'Kyle', avatarInitials: 'KM', avatarGradient: 'from-nm-signature-light to-nm-accent', hasNewStory: false },
  { id: 's5', userName: 'Priya', avatarInitials: 'PD', avatarGradient: 'from-nm-accent to-nm-accent', hasNewStory: true, restaurantName: 'Curry House', dishName: 'Butter Chicken' },
];

export const MOCK_DINING_SIGNALS: MockDiningSignal[] = [
  { id: 'd1', userName: 'Elena Vance', avatarInitials: 'EV', avatarGradient: 'from-nm-signature to-nm-signature-light', activatedAgo: '15 min ago' },
  { id: 'd2', userName: 'Tamarah Jones', avatarInitials: 'TJ', avatarGradient: 'from-nm-success to-nm-success', activatedAgo: '1 hr ago' },
];

export const MOCK_POSTS: MockPost[] = [
  {
    id: 'p1',
    type: 'meal',
    userName: 'Elena Vance',
    avatarInitials: 'EV',
    avatarGradient: 'from-nm-signature to-nm-signature-light',
    timestamp: '2 hours ago',
    dnaMatch: 94,
    dishName: 'Wild Mushroom Truffle Tagliatelle',
    restaurantName: 'Osteria Francescana',
    caption: 'The earthy aroma hit me before the plate even reached the table. Seriously the best pasta I\'ve had this year. Anyone want to go back next Tuesday? 🍝✨',
    reactions: 28,
    comments: 12,
  },
  {
    id: 'p2',
    type: 'achievement',
    userName: 'Wayne',
    avatarInitials: 'WC',
    avatarGradient: 'from-nm-accent to-nm-signature',
    timestamp: '3 hours ago',
    achievementText: 'Wayne hit his protein goal 7 days straight 🔥',
  },
  {
    id: 'p3',
    type: 'meal',
    userName: 'Marcus Chen',
    avatarInitials: 'MC',
    avatarGradient: 'from-nm-accent to-nm-signature',
    timestamp: '5 hours ago',
    dnaMatch: 82,
    dishName: 'Smoked Yuzu Highball',
    restaurantName: 'Neon Tokyo Lounge',
    caption: 'The presentation was 10/10 but the flavor was 11/10. Subtle smoke with a citrus kick. Their happy hour starts at 4pm! 🍸',
    reactions: 45,
    comments: 8,
  },
  {
    id: 'p4',
    type: 'discovery',
    userName: 'Tamarah Jones',
    avatarInitials: 'TJ',
    avatarGradient: 'from-nm-success to-nm-success',
    timestamp: '6 hours ago',
    dnaMatch: 92,
    restaurantName: "Pappadeaux's Seafood Kitchen",
    dishName: 'Cajun Seafood Platter',
    discoveryMatch: 92,
  },
  {
    id: 'p5',
    type: 'recommendation',
    userName: 'Kyle Martinez',
    avatarInitials: 'KM',
    avatarGradient: 'from-nm-signature-light to-nm-accent',
    timestamp: '8 hours ago',
    dnaMatch: 88,
    dishName: 'Grilled Salmon Bowl',
    restaurantName: 'The Healthy Kitchen',
    caption: 'NomMigo found this gem — 420 cal, 38g protein. Exactly what I needed after the gym.',
    recommendationSource: 'NomMigo picked this',
    reactions: 15,
    comments: 3,
  },
  {
    id: 'p6',
    type: 'meal',
    userName: 'Priya Desai',
    avatarInitials: 'PD',
    avatarGradient: 'from-nm-accent to-nm-accent',
    timestamp: 'Yesterday',
    dnaMatch: 76,
    dishName: 'Butter Chicken Thali',
    restaurantName: 'Curry House',
    caption: 'Finally found a place that does butter chicken right in DFW. The naan was fresh out of the tandoor 🫓',
    reactions: 32,
    comments: 19,
  },
  {
    id: 'p7',
    type: 'achievement',
    userName: 'Elena Vance',
    avatarInitials: 'EV',
    avatarGradient: 'from-nm-signature to-nm-signature-light',
    timestamp: 'Yesterday',
    achievementText: 'Elena logged meals for 30 days straight — Master Logger unlocked! 🏆',
  },
  {
    id: 'p8',
    type: 'discovery',
    userName: 'Marcus Chen',
    avatarInitials: 'MC',
    avatarGradient: 'from-nm-accent to-nm-signature',
    timestamp: '2 days ago',
    dnaMatch: 89,
    restaurantName: 'Blue Sushi Sake Grill',
    dishName: 'Omakase Special',
    discoveryMatch: 89,
  },
];
