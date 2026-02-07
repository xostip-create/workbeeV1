'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

/**
 * Placeholder screen for viewing single job details.
 */
export default function JobDetailsPage() {
  const params = useParams();
  const jobId = params.id;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="ghost" className="mb-6 gap-2">
        <Link href="/jobs">
          <ArrowLeft className="w-4 h-4" />
          Back to Find Jobs
        </Link>
      </Button>
      
      <div className="max-w-2xl mx-auto bg-card border rounded-lg p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Info className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold font-headline text-foreground">Job Details</h1>
        </div>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">
            This is a placeholder screen for viewing the details of a specific job listing.
          </p>
          <div className="p-4 bg-muted/30 rounded-md border border-dashed">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-tight">System Reference:</span>
            <p className="font-mono text-sm mt-1">{jobId || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
