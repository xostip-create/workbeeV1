
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ShopsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="ghost" className="mb-6 gap-2">
        <Link href="/">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </Button>
      <h1 className="text-3xl font-bold font-headline">Find a Shop</h1>
      <p className="text-muted-foreground mt-4">Placeholder for the local shops directory.</p>
    </div>
  );
}
