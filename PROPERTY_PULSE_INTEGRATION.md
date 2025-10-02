# Property Pulse Integration

This branch integrates the Property Pulse Next.js template while preserving the existing Yard Sale Tracker functionality.

## Structure

### Property Pulse Files
- `app-property-pulse/` - Property Pulse app directory
- `components-property-pulse/` - Property Pulse components
- `config-property-pulse/` - Property Pulse configuration
- `context-property-pulse/` - Property Pulse context providers
- `models-property-pulse/` - Property Pulse data models
- `utils-property-pulse/` - Property Pulse utilities

### Preserved Assets
- `/public/brand/` - Preserved for existing branding assets
- Existing app structure in `app/` directory
- Existing components in `components/` directory

## Dependencies Added

### Property Pulse Dependencies
- `cloudinary` - Image upload and management
- `mapbox-gl` - Map functionality
- `mongodb` - Database
- `mongoose` - MongoDB ODM
- `next-auth` - Authentication
- `photoswipe` - Image gallery
- `react-geocode` - Geocoding
- `react-icons` - Icon library
- `react-map-gl` - React map components
- `react-photoswipe-gallery` - Photo gallery
- `react-share` - Social sharing
- `react-spinners` - Loading spinners
- `react-toastify` - Toast notifications

## Node.js Version
- Enforced Node 20 via `.nvmrc` and `package.json.engines`

## Tailwind Configuration
- Updated to include Property Pulse components
- Added Poppins font family
- Added custom grid template columns

## Next Steps
1. Install dependencies: `npm install`
2. Configure environment variables for Property Pulse
3. Set up MongoDB connection
4. Configure Cloudinary for image uploads
5. Set up Mapbox API key
6. Test Property Pulse functionality

## Legacy Code
- Existing Yard Sale Tracker code paths are preserved
- No modifications to legacy functionality
- Property Pulse runs alongside existing app
