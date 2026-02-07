
import React from 'react';
import { Search, Store, PlusCircle, BeeIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Home() {
  const options = [
    {
      title: 'Find a Worker',
      description: 'Connect with skilled professionals for your projects.',
      icon: <Search className="w-8 h-8 text-primary" />,
      actionLabel: 'Browse Workers',
    },
    {
      title: 'Find a Shop',
      description: 'Discover local businesses and repair centers near you.',
      icon: <Store className="w-8 h-8 text-primary" />,
      actionLabel: 'Explore Shops',
    },
    {
      title: 'Post a Job',
      description: 'Reach out to the community and find the right help.',
      icon: <PlusCircle className="w-8 h-8 text-accent" />,
      actionLabel: 'Get Started',
      accent: true,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
              <span className="font-bold text-lg">W</span>
            </div>
            <h1 className="text-xl font-bold text-primary font-headline tracking-tight">E&amp;F WorkBee</h1>
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
                  className={`w-full font-bold ${option.accent ? 'bg-accent hover:bg-accent/90' : 'bg-primary hover:bg-primary/90'}`}
                >
                  {option.actionLabel}
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
            &copy; {new Date().getFullYear()} E&amp;F WorkBee. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
