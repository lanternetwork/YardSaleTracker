export function haversineKm(a: {lat: number, lng: number}, b: {lat: number, lng: number}) {
  const toRad = (n: number) => (n * Math.PI) / 180
  // Use WGS84 mean Earth radius for better accuracy
  const R = 6371.0088
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const sa = Math.sin(dLat/2)**2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng/2)**2
  return 2 * R * Math.asin(Math.sqrt(sa))
}

export function kmToMiles(km: number): number {
  // Use more precise factor
  return km * 0.62137119223733
}

export function milesToKm(miles: number): number {
  // Use inverse of kmToMiles to minimize round-trip drift
  return miles / 0.62137119223733
}
