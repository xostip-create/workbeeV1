'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Info, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

/**
 * Enhanced Job Details Placeholder.
 * Includes a link to Chat.
 */
export default function JobDetailsPage() {
  const params = useParams();
  const jobId = params.id;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="ghost" className="mb-6 gap-2">
        <Link href="/jobs">
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </Link>
      </Button>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Info className="w-6 h-6 text-primary" />
            <CardTitle className="text-3xl font-bold font-headline">Job Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted/30 rounded-md border border-dashed">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Job ID: {jobId}</span>
            <p className="mt-2">This is a placeholder for the full job description, location, and budget details.</p>
          </div>
          
          <Button asChild className="w-full gap-2 py-6 text-lg font-bold">
            <Link href={`/chat/user-${jobId}`}>
              <MessageSquare className="w-5 h-5" />
              Chat with Customer
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
