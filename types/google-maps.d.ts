declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: Element, opts?: MapOptions)
      setCenter(latlng: LatLng | LatLngLiteral): void
      setZoom(zoom: number): void
      getCenter(): LatLng
      getZoom(): number
      addListener(eventName: string, handler: Function): MapsEventListener
      fitBounds(bounds: LatLngBounds): void
      controls: { [key: number]: { push(element: HTMLElement): void } }
      map: Map
      anchor: any
    }

    class LatLngBounds {
      constructor(sw?: LatLng, ne?: LatLng)
      extend(point: LatLng): LatLngBounds
      contains(point: LatLng): boolean
      isEmpty(): boolean
    }

    enum ControlPosition {
      TOP_LEFT = 1,
      TOP_CENTER = 2,
      TOP_RIGHT = 3,
      LEFT_TOP = 4,
      LEFT_CENTER = 5,
      LEFT_BOTTOM = 6,
      RIGHT_TOP = 7,
      RIGHT_CENTER = 8,
      RIGHT_BOTTOM = 9,
      BOTTOM_LEFT = 10,
      BOTTOM_CENTER = 11,
      BOTTOM_RIGHT = 12
    }

    interface ControlPosition {
      push(element: HTMLElement): void
    }

    class ControlPosition {
      push(element: HTMLElement): void
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
      mapTypeControl?: boolean
      streetViewControl?: boolean
      fullscreenControl?: boolean
      zoomControl?: boolean
      styles?: MapTypeStyle[]
    }

    enum MapTypeId {
      ROADMAP = 'roadmap',
      SATELLITE = 'satellite',
      HYBRID = 'hybrid',
      TERRAIN = 'terrain'
    }

    interface MapTypeStyle {
      elementType?: string
      featureType?: string
      stylers?: MapTypeStyler[]
    }

    interface MapTypeStyler {
      color?: string
      gamma?: number
      hue?: string
      invert_lightness?: boolean
      lightness?: number
      saturation?: number
      visibility?: string
      weight?: number
    }

    class Marker {
      constructor(opts?: MarkerOptions)
      setPosition(latlng: LatLng | LatLngLiteral): void
      getPosition(): LatLng
      setMap(map: Map | null): void
      addListener(eventName: string, handler: Function): MapsEventListener
    }

    interface MarkerOptions {
      position?: LatLng | LatLngLiteral
      map?: Map
      title?: string
      label?: string | LabelOptions
      icon?: string | IconOptions
    }

    interface LabelOptions {
      text: string
      color?: string
      fontSize?: string
      fontWeight?: string
    }

    interface IconOptions {
      url: string
      scaledSize?: Size
      anchor?: Point
    }

    interface Point {
      x: number
      y: number
    }

    interface Size {
      width: number
      height: number
    }

    class InfoWindow {
      constructor(opts?: InfoWindowOptions)
      setContent(content: string | Element): void
      open(options?: { map?: Map; anchor?: Marker }): void
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

    namespace event {
      function addListener(instance: any, eventName: string, handler: Function): MapsEventListener
      function addListenerOnce(instance: any, eventName: string, handler: Function): MapsEventListener
      function removeListener(listener: MapsEventListener): void
    }

    class Size {
      constructor(width: number, height: number, widthUnit?: string, heightUnit?: string)
      width: number
      height: number
    }

    namespace places {
      class Autocomplete {
        constructor(input: HTMLInputElement, options?: AutocompleteOptions)
        addListener(eventName: string, handler: Function): MapsEventListener
        getPlace(): PlaceResult
        setBounds(bounds: LatLngBounds): void
        setTypes(types: string[]): void
      }

      interface AutocompleteOptions {
        bounds?: LatLngBounds
        componentRestrictions?: ComponentRestrictions
        fields?: string[]
        strictBounds?: boolean
        types?: string[]
      }

      interface ComponentRestrictions {
        country?: string | string[]
      }

      interface PlaceResult {
        address_components?: AddressComponent[]
        formatted_address?: string
        geometry?: PlaceGeometry
        name?: string
        place_id?: string
        types?: string[]
        url?: string
        utc_offset?: number
        vicinity?: string
        website?: string
      }

      interface AddressComponent {
        long_name: string
        short_name: string
        types: string[]
      }

      interface PlaceGeometry {
        location?: LatLng
        viewport?: LatLngBounds
      }
    }
  }
}
