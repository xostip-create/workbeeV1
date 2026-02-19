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
  LayoutDashboard
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
  const trustImage = PlaceHolderImages.find(img => img.id === 'trust-security');

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white shadow-lg">
              <span className="font-bold text-lg">W</span>
            </div>
            <h1 className="text-xl font-bold text-primary font-headline tracking-tight">E&amp;F WorkBee</h1>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/workers" className="text-sm font-medium hover:text-primary transition-colors">Find Workers</Link>
            <Link href="/jobs" className="text-sm font-medium hover:text-primary transition-colors">Browse Jobs</Link>
            <Link href="/shops" className="text-sm font-medium hover:text-primary transition-colors">Local Shops</Link>
          </nav>

          <div className="flex items-center gap-3">
            {!isUserLoading && (
              user ? (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar className="h-10 w-10 border-2 border-primary/20 hover:border-primary/50 transition-all">
                          <AvatarImage src={profile?.photoUrl} alt={profile?.name} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {profile?.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold leading-none">{profile?.name || 'User'}</p>
                            <Badge variant="outline" className="text-[10px] py-0 px-1">
                              {profile?.accountType}
                            </Badge>
                          </div>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
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
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="cursor-pointer w-full flex items-center">
                          <UserIcon className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      {profile?.isAdmin && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="cursor-pointer w-full flex items-center text-amber-600">
                            <Settings2 className="mr-2 h-4 w-4" />
                            <span>Admin Panel</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild size="sm" className="bg-primary shadow-md">
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
        <section className="relative py-20 overflow-hidden bg-white">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 animate-fade-in-up">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-4 py-1">
                The Trusted Hive for Services
              </Badge>
              <h2 className="text-5xl md:text-7xl font-extrabold text-foreground leading-[1.1] font-headline">
                Reliable Workers. <br />
                <span className="text-primary">Verified Skills.</span>
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                Connect with local experts, browse specialized shops, or post your job to find the perfect help today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button asChild size="lg" className="h-14 px-8 text-lg font-bold bg-primary shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all">
                  <Link href="/post-job" className="flex items-center gap-2">
                    <PlusCircle className="w-5 h-5" />
                    Post a Job
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg font-bold hover:bg-muted/50 transition-all border-2">
                  <Link href="/workers" className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Find Workers
                  </Link>
                </Button>
              </div>
              <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>Verified Pros</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <span>Secure Escrow</span>
                </div>
              </div>
            </div>
            <div className="relative animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl aspect-[4/3]">
                {heroImage && (
                  <Image 
                    src={heroImage.imageUrl} 
                    alt={heroImage.description} 
                    fill 
                    className="object-cover"
                    data-ai-hint={heroImage.imageHint}
                  />
                )}
              </div>
              {/* Decorative blobs */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl" />
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl font-bold font-headline">Built for Reliability & Trust</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                WorkBee provides the tools you need to manage your service requests from first contact to final payout.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="border-none shadow-md bg-white hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <CardTitle>Real-time Negotiation</CardTitle>
                  <CardDescription>
                    Chat directly with workers, propose prices, and agree on terms before any commitment.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-none shadow-md bg-white hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent mb-4">
                    <Banknote className="w-6 h-6" />
                  </div>
                  <CardTitle>Secure Escrow Payments</CardTitle>
                  <CardDescription>
                    Your payments are held securely via Paystack and only released when the job is completed.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-none shadow-md bg-white hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 mb-4">
                    <Star className="w-6 h-6" />
                  </div>
                  <CardTitle>Verified Reviews</CardTitle>
                  <CardDescription>
                    Build your reputation or choose experts based on real feedback from the community.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div className="order-2 lg:order-1 relative">
                <div className="rounded-2xl overflow-hidden shadow-xl aspect-video relative">
                  {trustImage && (
                    <Image 
                      src={trustImage.imageUrl} 
                      alt={trustImage.description} 
                      fill 
                      className="object-cover"
                      data-ai-hint={trustImage.imageHint}
                    />
                  )}
                </div>
                <Card className="absolute -bottom-6 -right-6 w-48 shadow-xl border-2 border-primary/20">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <ShieldCheck className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Protection</p>
                      <p className="text-sm font-bold">Funds Secured</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="order-1 lg:order-2 space-y-10">
                <h2 className="text-4xl font-bold font-headline">How the Hive Works</h2>
                
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">1</div>
                    <div className="space-y-1">
                      <h3 className="font-bold">Post your Request</h3>
                      <p className="text-sm text-muted-foreground">Describe your task and let the community of skilled workers see what you need.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">2</div>
                    <div className="space-y-1">
                      <h3 className="font-bold">Negotiate & Hire</h3>
                      <p className="text-sm text-muted-foreground">Select an applicant, discuss the price in our secure chat, and accept a proposal.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">3</div>
                    <div className="space-y-1">
                      <h3 className="font-bold">Pay & Complete</h3>
                      <p className="text-sm text-muted-foreground">Fund the job via Paystack. Once the work is done, mark it as complete to release the funds.</p>
                    </div>
                  </div>
                </div>

                <Button asChild className="mt-4 gap-2">
                  <Link href="/signup">
                    Get Started Now
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Categories / Quick Navigation */}
        <section className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-4">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold font-headline">Explore the Hive</h2>
                <p className="text-muted-foreground">Find exactly what you need with our quick access modules.</p>
              </div>
              <Button asChild variant="outline" className="shrink-0">
                <Link href="/jobs">View all Jobs</Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: 'Workers', icon: <Search />, link: '/workers', color: 'bg-blue-50 text-blue-600', desc: 'Find skilled hands' },
                { title: 'Jobs', icon: <Briefcase />, link: '/jobs', color: 'bg-green-50 text-green-600', desc: 'Available opportunities' },
                { title: 'Shops', icon: <Store />, link: '/shops', color: 'bg-purple-50 text-purple-600', desc: 'Local business hubs' },
                { title: 'Post Job', icon: <PlusCircle />, link: '/post-job', color: 'bg-orange-50 text-orange-600', desc: 'Request help' },
              ].map((item, idx) => (
                <Link href={item.link} key={idx} className="group">
                  <Card className="h-full border-none shadow-sm hover:shadow-md transition-all group-hover:-translate-y-1 overflow-hidden">
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${item.color}`}>
                        {React.cloneElement(item.icon as React.ReactElement, { className: "w-6 h-6" })}
                      </div>
                      <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-primary text-white overflow-hidden relative">
          <div className="max-w-4xl mx-auto px-4 text-center space-y-8 relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold font-headline">Ready to join the community?</h2>
            <p className="text-primary-foreground/80 text-lg">
              Whether you're looking for help or looking to provide it, WorkBee is the safest way to connect and get things done.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary" className="h-14 px-8 text-lg font-bold shadow-xl">
                <Link href="/signup">Join the Hive</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg font-bold border-white/20 hover:bg-white/10 text-white">
                <Link href="/login">Login to Account</Link>
              </Button>
            </div>
          </div>
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
                <span className="font-bold">W</span>
              </div>
              <h1 className="text-lg font-bold text-primary font-headline">E&amp;F WorkBee</h1>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Empowering local communities with reliable connections and secure payments.
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-widest text-foreground">Services</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/workers" className="hover:text-primary transition-colors">Find a Worker</Link></li>
              <li><Link href="/jobs" className="hover:text-primary transition-colors">Post a Job</Link></li>
              <li><Link href="/shops" className="hover:text-primary transition-colors">Local Shops</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-widest text-foreground">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-widest text-foreground">Admin</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/admin" className="flex items-center gap-2 hover:text-primary transition-colors">
                  <Settings2 className="w-4 h-4" />
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pt-8 border-t text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear || '...'} E&amp;F WorkBee. Built with trust for the community.
          </p>
        </div>
      </footer>
    </div>
  );
}
