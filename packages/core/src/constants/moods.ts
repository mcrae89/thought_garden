export type MoodFamily =
  | 'joy_love_gratitude'
  | 'peace_calm_acceptance'
  | 'grief_loneliness_sadness'
  | 'anxiety_overwhelm'
  | 'resilience_courage'
  | 'creativity_wonder';

export type Mood =
  | 'joy'
  | 'love'
  | 'gratitude'
  | 'peace'
  | 'calm'
  | 'acceptance'
  | 'grief'
  | 'loneliness'
  | 'sadness'
  | 'anxiety'
  | 'overwhelm'
  | 'resilience'
  | 'courage'
  | 'creativity'
  | 'wonder';

export interface MoodDefinition {
  mood: Mood;
  family: MoodFamily;
  colorHint: string; // Tailwind-style hint for NativeWind
}

export const MOODS: MoodDefinition[] = [
  { mood: 'joy',        family: 'joy_love_gratitude',       colorHint: 'yellow' },
  { mood: 'love',       family: 'joy_love_gratitude',       colorHint: 'red' },
  { mood: 'gratitude',  family: 'joy_love_gratitude',       colorHint: 'orange' },
  { mood: 'peace',      family: 'peace_calm_acceptance',    colorHint: 'blue' },
  { mood: 'calm',       family: 'peace_calm_acceptance',    colorHint: 'sky' },
  { mood: 'acceptance', family: 'peace_calm_acceptance',    colorHint: 'purple' },
  { mood: 'grief',      family: 'grief_loneliness_sadness', colorHint: 'slate' },
  { mood: 'loneliness', family: 'grief_loneliness_sadness', colorHint: 'gray' },
  { mood: 'sadness',    family: 'grief_loneliness_sadness', colorHint: 'indigo' },
  { mood: 'anxiety',    family: 'anxiety_overwhelm',        colorHint: 'green' },
  { mood: 'overwhelm',  family: 'anxiety_overwhelm',        colorHint: 'violet' },
  { mood: 'resilience', family: 'resilience_courage',       colorHint: 'amber' },
  { mood: 'courage',    family: 'resilience_courage',       colorHint: 'orange' },
  { mood: 'creativity', family: 'creativity_wonder',        colorHint: 'teal' },
  { mood: 'wonder',     family: 'creativity_wonder',        colorHint: 'fuchsia' },
];
