
'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Store, 
  MapPin, 
  Package, 
  MessageSquare, 
  ShoppingBag, 
  Loader2,
  Tag,
  Info,
  ChevronRight,
  User,
  Star
} from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

export default function ShopStorefrontPage() {
  const params = useParams();
  const shopId = params.id as string;
  const db = useFirestore();
  const router = useRouter();
  const { user } = useUser();

  const shopRef = useMemoFirebase(() => {
    if (!db || !shopId) return null;
    return doc(db, 'shops', shopId);
  }, [db, shopId]);
  const { data: shop, isLoading: isShopLoading } = useDoc(shopRef);

  const sellerRef = useMemoFirebase(() => {
    if (!db || !shopId) return null;
    return doc(db, 'users', shopId);
  }, [db, shopId]);
  const { data: seller } = useDoc(sellerRef);

  const productsQuery = useMemoFirebase(() => {
    if (!db || !shopId) return null;
    return query(collection(db, 'shops', shopId, 'products'));
  }, [db, shopId]);
  const { data: products, isLoading: isProductsLoading } = useCollection(productsQuery);

  if (isShopLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  if (!shop) {
    return (
      <div className="container py-20 text-center">
        <h2 className="text-2xl font-bold">Store Not Found</h2>
        <Button onClick={() => router.push('/shops')} className="mt-4">Back to Marketplace</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Shop Header */}
      <div className="relative h-64 md:h-80 bg-slate-900 overflow-hidden">
        {shop.imageUrl && (
          <img src={shop.imageUrl} className="w-full h-full object-cover opacity-60" alt={shop.name} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 max-w-7xl mx-auto px-4 pb-8 flex flex-col md:flex-row items-end gap-6">
          <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-white shadow-2xl rounded-2xl">
            <AvatarFallback className="bg-primary text-white text-4xl font-black">{shop.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2 text-white">
            <h1 className="text-3xl md:text-5xl font-black font-headline tracking-tighter">{shop.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm font-medium opacity-90">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{shop.address || 'Local Community'}</span>
              <span className="flex items-center gap-1"><Package className="w-4 h-4" />{products?.length || 0} Items Listed</span>
              <div className="flex items-center gap-1 text-amber-400">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-white">Trusted Merchant</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3 shrink-0 w-full md:w-auto mt-4 md:mt-0">
            <Button className="flex-1 md:flex-none h-12 font-bold gap-2 shadow-xl shadow-primary/20" onClick={() => router.push(`/chat/${shop.id}`)}>
              <MessageSquare className="w-4 h-4" />
              Contact Seller
            </Button>
          </div>
        </div>
        <div className="absolute top-4 left-4">
          <Button variant="ghost" size="icon" className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Sidebar Info */}
          <div className="space-y-8">
            <section className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">About the Merchant</h3>
              <p className="text-sm leading-relaxed text-slate-600 font-medium">{shop.description || 'Verified local shop offering quality goods.'}</p>
            </section>
            
            <Separator />

            <Card className="border-none shadow-sm bg-white overflow-hidden">
              <CardHeader className="bg-slate-50 pb-4">
                <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Owner Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 text-center">
                <Avatar className="w-16 h-16 mx-auto mb-3">
                  <AvatarImage src={seller?.photoUrl} />
                  <AvatarFallback className="bg-slate-100 text-slate-400">{seller?.name?.charAt(0) || 'S'}</AvatarFallback>
                </Avatar>
                <h4 className="font-bold">{seller?.name || 'Seller'}</h4>
                <p className="text-[10px] text-muted-foreground uppercase font-black mt-1">Verified Seller</p>
              </CardContent>
            </Card>

            <div className="bg-primary/5 rounded-2xl p-6 space-y-3 border border-primary/10">
              <div className="flex items-center gap-2 text-primary">
                <ShoppingBag className="w-5 h-5" />
                <h4 className="font-bold">Zero Worries Escrow</h4>
              </div>
              <p className="text-xs text-primary/80 leading-relaxed font-medium">
                Buy with peace of mind. Your payments are protected by our secure platform until items are delivered.
              </p>
            </div>
          </div>

          {/* Product Grid */}
          <div className="lg:col-span-3 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black font-headline tracking-tight">Available Inventory</h2>
              <Badge variant="outline" className="px-4 py-1 font-bold border-slate-200">{products?.length || 0} Products</Badge>
            </div>

            {isProductsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white animate-pulse rounded-2xl" />)}
              </div>
            ) : products && products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {products.map((prod) => (
                  <Card key={prod.id} className="border-none shadow-sm hover:shadow-xl transition-all group overflow-hidden bg-white">
                    <div className="h-48 bg-slate-100 relative">
                      {prod.imageUrl ? (
                        <img src={prod.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" alt={prod.name} />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-200">
                          <Package className="w-12 h-12" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-white/90 text-primary backdrop-blur-sm border-none shadow-sm">₦{prod.price.toLocaleString()}</Badge>
                      </div>
                    </div>
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm font-bold truncate group-hover:text-primary transition-colors">{prod.name}</CardTitle>
                      <CardDescription className="text-xs line-clamp-2 h-8">{prod.description || 'No description provided.'}</CardDescription>
                    </CardHeader>
                    <CardFooter className="p-4 pt-0">
                      <Button variant="outline" className="w-full text-xs font-bold h-9 gap-2 group-hover:bg-primary group-hover:text-white transition-all" onClick={() => router.push(`/chat/${shop.id}`)}>
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Buy Now
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-32 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                <Tag className="w-16 h-16 mx-auto text-slate-100 mb-4" />
                <h3 className="text-xl font-bold text-slate-400">Shelves are currently empty</h3>
                <p className="text-sm text-slate-300 mt-2">Check back later or contact the seller directly.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
