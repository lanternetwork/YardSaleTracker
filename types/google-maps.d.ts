declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: Element, opts?: MapOptions)
      setCenter(latlng: LatLng | LatLngLiteral): void
      setZoom(zoom: number): void
      getCenter(): LatLng
      getZoom(): number
      addListener(eventName: string, handler: Function): MapsEventListener
    }

    class LatLng {
      constructor(lat: number, lng: number)
      lat(): number
      lng(): number
    }

    interface LatLngLiteral {
      lat: number
      lng: number
    }

    interface MapOptions {
      center?: LatLng | LatLngLiteral
      zoom?: number
      mapTypeId?: MapTypeId
    }

    enum MapTypeId {
      ROADMAP = 'roadmap',
      SATELLITE = 'satellite',
      HYBRID = 'hybrid',
      TERRAIN = 'terrain'
    }

    class Marker {
      constructor(opts?: MarkerOptions)
      setPosition(latlng: LatLng | LatLngLiteral): void
      setMap(map: Map | null): void
      addListener(eventName: string, handler: Function): MapsEventListener
    }

    interface MarkerOptions {
      position?: LatLng | LatLngLiteral
      map?: Map
      title?: string
      label?: string
    }

    class InfoWindow {
      constructor(opts?: InfoWindowOptions)
      setContent(content: string | Element): void
      open(map?: Map, anchor?: Marker): void
      close(): void
    }

    interface InfoWindowOptions {
      content?: string | Element
      position?: LatLng | LatLngLiteral
    }

    interface MapsEventListener {
      remove(): void
    }

    namespace geometry {
      namespace spherical {
        function computeDistanceBetween(from: LatLng, to: LatLng): number
      }
    }
  }
}
