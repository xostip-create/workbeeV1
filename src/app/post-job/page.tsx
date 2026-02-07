
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function PostJobPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;
    
    setIsSubmitting(true);
    const jobsRef = collection(db, 'jobs');
    
    addDocumentNonBlocking(jobsRef, {
      title,
      description,
      customerId: user.uid,
      createdAt: new Date().toISOString(),
    })
    .then(() => {
      toast({
        title: "Job Posted!",
        description: "Your request has been added to the hive.",
      });
      router.push('/jobs');
    })
    .catch(() => {
      setIsSubmitting(false);
    });
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Please log in to post a job.</h2>
        <Button asChild>
          <Link href="/login">Go to Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="ghost" className="mb-6 gap-2">
        <Link href="/">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </Button>

      <Card className="max-w-2xl mx-auto shadow-lg border-t-4 border-t-accent">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <PlusCircle className="w-8 h-8 text-accent" />
            <CardTitle className="text-2xl font-bold font-headline">Post a Job</CardTitle>
          </div>
          <CardDescription>
            Tell the hive what you need help with. Skilled workers will see your request.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                placeholder="e.g. Repair Kitchen Sink, Home Cleaning..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Short Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the task in a few sentences..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="min-h-[150px]"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full h-12 text-lg font-bold bg-accent hover:bg-accent/90" disabled={isSubmitting}>
              {isSubmitting ? 'Posting...' : 'Post Job to Hive'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
