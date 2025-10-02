// Global type declarations for missing packages

declare module 'web-push' {
  export interface PushSubscription {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  }

  export interface VapidDetails {
    subject: string;
    publicKey: string;
    privateKey: string;
  }

  export function setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
  export function sendNotification(subscription: PushSubscription, payload: string | Buffer, options?: any): Promise<void>;
}

declare module 'jsdom' {
  export class JSDOM {
    constructor(html?: string, options?: any);
    window: any;
  }
}

declare module '@types/google.maps' {
  export interface Map {
    // Basic map interface
  }
}

// Jest-DOM matchers
declare namespace jest {
  interface Matchers<R> {
    toBeInTheDocument(): R;
    toHaveAttribute(attr: string, value?: string): R;
    toHaveClass(className: string): R;
    toHaveFocus(): R;
    toBeDisabled(): R;
    toHaveValue(value: string | string[] | number): R;
    toHaveAccessibleName(name?: string): R;
  }
}

// Google Maps global
declare global {
  namespace google {
    namespace maps {
      interface Map {
        // Map interface
      }
      interface Marker {
        // Marker interface
      }
      interface LatLng {
        lat(): number;
        lng(): number;
      }
      interface LatLngBounds {
        // Bounds interface
      }
      interface MapOptions {
        center?: LatLng;
        zoom?: number;
        mapTypeId?: string;
      }
      interface MarkerOptions {
        position?: LatLng;
        map?: Map;
        title?: string;
      }
      class Map {
        constructor(mapDiv: Element, opts?: MapOptions);
        setCenter(latlng: LatLng): void;
        setZoom(zoom: number): void;
        getCenter(): LatLng;
        getZoom(): number;
      }
      class Marker {
        constructor(opts?: MarkerOptions);
        setPosition(latlng: LatLng): void;
        setMap(map: Map | null): void;
      }
      class LatLng {
        constructor(lat: number, lng: number);
        lat(): number;
        lng(): number;
      }
      class LatLngBounds {
        constructor();
        extend(latlng: LatLng): void;
        contains(latlng: LatLng): boolean;
      }
    }
  }
}

// Web Vitals
declare module 'web-vitals' {
  export function getCLS(onPerfEntry: (metric: any) => void): void;
  export function getFID(onPerfEntry: (metric: any) => void): void;
  export function getFCP(onPerfEntry: (metric: any) => void): void;
  export function getLCP(onPerfEntry: (metric: any) => void): void;
  export function getTTFB(onPerfEntry: (metric: any) => void): void;
}
