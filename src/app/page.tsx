
'use client';

import React, { useState, useEffect } from 'react';
import { Search, Store, PlusCircle, LogIn, User as UserIcon, LogOut } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Home() {
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

  const options = [
    {
      title: 'Find a Worker',
      description: 'Connect with skilled professionals for your projects.',
      icon: <Search className="w-8 h-8 text-primary" />,
      actionLabel: 'Browse Workers',
      link: '/workers'
    },
    {
      title: 'Find a Shop',
      description: 'Discover local businesses and repair centers near you.',
      icon: <Store className="w-8 h-8 text-primary" />,
      actionLabel: 'Explore Shops',
      link: '/shops'
    },
    {
      title: 'Post a Job',
      description: 'Reach out to the community and find the right help.',
      icon: <PlusCircle className="w-8 h-8 text-accent" />,
      actionLabel: 'Get Started',
      accent: true,
      link: '/post-job'
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
              <span className="font-bold text-lg">W</span>
            </div>
            <h1 className="text-xl font-bold text-primary font-headline tracking-tight">E&amp;F WorkBee</h1>
          </Link>

          <div className="flex items-center gap-4">
            {!isUserLoading && (
              user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
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
                        <p className="text-sm font-medium leading-none">{profile?.name || user.displayName || 'User'}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer w-full flex items-center">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <Link href="/login">
                    <LogIn className="w-4 h-4" />
                    Login
                  </Link>
                </Button>
              )
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-12 w-full">
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-headline">
            The Hive for Hardworking Pros
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Reliable connections for workers, businesses, and everyday tasks. Choose an option below to get started.
          </p>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {options.map((option, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-xl transition-all duration-300 border-none bg-white/80 backdrop-blur-sm cursor-pointer"
            >
              <CardContent className="p-8 flex flex-col items-center text-center">
                <div className="mb-6 p-4 rounded-full bg-background group-hover:bg-primary/10 transition-colors duration-300">
                  {option.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3 font-headline text-foreground">
                  {option.title}
                </h3>
                <p className="text-muted-foreground mb-8">
                  {option.description}
                </p>
                <Button 
                  asChild
                  className={`w-full font-bold ${option.accent ? 'bg-accent hover:bg-accent/90' : 'bg-primary hover:bg-primary/90'}`}
                >
                  <Link href={option.link}>
                    {option.actionLabel}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-white/50 border-t">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear || '...'} E&amp;F WorkBee. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
