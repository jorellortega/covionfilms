'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useStreaming } from '@/hooks/use-streaming';
import { RoleManagement } from '@/components/role-management';
import { 
  Cloud, 
  Database, 
  ExternalLink, 
  FileVideo, 
  Globe, 
  HardDrive, 
  Settings, 
  Upload,
  Video,
  Zap,
  Shield,
  DollarSign,
  Users,
  RefreshCw
} from 'lucide-react';

interface StreamingSource {
  id: string;
  name: string;
  type: 'bucket' | 'cdn' | 'dropbox' | 'external';
  url: string;
  apiKey?: string;
  region?: string;
  isActive: boolean;
  priority: number;
  supportedTiers: string[];
  maxQuality: string;
  bandwidth: string;
  costPerGB: number;
}

interface DropboxConfig {
  accessToken: string;
  appKey: string;
  appSecret: string;
  rootFolder: string;
  isConnected: boolean;
}

interface TierConfig {
  tier: string;
  streamingSource: string;
  maxQuality: string;
  bandwidth: string;
  cdnEnabled: boolean;
  fallbackSource: string;
}

export default function StreamingControlPage() {
  const {
    streamingSources,
    tierConfigs,
    isLoading,
    error,
    updateStreamingSource,
    updateTierConfig,
    refresh,
    clearError
  } = useStreaming();
  
  const [dropboxConfig, setDropboxConfig] = useState<DropboxConfig>({
    accessToken: '',
    appKey: '',
    appSecret: '',
    rootFolder: '/Movies',
    isConnected: false
  });
  const [activeTab, setActiveTab] = useState('sources');

  const handleSourceToggle = async (sourceId: string) => {
    const source = streamingSources.find(s => s.id === sourceId);
    if (source) {
      await updateStreamingSource(sourceId, { isActive: !source.isActive });
    }
  };

  const [isDropboxLoading, setIsDropboxLoading] = useState(false);

  const handleDropboxConnect = async () => {
    setIsDropboxLoading(true);
    try {
      // Simulate Dropbox connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      setDropboxConfig(prev => ({ ...prev, isConnected: true }));
      // Here you would actually implement Dropbox OAuth
    } catch (error) {
      console.error('Dropbox connection failed:', error);
    } finally {
      setIsDropboxLoading(false);
    }
  };

  const handleTierConfigUpdate = async (tier: string, field: keyof TierConfig, value: any) => {
    await updateTierConfig(tier, { [field]: value });
  };

  const getSourceById = (id: string) => {
    return streamingSources.find(source => source.id === id);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'standard': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'family': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Streaming Control</h1>
          <p className="text-muted-foreground">
            Manage video sources, CDN configurations, and subscription tier streaming settings
          </p>
        </div>
        <Button onClick={refresh} disabled={isLoading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          {isLoading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <Shield className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
            <Button 
              variant="link" 
              className="p-0 h-auto text-red-800 underline ml-2"
              onClick={clearError}
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading streaming configuration...</span>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sources">Streaming Sources</TabsTrigger>
          <TabsTrigger value="tiers">Tier Configuration</TabsTrigger>
          <TabsTrigger value="dropbox">Dropbox Integration</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Streaming Sources Configuration
              </CardTitle>
              <CardDescription>
                Configure different video streaming sources and their capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {streamingSources.map((source) => (
                <div key={source.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {source.type === 'bucket' && <Database className="h-4 w-4 text-blue-500" />}
                        {source.type === 'cdn' && <Zap className="h-4 w-4 text-yellow-500" />}
                        {source.type === 'dropbox' && <HardDrive className="h-4 w-4 text-green-500" />}
                        {source.type === 'external' && <ExternalLink className="h-4 w-4 text-purple-500" />}
                        <span className="font-medium">{source.name}</span>
                      </div>
                      <Badge variant={source.isActive ? "default" : "secondary"}>
                        {source.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <Switch
                      checked={source.isActive}
                      onCheckedChange={() => handleSourceToggle(source.id)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">Type</Label>
                      <p className="font-medium capitalize">{source.type}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Max Quality</Label>
                      <p className="font-medium">{source.maxQuality}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Bandwidth</Label>
                      <p className="font-medium">{source.bandwidth}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Cost/GB</Label>
                      <p className="font-medium">${source.costPerGB}</p>
                    </div>
                  </div>

                    <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Supported Tiers</Label>
                    <div className="flex flex-wrap gap-2">
                      {(source.supportedTiers || []).map((tier) => (
                        <Badge key={tier} className={getTierColor(tier)}>
                          {tier}
                        </Badge>
                      ))}
                      {(!source.supportedTiers || source.supportedTiers.length === 0) && (
                        <span className="text-xs text-muted-foreground">No tiers configured</span>
                      )}
                    </div>
                  </div>

                  {source.type === 'cdn' && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">API Key</Label>
                      <Input
                        type="password"
                        placeholder="Enter API key"
                        value={source.apiKey || ''}
                        onChange={(e) => {
                          // Update API key in database
                          updateStreamingSource(source.id, { apiKey: e.target.value });
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tiers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Subscription Tier Configuration
              </CardTitle>
              <CardDescription>
                Configure which streaming source each subscription tier uses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {tierConfigs.map((config) => (
                <div key={config.tier} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <Badge className={getTierColor(config.tier)}>
                      {config.tier.toUpperCase()}
                    </Badge>
                    <h3 className="font-medium">Streaming Configuration</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                         <div className="space-y-2">
                       <Label>Primary Streaming Source</Label>
                       <Select
                         value={config.streamingSourceId || ''}
                         onValueChange={(value) => handleTierConfigUpdate(config.tier, 'streamingSourceId', value)}
                       >
                         <SelectTrigger>
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           {streamingSources
                             .filter(source => source.isActive)
                             .map(source => (
                               <SelectItem key={source.id} value={source.id}>
                                 {source.name}
                               </SelectItem>
                             ))}
                         </SelectContent>
                       </Select>
                     </div>

                     <div className="space-y-2">
                       <Label>Fallback Source</Label>
                       <Select
                         value={config.fallbackSourceId || ''}
                         onValueChange={(value) => handleTierConfigUpdate(config.tier, 'fallbackSourceId', value)}
                       >
                         <SelectTrigger>
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent>
                           {streamingSources
                             .filter(source => source.isActive)
                             .map(source => (
                               <SelectItem key={source.id} value={source.id}>
                                 {source.name}
                               </SelectItem>
                             ))}
                         </SelectContent>
                       </Select>
                     </div>

                    <div className="space-y-2">
                      <Label>Max Quality</Label>
                      <Select
                        value={config.maxQuality}
                        onValueChange={(value) => handleTierConfigUpdate(config.tier, 'maxQuality', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="480p">480p</SelectItem>
                          <SelectItem value="720p">720p</SelectItem>
                          <SelectItem value="1080p">1080p</SelectItem>
                          <SelectItem value="4K">4K</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>CDN Enabled</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={config.cdnEnabled}
                          onCheckedChange={(checked) => handleTierConfigUpdate(config.tier, 'cdnEnabled', checked)}
                        />
                        <span className="text-sm text-muted-foreground">
                          {config.cdnEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>

                                     <div className="pt-2">
                     <Separator />
                     <div className="pt-2 text-sm text-muted-foreground">
                       <strong>Current Setup:</strong> {getSourceById(config.streamingSourceId)?.name} 
                       {config.cdnEnabled && ' (CDN Enabled)'} → 
                       {config.fallbackSourceId !== config.streamingSourceId && ` Fallback: ${getSourceById(config.fallbackSourceId)?.name}`}
                     </div>
                   </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dropbox" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Dropbox Integration
              </CardTitle>
              <CardDescription>
                Connect Dropbox for video storage and management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {dropboxConfig.isConnected ? (
                <Alert>
                  <HardDrive className="h-4 w-4" />
                  <AlertDescription>
                    Dropbox is connected and ready for video storage. 
                    Videos stored here will be available for internal use and can be 
                    transferred to streaming sources as needed.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Connect your Dropbox account to enable video storage and management capabilities.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dropbox App Key</Label>
                  <Input
                    placeholder="Enter your Dropbox app key"
                    value={dropboxConfig.appKey}
                    onChange={(e) => setDropboxConfig(prev => ({ ...prev, appKey: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Dropbox App Secret</Label>
                  <Input
                    type="password"
                    placeholder="Enter your Dropbox app secret"
                    value={dropboxConfig.appSecret}
                    onChange={(e) => setDropboxConfig(prev => ({ ...prev, appSecret: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Access Token</Label>
                  <Input
                    type="password"
                    placeholder="Enter your access token"
                    value={dropboxConfig.accessToken}
                    onChange={(e) => setDropboxConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Root Folder</Label>
                  <Input
                    placeholder="/Movies"
                    value={dropboxConfig.rootFolder}
                    onChange={(e) => setDropboxConfig(prev => ({ ...prev, rootFolder: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                {!dropboxConfig.isConnected ? (
                  <Button 
                    onClick={handleDropboxConnect} 
                    disabled={isDropboxLoading || !dropboxConfig.appKey || !dropboxConfig.appSecret || !dropboxConfig.accessToken}
                  >
                    {isDropboxLoading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Connect Dropbox
                      </>
                    )}
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => setDropboxConfig(prev => ({ ...prev, isConnected: false }))}>
                    Disconnect
                  </Button>
                )}
              </div>

              {dropboxConfig.isConnected && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h4 className="font-medium mb-2">Dropbox Storage Features</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Video file storage and organization</li>
                    <li>• Automatic file synchronization</li>
                    <li>• Video metadata management</li>
                    <li>• Transfer to streaming sources</li>
                    <li>• Backup and archival</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <RoleManagement />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bandwidth Used</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.4 TB</div>
                <p className="text-xs text-muted-foreground">
                  +20.1% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CDN Performance</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98.5%</div>
                <p className="text-xs text-muted-foreground">
                  +2.1% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$187.50</div>
                <p className="text-xs text-muted-foreground">
                  +12.3% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Streaming Source Usage</CardTitle>
              <CardDescription>
                Bandwidth usage by streaming source and subscription tier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {streamingSources.filter(s => s.isActive).map((source) => (
                  <div key={source.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                      <span className="font-medium">{source.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">1.2 TB</div>
                      <div className="text-sm text-muted-foreground">45% of total</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
