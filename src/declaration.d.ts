declare module '*.png' {
    const value: string;
    export default value;
  }
  // src/declaration.d.ts
declare module 'react-geolocated' {
    export function useGeolocated(): {
      coords: { latitude: number; longitude: number } | null;
      isGeolocationAvailable: boolean;
      isGeolocationEnabled: boolean;
    };
  }
  