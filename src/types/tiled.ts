export interface TiledLayer {
  data: number[];
  height: number;
  width: number;
  name: string;
  type: 'tilelayer' | 'objectgroup';
  visible: boolean;
  opacity: number;
  x: number;
  y: number;
}

export interface TiledMap {
  width: number;
  height: number;
  layers: TiledLayer[];
  tilewidth: number;
  tileheight: number;
}
