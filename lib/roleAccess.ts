import { supabase } from './supabaseClient';

export interface UserRole {
  role: string;
  permissions: string[];
  level: number;
  canManageRoles: string[];
}

export interface StreamingAccess {
  streamingSourceId: string;
  accessLevel: 'full' | 'read' | 'write' | 'none';
  qualityOverride: string | null;
  canConfigure: boolean;
}

export class RoleAccess {
  private static instance: RoleAccess;
  private userRoles: Map<string, UserRole> = new Map();
  private streamingAccess: Map<string, StreamingAccess[]> = new Map();

  private constructor() {}

  public static getInstance(): RoleAccess {
    if (!RoleAccess.instance) {
      RoleAccess.instance = new RoleAccess();
    }
    return RoleAccess.instance;
  }

  /**
   * Check if a user has a specific permission
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      // Check if we have cached user role
      if (this.userRoles.has(userId)) {
        const userRole = this.userRoles.get(userId)!;
        return userRole.permissions.includes(permission);
      }

      // Query database for user role and permissions
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return false;
      }

      const { data: permissions, error: permError } = await supabase
        .from('role_permissions')
        .select('permission')
        .eq('role', user.role);

      if (permError) {
        return false;
      }

      const permissionList = permissions.map(p => p.permission);
      
      // Cache user role
      this.userRoles.set(userId, {
        role: user.role,
        permissions: permissionList,
        level: this.getRoleLevel(user.role),
        canManageRoles: this.getManageableRoles(user.role)
      });

      return permissionList.includes(permission);
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Check if a user can access a streaming source
   */
  async canAccessStreamingSource(userId: string, streamingSourceId: string): Promise<boolean> {
    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return false;
      }

      const { data: access, error: accessError } = await supabase
        .from('role_streaming_access')
        .select('access_level')
        .eq('role', user.role)
        .eq('streaming_source_id', streamingSourceId)
        .single();

      if (accessError || !access) {
        return false;
      }

      return access.access_level !== 'none';
    } catch (error) {
      console.error('Error checking streaming access:', error);
      return false;
    }
  }

  /**
   * Get user's effective streaming quality for a source
   */
  async getUserEffectiveQuality(userId: string, streamingSourceId: string): Promise<string> {
    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return '480p';
      }

      // Check for role-based quality override
      const { data: roleAccess, error: roleError } = await supabase
        .from('role_streaming_access')
        .select('quality_override')
        .eq('role', user.role)
        .eq('streaming_source_id', streamingSourceId)
        .single();

      if (!roleError && roleAccess?.quality_override) {
        return roleAccess.quality_override;
      }

      // Fall back to subscription tier quality
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (!subError && subscription) {
        const { data: tierConfig, error: tierError } = await supabase
          .from('tier_configurations')
          .select('max_quality')
          .eq('tier', subscription.tier)
          .single();

        if (!tierError && tierConfig) {
          return tierConfig.max_quality;
        }
      }

      return '480p';
    } catch (error) {
      console.error('Error getting effective quality:', error);
      return '480p';
    }
  }

  /**
   * Check if user can configure a streaming source
   */
  async canConfigureStreamingSource(userId: string, streamingSourceId: string): Promise<boolean> {
    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return false;
      }

      const { data: access, error: accessError } = await supabase
        .from('role_streaming_access')
        .select('can_configure')
        .eq('role', user.role)
        .eq('streaming_source_id', streamingSourceId)
        .single();

      if (accessError || !access) {
        return false;
      }

      return access.can_configure;
    } catch (error) {
      console.error('Error checking configuration access:', error);
      return false;
    }
  }

  /**
   * Get all roles a user can manage
   */
  async getManageableRoles(userId: string): Promise<string[]> {
    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return [];
      }

      const { data: hierarchy, error: hierarchyError } = await supabase
        .from('role_hierarchy')
        .select('can_manage_roles')
        .eq('role', user.role)
        .single();

      if (hierarchyError || !hierarchy) {
        return [];
      }

      return hierarchy.can_manage_roles || [];
    } catch (error) {
      console.error('Error getting manageable roles:', error);
      return [];
    }
  }

  /**
   * Check if user can manage another user's role
   */
  async canManageUserRole(userId: string, targetRole: string): Promise<boolean> {
    try {
      const manageableRoles = await this.getManageableRoles(userId);
      return manageableRoles.includes(targetRole);
    } catch (error) {
      console.error('Error checking role management:', error);
      return false;
    }
  }

  /**
   * Get user's role level
   */
  private getRoleLevel(role: string): number {
    switch (role) {
      case 'admin': return 1;
      case 'management': return 2;
      case 'creator': return 3;
      case 'user': return 4;
      default: return 5;
    }
  }

  /**
   * Get roles that a role can manage
   */
  private getManageableRoles(role: string): string[] {
    switch (role) {
      case 'admin': return ['admin', 'management', 'creator', 'user'];
      case 'management': return ['creator', 'user'];
      case 'creator': return ['user'];
      case 'user': return [];
      default: return [];
    }
  }

  /**
   * Clear cached data for a user
   */
  clearUserCache(userId: string): void {
    this.userRoles.delete(userId);
    this.streamingAccess.delete(userId);
  }

  /**
   * Clear all cached data
   */
  clearAllCache(): void {
    this.userRoles.clear();
    this.streamingAccess.clear();
  }
}

// Export singleton instance
export const roleAccess = RoleAccess.getInstance();

// Convenience functions
export const hasPermission = (userId: string, permission: string) => 
  roleAccess.hasPermission(userId, permission);

export const canAccessStreamingSource = (userId: string, streamingSourceId: string) => 
  roleAccess.canAccessStreamingSource(userId, streamingSourceId);

export const getUserEffectiveQuality = (userId: string, streamingSourceId: string) => 
  roleAccess.getUserEffectiveQuality(userId, streamingSourceId);

export const canConfigureStreamingSource = (userId: string, streamingSourceId: string) => 
  roleAccess.canConfigureStreamingSource(userId, streamingSourceId);

