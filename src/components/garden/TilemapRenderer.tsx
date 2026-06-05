import React from 'react';
import { View, Image } from 'react-native';
import type { TiledMap } from '@/types/tiled';
import { TILE_IMAGES } from './tileRequires';

interface TilemapRendererProps {
  mapData: TiledMap;
  tileSize?: number;
}

const NATIVE = 16;

export function TilemapRenderer({ mapData, tileSize = 32 }: TilemapRendererProps) {
  const scale = tileSize / NATIVE;
  const nativeWidth = mapData.width * NATIVE;
  const nativeHeight = mapData.height * NATIVE;
  const tiles: React.ReactElement[] = [];

  for (const layer of mapData.layers) {
    if (layer.type !== 'tilelayer' || !layer.visible) continue;

    for (let i = 0; i < layer.data.length; i++) {
      const gid = layer.data[i];
      if (gid === 0 || !TILE_IMAGES[gid]) continue;

      const col = i % layer.width;
      const row = Math.floor(i / layer.width);

      tiles.push(
        <Image
          key={`${layer.name}-${i}`}
          source={TILE_IMAGES[gid]}
          style={{
            position: 'absolute',
            left: col * NATIVE,
            top: row * NATIVE,
            width: NATIVE,
            height: NATIVE,
          }}
          resizeMode="stretch"
        />,
      );
    }
  }

  return (
    <View style={{ width: mapData.width * tileSize, height: mapData.height * tileSize }}>
      <View
        style={{
          width: nativeWidth,
          height: nativeHeight,
          transform: [{ scale }],
          transformOrigin: 'top left',
        }}
      >
        {tiles}
      </View>
    </View>
  );
}
