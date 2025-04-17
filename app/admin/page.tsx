'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="container mx-auto py-12 px-6 bg-black min-h-screen">
      <h1 className="text-4xl font-bold mb-12 text-center text-blue-400">Admin Dashboard</h1>
      
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-blue-600 text-white rounded-lg">
          <TabsTrigger value="dashboard" className="py-2">Dashboard</TabsTrigger>
          <TabsTrigger value="users" className="py-2">Users</TabsTrigger>
          <TabsTrigger value="content" className="py-2">Content</TabsTrigger>
          <TabsTrigger value="settings" className="py-2">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <Card className="shadow-lg bg-gray-900 rounded-lg">
            <CardHeader>
              <CardTitle className="text-white">Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
              <Card className="bg-gray-800 rounded-lg">
                <CardHeader>
                  <CardTitle className="text-white">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-white">0</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 rounded-lg">
                <CardHeader>
                  <CardTitle className="text-white">Total Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-white">0</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 rounded-lg">
                <CardHeader>
                  <CardTitle className="text-white">Active Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-white">0</p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="shadow-lg bg-gray-900 rounded-lg">
            <CardHeader>
              <CardTitle className="text-white">User Management</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <Input placeholder="Search users..." className="border-blue-500 bg-gray-800 text-white" />
                  <Button className="bg-blue-500 text-white hover:bg-blue-400">Search</Button>
                </div>
                <div className="border rounded-lg p-4 bg-gray-800">
                  <p className="text-center text-gray-500">No users found</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card className="shadow-lg bg-gray-900 rounded-lg">
            <CardHeader>
              <CardTitle className="text-white">Content Management</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <Input placeholder="Search content..." className="border-blue-500 bg-gray-800 text-white" />
                  <Button className="bg-blue-500 text-white hover:bg-blue-400">Search</Button>
                </div>
                <div className="border rounded-lg p-4 bg-gray-800">
                  <p className="text-center text-gray-500">No content found</p>
                </div>
                <div className="mt-8">
                  <h2 className="text-xl font-bold mb-4 text-white">Upload New Movie</h2>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-white">Movie Title</Label>
                      <Input placeholder="Enter movie title" className="border-blue-500 bg-gray-800 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Description</Label>
                      <Input placeholder="Enter movie description" className="border-blue-500 bg-gray-800 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Upload Video</Label>
                      <Input type="file" accept="video/*" className="border-blue-500 bg-gray-800 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Upload Cover Image</Label>
                      <Input type="file" accept="image/*" className="border-blue-500 bg-gray-800 text-white" />
                    </div>
                    <Button type="submit" className="bg-blue-500 text-white hover:bg-blue-400">Upload Movie</Button>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="shadow-lg bg-gray-900 rounded-lg">
            <CardHeader>
              <CardTitle className="text-white">Admin Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-white">Site Name</Label>
                  <Input placeholder="Enter site name" className="border-blue-500 bg-gray-800 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Maintenance Mode</Label>
                  <div className="flex items-center space-x-2">
                    <Input type="checkbox" />
                    <span className="text-white">Enable maintenance mode</span>
                  </div>
                </div>
                <Button className="bg-blue-500 text-white hover:bg-blue-400">Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 