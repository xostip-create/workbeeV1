
'use client';

import React from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Store, MapPin, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Local Shops Directory.
 * Fetches shop listings directly from the Firestore 'shops' collection.
 */
export default function ShopsPage() {
  const db = useFirestore();

  // Querying for potential shops collection
  const shopsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'shops'), limit(20));
  }, [db]);

  const { data: shops, isLoading } = useCollection(shopsQuery);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Button asChild variant="ghost" className="mb-6 gap-2">
        <Link href="/">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </Button>
      
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-black font-headline text-slate-900 tracking-tight">Local Shop Hub</h1>
        <p className="text-muted-foreground mt-2 text-lg">Support local businesses in the hive.</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground mt-4">Browsing local shopfronts...</p>
        </div>
      ) : shops && shops.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {shops.map((shop) => (
            <Card key={shop.id} className="border-none shadow-md hover:shadow-xl transition-all group overflow-hidden bg-white">
              <div className="h-48 bg-slate-100 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                  <Store className="w-16 h-16 opacity-20" />
                </div>
                {shop.imageUrl && (
                   <img src={shop.imageUrl} alt={shop.name} className="w-full h-full object-cover" />
                )}
              </div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl font-bold">{shop.name}</CardTitle>
                  <Badge className="bg-green-100 text-green-700 border-none">Open</Badge>
                </div>
                <CardDescription className="flex items-center gap-1.5 text-xs">
                  <MapPin className="w-3 h-3 text-primary" />
                  {shop.address || 'Local Community'}
                </CardDescription>
              </CardHeader>
              <CardFooter className="pt-0">
                <Button className="w-full gap-2 font-bold">
                  View Inventory
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto text-center py-24 bg-white rounded-3xl shadow-sm border border-slate-100">
          <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="w-12 h-12 text-primary opacity-40" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">No Shops Registered</h2>
          <p className="text-muted-foreground mt-3 leading-relaxed px-8">
            The shop directory is currently empty. Local businesses can register through the WorkBee portal to showcase their products to the hive.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold h-12">
              <Link href="/signup">Register Business</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-bold h-12">
              <Link href="/">Back to Landing</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
