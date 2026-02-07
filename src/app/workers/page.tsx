'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, User, MessageSquare } from 'lucide-react';
import Link from 'next/link';

/**
 * Enhanced Workers Directory Placeholder.
 * Includes dummy cards to demonstrate navigation to chat.
 */
export default function WorkersPage() {
  const dummyWorkers = [
    { id: 'w1', name: 'John Mechanic', skill: 'Auto Repair' },
    { id: 'w2', name: 'Sarah Plumber', skill: 'Plumbing & Leaks' },
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
        <h1 className="text-3xl font-bold font-headline">Find a Worker</h1>
        <p className="text-muted-foreground mt-2">Browse professionals available for hire.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dummyWorkers.map((worker) => (
          <Card key={worker.id}>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="text-primary w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-lg">{worker.name}</CardTitle>
                <CardDescription>{worker.skill}</CardDescription>
              </div>
            </CardHeader>
            <CardFooter className="border-t pt-4">
              <Button asChild className="w-full gap-2">
                <Link href={`/chat/${worker.id}`}>
                  <MessageSquare className="w-4 h-4" />
                  Contact Worker
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
