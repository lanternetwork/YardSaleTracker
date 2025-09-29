# Map Clustering Documentation

## Overview

The YardSaleFinder map now features advanced zoom-aware clustering that groups nearby sales into visual clusters, improving map usability and performance.

## Features

### Zoom-Aware Clustering
- **Low zoom (<12)**: Large radius (20km) clustering for wide area view
- **Medium zoom (12-14)**: Small radius (5km) for tighter clustering
- **High zoom (15+)**: No clustering - individual markers only

### Visual Elements
- **Blue cluster circles** with count numbers (e.g., "2" for 2 sales)
- **Individual markers** for single sales or when zoomed in close
- **InfoWindow popups** for cluster interactions

### Cluster Popups
- **First 10 sales** displayed in scrollable list
- **Sale details**: Title, address, date
- **"View All" button** for clusters with >10 sales
- **Map-anchored positioning** using Google Maps InfoWindow

## Technical Implementation

### Clustering Algorithm
```typescript
// Distance calculation using Haversine formula
const getDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}
```

### Zoom Thresholds
```typescript
let clusterRadiusKm: number
if (zoom >= 15) {
  clusterRadiusKm = 0 // No clustering at high zoom
} else if (zoom >= 12) {
  clusterRadiusKm = 5 // Small radius at medium zoom
} else {
  clusterRadiusKm = 20 // Large radius at low zoom
}
```

### Performance Optimizations
- **Change detection**: Only updates markers when clustering actually changes
- **Marker tracking**: Proper cleanup of old cluster markers
- **State management**: Efficient re-clustering on zoom changes

## User Experience

### Interaction Flow
1. **Zoom out**: Sales cluster into blue circles with counts
2. **Click cluster**: InfoWindow shows first 10 sales
3. **Zoom in**: Clusters break apart into individual markers
4. **Click individual marker**: Standard sale popup

### Visual Feedback
- **Smooth transitions** between cluster and individual marker states
- **No blinking** during zoom changes
- **Consistent positioning** of InfoWindow popups
- **Responsive design** with scrollable content

## Configuration

### Clustering Parameters
- **Cluster radius**: Adjustable based on zoom level
- **Minimum cluster size**: 2 markers required for clustering
- **Distance calculation**: Haversine formula for accuracy

### InfoWindow Settings
- **Max width**: 300px (controlled by CSS)
- **Max height**: 200px with scroll
- **Content**: HTML with inline styles for consistency

## Debugging

### Console Logs
- **Zoom changes**: `Zoom changed to: X`
- **Clustering decisions**: `Clustering with radius: Xkm at zoom level: Y`
- **Distance calculations**: `Distance between markers: X.XXkm (threshold: Ykm)`
- **Cluster creation**: `Cluster found: X markers at (lat, lng)`

### Performance Monitoring
- **Marker count**: `Markers updated: X, clusters: Y`
- **Change detection**: `Clustering unchanged, skipping marker updates`
- **Update triggers**: `Clustering changed, updating markers`

## Browser Compatibility

### Requirements
- **Google Maps API**: v3 with clustering support
- **Modern browsers**: ES6+ support for async/await
- **TypeScript**: Strict type checking enabled

### Fallbacks
- **No clustering**: Falls back to individual markers if clustering fails
- **Error handling**: Graceful degradation for API failures
- **Fallback queries**: Uses regular Supabase queries if RPC fails

## Future Enhancements

### Planned Features
- **Custom cluster icons**: Different styles for different sale types
- **Cluster animations**: Smooth transitions during zoom changes
- **Advanced filtering**: Cluster by date, price, or category
- **Performance metrics**: Real-time clustering performance monitoring

### Optimization Opportunities
- **Web Workers**: Move clustering calculations off main thread
- **Caching**: Store cluster results for repeated zoom levels
- **Lazy loading**: Load cluster data on demand
- **Memory management**: Better cleanup of marker references
