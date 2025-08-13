'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Users, 
  Key, 
  Eye, 
  Edit, 
  Settings, 
  Crown,
  UserCheck,
  Lock,
  Unlock,
  Zap,
  Video,
  HardDrive,
  Globe
} from 'lucide-react';

interface RolePermission {
  role: string;
  permission: string;
}

interface RoleHierarchy {
  role: string;
  parentRole: string | null;
  level: number;
  canManageRoles: string[];
}

interface RoleStreamingAccess {
  role: string;
  streamingSource: string;
  accessLevel: 'full' | 'read' | 'write' | 'none';
  qualityOverride: string | null;
  canConfigure: boolean;
}

export function RoleManagement() {
  const [activeTab, setActiveTab] = useState('overview');
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [roleHierarchy, setRoleHierarchy] = useState<RoleHierarchy[]>([]);
  const [roleStreamingAccess, setRoleStreamingAccess] = useState<RoleStreamingAccess[]>([]);

  // Mock data - replace with actual API calls
  useEffect(() => {
    setRolePermissions([
      { role: 'admin', permission: 'manage_users' },
      { role: 'admin', permission: 'manage_content' },
      { role: 'admin', permission: 'manage_subscriptions' },
      { role: 'admin', permission: 'view_analytics' },
      { role: 'admin', permission: 'manage_streaming_sources' },
      { role: 'admin', permission: 'manage_tier_configurations' },
      { role: 'admin', permission: 'manage_dropbox_integration' },
      { role: 'admin', permission: 'view_streaming_analytics' },
      { role: 'admin', permission: 'manage_video_assignments' },
      { role: 'admin', permission: 'override_video_restrictions' },
      
      { role: 'management', permission: 'manage_content' },
      { role: 'management', permission: 'view_analytics' },
      { role: 'management', permission: 'view_streaming_sources' },
      { role: 'management', permission: 'view_tier_configurations' },
      { role: 'management', permission: 'upload_to_dropbox' },
      { role: 'management', permission: 'assign_video_sources' },
      { role: 'management', permission: 'view_streaming_analytics' },
      
      { role: 'creator', permission: 'upload_content' },
      { role: 'creator', permission: 'manage_own_content' },
      { role: 'creator', permission: 'view_own_streaming_quality' },
      { role: 'creator', permission: 'request_quality_upgrade' },
      { role: 'creator', permission: 'view_streaming_performance' },
      
      { role: 'user', permission: 'view_content' },
      { role: 'user', permission: 'comment' },
      { role: 'user', permission: 'rate_content' },
      { role: 'user', permission: 'view_streaming_quality' },
      { role: 'user', permission: 'report_streaming_issues' },
      { role: 'user', permission: 'request_quality_preferences' }
    ]);

    setRoleHierarchy([
      { role: 'admin', parentRole: null, level: 1, canManageRoles: ['admin', 'management', 'creator', 'user'] },
      { role: 'management', parentRole: 'admin', level: 2, canManageRoles: ['creator', 'user'] },
      { role: 'creator', parentRole: 'management', level: 3, canManageRoles: ['user'] },
      { role: 'user', parentRole: 'creator', level: 4, canManageRoles: [] }
    ]);

    setRoleStreamingAccess([
      { role: 'admin', streamingSource: 'Supabase Storage (Free)', accessLevel: 'full', qualityOverride: '4K', canConfigure: true },
      { role: 'admin', streamingSource: 'Cloudflare Stream (Premium)', accessLevel: 'full', qualityOverride: '4K', canConfigure: true },
      { role: 'admin', streamingSource: 'Bunny.net (Standard)', accessLevel: 'full', qualityOverride: '4K', canConfigure: true },
      { role: 'admin', streamingSource: 'Dropbox Storage', accessLevel: 'full', qualityOverride: '4K', canConfigure: true },
      
      { role: 'management', streamingSource: 'Supabase Storage (Free)', accessLevel: 'full', qualityOverride: '4K', canConfigure: true },
      { role: 'management', streamingSource: 'Cloudflare Stream (Premium)', accessLevel: 'full', qualityOverride: '4K', canConfigure: false },
      { role: 'management', streamingSource: 'Bunny.net (Standard)', accessLevel: 'full', qualityOverride: '4K', canConfigure: false },
      { role: 'management', streamingSource: 'Dropbox Storage', accessLevel: 'write', qualityOverride: '4K', canConfigure: false },
      
      { role: 'creator', streamingSource: 'Supabase Storage (Free)', accessLevel: 'read', qualityOverride: '1080p', canConfigure: false },
      { role: 'creator', streamingSource: 'Cloudflare Stream (Premium)', accessLevel: 'read', qualityOverride: '4K', canConfigure: false },
      { role: 'creator', streamingSource: 'Bunny.net (Standard)', accessLevel: 'read', qualityOverride: '1080p', canConfigure: false },
      { role: 'creator', streamingSource: 'Dropbox Storage', accessLevel: 'none', qualityOverride: null, canConfigure: false },
      
      { role: 'user', streamingSource: 'Supabase Storage (Free)', accessLevel: 'read', qualityOverride: '720p', canConfigure: false },
      { role: 'user', streamingSource: 'Cloudflare Stream (Premium)', accessLevel: 'read', qualityOverride: '4K', canConfigure: false },
      { role: 'user', streamingSource: 'Bunny.net (Standard)', accessLevel: 'read', qualityOverride: '1080p', canConfigure: false },
      { role: 'user', streamingSource: 'Dropbox Storage', accessLevel: 'none', qualityOverride: null, canConfigure: false }
    ]);
  }, []);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'management': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'creator': return 'bg-green-100 text-green-800 border-green-200';
      case 'user': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'full': return 'bg-green-100 text-green-800';
      case 'write': return 'bg-blue-100 text-blue-800';
      case 'read': return 'bg-yellow-100 text-yellow-800';
      case 'none': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAccessLevelIcon = (level: string) => {
    switch (level) {
      case 'full': return <Settings className="h-3 w-3" />;
      case 'write': return <Edit className="h-3 w-3" />;
      case 'read': return <Eye className="h-3 w-3" />;
      case 'none': return <Lock className="h-3 w-3" />;
      default: return <Eye className="h-3 w-3" />;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />;
      case 'management': return <Shield className="h-4 w-4" />;
      case 'creator': return <Users className="h-4 w-4" />;
      case 'user': return <UserCheck className="h-4 w-4" />;
      default: return <UserCheck className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Role Management</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
          <TabsTrigger value="streaming">Streaming Access</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {roleHierarchy.map((role) => (
              <Card key={role.role} className="text-center">
                <CardHeader className="pb-2">
                  <div className="mx-auto mb-2">
                    {getRoleIcon(role.role)}
                  </div>
                  <CardTitle className="text-lg">
                    <Badge className={getRoleColor(role.role)}>
                      {role.role.toUpperCase()}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Level {role.level}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Can manage:</span>
                      <div className="flex flex-wrap gap-1 mt-1 justify-center">
                        {role.canManageRoles.map((manageableRole) => (
                          <Badge key={manageableRole} variant="outline" className="text-xs">
                            {manageableRole}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Permissions:</span>
                      <div className="font-medium">
                        {rolePermissions.filter(rp => rp.role === role.role).length}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Role Permissions Matrix</CardTitle>
              <CardDescription>
                Detailed breakdown of what each role can do
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['admin', 'management', 'creator', 'user'].map((role) => (
                  <div key={role} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      {getRoleIcon(role)}
                      <h3 className="font-medium capitalize">{role}</h3>
                      <Badge className={getRoleColor(role)}>
                        {rolePermissions.filter(rp => rp.role === role).length} permissions
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {rolePermissions
                        .filter(rp => rp.role === role)
                        .map((permission) => (
                          <div key={permission.permission} className="flex items-center gap-2 text-sm">
                            <Key className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {permission.permission.replace(/_/g, ' ')}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hierarchy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Role Hierarchy</CardTitle>
              <CardDescription>
                How roles relate to each other and who can manage whom
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roleHierarchy.map((role) => (
                  <div key={role.role} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getRoleIcon(role.role)}
                        <div>
                          <h3 className="font-medium capitalize">{role.role}</h3>
                          <p className="text-sm text-muted-foreground">
                            Level {role.level}
                            {role.parentRole && ` • Reports to ${role.parentRole}`}
                          </p>
                        </div>
                      </div>
                      <Badge className={getRoleColor(role.role)}>
                        {role.canManageRoles.length} roles managed
                      </Badge>
                    </div>
                    
                    {role.canManageRoles.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-muted-foreground mb-2">Can manage:</p>
                        <div className="flex flex-wrap gap-2">
                          {role.canManageRoles.map((manageableRole) => (
                            <Badge key={manageableRole} variant="outline">
                              {manageableRole}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="streaming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Streaming Access by Role</CardTitle>
              <CardDescription>
                How each role accesses different streaming sources and their quality limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {['admin', 'management', 'creator', 'user'].map((role) => (
                  <div key={role} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                      {getRoleIcon(role)}
                      <h3 className="font-medium capitalize">{role}</h3>
                      <Badge className={getRoleColor(role)}>
                        {roleStreamingAccess.filter(rsa => rsa.role === role).length} sources
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {roleStreamingAccess
                        .filter(rsa => rsa.role === role)
                        .map((access) => (
                          <div key={access.streamingSource} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{access.streamingSource}</span>
                              <Badge className={getAccessLevelColor(access.accessLevel)}>
                                <div className="flex items-center gap-1">
                                  {getAccessLevelIcon(access.accessLevel)}
                                  {access.accessLevel}
                                </div>
                              </Badge>
                            </div>
                            
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2">
                                <Video className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">Quality:</span>
                                <span className="font-medium">
                                  {access.qualityOverride || 'Default'}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Settings className="h-3 w-3 text-muted-foreground" />
                                <span className="text-muted-foreground">Configure:</span>
                                <span className="font-medium">
                                  {access.canConfigure ? 'Yes' : 'No'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
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

