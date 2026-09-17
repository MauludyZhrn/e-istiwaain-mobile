export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface HisabResult {
  declination: number;
  equationOfTime: number;
  qiblaAzimuth: number;
  sunAzimuth: number;
  rashdulQiblah: string;
}