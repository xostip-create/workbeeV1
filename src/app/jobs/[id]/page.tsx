'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Briefcase, 
  MessageSquare, 
  Clock, 
  User, 
  Edit, 
  Trash2, 
  Save, 
  X,
  UserCheck,
  Send,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/**
 * Job Details Page with Ownership Management, Applications, and Worker Selection.
 */
export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  // Job Data
  const jobDocRef = useMemoFirebase(() => {
    if (!db || !jobId) return null;
    return doc(db, 'jobs', jobId);
  }, [db, jobId]);

  const { data: job, isLoading } = useDoc(jobDocRef);

  // User Profile Data (for applicant name)
  const userDocRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, 'users', user.uid);
  }, [user, db]);
  const { data: userProfile } = useDoc(userDocRef);

  // Applications Data
  const applicationsQuery = useMemoFirebase(() => {
    if (!db || !jobId) return null;
    return query(collection(db, 'jobs', jobId, 'applications'), orderBy('appliedAt', 'desc'));
  }, [db, jobId]);

  const { data: applications, isLoading: isLoadingApps } = useCollection(applicationsQuery);

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  // Sync state with job data when loaded
  useEffect(() => {
    if (job) {
      setEditedTitle(job.title || '');
      setEditedDescription(job.description || '');
    }
  }, [job]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-32 mb-6" />
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Job not found</h2>
        <Button asChild>
          <Link href="/jobs">Back to Jobs</Link>
        </Button>
      </div>
    );
  }

  const isOwner = user && user.uid === job.customerId;
  const hasApplied = applications?.some(app => app.applicantId === user?.uid);
  const isAssigned = job.status === 'Assigned';

  const handleSave = () => {
    if (!jobDocRef) return;
    
    updateDocumentNonBlocking(jobDocRef, {
      title: editedTitle.trim(),
      description: editedDescription.trim(),
    });
    
    setIsEditing(false);
    toast({
      title: "Job Updated",
      description: "Your changes have been saved to the hive.",
    });
  };

  const handleDelete = () => {
    if (!jobDocRef) return;
    
    deleteDocumentNonBlocking(jobDocRef);
    toast({
      title: "Job Deleted",
      description: "The request has been removed from the hive.",
    });
    router.push('/jobs');
  };

  const handleApply = () => {
    if (!user || !db || !jobId || !userProfile) return;
    
    setIsApplying(true);
    const appsRef = collection(db, 'jobs', jobId, 'applications');
    
    addDocumentNonBlocking(appsRef, {
      applicantId: user.uid,
      applicantName: userProfile.name || 'Anonymous User',
      appliedAt: new Date().toISOString(),
    })
    .then(() => {
      toast({
        title: "Application Sent!",
        description: "You've successfully applied for this job.",
      });
      setIsApplying(false);
    })
    .catch(() => {
      setIsApplying(false);
    });
  };

  const handleSelectWorker = (applicantId: string, applicantName: string) => {
    if (!jobDocRef) return;

    updateDocumentNonBlocking(jobDocRef, {
      selectedApplicantId: applicantId,
      selectedApplicantName: applicantName,
      status: 'Assigned',
    });

    toast({
      title: "Worker Selected!",
      description: `${applicantName} has been assigned to this job.`,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="ghost" className="mb-6 gap-2">
        <Link href="/jobs">
          <ArrowLeft className="w-4 h-4" />
          Back to Jobs
        </Link>
      </Button>
      
      <div className="max-w-3xl mx-auto space-y-6">
        <Card className="shadow-lg border-t-4 border-t-primary overflow-hidden">
          <CardHeader className="bg-muted/30 border-b p-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant={isAssigned ? "secondary" : "outline"} className={isAssigned ? "bg-green-100 text-green-700 border-green-200" : "bg-primary/5 text-primary border-primary/20"}>
                    {isAssigned ? (
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                    ) : (
                      <Briefcase className="w-3 h-3 mr-1" />
                    )}
                    {isAssigned ? `Assigned to ${job.selectedApplicantName}` : 'Open Request'}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently'}
                  </span>
                </div>
                
                {isEditing ? (
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="title" className="text-xs uppercase tracking-wider text-muted-foreground">Job Title</Label>
                    <Input 
                      id="title"
                      value={editedTitle} 
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="text-xl font-bold h-12"
                      placeholder="e.g. Repair Kitchen Sink"
                    />
                  </div>
                ) : (
                  <CardTitle className="text-4xl font-bold font-headline leading-tight">{job.title}</CardTitle>
                )}
              </div>

              {isOwner && !isEditing && (
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="gap-2">
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this job request?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently remove your job posting from the WorkBee hive.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete Permanently
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <section className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                Description
              </h3>
              {isEditing ? (
                <div className="space-y-4">
                  <Textarea 
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="min-h-[200px] text-lg leading-relaxed"
                    placeholder="Describe the task details..."
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" onClick={() => setIsEditing(false)} className="gap-2">
                      <X className="w-4 h-4" />
                      Cancel
                    </Button>
                    <Button onClick={handleSave} className="gap-2 bg-primary">
                      <Save className="w-4 h-4" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {job.description}
                </p>
              )}
            </section>

            {!isEditing && !isAssigned && (
              <div className="pt-6 border-t flex flex-col sm:flex-row gap-4">
                {isOwner ? (
                  <Button asChild className="flex-1 gap-2 py-6 text-lg font-bold">
                    <Link href={`/chat/user-${job.customerId}`}>
                      <MessageSquare className="w-5 h-5" />
                      View Conversations
                    </Link>
                  </Button>
                ) : (
                  <Button 
                    onClick={handleApply} 
                    disabled={isApplying || hasApplied} 
                    className="flex-1 gap-2 py-6 text-lg font-bold bg-accent hover:bg-accent/90"
                  >
                    {hasApplied ? (
                      <>
                        <UserCheck className="w-5 h-5" />
                        Applied
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        {isApplying ? 'Applying...' : 'Apply for this Job'}
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {isAssigned && (
              <div className="pt-6 border-t">
                <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-green-800">Worker Selected</h4>
                    <p className="text-sm text-green-700">
                      This job has been assigned to <strong>{job.selectedApplicantName}</strong>. 
                      You can now coordinate via chat.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Applicants List for Creator */}
        {isOwner && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Applicants ({applications?.length || 0})
                </div>
                {isAssigned && (
                   <Badge variant="secondary" className="bg-green-100 text-green-700">
                     Hired: {job.selectedApplicantName}
                   </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingApps ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : applications && applications.length > 0 ? (
                <div className="divide-y">
                  {applications.map((app) => (
                    <div key={app.id} className="py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${job.selectedApplicantId === app.applicantId ? 'bg-green-500 text-white' : 'bg-primary/10 text-primary'}`}>
                          {job.selectedApplicantId === app.applicantId ? <CheckCircle2 className="w-6 h-6" /> : app.applicantName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm">{app.applicantName}</p>
                            {job.selectedApplicantId === app.applicantId && (
                              <Badge className="bg-green-500 text-white text-[10px] py-0 px-1">Selected</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Applied on {new Date(app.appliedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!isAssigned && (
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="bg-green-500 text-white hover:bg-green-600"
                            onClick={() => handleSelectWorker(app.applicantId, app.applicantName)}
                          >
                            Select Worker
                          </Button>
                        )}
                        <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                          <Link href={`/chat/${app.applicantId}`}>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Message
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground italic">
                  No applications yet.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground italic">
           <User className="w-3 h-3" />
           <span>Posted by: {isOwner ? "You" : `User ID: ${job.customerId}`}</span>
        </div>
      </div>
    </div>
  );
}