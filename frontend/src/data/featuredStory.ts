export interface RestorationStory {
  id: string;
  title: string;
  description: string;
  gradientFrom: string;
  gradientTo: string;
}

export interface FeaturedStory {
  eyebrow: string;
  headline: string;
  dek: string;
  imageCaption: string;
}

export const featuredStory: FeaturedStory = {
  eyebrow: 'Featured restoration story',
  headline: 'A journey from silence to voice',
  dek: 'Each story within these walls represents a life reclaimed — a quiet transformation from fear into strength, from isolation into community. This is one of many journeys that reminds us why every resource, every trained hand, every moment of care matters profoundly.',
  imageCaption: 'Finding Voice — A calm space to speak — and be heard.',
};

export const restorationStories: RestorationStory[] = [
  {
    id: 'S001',
    title: 'Finding Voice',
    description: 'Structured counseling milestones tied to anonymized outcome indicators, helping residents rediscover their sense of self and capacity to express their needs.',
    gradientFrom: '#dce8dc',
    gradientTo: '#c5dde1',
  },
  {
    id: 'S002',
    title: 'Reconnecting with Family',
    description: 'Gradual supervised contact plans aligned with case conferences, carefully rebuilding trust and safety within family relationships at a pace each child defines.',
    gradientFrom: '#e8f1ef',
    gradientTo: '#dce8dc',
  },
  {
    id: 'S003',
    title: 'Academic Excellence',
    description: 'Education records tracked alongside wellbeing goals, celebrating every achievement as a step toward independence, confidence, and a future of their choosing.',
    gradientFrom: '#c5dde1',
    gradientTo: '#e8f1ef',
  },
];
