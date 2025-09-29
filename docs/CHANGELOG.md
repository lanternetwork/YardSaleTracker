# Changelog

All notable changes to YardSaleFinder will be documented in this file.

## [Milestone A - Enhanced Search & Geolocation] - 2025-01-18

### Added
- **Enhanced ZIP Code Search** - PO Box support with multiple search strategies
- **IP Geolocation Improvements** - Multi-source location detection with fallback APIs
- **Map Re-centering** - Forces map updates even with identical coordinates
- **Cache Bypass System** - Reliable repeated searches with cache invalidation
- **Rate Limiting** - 60 requests/minute with development bypass
- **Comprehensive Debugging** - Detailed console logging for troubleshooting

### ZIP Code Search Features
- **PO Box Support** - Handles PO Box-only ZIP codes (e.g., 90078) with fallback locations
- **Multiple Search Strategies** - Tries post office, city, and state-based searches
- **Cache Management** - 1-hour TTL with bypass options for testing
- **Visual Feedback** - Console logging and success indicators
- **Error Handling** - Graceful fallbacks for geocoding failures

### IP Geolocation System
- **Primary Source** - Vercel IP headers for fast, server-side detection
- **Fallback API** - ipapi.co integration for improved accuracy
- **Multi-Header Support** - x-forwarded-for, x-real-ip, cf-connecting-ip
- **Debugging** - Comprehensive logging for geolocation troubleshooting
- **Accuracy** - Better location detection for regional areas (e.g., Louisville vs Cincinnati)

## [Milestone A - Map Clustering] - 2025-01-18

### Added
- **Zoom-aware map clustering** - Blue cluster circles that appear/disappear based on zoom level
- **Custom clustering algorithm** - Distance-based clustering using Haversine formula for accurate km calculations
- **InfoWindow cluster popups** - Rich popups showing first 10 sales with "View All" button
- **Cluster preview UI** - Scrollable list of sales with title, address, and date
- **Map container optimization** - Fixed map loading issues and container availability
- **Debug logging** - Comprehensive console logging for clustering decisions and zoom changes

### Changed
- **Map component architecture** - Replaced simple markers with advanced clustering system
- **Zoom behavior** - Clusters break apart when zoomed in close (zoom 15+), reform when zoomed out
- **Popup system** - Replaced bottom overlays with map-based InfoWindow popups
- **Marker management** - Optimized marker creation/destruction to prevent blinking

### Technical Details
- **Clustering thresholds**:
  - Zoom 15+: No clustering (individual markers only)
  - Zoom 12-14: Small radius (5km) for tight clustering  
  - Zoom <12: Large radius (20km) for wide clustering
- **Distance calculation**: Haversine formula for accurate real-world distances
- **Performance optimizations**: Change detection prevents unnecessary marker updates
- **InfoWindow API**: Proper Google Maps InfoWindow usage with anchor positioning

### Fixed
- **Map container errors** - Resolved "Map container not available" issues
- **TypeScript compilation** - Fixed InfoWindow API usage and method signatures
- **Marker blinking** - Eliminated visual flickering during zoom changes
- **Popup positioning** - Corrected InfoWindow anchor and positioning

## [Production Steps Kickoff] - 2025-01-18

### Added
- Production roadmap implementation
- Comprehensive testing strategy
- Performance optimization plan
- Security enhancements
- SEO and marketing features
- Cost optimization review

### Changed
- Updated plan.md with active roadmap checklist
- Enhanced documentation structure

### Next Steps
- Complete all 7 production milestones
- Implement virtual scrolling for performance
- Add push notifications and real-time updates
- Integrate monitoring and analytics
- Enhance security measures
- Optimize for SEO and marketing
- Complete comprehensive testing
- Review and optimize costs
