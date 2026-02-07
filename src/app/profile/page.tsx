
'use client';

import React, { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
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
  CircleDashed,
  Star,
  Phone
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
  const [editedPhoneNumber, setEditedPhoneNumber] = useState('');
  const [editedPhotoUrl, setEditedPhotoUrl] = useState('');
  const [editedSkills, setEditedSkills] = useState<string[]>([]);
  const [editedIsAvailable, setEditedIsAvailable] = useState(true);
  const [customSkill, setCustomSkill] = useState('');

  const userDocRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, 'users', user.uid);
  }, [user, db]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userDocRef);

  // Fetch reviews for this user
  const reviewsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'reviews'), orderBy('createdAt', 'desc'));
  }, [db, user]);

  const { data: reviews, isLoading: isReviewsLoading } = useCollection(reviewsQuery);

  const averageRating = reviews && reviews.length > 0
    ? (reviews.reduce((acc, rev) => acc + (rev.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  useEffect(() => {
    if (profile) {
      setEditedName(profile.name || '');
      setEditedPhoneNumber(profile.phoneNumber || '');
      setEditedPhotoUrl(profile.photoUrl || '');
      setEditedSkills(profile.skills || []);
      setEditedIsAvailable(profile.isAvailable !== false);
    }
  }, [profile]);

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <Skeleton className="h-8 w-1/3 mb-2" /><Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Please log in to view your profile.</h2>
        <Button asChild><Link href="/login">Go to Login</Link></Button>
      </div>
    );
  }

  const handleSave = () => {
    if (!userDocRef || !editedName.trim()) return;
    updateDocumentNonBlocking(userDocRef, {
      name: editedName.trim(),
      phoneNumber: editedPhoneNumber.trim(),
      photoUrl: editedPhotoUrl.trim(),
      skills: editedSkills,
      isAvailable: editedIsAvailable,
    });
    toast({ title: 'Profile updated', description: 'Changes saved successfully.' });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(profile?.name || '');
    setEditedPhoneNumber(profile?.phoneNumber || '');
    setEditedPhotoUrl(profile?.photoUrl || '');
    setEditedSkills(profile?.skills || []);
    setEditedIsAvailable(profile?.isAvailable !== false);
    setIsEditing(false);
  };

  const toggleSkill = (skill: string) => {
    setEditedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
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
      <div className="max-w-2xl mx-auto space-y-8">
        <Button asChild variant="ghost" className="mb-2 gap-2">
          <Link href="/"><ArrowLeft className="w-4 h-4" />Back to Home</Link>
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
                    {profile?.accountType === 'Worker' ? <ShieldCheck className="w-3 h-3" /> : <UserCircle className="w-3 h-3" />}
                    {profile?.accountType || 'Customer'}
                  </Badge>
                  {profile?.accountType === 'Worker' && (
                    <Badge variant={profile?.isAvailable !== false ? "success" as any : "secondary"} className={`gap-1 ${profile?.isAvailable !== false ? 'bg-green-500 text-white' : ''}`}>
                      {profile?.isAvailable !== false ? <CircleCheck className="w-3 h-3" /> : <CircleDashed className="w-3 h-3" />}
                      {profile?.isAvailable !== false ? 'Available' : 'Busy'}
                    </Badge>
                  )}
                  {averageRating && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      {averageRating} ({reviews?.length})
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2 shrink-0">
                <Edit2 className="w-4 h-4" />Edit Profile
              </Button>
            )}
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            <div className="grid grid-cols-1 gap-8">
              {/* Name Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium uppercase tracking-wider">
                  <User className="w-4 h-4" />Full Name
                </div>
                {isEditing ? (
                  <Input value={editedName} onChange={(e) => setEditedName(e.target.value)} className="text-lg h-12" />
                ) : (
                  <p className="text-lg font-medium">{profile?.name || 'Not provided'}</p>
                )}
              </div>

              {/* Phone Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium uppercase tracking-wider">
                  <Phone className="w-4 h-4" />Phone Number
                </div>
                {isEditing ? (
                  <Input 
                    value={editedPhoneNumber} 
                    onChange={(e) => setEditedPhoneNumber(e.target.value)} 
                    placeholder="e.g. 08012345678"
                    className="text-lg h-12" 
                  />
                ) : (
                  <p className="text-lg font-medium">{profile?.phoneNumber || 'Not provided'}</p>
                )}
                <p className="text-[10px] text-muted-foreground italic">
                  Note: Your phone number is only shared with customers who have paid for a job you are assigned to.
                </p>
              </div>

              {/* Availability Toggle */}
              {profile?.accountType === 'Worker' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium uppercase tracking-wider">
                    <Clock className="w-4 h-4" />Availability Status
                  </div>
                  {isEditing ? (
                    <div className="flex items-center space-x-2 bg-muted/20 p-3 rounded-lg border">
                      <Switch id="availability-toggle" checked={editedIsAvailable} onCheckedChange={setEditedIsAvailable} />
                      <Label htmlFor="availability-toggle" className="cursor-pointer font-medium">
                        {editedIsAvailable ? 'I am available for work' : 'I am currently busy'}
                      </Label>
                    </div>
                  ) : (
                    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium ${profile?.isAvailable !== false ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                      {profile?.isAvailable !== false ? 'Available for new jobs' : 'Currently not taking new jobs'}
                    </div>
                  )}
                </div>
              )}

              {/* Photo Section */}
              {isEditing && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium uppercase tracking-wider">
                    <Camera className="w-4 h-4" />Profile Photo URL
                  </div>
                  <Input value={editedPhotoUrl} onChange={(e) => setEditedPhotoUrl(e.target.value)} className="text-lg h-12" />
                </div>
              )}

              {/* Skills Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium uppercase tracking-wider">
                  <Briefcase className="w-4 h-4" />Skills & Services
                </div>
                {isEditing ? (
                  <div className="space-y-4 border rounded-lg p-4 bg-muted/10">
                    <div className="flex flex-wrap gap-2">
                      {PREDEFINED_SKILLS.map((skill) => (
                        <Button key={skill.name} type="button" variant={editedSkills.includes(skill.name) ? "default" : "outline"} size="sm" className="gap-2 rounded-full" onClick={() => toggleSkill(skill.name)}>
                          {skill.icon}{skill.name}
                        </Button>
                      ))}
                    </div>
                    <div className="pt-4 border-t flex gap-2">
                      <Input value={customSkill} onChange={(e) => setCustomSkill(e.target.value)} placeholder="Add custom skill..." className="h-9" onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSkill(e as any))} />
                      <Button type="button" size="sm" variant="secondary" onClick={(e) => addCustomSkill(e as any)}>Add</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile?.skills?.length ? profile.skills.map((skill: string) => (
                      <Badge key={skill} variant="outline" className="px-4 py-1.5 text-sm border-primary/20 text-primary bg-primary/5">{skill}</Badge>
                    )) : <p className="text-sm text-muted-foreground italic">No skills listed.</p>}
                  </div>
                )}
              </div>

              {/* Account Summary */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium uppercase tracking-wider"><Shield className="w-4 h-4" />Account Type</div>
                <div className="pt-2">
                  <div className={`inline-flex items-center gap-2 p-4 rounded-lg border ${profile?.accountType === 'Worker' ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-secondary/5 border-secondary/20 text-secondary'}`}>
                    {profile?.accountType === 'Worker' ? <ShieldCheck className="w-6 h-6" /> : <UserCircle className="w-6 h-6" />}
                    <div>
                      <p className="text-sm font-bold leading-none">{profile?.accountType || 'Customer'}</p>
                      <p className="text-xs opacity-70 mt-1">{profile?.accountType === 'Worker' ? 'Providing expert services.' : 'Connecting with experts.'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          {isEditing && (
            <CardFooter className="border-t bg-muted/10 p-6 flex justify-end gap-3">
              <Button variant="ghost" onClick={handleCancel} className="gap-2"><X className="w-4 h-4" />Cancel</Button>
              <Button onClick={handleSave} className="gap-2 bg-accent hover:bg-accent/90"><Check className="w-4 h-4" />Save Changes</Button>
            </CardFooter>
          )}
        </Card>

        {/* Reviews Section */}
        {profile?.accountType === 'Worker' && (
          <Card className="shadow-lg border-none">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                Reviews & Feedback
              </CardTitle>
              <CardDescription>What customers are saying about this worker.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isReviewsLoading ? (
                <div className="p-6 space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
              ) : reviews && reviews.length > 0 ? (
                <div className="divide-y">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-6 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm">{review.reviewerName}</p>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={`w-3 h-3 ${review.rating >= s ? 'fill-amber-500 text-amber-500' : 'text-muted'}`} />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>
                      {review.comment && <p className="text-sm text-foreground/80 italic">"{review.comment}"</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground italic">No reviews yet.</div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
