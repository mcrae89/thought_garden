import React, { useMemo } from 'react';
import { View, Image } from 'react-native';
import type { TiledMap } from '@/types/tiled';
import { TILE_IMAGES } from './tileRequires';

interface TilemapRendererProps {
  mapData: TiledMap;
  tileSize?: number;
  children?: React.ReactNode;
}

export const NATIVE_TILE = 16;

export const TilemapRenderer = React.memo(function TilemapRenderer({ mapData, tileSize = 32, children }: TilemapRendererProps) {
  const scale = tileSize / NATIVE_TILE;
  const nativeWidth = mapData.width * NATIVE_TILE;
  const nativeHeight = mapData.height * NATIVE_TILE;

  const tiles = useMemo(() => {
    const result: React.ReactElement[] = [];
    for (const layer of mapData.layers) {
      if (layer.type !== 'tilelayer' || !layer.visible) continue;
      for (let i = 0; i < layer.data.length; i++) {
        const gid = layer.data[i];
        if (gid === 0 || !TILE_IMAGES[gid]) continue;
        const col = i % layer.width;
        const row = Math.floor(i / layer.width);
        result.push(
          <Image
            key={`${layer.name}-${i}`}
            source={TILE_IMAGES[gid]}
            style={{
              position: 'absolute',
              left: col * NATIVE_TILE,
              top: row * NATIVE_TILE,
              width: NATIVE_TILE,
              height: NATIVE_TILE,
            }}
            resizeMode="stretch"
          />,
        );
      }
    }
    return result;
  }, [mapData]);

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
        {children}
      </View>
    </View>
  );
});
