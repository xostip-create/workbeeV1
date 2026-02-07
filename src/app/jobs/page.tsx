'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Briefcase } from 'lucide-react';
import Link from 'next/link';

/**
 * Placeholder screen for finding jobs.
 * Intended for Worker accounts to browse listings.
 */
export default function FindJobPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="ghost" className="mb-6 gap-2">
        <Link href="/">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </Button>
      
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="inline-flex p-4 rounded-full bg-primary/10 text-primary mb-6">
          <Briefcase className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-bold font-headline mb-4">Find a Job</h1>
        <p className="text-muted-foreground text-lg">
          This is a placeholder for the worker job browsing directory.
        </p>
      </div>
    </div>
  );
}
