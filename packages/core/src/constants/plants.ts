export type PlantSpecies =
  | 'sunflower'
  | 'tulip'
  | 'rose'
  | 'daffodil'
  | 'lavender'
  | 'fern'
  | 'bamboo'
  | 'cactus'
  | 'wisteria'
  | 'blue_poppy'
  | 'bird_of_paradise'
  | 'moonflower'
  | 'foxglove'
  | 'forget_me_not'
  | 'protea'
  | 'willow_herb'
  | 'passionflower'
  | 'edelweiss'
  | 'lotus'
  | 'bleeding_heart'
  | 'dahlia'
  | 'hydrangea'
  | 'morning_glory'
  | 'chamomile'
  | 'aloe';

export type Theme =
  | 'gratitude'
  | 'joy'
  | 'love'
  | 'hope'
  | 'peace'
  | 'reflection'
  | 'growth'
  | 'resilience'
  | 'anxiety'
  | 'grief'
  | 'anger'
  | 'loneliness'
  | 'confusion'
  | 'nostalgia'
  | 'creativity'
  | 'exhaustion'
  | 'curiosity'
  | 'courage'
  | 'acceptance'
  | 'self_compassion'
  | 'excitement'
  | 'sadness'
  | 'overwhelm'
  | 'contentment'
  | 'healing';

export interface PlantDefinition {
  species: PlantSpecies;
  theme: Theme;
  isRare: boolean;
}

export const PLANTS: PlantDefinition[] = [
  { species: 'sunflower',         theme: 'gratitude',      isRare: false },
  { species: 'tulip',             theme: 'joy',            isRare: false },
  { species: 'rose',              theme: 'love',           isRare: false },
  { species: 'daffodil',          theme: 'hope',           isRare: false },
  { species: 'lavender',          theme: 'peace',          isRare: false },
  { species: 'fern',              theme: 'reflection',     isRare: false },
  { species: 'bamboo',            theme: 'growth',         isRare: false },
  { species: 'cactus',            theme: 'resilience',     isRare: false },
  { species: 'wisteria',          theme: 'anxiety',        isRare: false },
  { species: 'blue_poppy',        theme: 'grief',          isRare: true  },
  { species: 'bird_of_paradise',  theme: 'anger',          isRare: false },
  { species: 'moonflower',        theme: 'loneliness',     isRare: false },
  { species: 'foxglove',          theme: 'confusion',      isRare: false },
  { species: 'forget_me_not',     theme: 'nostalgia',      isRare: false },
  { species: 'protea',            theme: 'creativity',     isRare: true  },
  { species: 'willow_herb',       theme: 'exhaustion',     isRare: false },
  { species: 'passionflower',     theme: 'curiosity',      isRare: false },
  { species: 'edelweiss',         theme: 'courage',        isRare: true  },
  { species: 'lotus',             theme: 'acceptance',     isRare: false },
  { species: 'bleeding_heart',    theme: 'self_compassion',isRare: false },
  { species: 'dahlia',            theme: 'excitement',     isRare: false },
  { species: 'hydrangea',         theme: 'sadness',        isRare: false },
  { species: 'morning_glory',     theme: 'overwhelm',      isRare: false },
  { species: 'chamomile',         theme: 'contentment',    isRare: false },
  { species: 'aloe',              theme: 'healing',        isRare: false },
];

export const PLANT_BY_THEME = Object.fromEntries(
  PLANTS.map((p) => [p.theme, p])
) as Record<Theme, PlantDefinition>;
