
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Store, 
  PlusCircle, 
  LogIn, 
  User as UserIcon, 
  LogOut, 
  ShieldCheck, 
  UserCircle, 
  Briefcase, 
  Settings2,
  CheckCircle2,
  Clock,
  MessageSquare,
  Banknote,
  Users,
  Star,
  ArrowRight,
  ShieldAlert,
  LayoutDashboard,
  ShoppingBag
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from '@/components/ui/badge';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LandingPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  const userDocRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, 'users', user.uid);
  }, [user, db]);

  const { data: profile } = useDoc(userDocRef);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const handleLogout = () => {
    signOut(auth);
  };

  const heroImage = PlaceHolderImages.find(img => img.id === 'hero-main');

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-[0_0_15px_rgba(34,197,94,0.3)] group-hover:scale-105 transition-transform">
              <span className="font-black text-xl">Z</span>
            </div>
            <h1 className="text-xl font-bold text-primary font-headline tracking-tight glow-text">Zero Worries</h1>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/workers" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors">Find Workers</Link>
            <Link href="/jobs" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors">Browse Jobs</Link>
            <Link href="/shops" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors">Marketplace</Link>
          </nav>

          <div className="flex items-center gap-3">
            {!isUserLoading && (
              user ? (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar className="h-10 w-10 border-2 border-primary/20 hover:border-primary transition-all">
                          <AvatarImage src={profile?.photoUrl} alt={profile?.name} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {profile?.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-card border-white/10" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold leading-none">{profile?.name || 'User'}</p>
                            <Badge variant="outline" className="text-[10px] py-0 px-1 border-primary/30 text-primary">
                              {profile?.accountType}
                            </Badge>
                          </div>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/5" />
                      {profile?.accountType === 'Worker' && (
                        <DropdownMenuItem asChild>
                          <Link href="/worker-dashboard" className="cursor-pointer w-full flex items-center text-primary font-bold">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Worker Dashboard</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {profile?.accountType === 'Customer' && (
                        <DropdownMenuItem asChild>
                          <Link href="/customer-dashboard" className="cursor-pointer w-full flex items-center text-primary font-bold">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Customer Hub</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {profile?.accountType === 'Seller' && (
                        <DropdownMenuItem asChild>
                          <Link href="/shops/manage" className="cursor-pointer w-full flex items-center text-primary font-bold">
                            <Store className="mr-2 h-4 w-4" />
                            <span>Manage My Store</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href="/messages" className="cursor-pointer w-full flex items-center font-bold">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          <span>Inbox</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="cursor-pointer w-full flex items-center">
                          <UserIcon className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      {profile?.isAdmin && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="cursor-pointer w-full flex items-center text-amber-500">
                            <Settings2 className="mr-2 h-4 w-4" />
                            <span>Admin Panel</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator className="bg-white/5" />
                      <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button asChild variant="ghost" size="sm" className="text-foreground/70 hover:text-primary hover:bg-white/5">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild size="sm" className="bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20">
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-6 pb-16 md:py-20 overflow-hidden bg-background">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in-up">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-4 py-1">
                The Trusted Hub for Every Task
              </Badge>
              <h2 className="text-5xl md:text-7xl font-extrabold text-foreground leading-[1.1] font-headline">
                Reliable Experts. <br />
                <span className="text-primary glow-text">Trusted Stores.</span>
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed max-lg">
                Connect with local pros, browse verified shops, or post your job to find the perfect help today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button asChild size="lg" className="h-14 px-8 text-lg font-bold bg-primary text-primary-foreground shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:-translate-y-1 transition-all">
                  <Link href="/post-job" className="flex items-center gap-2">
                    <PlusCircle className="w-5 h-5" />
                    Hire Help
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg font-bold border-primary/30 text-primary hover:bg-primary/5 transition-all">
                  <Link href="/shops" className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    Shop Local
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="relative z-10 rounded-2xl shadow-2xl overflow-hidden bg-card/50 flex items-center justify-center min-h-[400px] border border-white/5">
                {heroImage && (
                  <Image 
                    src={heroImage.imageUrl} 
                    alt={heroImage.description} 
                    fill 
                    className="object-contain"
                    data-ai-hint={heroImage.imageHint}
                    priority
                  />
                )}
              </div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
            </div>
          </div>
        </section>

        {/* Categories / Quick Navigation */}
        <section className="py-24 bg-card/30 border-y border-white/5">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-4">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold font-headline text-primary glow-text">Explore Zero Worries</h2>
                <p className="text-muted-foreground">Find exactly what you need with our community-driven marketplace.</p>
              </div>
              <Button asChild variant="outline" className="shrink-0 border-white/10 hover:bg-white/5">
                <Link href="/shops">Browse Marketplace</Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Find Pros', icon: <Search />, link: '/workers', color: 'bg-primary/5 text-primary', desc: 'Verified local experts' },
                { title: 'Browse Gigs', icon: <Briefcase />, link: '/jobs', color: 'bg-primary/5 text-primary', desc: 'Available opportunities' },
                { title: 'Marketplace', icon: <ShoppingBag />, link: '/shops', color: 'bg-primary/5 text-primary', desc: 'Shop local storefronts' },
                { title: 'Hire Now', icon: <PlusCircle />, link: '/post-job', color: 'bg-primary/5 text-primary', desc: 'Post a request' },
              ].map((item, idx) => (
                <Link href={item.link} key={idx} className="group">
                  <Card className="h-full border-white/5 bg-card hover:border-primary/50 transition-all group-hover:-translate-y-1 overflow-hidden glow-primary">
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${item.color}`}>
                        {React.cloneElement(item.icon as React.ReactElement, { className: "w-6 h-6" })}
                      </div>
                      <h3 className="font-bold text-lg mb-1 text-foreground group-hover:text-primary transition-colors">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 bg-background border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-sm group-hover:scale-105 transition-transform">
                <span className="font-black text-xl">Z</span>
              </div>
              <h1 className="text-lg font-bold text-primary font-headline glow-text">Zero Worries</h1>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Empowering local communities with reliable connections and secure payments.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-widest text-foreground/70">Marketplace</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/shops" className="hover:text-primary transition-colors">Find a Shop</Link></li>
              <li><Link href="/signup" className="hover:text-primary transition-colors">Start Selling</Link></li>
              <li><Link href="/workers" className="hover:text-primary transition-colors">Find a Pro</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 pt-8 border-t border-white/5 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear || '...'} Zero Worries. Built with trust for the community.
          </p>
        </div>
      </footer>
    </div>
  );
}
