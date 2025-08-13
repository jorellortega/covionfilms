# Streaming Control System

This document explains how to use the comprehensive streaming control system for your movie app, which allows you to manage video sources based on subscription tiers and integrate with Dropbox for storage.

## 🚀 Features

### 1. **Multi-Source Streaming**
- **Supabase Storage (Free)**: Basic storage for free users (720p max)
- **Cloudflare Stream (Premium)**: High-performance CDN for premium users (4K max)
- **Bunny.net (Standard)**: Cost-effective CDN for standard users (1080p max)
- **Dropbox Storage**: Internal storage for admin/management use

### 2. **Subscription Tier Management**
- **Free**: Supabase bucket only, 720p max quality
- **Standard**: Bunny.net CDN + Supabase fallback, 1080p max quality
- **Premium**: Cloudflare Stream + Bunny.net fallback, 4K max quality
- **Family**: Same as Premium, 4K max quality

### 3. **Smart Fallback System**
- Automatic fallback to backup sources if primary source fails
- Quality degradation based on available sources
- Seamless user experience during source failures

### 4. **Dropbox Integration**
- Secure file storage for internal use
- Video organization and management
- Transfer capabilities to streaming sources

## 📁 File Structure

```
├── app/streaming-control/page.tsx          # Main admin interface
├── lib/streamingService.ts                 # Core streaming logic
├── hooks/use-streaming.ts                  # React hook for components
├── components/streaming-video-player.tsx   # Example video player
├── migrations/002_streaming_control.sql    # Database schema
└── scripts/run-migrations.js               # Migration runner
```

## 🗄️ Database Schema

### Core Tables

1. **`streaming_sources`** - Available streaming sources
2. **`tier_configurations`** - How each subscription tier uses sources
3. **`dropbox_configurations`** - Dropbox integration settings
4. **`video_assignments`** - Individual video source assignments
5. **`streaming_analytics`** - Usage tracking and cost monitoring

## 🛠️ Setup Instructions

### 1. Run Migrations

```bash
npm run migrate
```

This will create all necessary database tables and insert default configurations.

### 2. Access the Admin Panel

Navigate to `/streaming-control` in your app to access the streaming control interface.

### 3. Configure Streaming Sources

1. **Enable/Disable Sources**: Toggle streaming sources on/off
2. **Set API Keys**: Add CDN API keys for Cloudflare, Bunny.net, etc.
3. **Configure Regions**: Set appropriate regions for each source
4. **Set Priorities**: Determine source selection order

### 4. Configure Subscription Tiers

1. **Primary Source**: Main streaming source for each tier
2. **Fallback Source**: Backup source if primary fails
3. **Max Quality**: Highest quality available for each tier
4. **CDN Enable**: Toggle CDN features for each tier

### 5. Connect Dropbox

1. Create a Dropbox app in the Dropbox Developer Console
2. Get your app key, app secret, and access token
3. Enter credentials in the Dropbox Integration tab
4. Set your root folder (default: `/Movies`)

## 💻 Usage Examples

### Basic Video Player Integration

```tsx
import { StreamingVideoPlayer } from '@/components/streaming-video-player';

function MoviePage() {
  return (
    <StreamingVideoPlayer
      videoId="movie-123"
      videoTitle="The Great Movie"
      userId="user-456"
      userTier="premium"
    />
  );
}
```

### Using the Streaming Hook

```tsx
import { useStreaming } from '@/hooks/use-streaming';

function VideoComponent() {
  const { 
    getStreamingUrl, 
    canUserAccessVideo, 
    getAvailableQualities 
  } = useStreaming();

  const handlePlay = async () => {
    if (canUserAccessVideo(userId, videoId, userTier)) {
      const result = await getStreamingUrl(videoId, userTier, userId);
      if (result) {
        // Use result.url for video player
        console.log('Streaming URL:', result.url);
        console.log('Quality:', result.quality);
        console.log('CDN Enabled:', result.cdnEnabled);
      }
    }
  };

  return (
    <button onClick={handlePlay}>
      Play Video
    </button>
  );
}
```

### Direct Service Usage

```tsx
import { streamingService } from '@/lib/streamingService';

// Initialize service
await streamingService.initialize();

// Get streaming source for a tier
const source = streamingService.getStreamingSourceForTier('premium', 'video-123');

// Get streaming URL
const result = await streamingService.getStreamingUrl('video-123', 'premium', 'user-456');

// Check access permissions
const canAccess = streamingService.canUserAccessVideo('user-456', 'video-123', 'premium');
```

## 🔧 Configuration Options

### Streaming Source Types

- **`bucket`**: Direct storage (Supabase, AWS S3)
- **`cdn`**: Content Delivery Network (Cloudflare, Bunny.net)
- **`dropbox`**: Dropbox storage (internal use only)
- **`external`**: Third-party streaming services

### Quality Settings

- **480p**: Basic quality
- **720p**: Standard quality (free tier)
- **1080p**: High quality (standard tier)
- **4K**: Ultra HD (premium/family tiers)

### Bandwidth Options

- **Standard**: Basic streaming
- **Medium**: Enhanced streaming
- **High**: Premium streaming
- **Storage Only**: No streaming (Dropbox)

## 📊 Analytics & Monitoring

The system automatically tracks:

- **Bandwidth Usage**: Per source and tier
- **Request Counts**: Video playback requests
- **Response Times**: Performance metrics
- **Error Rates**: Failure tracking
- **Cost Analysis**: Per-GB costs

## 🔒 Security Features

- **Role-based Access**: Admin-only streaming control
- **Tier Restrictions**: Video access control by subscription
- **API Key Protection**: Secure credential storage
- **Audit Logging**: All changes tracked with timestamps

## 🚨 Troubleshooting

### Common Issues

1. **"No streaming source available"**
   - Check if streaming sources are active
   - Verify tier configurations
   - Ensure fallback sources are configured

2. **"Access restricted"**
   - Verify user subscription tier
   - Check video assignment permissions
   - Ensure video is active

3. **"Failed to get streaming URL"**
   - Check API keys for CDN sources
   - Verify source URLs are correct
   - Check database connectivity

### Debug Mode

Enable debug logging by setting:

```typescript
// In your component
const { error } = useStreaming();
console.log('Streaming error:', error);
```

## 🔄 API Endpoints

The system integrates with your existing Supabase backend:

- **`streaming_sources`**: CRUD operations for streaming sources
- **`tier_configurations`**: Manage tier settings
- **`dropbox_configurations`**: Dropbox integration settings
- **`video_assignments`**: Individual video configurations
- **`streaming_analytics`**: Usage and performance data

## 📈 Performance Optimization

1. **CDN Selection**: Use appropriate CDN for each tier
2. **Fallback Strategy**: Ensure reliable backup sources
3. **Quality Scaling**: Automatically adjust based on user tier
4. **Caching**: Leverage CDN caching for better performance

## 🔮 Future Enhancements

- **Multi-CDN Load Balancing**: Distribute load across multiple CDNs
- **Adaptive Bitrate Streaming**: HLS/DASH support
- **Geographic Routing**: Route users to nearest CDN edge
- **Real-time Analytics**: Live performance monitoring
- **Automated Failover**: Intelligent source switching

## 📞 Support

For technical support or questions about the streaming control system:

1. Check the database logs for error details
2. Verify all API keys and credentials
3. Test with different subscription tiers
4. Review the streaming analytics for performance issues

---

**Note**: This system is designed to be production-ready and scalable. Always test configurations in a staging environment before applying to production.

