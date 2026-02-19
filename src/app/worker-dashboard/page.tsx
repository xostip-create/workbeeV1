'use client';

import React from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  PlayCircle, 
  MessageSquare, 
  Eye, 
  TrendingUp, 
  Banknote,
  LayoutDashboard,
  User,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

/**
 * Dedicated Dashboard for Workers.
 * Provides overview of active jobs, available gigs, and earnings.
 */
export default function WorkerDashboardPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  // Fetch worker profile
  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  // Fetch jobs where the worker is selected (Active/Completed)
  const myJobsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'jobs'),
      where('selectedApplicantId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [db, user]);
  const { data: myJobs, isLoading: isLoadingMyJobs } = useCollection(myJobsQuery);

  // Fetch open jobs (Available Gigs)
  const openJobsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'jobs'),
      where('status', '==', 'Open'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
  }, [db]);
  const { data: openJobs, isLoading: isLoadingOpenJobs } = useCollection(openJobsQuery);

  const isLoading = isUserLoading || isProfileLoading || isLoadingMyJobs || isLoadingOpenJobs;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Auth Guard
  if (!user || profile?.accountType !== 'Worker') {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-4 text-center bg-slate-50">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
        <p className="text-slate-600 max-w-md mb-6">
          This dashboard is exclusively for registered Workers. If you are a Customer, please use the standard job browsing features.
        </p>
        <Button onClick={() => router.push('/')} variant="outline">
          Return to Home
        </Button>
      </div>
    );
  }

  const activeJobs = myJobs?.filter(j => j.status === 'In Progress') || [];
  const completedJobs = myJobs?.filter(j => j.status === 'Completed') || [];
  const totalEarnings = completedJobs.reduce((acc, j) => acc + (j.workerPayout || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold font-headline">Worker Console</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
              <Link href="/jobs">Browse All Jobs</Link>
            </Button>
            <Avatar className="h-8 w-8 border">
              <AvatarImage src={profile.photoUrl} />
              <AvatarFallback className="bg-primary/10 text-primary">{profile.name?.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold font-headline">Welcome back, {profile.name}!</h2>
            <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${profile.isAvailable !== false ? 'bg-green-500' : 'bg-slate-400'}`} />
              {profile.isAvailable !== false ? 'You are visible to customers' : 'You are currently offline'}
            </p>
          </div>
          <Button asChild className="shadow-md">
            <Link href="/profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Manage Profile
            </Link>
          </Button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className="border-none shadow-sm bg-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Banknote className="w-24 h-24" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Total Payouts</CardDescription>
              <CardTitle className="text-2xl font-black text-primary">₦{totalEarnings.toLocaleString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                From {completedJobs.length} completed tasks
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <PlayCircle className="w-24 h-24" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider">In Progress</CardDescription>
              <CardTitle className="text-2xl font-black text-amber-600">{activeJobs.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Active gigs currently being worked</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <CheckCircle2 className="w-24 h-24" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-bold uppercase tracking-wider">Success Rate</CardDescription>
              <CardTitle className="text-2xl font-black text-green-600">
                {myJobs?.length ? Math.round((completedJobs.length / myJobs.length) * 100) : 0}%
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Progress value={myJobs?.length ? (completedJobs.length / myJobs.length) * 100 : 0} className="h-1.5" />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Work Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-headline flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-amber-500" />
                Current Active Jobs
              </h3>
            </div>
            {activeJobs.length > 0 ? (
              <div className="space-y-4">
                {activeJobs.map(job => (
                  <Card key={job.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-md font-bold">{job.title}</CardTitle>
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                          In Progress
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-1">{job.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-0 flex gap-2">
                      <Button asChild variant="outline" size="sm" className="flex-1 gap-2 border-primary text-primary">
                        <Link href={`/chat/${job.id}`}>
                          <MessageSquare className="w-4 h-4" />
                          Chat with Client
                        </Link>
                      </Button>
                      <Button asChild size="sm" className="flex-1">
                        <Link href={`/jobs/${job.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 bg-transparent">
                <CardContent className="py-10 text-center text-muted-foreground flex flex-col items-center gap-3">
                  <Briefcase className="w-10 h-10 opacity-20" />
                  <p>You don't have any active jobs right now.</p>
                </CardContent>
              </Card>
            )}
          </section>

          {/* New Opportunities Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-headline flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                New Gigs for You
              </h3>
              <Button asChild variant="link" size="sm" className="text-primary p-0">
                <Link href="/jobs">See All</Link>
              </Button>
            </div>
            <div className="space-y-4">
              {openJobs && openJobs.length > 0 ? (
                openJobs.map(job => (
                  <Card key={job.id} className="border-none shadow-sm hover:shadow-md transition-shadow bg-white">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-md font-bold leading-snug">{job.title}</CardTitle>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" />
                          {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <CardDescription className="line-clamp-2 text-xs">{job.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-0">
                      <Button asChild variant="ghost" size="sm" className="w-full text-primary hover:bg-primary/5 group">
                        <Link href={`/jobs/${job.id}`} className="flex items-center justify-center gap-2">
                          <Eye className="w-4 h-4" />
                          View Gig Details
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground italic bg-white rounded-lg border shadow-sm">
                  No new gigs found in your area.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
