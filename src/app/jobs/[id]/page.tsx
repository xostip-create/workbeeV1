
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Briefcase, MessageSquare, Clock, User } from 'lucide-react';
import Link from 'next/link';

export default function JobDetailsPage() {
  const params = useParams();
  const jobId = params.id as string;
  const db = useFirestore();

  const jobDocRef = useMemoFirebase(() => {
    if (!db || !jobId) return null;
    return doc(db, 'jobs', jobId);
  }, [db, jobId]);

  const { data: job, isLoading } = useDoc(jobDocRef);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-32 mb-6" />
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Job not found</h2>
        <Button asChild>
          <Link href="/jobs">Back to Jobs</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="ghost" className="mb-6 gap-2">
        <Link href="/jobs">
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </Link>
      </Button>
      
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="shadow-lg border-t-4 border-t-primary overflow-hidden">
          <CardHeader className="bg-muted/30 border-b p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                    <Briefcase className="w-3 h-3 mr-1" />
                    Open Request
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently'}
                  </span>
                </div>
                <CardTitle className="text-4xl font-bold font-headline">{job.title}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <section className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                Description
              </h3>
              <p className="text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {job.description}
              </p>
            </section>

            <div className="pt-6 border-t flex flex-col sm:flex-row gap-4">
              <Button asChild className="flex-1 gap-2 py-6 text-lg font-bold">
                <Link href={`/chat/user-${job.customerId}`}>
                  <MessageSquare className="w-5 h-5" />
                  Chat with Customer
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground italic">
           <User className="w-3 h-3" />
           <span>Posted by user ID: {job.customerId}</span>
        </div>
      </div>
    </div>
  );
}
