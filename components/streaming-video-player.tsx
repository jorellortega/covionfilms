'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStreaming } from '@/hooks/use-streaming';
import { Video, Play, Settings, Zap, Globe } from 'lucide-react';

interface StreamingVideoPlayerProps {
  videoId: string;
  videoTitle: string;
  userId: string;
  userTier: string;
}

export function StreamingVideoPlayer({ 
  videoId, 
  videoTitle, 
  userId, 
  userTier 
}: StreamingVideoPlayerProps) {
  const [streamingUrl, setStreamingUrl] = useState<string | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    getStreamingUrl,
    getAvailableQualities,
    canUserAccessVideo,
    isCdnEnabled,
    getStreamingSourceForTier,
    streamingSources,
    tierConfigs
  } = useStreaming();

  // Check if user can access this video
  const canAccess = canUserAccessVideo(userId, videoId, userTier);
  
  // Get available qualities for user's tier
  const availableQualities = getAvailableQualities(userTier, videoId);
  
  // Get streaming source info
  const streamingSource = getStreamingSourceForTier(userTier, videoId);
  
  // Check if CDN is enabled for this tier
  const cdnEnabled = isCdnEnabled(userTier);

  useEffect(() => {
    if (selectedQuality && canAccess) {
      loadStreamingUrl();
    }
  }, [selectedQuality, canAccess]);

  const loadStreamingUrl = async () => {
    if (!canAccess) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getStreamingUrl(videoId, userTier, userId);
      
      if (result) {
        setStreamingUrl(result.url);
      } else {
        setError('Failed to get streaming URL');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load video');
    } finally {
      setIsLoading(false);
    }
  };

  if (!canAccess) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-red-500" />
            Access Restricted
          </CardTitle>
          <CardDescription>
            You don't have permission to access this video with your current subscription tier.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              This video requires a higher subscription tier or is not available for your account.
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/subscribe'}>
              Upgrade Subscription
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          {videoTitle}
        </CardTitle>
        <CardDescription>
          Streaming from {streamingSource?.name} • Quality: {selectedQuality || 'Select quality'} • CDN: {cdnEnabled ? 'Enabled' : 'Disabled'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quality Selection */}
        <div className="flex items-center gap-4">
          <Label className="font-medium">Video Quality:</Label>
          <Select value={selectedQuality} onValueChange={setSelectedQuality}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select quality" />
            </SelectTrigger>
            <SelectContent>
              {availableQualities.map((quality) => (
                <SelectItem key={quality} value={quality}>
                  {quality}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Badge variant={cdnEnabled ? "default" : "secondary"}>
            {cdnEnabled ? (
              <>
                <Zap className="h-3 w-3 mr-1" />
                CDN Enabled
              </>
            ) : (
              <>
                <Globe className="h-3 w-3 mr-1" />
                Direct Stream
              </>
            )}
          </Badge>
        </div>

        {/* Streaming Source Info */}
        {streamingSource && (
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Streaming Source Details</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Source:</span>
                <p className="font-medium">{streamingSource.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span>
                <p className="font-medium capitalize">{streamingSource.type}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Max Quality:</span>
                <p className="font-medium">{streamingSource.maxQuality}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Bandwidth:</span>
                <p className="font-medium">{streamingSource.bandwidth}</p>
              </div>
            </div>
          </div>
        )}

        {/* Video Player */}
        {streamingUrl && selectedQuality ? (
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <video
              className="w-full h-full"
              controls
              autoPlay={false}
              src={streamingUrl}
              onError={(e) => setError('Failed to load video')}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        ) : (
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            {isLoading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading video...</p>
              </div>
            ) : (
              <div className="text-center">
                <Play className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Select a quality to start streaming</p>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Subscription Tier Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Your Subscription</h4>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-800">
              {userTier.toUpperCase()}
            </Badge>
            <span className="text-blue-700 text-sm">
              Streaming from {streamingSource?.name} • Max quality: {availableQualities[availableQualities.length - 1]}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Add Label import
import { Label } from '@/components/ui/label';

