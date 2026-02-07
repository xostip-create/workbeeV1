
'use client';

import React, { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { User, Mail, Shield, ArrowLeft, Edit2, Check, X } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');

  const userDocRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, 'users', user.uid);
  }, [user, db]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userDocRef);

  useEffect(() => {
    if (profile?.name) {
      setEditedName(profile.name);
    }
  }, [profile]);

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <Skeleton className="h-8 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Please log in to view your profile.</h2>
        <Button asChild>
          <Link href="/login">Go to Login</Link>
        </Button>
      </div>
    );
  }

  const handleSave = () => {
    if (!userDocRef || !editedName.trim()) return;

    updateDocumentNonBlocking(userDocRef, {
      name: editedName.trim(),
    });

    toast({
      title: 'Profile updated',
      description: 'Your changes have been saved successfully.',
    });
    
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(profile?.name || '');
    setIsEditing(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Button asChild variant="ghost" className="mb-6 gap-2">
          <Link href="/">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </Button>

        <Card className="shadow-lg">
          <CardHeader className="border-b bg-muted/30 flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {profile?.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <CardTitle className="text-3xl font-bold">{profile?.name || 'User Profile'}</CardTitle>
                <CardDescription>View and manage your account information</CardDescription>
              </div>
            </div>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
                <Edit2 className="w-4 h-4" />
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium uppercase tracking-wider">
                  <User className="w-4 h-4" />
                  Full Name
                </div>
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      placeholder="Enter your name"
                      className="text-lg h-12"
                      autoFocus
                    />
                  </div>
                ) : (
                  <p className="text-lg font-medium">{profile?.name || 'Not provided'}</p>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium uppercase tracking-wider">
                  <Mail className="w-4 h-4" />
                  Email Address
                </div>
                <p className="text-lg font-medium text-muted-foreground">{user.email}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium uppercase tracking-wider">
                  <Shield className="w-4 h-4" />
                  Account Type
                </div>
                <div className="pt-1">
                  <Badge variant={profile?.accountType === 'Worker' ? 'default' : 'secondary'} className="text-sm px-3 py-1">
                    {profile?.accountType || 'Customer'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
          {isEditing && (
            <CardFooter className="border-t bg-muted/10 p-4 flex justify-end gap-3">
              <Button variant="ghost" onClick={handleCancel} className="gap-2">
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button onClick={handleSave} className="gap-2 bg-accent hover:bg-accent/90">
                <Check className="w-4 h-4" />
                Save Changes
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
