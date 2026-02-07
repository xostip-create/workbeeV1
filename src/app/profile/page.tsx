
'use client';

import React, { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Mail, 
  Shield, 
  ArrowLeft, 
  Edit2, 
  Check, 
  X, 
  Camera, 
  ShieldCheck, 
  UserCircle, 
  Briefcase,
  Plus,
  Wrench,
  Droplets,
  Zap,
  Brush,
  Car,
  Clock,
  CircleCheck,
  CircleDashed
} from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const PREDEFINED_SKILLS = [
  { name: 'Mechanic', icon: <Wrench className="w-3 h-3" /> },
  { name: 'Plumber', icon: <Droplets className="w-3 h-3" /> },
  { name: 'Electrician', icon: <Zap className="w-3 h-3" /> },
  { name: 'Cleaner', icon: <Brush className="w-3 h-3" /> },
  { name: 'Driver', icon: <Car className="w-3 h-3" /> },
];

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedPhotoUrl, setEditedPhotoUrl] = useState('');
  const [editedSkills, setEditedSkills] = useState<string[]>([]);
  const [editedIsAvailable, setEditedIsAvailable] = useState(true);
  const [customSkill, setCustomSkill] = useState('');

  const userDocRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, 'users', user.uid);
  }, [user, db]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userDocRef);

  useEffect(() => {
    if (profile) {
      setEditedName(profile.name || '');
      setEditedPhotoUrl(profile.photoUrl || '');
      setEditedSkills(profile.skills || []);
      setEditedIsAvailable(profile.isAvailable !== false); // Default to true if undefined
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
      skills: editedSkills,
      isAvailable: editedIsAvailable,
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
    setEditedSkills(profile?.skills || []);
    setEditedIsAvailable(profile?.isAvailable !== false);
    setIsEditing(false);
  };

  const toggleSkill = (skill: string) => {
    setEditedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill) 
        : [...prev, skill]
    );
  };

  const addCustomSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSkill.trim() && !editedSkills.includes(customSkill.trim())) {
      setEditedSkills([...editedSkills, customSkill.trim()]);
      setCustomSkill('');
    }
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

        <Card className="shadow-lg border-t-4 border-t-primary overflow-hidden">
          <CardHeader className="border-b bg-muted/30 flex flex-col sm:flex-row items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20 border-2 border-background shadow-md">
                <AvatarImage src={profile?.photoUrl} alt={profile?.name} />
                <AvatarFallback className="bg-primary text-white text-2xl font-bold">
                  {profile?.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-3xl font-bold">{profile?.name || 'User Profile'}</CardTitle>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Badge variant={profile?.accountType === 'Worker' ? 'default' : 'secondary'} className="flex items-center gap-1">
                    {profile?.accountType === 'Worker' ? (
                      <ShieldCheck className="w-3 h-3" />
                    ) : (
                      <UserCircle className="w-3 h-3" />
                    )}
                    {profile?.accountType || 'Customer'}
                  </Badge>
                  {profile?.accountType === 'Worker' && (
                    <Badge variant={profile?.isAvailable !== false ? "success" as any : "secondary"} className={`gap-1 ${profile?.isAvailable !== false ? 'bg-green-500 hover:bg-green-600 text-white' : ''}`}>
                      {profile?.isAvailable !== false ? (
                        <CircleCheck className="w-3 h-3" />
                      ) : (
                        <CircleDashed className="w-3 h-3" />
                      )}
                      {profile?.isAvailable !== false ? 'Available' : 'Not Available'}
                    </Badge>
                  )}
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
          <CardContent className="p-6 space-y-8">
            <div className="grid grid-cols-1 gap-8">
              {/* Name Section */}
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

              {/* Availability Toggle for Workers */}
              {(isEditing || profile?.accountType === 'Worker') && profile?.accountType === 'Worker' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium uppercase tracking-wider">
                    <Clock className="w-4 h-4" />
                    Availability Status
                  </div>
                  {isEditing ? (
                    <div className="flex items-center space-x-2 bg-muted/20 p-3 rounded-lg border">
                      <Switch 
                        id="availability-toggle" 
                        checked={editedIsAvailable}
                        onCheckedChange={setEditedIsAvailable}
                      />
                      <Label htmlFor="availability-toggle" className="cursor-pointer font-medium">
                        {editedIsAvailable ? 'I am available for work' : 'I am currently busy'}
                      </Label>
                    </div>
                  ) : (
                    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium ${profile?.isAvailable !== false ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                       {profile?.isAvailable !== false ? (
                        <CircleCheck className="w-4 h-4" />
                      ) : (
                        <CircleDashed className="w-4 h-4" />
                      )}
                      {profile?.isAvailable !== false ? 'Available for new jobs' : 'Currently not taking new jobs'}
                    </div>
                  )}
                </div>
              )}

              {/* Photo Section */}
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

              {/* Skills Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium uppercase tracking-wider">
                  <Briefcase className="w-4 h-4" />
                  Skills & Services
                </div>
                
                {isEditing ? (
                  <div className="space-y-4 border rounded-lg p-4 bg-muted/10">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Predefined Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {PREDEFINED_SKILLS.map((skill) => (
                        <Button
                          key={skill.name}
                          type="button"
                          variant={editedSkills.includes(skill.name) ? "default" : "outline"}
                          size="sm"
                          className="gap-2 rounded-full"
                          onClick={() => toggleSkill(skill.name)}
                        >
                          {skill.icon}
                          {skill.name}
                        </Button>
                      ))}
                    </div>
                    
                    <div className="pt-4 border-t">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Custom Skills</p>
                      <div className="flex gap-2">
                        <Input
                          value={customSkill}
                          onChange={(e) => setCustomSkill(e.target.value)}
                          placeholder="Add custom skill (e.g. Tiler, Tutor)..."
                          className="h-9"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSkill(e as any))}
                        />
                        <Button type="button" size="sm" variant="secondary" className="gap-2" onClick={(e) => addCustomSkill(e as any)}>
                          <Plus className="w-4 h-4" />
                          Add
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {editedSkills.filter(s => !PREDEFINED_SKILLS.some(ps => ps.name === s)).map(skill => (
                          <Badge key={skill} variant="secondary" className="gap-1 pr-1 bg-accent/10 text-accent border-accent/20">
                            {skill}
                            <X 
                              className="w-3 h-3 cursor-pointer hover:text-destructive transition-colors" 
                              onClick={() => toggleSkill(skill)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile?.skills && profile.skills.length > 0 ? (
                      profile.skills.map((skill: string) => (
                        <Badge key={skill} variant="outline" className="px-4 py-1.5 text-sm border-primary/20 text-primary bg-primary/5">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No skills listed yet.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Email Section (Read Only) */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium uppercase tracking-wider">
                  <Mail className="w-4 h-4" />
                  Email Address
                </div>
                <p className="text-lg font-medium text-muted-foreground">{user.email}</p>
              </div>

              {/* Account Type Summary */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium uppercase tracking-wider">
                  <Shield className="w-4 h-4" />
                  Account Type
                </div>
                <div className="pt-2">
                  <div className={`inline-flex items-center gap-2 p-4 rounded-lg border ${profile?.accountType === 'Worker' ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-secondary/5 border-secondary/20 text-secondary'}`}>
                    {profile?.accountType === 'Worker' ? (
                      <ShieldCheck className="w-6 h-6" />
                    ) : (
                      <UserCircle className="w-6 h-6" />
                    )}
                    <div>
                      <p className="text-sm font-bold leading-none">{profile?.accountType || 'Customer'}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {profile?.accountType === 'Worker' 
                          ? 'Providing expert services to the community.' 
                          : 'Connecting with experts for quality help.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          {isEditing && (
            <CardFooter className="border-t bg-muted/10 p-6 flex justify-end gap-3">
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
