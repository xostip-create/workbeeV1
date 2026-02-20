'use client';

import React from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  PlusCircle, 
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
  AlertCircle,
  Wallet,
  Calendar,
  ChevronRight,
  Search,
  Users,
  Home
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

/**
 * Dedicated Dashboard for Customers.
 * Provides a clean overview of posted jobs, active services, and total spend.
 */
export default function CustomerDashboardPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  // Fetch customer profile
  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  // Fetch jobs posted by this customer
  const myJobsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'jobs'),
      where('customerId', '==', user.uid)
    );
  }, [db, user]);
  const { data: myJobsRaw, isLoading: isLoadingMyJobs } = useCollection(myJobsQuery);

  // Sort jobs locally by createdAt descending
  const myJobs = React.useMemo(() => {
    if (!myJobsRaw) return [];
    return [...myJobsRaw].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [myJobsRaw]);

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Auth Guard - only allow customers
  if (!user || profile?.accountType !== 'Customer') {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-4 text-center bg-slate-50">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Customer Access Only</h1>
        <p className="text-slate-600 max-w-md mb-6">
          This workspace is designed for customers to manage their requests. If you are looking for work, please visit the worker console.
        </p>
        <div className="flex gap-4">
          <Button onClick={() => router.push('/')} variant="outline">Back to Home</Button>
          <Button onClick={() => router.push('/worker-dashboard')}>Go to Worker Console</Button>
        </div>
      </div>
    );
  }

  const activeJobs = myJobs.filter(j => j.status === 'In Progress');
  const openJobs = myJobs.filter(j => !j.status || j.status === 'Open');
  const completedJobs = myJobs.filter(j => j.status === 'Completed');
  const totalSpent = completedJobs.reduce((acc, j) => acc + (j.totalPrice || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <LayoutDashboard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-headline leading-none hidden sm:block">Customer Hub</h1>
              <h1 className="text-lg font-bold font-headline leading-none sm:hidden">Hive</h1>
              <p className="text-[10px] text-primary font-bold uppercase mt-0.5 tracking-tight group-hover:underline">WorkBee Home</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link href="/messages" className="text-sm font-bold text-primary flex items-center gap-2 hover:underline mr-2">
              <MessageSquare className="w-4 h-4" />
              Inbox
            </Link>
            <Link href="/profile">
              <Avatar className="h-9 w-9 border-2 border-primary/10 hover:border-primary/30 transition-all">
                <AvatarImage src={profile.photoUrl} />
                <AvatarFallback className="bg-primary/5 text-primary font-bold">{profile.name?.charAt(0)}</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Welcome */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-black font-headline tracking-tight text-slate-900">Hello, {profile.name}!</h2>
            <p className="text-sm text-muted-foreground">Manage your help requests and track project progress.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="lg" className="h-12 border-slate-200">
              <Link href="/messages" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Messages
              </Link>
            </Button>
            <Button asChild size="lg" className="h-12 shadow-lg shadow-primary/20 bg-accent hover:bg-accent/90">
              <Link href="/post-job" className="gap-2">
                <PlusCircle className="w-4 h-4" />
                Post New Job
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-sm bg-white hover:shadow-md transition-all">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Spent</CardDescription>
              <Wallet className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900">₦{totalSpent.toLocaleString()}</div>
              <p className="text-[10px] text-muted-foreground mt-2">Across {completedJobs.length} completed tasks</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white hover:shadow-md transition-all">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">In Progress</CardDescription>
              <PlayCircle className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900">{activeJobs.length}</div>
              <p className="text-[10px] text-muted-foreground mt-2">Active service requests</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white hover:shadow-md transition-all">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Open Requests</CardDescription>
              <Clock className="w-4 h-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900">{openJobs.length}</div>
              <p className="text-[10px] text-muted-foreground mt-2">Waiting for applicants</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-primary text-primary-foreground overflow-hidden relative">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Users className="w-32 h-32 rotate-12" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/70">Network</CardDescription>
              <CardTitle className="text-xl font-bold">Find Experts</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/workers" className="text-sm font-bold flex items-center gap-2 hover:underline">
                Browse Professionals
                <ArrowRight className="w-4 h-4" />
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Job Management Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold font-headline text-slate-900 flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-primary" />
                Active & Open Jobs
              </h3>
              <Badge className="bg-primary/10 text-primary border-none">{activeJobs.length + openJobs.length} Pending</Badge>
            </div>

            {isLoadingMyJobs ? (
              <div className="space-y-4">
                <Card className="p-8 border-none"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></Card>
              </div>
            ) : (activeJobs.length > 0 || openJobs.length > 0) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...activeJobs, ...openJobs].map(job => (
                  <Card key={job.id} className="border-none shadow-sm hover:shadow-md transition-all flex flex-col">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-md font-bold text-slate-800 line-clamp-1">{job.title}</CardTitle>
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] shrink-0 ${
                            job.status === 'In Progress' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {job.status || 'Open'}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2 text-xs h-8">{job.description}</CardDescription>
                    </CardHeader>
                    <Separator className="bg-slate-50" />
                    <CardFooter className="pt-4 mt-auto flex gap-2">
                      <Button asChild variant="outline" size="sm" className="flex-1 h-9 text-xs gap-2 border-slate-200">
                        <Link href={job.status === 'In Progress' ? `/chat/${job.id}` : `/jobs/${job.id}`}>
                          {job.status === 'In Progress' ? <MessageSquare className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          {job.status === 'In Progress' ? 'Chat' : 'Manage'}
                        </Link>
                      </Button>
                      <Button asChild size="sm" className="flex-1 h-9 text-xs">
                        <Link href={`/jobs/${job.id}`}>
                          Details
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 bg-slate-50/50 py-16">
                <CardContent className="text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                    <PlusCircle className="w-8 h-8 text-slate-300" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-slate-600">No active requests</p>
                    <p className="text-sm text-slate-400">Post a job to find local professionals.</p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/post-job">Post First Job</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Actions / Inbox */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold font-headline text-slate-900">Inbox</h3>
            
            <Card className="border-none shadow-sm bg-white overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6 text-center space-y-4">
                  <MessageSquare className="w-10 h-10 text-primary/20 mx-auto" />
                  <p className="text-xs text-muted-foreground">Keep the conversation going with your applicants to finalize terms.</p>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/messages">View All Chats</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Separator />

            <h3 className="text-lg font-bold font-headline text-slate-900">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-3">
              <Button asChild variant="outline" className="justify-start h-14 px-4 gap-3 bg-white hover:bg-slate-50 border-none shadow-sm">
                <Link href="/post-job">
                  <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center text-accent">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold leading-none">Post Request</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Get help fast</p>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start h-14 px-4 gap-3 bg-white hover:bg-slate-50 border-none shadow-sm">
                <Link href="/workers">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                    <Search className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold leading-none">Browse Workers</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Find local talent</p>
                  </div>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
