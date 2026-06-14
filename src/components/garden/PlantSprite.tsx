import { View, Image } from 'react-native';
import type { Plant } from '@/modules/garden';
import type { Emotion } from '@/shared/types';

const FRAME_SIZE = 32;
const SHEET_WIDTH = 96;
const STAGE_OFFSET: Record<string, number> = { sprout: 0, full: 1, bloom: 2 };

const PLANT_SHEETS: Record<Emotion, ReturnType<typeof require>> = {
  happy: require('../../../assets/sprites/plants/sunflower/happy-sunflower-planted.png'),
  sad: require('../../../assets/sprites/plants/bleeding_heart/sad-bleeding-heart-planted.png'),
  angry: require('../../../assets/sprites/plants/cactus/angry-cactus-planted.png'),
  anxious: require('../../../assets/sprites/plants/passion_flower/anxious-passionflower-planted.png'),
  calm: require('../../../assets/sprites/plants/lavender/calm-lavender-planted.png'),
  grateful: require('../../../assets/sprites/plants/hydrangea/grateful-hydrangea-planted.png'),
  love: require('../../../assets/sprites/plants/rose/love-rose-planted.png'),
  hope: require('../../../assets/sprites/plants/daffodil/hope-daffodil-planted.png'),
  excited: require('../../../assets/sprites/plants/bird_of_paradise/excited-bird-of-paradise-planted.png'),
  lonely: require('../../../assets/sprites/plants/forget_me_not/lonely-forget-me-not-planted.png'),
  proud: require('../../../assets/sprites/plants/orchid/proud-orchid-planted.png'),
  confused: require('../../../assets/sprites/plants/wisteria/confused-wisteria-planted.png'),
  peaceful: require('../../../assets/sprites/plants/lotus/peaceful-lotus-planted.png'),
  nostalgic: require('../../../assets/sprites/plants/cherry_blossom/nostalgic-cherry-blossom-planted.png'),
  jealous: require('../../../assets/sprites/plants/nightshade/jealous-nightshade-planted.png'),
  inspired: require('../../../assets/sprites/plants/iris/inspired-iris-planted.png'),
  guilty: require('../../../assets/sprites/plants/thistle/guilty-thistle-planted.png'),
  curious: require('../../../assets/sprites/plants/snapdragon/curious-snapdragon-planted.png'),
  frustrated: require('../../../assets/sprites/plants/bramble/frustrated-bramble-planted.png'),
  content: require('../../../assets/sprites/plants/chamomile/content-chamomile-planted.png'),
  overwhelmed: require('../../../assets/sprites/plants/morning_glory/overwhelmed-morning-glory-planted.png'),
  brave: require('../../../assets/sprites/plants/protea/brave-protea-planted.png'),
  embarrassed: require('../../../assets/sprites/plants/mimosa/embarrassed-mimosa-planted.png'),
  surprised: require('../../../assets/sprites/plants/stargazer_lily/surprised-stargazer-lily-planted.png'),
  bored: require('../../../assets/sprites/plants/dandelion/bored-dandelion-planted.png'),
  determined: require('../../../assets/sprites/plants/gladiolus/determined-gladiolus-planted.png'),
  compassionate: require('../../../assets/sprites/plants/aloe_vera/compassionate-aloe-vera-planted.png'),
  melancholy: require('../../../assets/sprites/plants/bluebell/melancholy-bluebell-planted.png'),
  joyful: require('../../../assets/sprites/plants/daisy/joyful-daisy-planted.png'),
  vulnerable: require('../../../assets/sprites/plants/snowdrop/vulnerable-snowdrop-planted.png'),
};

export function PlantSprite({ plant, size }: { plant: Plant; size?: number }) {
  const s = size ?? FRAME_SIZE;

  if (plant.growthStage === 'seed') {
    return (
      <Image
        source={require('../../../assets/sprites/plants/seed.png')}
        style={{ width: s, height: s }}
        resizeMode="stretch"
        accessibilityLabel={`${plant.emotion} seed`}
      />
    );
  }

  const frameIndex = STAGE_OFFSET[plant.growthStage] ?? 0;
  const scale = s / FRAME_SIZE;

  return (
    <View style={{ width: s, height: s, overflow: 'hidden' }} accessibilityLabel={`${plant.emotion} plant, ${plant.growthStage} stage`}>
      <Image
        source={PLANT_SHEETS[plant.emotion]}
        style={{
          width: SHEET_WIDTH * scale,
          height: s,
          marginLeft: -frameIndex * s,
        }}
        resizeMode="stretch"
      />
    </View>
  );
}
