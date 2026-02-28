
'use client';

import React, { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, where, setDoc } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Store, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Package, 
  ArrowLeft, 
  Loader2, 
  Image as ImageIcon,
  Tag,
  Banknote,
  LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ManageShopPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [shopName, setShopName] = useState('');
  const [shopDesc, setShopDesc] = useState('');
  const [shopAddr, setShopAddr] = useState('');
  const [shopImg, setShopImg] = useState('');
  const [isSavingShop, setIsSavingShop] = useState(false);

  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdImg, setNewProdImg] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  const shopRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'shops', user.uid);
  }, [db, user]);
  const { data: shop, isLoading: isShopLoading } = useDoc(shopRef);

  const productsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'shops', user.uid, 'products'), where('sellerId', '==', user.uid));
  }, [db, user]);
  const { data: products, isLoading: isProductsLoading } = useCollection(productsQuery);

  useEffect(() => {
    if (shop) {
      setShopName(shop.name || '');
      setShopDesc(shop.description || '');
      setShopAddr(shop.address || '');
      setShopImg(shop.imageUrl || '');
    }
  }, [shop]);

  const handleSaveShop = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;
    setIsSavingShop(true);
    
    setDocumentNonBlocking(shopRef as any, {
      sellerId: user.uid,
      name: shopName,
      description: shopDesc,
      address: shopAddr,
      imageUrl: shopImg,
      createdAt: shop?.createdAt || new Date().toISOString(),
    }, { merge: true });

    toast({ title: "Shop Updated", description: "Your shop profile is now live." });
    setIsSavingShop(false);
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db || !shop) {
      toast({ variant: "destructive", title: "Setup Required", description: "Please save your shop profile first." });
      return;
    }
    
    setIsAddingProduct(true);
    const prodRef = collection(db, 'shops', user.uid, 'products');
    
    addDocumentNonBlocking(prodRef, {
      storeId: user.uid,
      sellerId: user.uid,
      name: newProdName,
      price: parseFloat(newProdPrice),
      description: newProdDesc,
      imageUrl: newProdImg,
      createdAt: new Date().toISOString(),
    });

    setNewProdName('');
    setNewProdPrice('');
    setNewProdDesc('');
    setNewProdImg('');
    setIsAddingProduct(false);
    toast({ title: "Product Added", description: "Item is now available in your store." });
  };

  const handleDeleteProduct = (prodId: string) => {
    if (!db || !user) return;
    const prodDocRef = doc(db, 'shops', user.uid, 'products', prodId);
    deleteDocumentNonBlocking(prodDocRef);
    toast({ title: "Product Removed", description: "The item has been deleted." });
  };

  if (isShopLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="icon">
              <Link href="/"><ArrowLeft className="w-5 h-5" /></Link>
            </Button>
            <h1 className="text-xl font-bold font-headline">Merchant Hub</h1>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={shop ? `/shops/${shop.id}` : "#"}>View Storefront</Link>
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-white border w-full justify-start p-1 h-12">
            <TabsTrigger value="profile" className="flex-1 gap-2"><Store className="w-4 h-4" />Shop Profile</TabsTrigger>
            <TabsTrigger value="inventory" className="flex-1 gap-2"><Package className="w-4 h-4" />Inventory</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="border-none shadow-md overflow-hidden">
              <div className="h-32 bg-primary/10 relative">
                {shopImg && <img src={shopImg} alt="Banner" className="w-full h-full object-cover opacity-50" />}
                <div className="absolute -bottom-10 left-8">
                  <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                    <AvatarFallback className="bg-primary text-white text-2xl font-bold">{shopName.charAt(0) || 'S'}</AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <CardHeader className="pt-14">
                <CardTitle>Global Shop Settings</CardTitle>
                <CardDescription>Configure how your store appears to customers.</CardDescription>
              </CardHeader>
              <form onSubmit={handleSaveShop}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Store Name</Label>
                      <Input value={shopName} onChange={(e) => setShopName(e.target.value)} required placeholder="e.g. Reliable Spares Hub" />
                    </div>
                    <div className="space-y-2">
                      <Label>Location / Address</Label>
                      <Input value={shopAddr} onChange={(e) => setShopAddr(e.target.value)} placeholder="e.g. Lagos, Nigeria" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Store Image URL</Label>
                    <Input value={shopImg} onChange={(e) => setShopImg(e.target.value)} placeholder="https://..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Short Bio / Description</Label>
                    <Textarea value={shopDesc} onChange={(e) => setShopDesc(e.target.value)} placeholder="What do you specialize in?" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full h-12 font-bold" disabled={isSavingShop}>
                    {isSavingShop ? <Loader2 className="animate-spin" /> : "Save Shop Profile"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="inventory">
            {!shop ? (
              <Card className="p-12 text-center">
                <Store className="w-12 h-12 mx-auto text-slate-200 mb-4" />
                <h3 className="text-xl font-bold">First things first</h3>
                <p className="text-muted-foreground mt-2">Setup your shop profile before adding products.</p>
              </Card>
            ) : (
              <div className="space-y-8">
                <Card className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Plus className="w-5 h-5 text-primary" />
                      Add New Product
                    </CardTitle>
                  </CardHeader>
                  <form onSubmit={handleAddProduct}>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Product Name</Label>
                          <Input value={newProdName} onChange={(e) => setNewProdName(e.target.value)} required placeholder="e.g. 10W-40 Engine Oil" />
                        </div>
                        <div className="space-y-2">
                          <Label>Price (₦)</Label>
                          <Input type="number" value={newProdPrice} onChange={(e) => setNewProdPrice(e.target.value)} required placeholder="5000" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Product Image URL</Label>
                        <Input value={newProdImg} onChange={(e) => setNewProdImg(e.target.value)} placeholder="https://..." />
                      </div>
                      <div className="space-y-2">
                        <Label>Detailed Description</Label>
                        <Textarea value={newProdDesc} onChange={(e) => setNewProdDesc(e.target.value)} placeholder="Specify quality, size, or brand..." />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button type="submit" className="w-full bg-accent hover:bg-accent/90 font-bold" disabled={isAddingProduct}>
                        List Item in Store
                      </Button>
                    </CardFooter>
                  </form>
                </Card>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold font-headline flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Current Inventory ({products?.length || 0})
                  </h3>
                  {isProductsLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
                  ) : products && products.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {products.map((prod) => (
                        <Card key={prod.id} className="border-none shadow-sm flex items-center p-4 gap-4 bg-white">
                          <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                            {prod.imageUrl ? <img src={prod.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon className="w-full h-full p-4 text-slate-300" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm truncate">{prod.name}</h4>
                            <p className="text-primary font-black text-xs mt-0.5">₦{prod.price.toLocaleString()}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteProduct(prod.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed">
                      <Tag className="w-10 h-10 mx-auto text-slate-200 mb-2" />
                      <p className="text-sm text-muted-foreground">Your shelves are empty. Add your first item!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
