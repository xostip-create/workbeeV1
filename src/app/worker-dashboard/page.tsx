
'use client';

import React from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, where, limit } from 'firebase/firestore';
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
  AlertCircle,
  Wallet,
  Calendar,
  Star,
  ChevronRight,
  Home
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

export default function WorkerDashboardPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  const myJobsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'jobs'),
      where('selectedApplicantId', '==', user.uid)
    );
  }, [db, user]);
  const { data: myJobsRaw, isLoading: isLoadingMyJobs } = useCollection(myJobsQuery);

  const openJobsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'jobs'),
      where('status', '==', 'Open'),
      limit(20)
    );
  }, [db]);
  const { data: openJobsRaw, isLoading: isLoadingOpenJobs } = useCollection(openJobsQuery);

  const myJobs = React.useMemo(() => {
    if (!myJobsRaw) return [];
    return [...myJobsRaw].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [myJobsRaw]);

  const openJobs = React.useMemo(() => {
    if (!openJobsRaw) return [];
    return [...openJobsRaw]
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 6);
  }, [openJobsRaw]);

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || profile?.accountType !== 'Worker') {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-4 text-center bg-background">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Worker Access Only</h1>
        <p className="text-muted-foreground max-w-md mb-6">
          This workspace is designed for service providers.
        </p>
        <div className="flex gap-4">
          <Button onClick={() => router.push('/')} variant="outline" className="border-white/10">Back to Home</Button>
          <Button onClick={() => router.push('/signup')}>Become a Worker</Button>
        </div>
      </div>
    );
  }

  const activeJobs = myJobs.filter(j => j.status === 'In Progress');
  const completedJobs = myJobs.filter(j => j.status === 'Completed');
  const totalEarnings = completedJobs.reduce((acc, j) => acc + (j.workerPayout || 0), 0);
  const successRate = myJobs.length ? Math.round((completedJobs.length / myJobs.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-card border-b border-white/5 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-sm group-hover:scale-105 transition-transform">
              <span className="font-black text-lg">Z</span>
            </div>
            <div>
              <h1 className="text-lg font-bold font-headline leading-none hidden sm:block">Provider Console</h1>
              <h1 className="text-lg font-bold font-headline leading-none sm:hidden">Zero</h1>
              <p className="text-[10px] text-primary font-bold uppercase mt-0.5 tracking-tight group-hover:underline">Zero Worries Home</p>
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
            <Link href="/messages" className="text-sm font-bold text-primary flex items-center gap-2 hover:underline mr-2">
              <MessageSquare className="w-4 h-4" />
              Inbox
            </Link>
            <Link href="/profile">
              <Avatar className="h-9 w-9 border-2 border-primary/10 hover:border-primary transition-all">
                <AvatarImage src={profile.photoUrl} />
                <AvatarFallback className="bg-primary/5 text-primary font-bold">{profile.name?.charAt(0)}</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-black font-headline tracking-tight text-foreground">Welcome, {profile.name}!</h2>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={`py-0.5 px-3 rounded-full border-none shadow-sm font-bold ${profile.isAvailable !== false ? 'bg-primary/10 text-primary' : 'bg-white/10 text-muted-foreground'}`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-2 ${profile.isAvailable !== false ? 'bg-primary animate-pulse' : 'bg-muted-foreground'}`} />
                {profile.isAvailable !== false ? 'Accepting Gigs' : 'Currently Offline'}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Member since {new Date(profile.createdAt).getFullYear()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="lg" className="h-12 border-white/10 font-bold bg-card text-foreground">
              <Link href="/messages" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Negotiations
              </Link>
            </Button>
            <Button asChild size="lg" className="h-12 shadow-lg shadow-primary/20 bg-primary text-primary-foreground font-bold">
              <Link href="/jobs" className="gap-2">
                <Briefcase className="w-4 h-4" />
                Find Gigs
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-white/5 shadow-sm bg-card hover:border-primary/50 transition-all">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-primary">Net Earnings</CardDescription>
              <Wallet className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground">₦{totalEarnings.toLocaleString()}</div>
              <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-primary" />
                Across {completedJobs.length} successful jobs
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/5 shadow-sm bg-card hover:border-primary/50 transition-all">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-primary">Active Contracts</CardDescription>
              <PlayCircle className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground">{activeJobs.length}</div>
              <p className="text-[10px] text-muted-foreground mt-2">Currently being serviced</p>
            </CardContent>
          </Card>

          <Card className="border-white/5 shadow-sm bg-card hover:border-primary/50 transition-all">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-primary">Success Rate</CardDescription>
              <CheckCircle2 className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-black text-foreground">{successRate}%</div>
              <Progress value={successRate} className="h-1.5 bg-background" />
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-primary text-primary-foreground overflow-hidden relative glow-primary">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Briefcase className="w-32 h-32 rotate-12" />
            </div>
            <CardHeader className="pb-2">
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/70">Gig Recommendation</CardDescription>
              <CardTitle className="text-xl font-bold">New Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black">{openJobs.length}</div>
              <p className="text-[10px] mt-2 text-primary-foreground/80">Available in the platform today</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold font-headline text-foreground flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-primary" />
                Active Contracts
              </h3>
              <Badge className="bg-primary/10 text-primary border-none">{activeJobs.length} Running</Badge>
            </div>

            {isLoadingMyJobs ? (
              <div className="space-y-4">
                <Card className="p-8 bg-card border-white/5"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></Card>
              </div>
            ) : activeJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeJobs.map(job => (
                  <Card key={job.id} className="border-white/5 bg-card hover:border-primary/50 transition-all flex flex-col shadow-sm">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start gap-2">
                        <CardTitle className="text-md font-bold text-foreground line-clamp-1">{job.title}</CardTitle>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] shrink-0 font-bold">In Progress</Badge>
                      </div>
                      <CardDescription className="line-clamp-2 text-xs h-8 text-muted-foreground">{job.description}</CardDescription>
                    </CardHeader>
                    <Separator className="bg-white/5" />
                    <CardFooter className="pt-4 mt-auto flex gap-2">
                      <Button asChild variant="outline" size="sm" className="flex-1 h-9 text-xs gap-2 border-white/10 hover:bg-white/5 font-bold">
                        <Link href={`/chat/${job.id}_${user.uid}`}>
                          <MessageSquare className="w-3.5 h-3.5" />
                          Chat
                        </Link>
                      </Button>
                      <Button asChild size="sm" className="flex-1 h-9 text-xs font-bold bg-primary text-primary-foreground">
                        <Link href={`/jobs/${job.id}`}>
                          Details
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 border-white/10 bg-card/50 py-16">
                <CardContent className="text-center space-y-4">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                    <Briefcase className="w-8 h-8 text-white/20" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-foreground">No active work right now</p>
                    <p className="text-sm text-muted-foreground">Apply for open gigs to start earning.</p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="border-white/10">
                    <Link href="/jobs">Browse Opportunities</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-headline text-foreground">Recent Messages</h3>
              <Button asChild variant="link" size="sm" className="text-primary text-xs h-auto p-0 font-bold">
                <Link href="/messages">View Inbox</Link>
              </Button>
            </div>

            <Card className="border-white/5 bg-card overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6 text-center space-y-4">
                  <MessageSquare className="w-10 h-10 text-primary/20 mx-auto" />
                  <p className="text-xs text-muted-foreground">Stay in touch with your clients.</p>
                  <Button asChild variant="outline" size="sm" className="w-full font-bold border-white/10">
                    <Link href="/messages">Open Messaging Inbox</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Separator className="bg-white/5" />

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold font-headline text-foreground">New Opportunities</h3>
              <Button asChild variant="link" size="sm" className="text-primary text-xs h-auto p-0 font-bold">
                <Link href="/jobs">See all</Link>
              </Button>
            </div>

            <div className="space-y-4">
              {isLoadingOpenJobs ? (
                <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
              ) : openJobs.length > 0 ? (
                openJobs.map(job => (
                  <Card key={job.id} className="border-white/5 bg-card hover:border-primary/50 transition-all group overflow-hidden shadow-sm">
                    <Link href={`/jobs/${job.id}`}>
                      <CardHeader className="p-4 space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <CardTitle className="text-sm font-bold group-hover:text-primary transition-colors leading-tight line-clamp-1 text-foreground">{job.title}</CardTitle>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">{new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                        <CardDescription className="text-[11px] line-clamp-2 leading-relaxed text-muted-foreground">
                          {job.description}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="p-4 pt-0 flex items-center justify-between">
                         <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-primary fill-primary" />
                            <span className="text-[10px] font-bold text-muted-foreground">New Post</span>
                         </div>
                         <div className="text-[11px] font-bold text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                           View Gig
                           <ChevronRight className="w-3 h-3" />
                         </div>
                      </CardFooter>
                    </Link>
                  </Card>
                ))
              ) : (
                <div className="text-center py-10 text-muted-foreground italic bg-card rounded-xl border border-dashed border-white/10 shadow-sm">
                  <p className="text-xs">No new gigs found nearby.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
