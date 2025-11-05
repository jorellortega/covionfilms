'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/components/auth-provider';

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if user has admin access
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You need admin permissions to access this page.",
        variant: "destructive",
      });
      return;
    }
  }, [user, toast]);

  // Load users
  useEffect(() => {
    if (user?.role === 'admin') {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          subscriptions(tier, status)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      setUpdatingRole(userId);
      
      // Update custom users table
      const { error: userError } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (userError) throw userError;

      // Update auth.users table using admin API
      const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { role: newRole }
      });

      if (authError) {
        console.warn('Auth update failed, but user table was updated:', authError);
        // Continue anyway as the main user table is updated
      }

      toast({
        title: "Role Updated",
        description: `User role updated to ${newRole}`,
      });

      // Reload users
      await loadUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive",
      });
    } finally {
      setUpdatingRole(null);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-8">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You need admin permissions to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Control Panel</h1>
        <p className="text-muted-foreground">Manage users, roles, and system settings</p>
      </div>

      <div className="grid gap-6">
        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>View and manage user roles and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'management' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'creator' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                      {user.subscriptions?.[0] && (
                        <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                          {user.subscriptions[0].tier}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select
                      value={user.role}
                      onValueChange={(newRole) => updateUserRole(user.id, newRole)}
                      disabled={updatingRole === user.id}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="creator">Creator</SelectItem>
                        <SelectItem value="management">Management</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {updatingRole === user.id && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={loadUsers} variant="outline">
                Refresh Users
              </Button>
              <Button 
                onClick={() => window.open('/signup', '_blank')} 
                variant="outline"
              >
                Create New User
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 