import { useState, useEffect, useCallback } from 'react';
import { streamingService, StreamingSource, TierConfig, VideoAssignment } from '@/lib/streamingService';

export function useStreaming() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streamingSources, setStreamingSources] = useState<StreamingSource[]>([]);
  const [tierConfigs, setTierConfigs] = useState<TierConfig[]>([]);
  const [videoAssignments, setVideoAssignments] = useState<VideoAssignment[]>([]);

  // Initialize streaming service
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await streamingService.initialize();
        
        // Load initial data
        const [sources, configs] = await Promise.all([
          streamingService.getStreamingSources(),
          streamingService.getTierConfigs()
        ]);
        
        setStreamingSources(sources);
        setTierConfigs(configs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize streaming service');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  // Get streaming URL for a video
  const getStreamingUrl = useCallback(async (
    videoId: string, 
    tier: string, 
    userId: string
  ) => {
    try {
      return await streamingService.getStreamingUrl(videoId, tier, userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get streaming URL');
      return null;
    }
  }, []);

  // Get available qualities for a tier
  const getAvailableQualities = useCallback((tier: string, videoId?: string) => {
    return streamingService.getAvailableQualities(tier, videoId);
  }, []);

  // Check if user can access a video
  const canUserAccessVideo = useCallback((userId: string, videoId: string, tier: string) => {
    return streamingService.canUserAccessVideo(userId, videoId, tier);
  }, []);

  // Check if CDN is enabled for a tier
  const isCdnEnabled = useCallback((tier: string) => {
    return streamingService.isCdnEnabled(tier);
  }, []);

  // Get streaming source for a tier
  const getStreamingSourceForTier = useCallback((tier: string, videoId?: string) => {
    return streamingService.getStreamingSourceForTier(tier, videoId);
  }, []);

  // Update streaming source
  const updateStreamingSource = useCallback(async (
    sourceId: string, 
    updates: Partial<StreamingSource>
  ) => {
    try {
      const success = await streamingService.updateStreamingSource(sourceId, updates);
      if (success) {
        // Reload streaming sources
        const sources = await streamingService.getStreamingSources();
        setStreamingSources(sources);
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update streaming source');
      return false;
    }
  }, []);

  // Update tier configuration
  const updateTierConfig = useCallback(async (
    tier: string, 
    updates: Partial<TierConfig>
  ) => {
    try {
      const success = await streamingService.updateTierConfig(tier, updates);
      if (success) {
        // Reload tier configs
        const configs = await streamingService.getTierConfigs();
        setTierConfigs(configs);
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tier configuration');
      return false;
    }
  }, []);

  // Refresh data
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      await streamingService.initialize();
      
      const [sources, configs] = await Promise.all([
        streamingService.getStreamingSources(),
        streamingService.getTierConfigs()
      ]);
      
      setStreamingSources(sources);
      setTierConfigs(configs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh streaming data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isLoading,
    error,
    streamingSources,
    tierConfigs,
    videoAssignments,
    
    // Actions
    getStreamingUrl,
    getAvailableQualities,
    canUserAccessVideo,
    isCdnEnabled,
    getStreamingSourceForTier,
    updateStreamingSource,
    updateTierConfig,
    refresh,
    clearError,
    
    // Computed values
    activeStreamingSources: streamingSources.filter(source => source.isActive),
    availableTiers: tierConfigs.map(config => config.tier),
  };
}

