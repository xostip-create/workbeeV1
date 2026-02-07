'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Briefcase, Eye } from 'lucide-react';
import Link from 'next/link';

/**
 * Enhanced Jobs Directory Placeholder.
 * Includes dummy cards to demonstrate navigation to job details.
 */
export default function FindJobPage() {
  const dummyJobs = [
    { id: 'j1', title: 'Fix Leaking Sink', budget: '₦5,000' },
    { id: 'j2', title: 'Car Brake Service', budget: '₦12,000' },
  ];

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
        <p className="text-muted-foreground mt-2">Browse open requests from customers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {dummyJobs.map((job) => (
          <Card key={job.id}>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-accent">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-lg">{job.title}</CardTitle>
                <CardDescription>Budget: {job.budget}</CardDescription>
              </div>
            </CardHeader>
            <CardFooter className="border-t pt-4">
              <Button asChild variant="outline" className="w-full gap-2">
                <Link href={`/jobs/${job.id}`}>
                  <Eye className="w-4 h-4" />
                  View Details
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
