declare module 'polyline-encoded' {
  export function decode(polyline: string): Array<[number, number]>;
  export function encode(coordinates: Array<[number, number]>): string;
}
