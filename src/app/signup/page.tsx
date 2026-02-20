'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState('Customer');
  const [isLoading, setIsLoading] = useState(false);
  
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const brandLogo = PlaceHolderImages.find(img => img.id === 'brand-logo');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        name: name,
        email: email,
        accountType: accountType,
        photoUrl: '', 
        isAvailable: true, 
        skills: [], 
        createdAt: new Date().toISOString(),
      });

      toast({
        title: 'Account created!',
        description: `Welcome to Zero Worries, ${name}.`,
      });

      if (accountType === 'Worker') {
        router.push('/worker-dashboard');
      } else if (accountType === 'Customer') {
        router.push('/customer-dashboard');
      } else {
        router.push('/');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Signup failed',
        description: error.message || 'There was an error creating your account.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 relative overflow-hidden rounded-lg">
              {brandLogo ? (
                <Image src={brandLogo.imageUrl} alt="Zero Worries" fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-primary rounded-full flex items-center justify-center text-white">
                  <span className="font-bold">Z</span>
                </div>
              )}
            </div>
            <CardTitle className="text-2xl font-bold">Join Zero Worries</CardTitle>
          </div>
          <CardDescription>
            Create an account to start your journey with complete peace of mind.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            
            <div className="space-y-3">
              <Label>I am a...</Label>
              <RadioGroup value={accountType} onValueChange={setAccountType} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Customer" id="customer" />
                  <Label htmlFor="customer" className="font-normal cursor-pointer">Customer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Worker" id="worker" />
                  <Label htmlFor="worker" className="font-normal cursor-pointer">Worker</Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground italic">
                {accountType === 'Customer' 
                  ? 'I want to find workers and shops for my needs.' 
                  : 'I want to offer my services to the community.'}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Log in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
