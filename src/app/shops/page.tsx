
'use client';

import React from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, limit, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Store, MapPin, Loader2, ArrowRight, ShoppingBag, Search, Tag, Users } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ShopsPage() {
  const { user } = useUser();
  const db = useFirestore();

  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);
  const { data: profile } = useDoc(profileRef);

  const homePath = React.useMemo(() => {
    if (!profile) return '/';
    if (profile.accountType === 'Worker') return '/worker-dashboard';
    if (profile.accountType === 'Customer') return '/customer-dashboard';
    if (profile.accountType === 'Seller') return '/shops/manage';
    return '/';
  }, [profile]);

  const shopsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'shops'), limit(50));
  }, [db]);

  const { data: shops, isLoading } = useCollection(shopsQuery);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon">
              <Link href={homePath}><ArrowLeft className="w-5 h-5" /></Link>
            </Button>
            <h1 className="text-xl font-bold font-headline tracking-tight">Zero Worries Marketplace</h1>
          </div>
          {profile?.accountType === 'Seller' && (
            <Button asChild size="sm" className="bg-accent hover:bg-accent/90">
              <Link href="/shops/manage">Manage My Shop</Link>
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <Badge className="bg-primary/10 text-primary border-none mb-2">Local Verified Shops</Badge>
            <h2 className="text-4xl font-black font-headline text-slate-900 tracking-tighter">Support Your Community</h2>
            <p className="text-muted-foreground text-lg">Browse local shopfronts and buy items with secure escrow protection.</p>
          </div>
          <div className="flex items-center gap-2 bg-white border px-4 py-2 rounded-xl shadow-sm text-xs font-bold text-muted-foreground">
             <Store className="w-4 h-4 text-primary" />
             {shops?.length || 0} ACTIVE STORES
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
            <p className="text-sm text-muted-foreground mt-4 font-bold uppercase tracking-widest">Scanning the Marketplace...</p>
          </div>
        ) : shops && shops.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {shops.map((shop) => (
              <Card key={shop.id} className="border-none shadow-md hover:shadow-2xl transition-all group overflow-hidden bg-white">
                <Link href={`/shops/${shop.id}`}>
                  <div className="h-48 bg-slate-100 relative overflow-hidden">
                    {shop.imageUrl ? (
                       <img src={shop.imageUrl} alt={shop.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-200">
                        <Store className="w-16 h-16 opacity-10" />
                      </div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4 flex items-end gap-3">
                      <Avatar className="w-12 h-12 border-2 border-white shadow-lg">
                        <AvatarFallback className="bg-primary text-white font-black">{shop.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="text-white">
                         <p className="text-[10px] font-black uppercase opacity-80 tracking-widest">Verified Merchant</p>
                         <h3 className="font-bold truncate">{shop.name}</h3>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <p className="text-sm text-slate-600 line-clamp-2 h-10 leading-relaxed italic">
                      "{shop.description || 'Specializing in high-quality local goods and services.'}"
                    </p>
                    <div className="mt-4 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        {shop.address || 'Local Hub'}
                      </div>
                      <Badge variant="secondary" className="bg-green-50 text-green-700 border-none">Open Now</Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="p-6 pt-0">
                    <Button className="w-full gap-2 font-black h-12 bg-slate-900 group-hover:bg-primary transition-colors">
                      <ShoppingBag className="w-4 h-4" />
                      VIEW INVENTORY
                      <ArrowRight className="w-4 h-4 ml-auto" />
                    </Button>
                  </CardFooter>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto text-center py-24 bg-white rounded-3xl shadow-sm border border-slate-100 border-dashed">
            <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-primary opacity-20" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Marketplace is Quiet</h2>
            <p className="text-muted-foreground mt-3 leading-relaxed px-8 text-sm">
              We haven't listed any local shops yet. If you are a seller, register your business to reach the Zero Worries community!
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="font-bold h-12 shadow-xl shadow-primary/10 px-10">
                <Link href="/signup">Open Your Store</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-bold h-12 px-10">
                <Link href="/">Explore Services</Link>
              </Button>
            </div>
          </div>
        )}

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-white border-none shadow-sm p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto">
              <Tag className="w-6 h-6" />
            </div>
            <h4 className="font-bold">Verified Items</h4>
            <p className="text-xs text-muted-foreground">Every product listed is from a verified member of our community.</p>
          </Card>
          <Card className="bg-white border-none shadow-sm p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mx-auto">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h4 className="font-bold">Escrow Protected</h4>
            <p className="text-xs text-muted-foreground">Your money is held securely until you confirm receipt of your items.</p>
          </Card>
          <Card className="bg-white border-none shadow-sm p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="font-bold">Community Support</h4>
            <p className="text-xs text-muted-foreground">Buying from Zero Worries Marketplace helps local entrepreneurs grow.</p>
          </Card>
        </div>
      </main>
    </div>
  );
}
