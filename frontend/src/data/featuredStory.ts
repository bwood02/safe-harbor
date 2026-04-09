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
  headline: 'A Journey from Silence to Voice',
  dek: 'Each story within these walls represents a life reclaimed — a quiet transformation from fear into strength, from isolation into community. This is one of many journeys that reminds us why every resource, every trained hand, every moment of care matters profoundly.',
  imageCaption: 'Finding Voice — A calm space to speak — and be heard.',
};

export const restorationStories: RestorationStory[] = [
  {
    id: 'S001',
    title: 'A Journey from Silence to Voice',
    description:
      'Each story within these walls represents a life reclaimed — a quiet transformation from fear into strength, from isolation into community. This is one of many journeys that reminds us why every resource, every trained hand, every moment of care matters profoundly.',
    gradientFrom: '#dce8dc',
    gradientTo: '#c5dde1',
  },
  {
    id: 'S002',
    title: 'Reconnecting with Family',
    description:
      'Supervised reconnection moments become turning points: trust is rebuilt slowly, safety is protected, and families begin to heal together.',
    gradientFrom: '#e8f1ef',
    gradientTo: '#dce8dc',
  },
  {
    id: 'S003',
    title: 'Academic Excellence',
    description:
      'From first breakthroughs to major milestones, survivors are rewriting their futures through learning, confidence, and hard-won academic success.',
    gradientFrom: '#c5dde1',
    gradientTo: '#e8f1ef',
  },
];
