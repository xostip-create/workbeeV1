
'use client';

import React from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ArrowLeft, User, MessageCircle, Star, Loader2, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/**
 * Real-time Workers Directory.
 * Retrieves all registered service providers from Firestore.
 */
export default function WorkersPage() {
  const db = useFirestore();

  const workersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'users'),
      where('accountType', '==', 'Worker'),
      limit(50)
    );
  }, [db]);

  const { data: workers, isLoading } = useCollection(workersQuery);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Button asChild variant="ghost" className="mb-6 gap-2">
        <Link href="/">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </Button>
      
      <div className="mb-8">
        <h1 className="text-4xl font-black font-headline tracking-tight text-slate-900">Find a Professional</h1>
        <p className="text-muted-foreground mt-2">Connect with verified experts in the WorkBee community.</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground mt-4">Searching the hive for pros...</p>
        </div>
      ) : workers && workers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {workers.map((worker) => (
            <Card key={worker.id} className="hover:shadow-lg transition-all border-none shadow-md overflow-hidden group">
              <div className="h-2 bg-primary group-hover:bg-accent transition-colors" />
              <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="w-14 h-14 border-2 border-primary/10">
                  <AvatarImage src={worker.photoUrl} alt={worker.name} />
                  <AvatarFallback className="bg-primary/5 text-primary text-xl font-bold">
                    {worker.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-bold truncate">{worker.name}</CardTitle>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>Top Rated</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="flex flex-wrap gap-1.5">
                  {worker.skills && worker.skills.length > 0 ? (
                    worker.skills.slice(0, 3).map((skill: string) => (
                      <Badge key={skill} variant="secondary" className="text-[10px] font-medium bg-slate-100 text-slate-700 border-none">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground italic">General Services</span>
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 bg-muted/10">
                <Button asChild className="w-full gap-2 font-bold shadow-sm group-hover:bg-accent transition-colors">
                  <Link href={`/chat/${worker.id}`}>
                    <MessageCircle className="w-4 h-4" />
                    Contact Worker
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">No Workers Found</h3>
          <p className="text-slate-500 mt-2 max-w-xs mx-auto">
            Our hive is growing! Check back soon to connect with new service providers.
          </p>
          <Button asChild variant="outline" className="mt-8">
            <Link href="/signup">Become the first worker</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
