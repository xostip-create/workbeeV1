
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
import { useToast } from '@/hooks/use-toast';

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
      } else if (accountType === 'Seller') {
        router.push('/shops/manage');
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
      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg">
              <span className="font-black text-3xl">Z</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold font-headline">Join Zero Worries</CardTitle>
          <CardDescription className="text-base">
            Create an account to start your journey with complete peace of mind.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-12"
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
                className="h-12"
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
                className="h-12"
              />
            </div>
            
            <div className="space-y-4 pt-2">
              <Label className="text-base font-bold">I am a...</Label>
              <RadioGroup value={accountType} onValueChange={setAccountType} className="grid grid-cols-3 gap-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Customer" id="customer" />
                  <Label htmlFor="customer" className="font-bold cursor-pointer text-xs">Buyer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Worker" id="worker" />
                  <Label htmlFor="worker" className="font-bold cursor-pointer text-xs">Worker</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Seller" id="seller" />
                  <Label htmlFor="seller" className="font-bold cursor-pointer text-xs">Seller</Label>
                </div>
              </RadioGroup>
              <p className="text-[10px] text-muted-foreground italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                {accountType === 'Customer' 
                  ? 'I want to hire experts and buy from shops.' 
                  : accountType === 'Worker' 
                    ? 'I want to provide manual or expert services.'
                    : 'I want to sell items and manage a shop.'}
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pb-8">
            <Button type="submit" className="w-full h-12 text-lg font-bold shadow-lg" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline font-bold">
                Log in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
