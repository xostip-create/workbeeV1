'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Users, 
  CreditCard, 
  Briefcase, 
  BarChart3, 
  ShieldCheck,
  Settings,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

/**
 * Placeholder Admin Dashboard Screen.
 * Provides a visual layout for future administrative controls.
 */
export default function AdminDashboardPage() {
  const adminSections = [
    {
      title: 'User Approvals',
      description: 'Review and verify new worker registrations and shop listings.',
      icon: <Users className="w-6 h-6 text-primary" />,
      count: '12 Pending'
    },
    {
      title: 'Subscriptions & Payments',
      description: 'Monitor transaction history, payouts, and subscription statuses.',
      icon: <CreditCard className="w-6 h-6 text-green-600" />,
      count: '₦245,000 Total'
    },
    {
      title: 'Job Management',
      description: 'Moderate job postings and resolve disputes between users.',
      icon: <Briefcase className="w-6 h-6 text-amber-600" />,
      count: '154 Active'
    },
    {
      title: 'Reports & Analytics',
      description: 'View platform growth metrics and user behavior reports.',
      icon: <BarChart3 className="w-6 h-6 text-indigo-600" />,
      count: 'Monthly Report'
    }
  ];

  return (
    <div className="min-h-screen bg-muted/30 pb-12">
      {/* Dashboard Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="icon">
              <Link href="/">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold font-headline">Admin Dashboard</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold font-headline">Overview</h2>
            <p className="text-sm text-muted-foreground">Manage the WorkBee platform and user base.</p>
          </div>
          <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            System Status: Healthy
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminSections.map((section, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow cursor-not-allowed opacity-90">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{section.title}</CardTitle>
                {section.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">{section.count}</div>
                <CardDescription className="text-xs">{section.description}</CardDescription>
                <Button variant="link" className="p-0 h-auto text-xs mt-4" disabled>
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Placeholder for future charts/tables */}
        <div className="mt-8 bg-white border rounded-xl p-12 text-center border-dashed">
          <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">Detailed Analytics Placeholder</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">
            This section will display real-time growth charts and user distribution data in the full version.
          </p>
        </div>
      </main>
    </div>
  );
}
