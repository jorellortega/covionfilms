import { supabase } from './supabaseClient';

export interface StreamingSource {
  id: string;
  name: string;
  type: 'bucket' | 'cdn' | 'dropbox' | 'external';
  url: string;
  apiKey?: string;
  region?: string;
  isActive: boolean;
  priority: number;
  maxQuality: string;
  bandwidth: string;
  costPerGB: number;
  supportedTiers: string[];
}

export interface TierConfig {
  tier: string;
  streamingSourceId: string;
  fallbackSourceId: string;
  maxQuality: string;
  bandwidth: string;
  cdnEnabled: boolean;
}

export interface VideoAssignment {
  id: string;
  videoId: string;
  title: string;
  streamingSourceId: string;
  dropboxPath?: string;
  qualityOverride?: string;
  tierRestrictions: string[];
  isActive: boolean;
}

export class StreamingService {
  private static instance: StreamingService;
  private streamingSources: StreamingSource[] = [];
  private tierConfigs: TierConfig[] = [];
  private videoAssignments: VideoAssignment[] = [];

  private constructor() {}

  public static getInstance(): StreamingService {
    if (!StreamingService.instance) {
      StreamingService.instance = new StreamingService();
    }
    return StreamingService.instance;
  }

  /**
   * Initialize the streaming service with data from database
   */
  async initialize(): Promise<void> {
    try {
      await Promise.all([
        this.loadStreamingSources(),
        this.loadTierConfigs(),
        this.loadVideoAssignments()
      ]);
    } catch (error) {
      console.error('Failed to initialize streaming service:', error);
      throw error;
    }
  }

  /**
   * Load streaming sources from database
   */
  private async loadStreamingSources(): Promise<void> {
    // First load all streaming sources
    const { data: sourcesData, error: sourcesError } = await supabase
      .from('streaming_sources')
      .select('*')
      .order('priority');

    if (sourcesError) {
      console.error('Error loading streaming sources:', sourcesError);
      return;
    }

    // Then load all tier relationships
    const { data: tiersData, error: tiersError } = await supabase
      .from('streaming_source_tiers')
      .select('streaming_source_id, tier');

    if (tiersError) {
      console.error('Error loading streaming source tiers:', tiersError);
      // Continue without tiers if there's an error
    }

    // Group tiers by source ID
    const tiersBySourceId = new Map<string, string[]>();
    (tiersData || []).forEach((rel: any) => {
      const sourceId = rel.streaming_source_id;
      if (!tiersBySourceId.has(sourceId)) {
        tiersBySourceId.set(sourceId, []);
      }
      tiersBySourceId.get(sourceId)!.push(rel.tier);
    });

    // Map the data to include supportedTiers array
    this.streamingSources = (sourcesData || []).map((source: any) => ({
      id: source.id,
      name: source.name,
      type: source.type,
      url: source.url,
      apiKey: source.api_key,
      region: source.region,
      isActive: source.is_active,
      priority: source.priority,
      maxQuality: source.max_quality,
      bandwidth: source.bandwidth,
      costPerGB: parseFloat(source.cost_per_gb || 0),
      supportedTiers: tiersBySourceId.get(source.id) || []
    }));
  }

  /**
   * Load tier configurations from database
   */
  private async loadTierConfigs(): Promise<void> {
    const { data, error } = await supabase
      .from('tier_configurations')
      .select('*');

    if (error) {
      console.error('Error loading tier configs:', error);
      return;
    }

    // Map database fields to interface fields
    this.tierConfigs = (data || []).map((config: any) => ({
      tier: config.tier,
      streamingSourceId: config.streaming_source_id,
      fallbackSourceId: config.fallback_source_id,
      maxQuality: config.max_quality,
      bandwidth: config.bandwidth,
      cdnEnabled: config.cdn_enabled
    }));
  }

  /**
   * Load video assignments from database
   */
  private async loadVideoAssignments(): Promise<void> {
    const { data, error } = await supabase
      .from('video_assignments')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Error loading video assignments:', error);
      return;
    }

    this.videoAssignments = data || [];
  }

  /**
   * Get the appropriate streaming source for a user's subscription tier
   */
  getStreamingSourceForTier(tier: string, videoId?: string): StreamingSource | null {
    // Check if there's a specific video assignment
    if (videoId) {
      const assignment = this.videoAssignments.find(va => va.videoId === videoId);
      if (assignment) {
        const source = this.streamingSources.find(ss => ss.id === assignment.streamingSourceId);
        if (source && source.isActive) {
          return source;
        }
      }
    }

    // Get tier configuration
    const tierConfig = this.tierConfigs.find(tc => tc.tier === tier);
    if (!tierConfig) {
      console.warn(`No tier configuration found for tier: ${tier}`);
      return null;
    }

    // Get primary streaming source
    let source = this.streamingSources.find(ss => ss.id === tierConfig.streamingSourceId);
    
    // If primary source is not available, try fallback
    if (!source || !source.isActive) {
      source = this.streamingSources.find(ss => ss.id === tierConfig.fallbackSourceId);
    }

    // If still no source, get the first available source for this tier
    if (!source || !source.isActive) {
      source = this.streamingSources.find(ss => ss.isActive);
    }

    return source || null;
  }

  /**
   * Get streaming URL for a video based on user's subscription tier
   */
  async getStreamingUrl(videoId: string, tier: string, userId: string): Promise<{
    url: string;
    source: StreamingSource;
    quality: string;
    cdnEnabled: boolean;
  } | null> {
    try {
      // Get streaming source for tier
      const source = this.getStreamingSourceForTier(tier, videoId);
      if (!source) {
        throw new Error(`No streaming source available for tier: ${tier}`);
      }

      // Get tier configuration
      const tierConfig = this.tierConfigs.find(tc => tc.tier === tier);
      if (!tierConfig) {
        throw new Error(`No tier configuration found for tier: ${tier}`);
      }

      // Check video assignment for quality override
      const assignment = this.videoAssignments.find(va => va.videoId === videoId);
      const quality = assignment?.qualityOverride || tierConfig.maxQuality;

      // Build streaming URL based on source type
      let streamingUrl = '';
      
      switch (source.type) {
        case 'bucket':
          // Supabase bucket URL
          streamingUrl = `${source.url}/${videoId}`;
          break;
          
        case 'cdn':
          // CDN URL (Cloudflare, Bunny.net, etc.)
          if (source.name.includes('Cloudflare')) {
            streamingUrl = `${source.url}/${videoId}/manifest/video.m3u8`;
          } else if (source.name.includes('Bunny')) {
            streamingUrl = `${source.url}/stream/${videoId}/play.mp4`;
          } else {
            streamingUrl = `${source.url}/${videoId}`;
          }
          break;
          
        case 'dropbox':
          // Dropbox is for storage only, not streaming
          throw new Error('Dropbox is for storage only, not streaming');
          
        default:
          streamingUrl = `${source.url}/${videoId}`;
      }

      // Log streaming request for analytics
      await this.logStreamingRequest(source.id, tier, userId);

      return {
        url: streamingUrl,
        source,
        quality,
        cdnEnabled: tierConfig.cdnEnabled
      };

    } catch (error) {
      console.error('Error getting streaming URL:', error);
      return null;
    }
  }

  /**
   * Get available qualities for a video based on tier
   */
  getAvailableQualities(tier: string, videoId?: string): string[] {
    const tierConfig = this.tierConfigs.find(tc => tc.tier === tier);
    if (!tierConfig) return ['480p'];

    const maxQuality = tierConfig.maxQuality;
    const qualities = ['480p', '720p', '1080p', '4K'];
    const maxIndex = qualities.indexOf(maxQuality);
    
    return qualities.slice(0, maxIndex + 1);
  }

  /**
   * Check if a user can access a specific video
   */
  canUserAccessVideo(userId: string, videoId: string, tier: string): boolean {
    const assignment = this.videoAssignments.find(va => va.videoId === videoId);
    
    if (!assignment || !assignment.isActive) {
      return false;
    }

    // Check tier restrictions
    if (assignment.tierRestrictions && assignment.tierRestrictions.length > 0) {
      return assignment.tierRestrictions.includes(tier);
    }

    return true;
  }

  /**
   * Get CDN status for a tier
   */
  isCdnEnabled(tier: string): boolean {
    const tierConfig = this.tierConfigs.find(tc => tc.tier === tier);
    return tierConfig?.cdnEnabled || false;
  }

  /**
   * Log streaming request for analytics
   */
  private async logStreamingRequest(sourceId: string, tier: string, userId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if analytics record exists for today
      const { data: existingRecord } = await supabase
        .from('streaming_analytics')
        .select('*')
        .eq('streaming_source_id', sourceId)
        .eq('tier', tier)
        .eq('date', today)
        .single();

      if (existingRecord) {
        // Update existing record
        await supabase
          .from('streaming_analytics')
          .update({
            requests_count: existingRecord.requests_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecord.id);
      } else {
        // Create new record
        await supabase
          .from('streaming_analytics')
          .insert({
            streaming_source_id: sourceId,
            tier,
            date: today,
            requests_count: 1,
            bandwidth_used_gb: 0,
            avg_response_time_ms: 0,
            error_count: 0,
            cost_usd: 0
          });
      }
    } catch (error) {
      console.error('Error logging streaming request:', error);
    }
  }

  /**
   * Get streaming sources for admin management
   */
  async getStreamingSources(): Promise<StreamingSource[]> {
    await this.loadStreamingSources();
    // Ensure all sources have supportedTiers array, even if empty
    return this.streamingSources.map(source => ({
      ...source,
      supportedTiers: source.supportedTiers || []
    }));
  }

  /**
   * Get tier configurations for admin management
   */
  async getTierConfigs(): Promise<TierConfig[]> {
    await this.loadTierConfigs();
    return this.tierConfigs;
  }

  /**
   * Update streaming source
   */
  async updateStreamingSource(sourceId: string, updates: Partial<StreamingSource>): Promise<boolean> {
    try {
      // Map camelCase fields to snake_case for database
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.url !== undefined) dbUpdates.url = updates.url;
      if (updates.apiKey !== undefined) dbUpdates.api_key = updates.apiKey;
      if (updates.region !== undefined) dbUpdates.region = updates.region;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.maxQuality !== undefined) dbUpdates.max_quality = updates.maxQuality;
      if (updates.bandwidth !== undefined) dbUpdates.bandwidth = updates.bandwidth;
      if (updates.costPerGB !== undefined) dbUpdates.cost_per_gb = updates.costPerGB;
      // Note: supportedTiers is stored in streaming_source_tiers table, not in streaming_sources

      const { error } = await supabase
        .from('streaming_sources')
        .update(dbUpdates)
        .eq('id', sourceId);

      if (error) {
        console.error('Error updating streaming source:', error);
        return false;
      }

      await this.loadStreamingSources();
      return true;
    } catch (error) {
      console.error('Error updating streaming source:', error);
      return false;
    }
  }

  /**
   * Update tier configuration
   */
  async updateTierConfig(tier: string, updates: Partial<TierConfig>): Promise<boolean> {
    try {
      // Map camelCase fields to snake_case for database
      const dbUpdates: any = {};
      if (updates.streamingSourceId !== undefined) {
        dbUpdates.streaming_source_id = updates.streamingSourceId;
      }
      if (updates.fallbackSourceId !== undefined) {
        dbUpdates.fallback_source_id = updates.fallbackSourceId;
      }
      if (updates.maxQuality !== undefined) {
        dbUpdates.max_quality = updates.maxQuality;
      }
      if (updates.bandwidth !== undefined) {
        dbUpdates.bandwidth = updates.bandwidth;
      }
      if (updates.cdnEnabled !== undefined) {
        dbUpdates.cdn_enabled = updates.cdnEnabled;
      }

      const { error } = await supabase
        .from('tier_configurations')
        .update(dbUpdates)
        .eq('tier', tier);

      if (error) {
        console.error('Error updating tier config:', error);
        return false;
      }

      await this.loadTierConfigs();
      return true;
    } catch (error) {
      console.error('Error updating tier config:', error);
      return false;
    }
  }
}

// Export singleton instance
export const streamingService = StreamingService.getInstance();

