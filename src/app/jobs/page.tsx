
'use client';

import React from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Briefcase, Eye, Clock } from 'lucide-react';
import Link from 'next/link';

export default function FindJobPage() {
  const db = useFirestore();

  const jobsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
  }, [db]);

  const { data: jobs, isLoading } = useCollection(jobsQuery);

  return (
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="ghost" className="mb-6 gap-2">
        <Link href="/">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </Button>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Find a Job</h1>
        <p className="text-muted-foreground mt-2">Browse open requests from the community.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : jobs && jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-xl font-bold leading-tight line-clamp-1">{job.title}</CardTitle>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently'}</span>
                  </div>
                  <CardDescription className="line-clamp-2 mt-2">
                    {job.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardFooter className="border-t pt-4">
                <Button asChild variant="outline" className="w-full gap-2 border-primary text-primary hover:bg-primary/5">
                  <Link href={`/jobs/${job.id}`}>
                    <Eye className="w-4 h-4" />
                    View Details
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
          <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-bold text-muted-foreground">No jobs found</h3>
          <p className="text-muted-foreground mt-2">Check back later or post your own request!</p>
        </div>
      )}
    </div>
  );
}
