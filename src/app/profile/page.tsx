'use client';

import React, { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { User, Mail, Shield, ArrowLeft, Edit2, Check, X, Camera, ShieldCheck, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedPhotoUrl, setEditedPhotoUrl] = useState('');

  const userDocRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, 'users', user.uid);
  }, [user, db]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userDocRef);

  useEffect(() => {
    if (profile) {
      setEditedName(profile.name || '');
      setEditedPhotoUrl(profile.photoUrl || '');
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
      photoUrl: editedPhotoUrl.trim(),
    });

    toast({
      title: 'Profile updated',
      description: 'Your changes have been saved successfully.',
    });
    
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(profile?.name || '');
    setEditedPhotoUrl(profile?.photoUrl || '');
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

        <Card className="shadow-lg border-t-4 border-t-primary">
          <CardHeader className="border-b bg-muted/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20 border-2 border-background shadow-md">
                <AvatarImage src={profile?.photoUrl} alt={profile?.name} />
                <AvatarFallback className="bg-primary text-white text-2xl font-bold">
                  {profile?.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-3xl font-bold">{profile?.name || 'User Profile'}</CardTitle>
                <div className="mt-1">
                  <Badge variant={profile?.accountType === 'Worker' ? 'default' : 'secondary'} className="flex items-center gap-1 w-fit">
                    {profile?.accountType === 'Worker' ? (
                      <ShieldCheck className="w-3 h-3" />
                    ) : (
                      <UserCircle className="w-3 h-3" />
                    )}
                    {profile?.accountType || 'Customer'}
                  </Badge>
                </div>
              </div>
            </div>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2 shrink-0">
                <Edit2 className="w-4 h-4" />
                Edit Profile
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
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="Enter your name"
                    className="text-lg h-12"
                  />
                ) : (
                  <p className="text-lg font-medium">{profile?.name || 'Not provided'}</p>
                )}
              </div>

              {isEditing && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium uppercase tracking-wider">
                    <Camera className="w-4 h-4" />
                    Profile Photo URL
                  </div>
                  <Input
                    value={editedPhotoUrl}
                    onChange={(e) => setEditedPhotoUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="text-lg h-12"
                  />
                  <p className="text-xs text-muted-foreground italic">Paste a link to an image file.</p>
                </div>
              )}

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
                <div className="pt-2">
                  <div className={`inline-flex items-center gap-2 p-3 rounded-lg border ${profile?.accountType === 'Worker' ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-secondary/5 border-secondary/20 text-secondary'}`}>
                    {profile?.accountType === 'Worker' ? (
                      <ShieldCheck className="w-5 h-5" />
                    ) : (
                      <UserCircle className="w-5 h-5" />
                    )}
                    <div>
                      <p className="text-sm font-bold leading-none">{profile?.accountType || 'Customer'}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {profile?.accountType === 'Worker' 
                          ? 'Providing expert services to the Hive.' 
                          : 'Connecting with experts for quality help.'}
                      </p>
                    </div>
                  </div>
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
