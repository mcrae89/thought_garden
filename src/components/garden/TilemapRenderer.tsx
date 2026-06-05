import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import type { TiledMap } from '@/types/tiled';

interface TilemapRendererProps {
  mapData: TiledMap;
  tileSize?: number;
}

interface TilesetDef {
  firstgid: number;
  columns: number;
  image: ReturnType<typeof require>;
  imageWidth: number;
  imageHeight: number;
}

const TILESETS: TilesetDef[] = [
  { firstgid: 1,   columns: 11, image: require('../../../assets/tiles/sprout-lands/ground/Darker_Grass_Hills_Tiles_v2.png'),               imageWidth: 176, imageHeight: 112 },
  { firstgid: 78,  columns: 11, image: require('../../../assets/tiles/sprout-lands/ground/Darker_Soil_Ground_Hills_Tiles.png'),             imageWidth: 176, imageHeight: 112 },
  { firstgid: 155, columns: 5,  image: require('../../../assets/tiles/sprout-lands/structures/Wooden_House_Walls_Tilset.png'),               imageWidth: 80,  imageHeight: 48  },
  { firstgid: 170, columns: 7,  image: require('../../../assets/tiles/sprout-lands/structures/Wooden_House_Roof_Tilset.png'),                imageWidth: 112, imageHeight: 80  },
  { firstgid: 205, columns: 18, image: require('../../../assets/tiles/sprout-lands/structures/door animation sprites.png'),                 imageWidth: 288, imageHeight: 32  },
  { firstgid: 241, columns: 8,  image: require('../../../assets/tiles/sprout-lands/fences/Fences.png'),                                     imageWidth: 128, imageHeight: 64  },
  { firstgid: 273, columns: 10, image: require('../../../assets/tiles/sprout-lands/fences/Fence gates animation sprites .png'),             imageWidth: 160, imageHeight: 48  },
  { firstgid: 303, columns: 4,  image: require('../../../assets/tiles/sprout-lands/paths/Paths.png'),                                       imageWidth: 64,  imageHeight: 64  },
  { firstgid: 319, columns: 12, image: require('../../../assets/sprites/objects/trees/Trees, stumps and bushes.png'),                       imageWidth: 192, imageHeight: 112 },
  { firstgid: 403, columns: 2,  image: require('../../../assets/sprites/objects/decorations/Water well.png'),                               imageWidth: 32,  imageHeight: 32  },
  { firstgid: 407, columns: 12, image: require('../../../assets/sprites/objects/decorations/Mushrooms, Flowers, Stones.png'),               imageWidth: 192, imageHeight: 80  },
  { firstgid: 467, columns: 8,  image: require('../../../assets/sprites/objects/decorations/signs_sides.png'),                              imageWidth: 128, imageHeight: 32  },
];

const NATIVE_TILE_SIZE = 16;

function findTileset(gid: number): TilesetDef | null {
  for (let i = TILESETS.length - 1; i >= 0; i--) {
    if (TILESETS[i].firstgid <= gid) return TILESETS[i];
  }
  return null;
}

export function TilemapRenderer({ mapData, tileSize = 32 }: TilemapRendererProps) {
  const scale = tileSize / NATIVE_TILE_SIZE; // 2
  const tiles: React.ReactElement[] = [];

  for (const layer of mapData.layers) {
    if (layer.type !== 'tilelayer' || !layer.visible) continue;

    for (let i = 0; i < layer.data.length; i++) {
      const gid = layer.data[i];
      if (gid === 0) continue;

      const tileset = findTileset(gid);
      if (!tileset) continue;

      const localId = gid - tileset.firstgid;
      const srcCol = localId % tileset.columns;
      const srcRow = Math.floor(localId / tileset.columns);
      // Offset in display pixels (tileset image rendered at 2x scale)
      const offsetX = -(srcCol * tileSize);
      const offsetY = -(srcRow * tileSize);

      const col = i % layer.width;
      const row = Math.floor(i / layer.width);

      tiles.push(
        // Clip container — shows only one tile worth of space
        <View
          key={`${layer.name}-${i}`}
          style={[styles.tileClip, { left: col * tileSize, top: row * tileSize }]}
        >
          {/* Full tileset sheet scaled to 2x, offset to show correct tile */}
          <Image
            source={tileset.image}
            style={{
              position: 'absolute',
              left: offsetX,
              top: offsetY,
              width: tileset.imageWidth * scale,
              height: tileset.imageHeight * scale,
            }}
            contentFit="fill"
            cachePolicy="memory"
            accessibilityIgnoresInvertColors
          />
        </View>,
      );
    }
  }

  return (
    <View style={{ width: mapData.width * tileSize, height: mapData.height * tileSize }}>
      {tiles}
    </View>
  );
}

const styles = StyleSheet.create({
  tileClip: {
    position: 'absolute',
    width: 32,
    height: 32,
    overflow: 'hidden',
  },
});
