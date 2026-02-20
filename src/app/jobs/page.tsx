'use client';

import React from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Briefcase, Eye, Clock, AlertCircle, Search } from 'lucide-react';
import Link from 'next/link';

export default function FindJobPage() {
  const { user } = useUser();
  const db = useFirestore();

  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);
  const { data: profile } = useDoc(profileRef);

  const homePath = React.useMemo(() => {
    if (!profile) return '/';
    if (profile.accountType === 'Worker') return '/worker-dashboard';
    if (profile.accountType === 'Customer') return '/customer-dashboard';
    return '/';
  }, [profile]);

  const jobsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'jobs'), 
      where('status', '==', 'Open')
    );
  }, [db]);

  const { data: jobsRaw, isLoading, error } = useCollection(jobsQuery);

  const jobs = React.useMemo(() => {
    if (!jobsRaw) return [];
    return [...jobsRaw].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [jobsRaw]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="ghost" className="mb-6 gap-2">
        <Link href={homePath}>
          <ArrowLeft className="w-4 h-4" />
          {profile ? 'Back to Dashboard' : 'Back to Home'}
        </Link>
      </Button>
      
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black font-headline tracking-tight text-slate-900">Open Opportunities</h1>
          <p className="text-muted-foreground mt-2">Browse the platform for new tasks and service requests.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border px-4 py-2 rounded-xl shadow-sm">
          <Search className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-bold text-muted-foreground uppercase">{jobs?.length || 0} Gigs Available</span>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">Could not load jobs. Please check your connection.</p>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : jobs && jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-xl transition-all border-none shadow-md group overflow-hidden bg-white flex flex-col">
              <div className="h-1 bg-primary group-hover:bg-accent transition-colors" />
              <CardHeader className="flex flex-row items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 transition-transform group-hover:scale-110">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-xl font-bold leading-tight line-clamp-1 group-hover:text-primary transition-colors">{job.title}</CardTitle>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
                    <Clock className="w-3 h-3" />
                    <span>Posted {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently'}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <CardDescription className="line-clamp-3 text-sm leading-relaxed text-slate-600">
                  {job.description}
                </CardDescription>
              </CardContent>
              <CardFooter className="pt-4 mt-auto">
                <Button asChild className="w-full gap-2 font-black shadow-lg shadow-primary/10 group-hover:bg-accent transition-colors">
                  <Link href={`/jobs/${job.id}`}>
                    <Eye className="w-4 h-4" />
                    VIEW DETAILS
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Briefcase className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">The feed is quiet...</h3>
          <p className="text-slate-500 mt-2 max-w-xs mx-auto">
            All current jobs have been taken. Check back later or post your own request to find help!
          </p>
          <Button asChild variant="outline" className="mt-8 border-primary text-primary hover:bg-primary/5">
            <Link href="/post-job">Post a Job Request</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
