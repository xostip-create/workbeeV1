
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, orderBy, where, limit } from 'firebase/firestore';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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
  AlertCircle,
  PlayCircle,
  Star,
  Banknote
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
import { Separator } from '@/components/ui/separator';

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const jobDocRef = useMemoFirebase(() => {
    if (!db || !jobId) return null;
    return doc(db, 'jobs', jobId);
  }, [db, jobId]);

  const { data: job, isLoading } = useDoc(jobDocRef);

  const userDocRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, 'users', user.uid);
  }, [user, db]);
  const { data: userProfile } = useDoc(userDocRef);

  const applicationsQuery = useMemoFirebase(() => {
    if (!db || !jobId) return null;
    return query(collection(db, 'jobs', jobId, 'applications'), orderBy('appliedAt', 'desc'));
  }, [db, jobId]);

  const { data: applications, isLoading: isLoadingApps } = useCollection(applicationsQuery);

  // Query for the accepted proposal to calculate commission
  const acceptedProposalQuery = useMemoFirebase(() => {
    if (!db || !jobId) return null;
    return query(
      collection(db, 'jobs', jobId, 'proposals'),
      where('status', '==', 'Accepted'),
      limit(1)
    );
  }, [db, jobId]);

  const { data: acceptedProposals } = useCollection(acceptedProposalQuery);
  const acceptedProposal = acceptedProposals?.[0];

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  // Review state
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

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
  const isSelectedWorker = user && user.uid === job.selectedApplicantId;
  const hasApplied = applications?.some(app => app.applicantId === user?.uid);
  const isInProgress = job.status === 'In Progress';
  const isCompleted = job.status === 'Completed';
  const isOpen = !job.status || job.status === 'Open';

  const handleSave = () => {
    if (!jobDocRef) return;
    updateDocumentNonBlocking(jobDocRef, {
      title: editedTitle.trim(),
      description: editedDescription.trim(),
    });
    setIsEditing(false);
    toast({ title: "Job Updated", description: "Your changes have been saved." });
  };

  const handleDelete = () => {
    if (!jobDocRef) return;
    deleteDocumentNonBlocking(jobDocRef);
    toast({ title: "Job Deleted", description: "The request has been removed." });
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
    }).then(() => {
      toast({ title: "Application Sent!", description: "You've successfully applied." });
      setIsApplying(false);
    }).catch(() => setIsApplying(false));
  };

  const handleSelectWorker = (applicantId: string, applicantName: string) => {
    if (!jobDocRef || !db) return;
    updateDocumentNonBlocking(jobDocRef, {
      selectedApplicantId: applicantId,
      selectedApplicantName: applicantName,
      status: 'In Progress',
    });
    const chatRoomRef = doc(db, 'chatRooms', jobId);
    setDocumentNonBlocking(chatRoomRef, {
      jobId: jobId,
      participants: [job.customerId, applicantId]
    }, { merge: true });
    toast({ title: "Worker Selected!", description: `${applicantName} has been assigned.` });
  };

  const handleMarkAsCompleted = () => {
    if (!jobDocRef) return;
    
    // Calculate commission (10%) and payout
    let totalPrice = 0;
    let commissionAmount = 0;
    let workerPayout = 0;

    if (acceptedProposal) {
      totalPrice = acceptedProposal.amount;
      commissionAmount = totalPrice * 0.10;
      workerPayout = totalPrice - commissionAmount;
    }

    updateDocumentNonBlocking(jobDocRef, { 
      status: 'Completed',
      totalPrice,
      commissionAmount,
      workerPayout
    });
    
    toast({ title: "Job Completed", description: "Great work! This job has been marked as finished." });
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user || !job.selectedApplicantId || rating === 0) return;
    setIsSubmittingReview(true);
    const reviewsRef = collection(db, 'users', job.selectedApplicantId, 'reviews');
    addDocumentNonBlocking(reviewsRef, {
      rating,
      comment: reviewComment.trim(),
      jobId: jobId,
      reviewerId: user.uid,
      reviewerName: userProfile?.name || 'Anonymous Customer',
      createdAt: new Date().toISOString(),
    }).then(() => {
      if (jobDocRef) {
        updateDocumentNonBlocking(jobDocRef, { isReviewed: true });
      }
      toast({ title: "Review Submitted", description: "Thank you for your feedback!" });
      setIsSubmittingReview(false);
    }).catch(() => setIsSubmittingReview(false));
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
        <Card className={`shadow-lg border-t-4 overflow-hidden ${isCompleted ? 'border-t-blue-500' : isInProgress ? 'border-t-green-500' : 'border-t-primary'}`}>
          <CardHeader className="bg-muted/30 border-b p-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className={
                      isCompleted ? "bg-blue-100 text-blue-700 border-blue-200" :
                      isInProgress ? "bg-green-100 text-green-700 border-green-200" :
                      "bg-primary/5 text-primary border-primary/20"
                    }
                  >
                    {isCompleted ? <CheckCircle2 className="w-3 h-3 mr-1" /> :
                     isInProgress ? <PlayCircle className="w-3 h-3 mr-1" /> :
                     <Briefcase className="w-3 h-3 mr-1" />}
                    {job.status || 'Open'}
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
                    />
                  </div>
                ) : (
                  <CardTitle className="text-4xl font-bold font-headline leading-tight">{job.title}</CardTitle>
                )}
              </div>

              {isOwner && !isEditing && isOpen && (
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
                          This action cannot be undone.
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

            {!isEditing && isOpen && (
              <div className="pt-6 border-t flex flex-col sm:flex-row gap-4">
                {!isOwner && (
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

            {(isInProgress || isCompleted) && (isOwner || isSelectedWorker) && (
              <div className="pt-6 border-t space-y-4">
                <div className={`border rounded-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4 ${isCompleted ? 'bg-blue-50 border-blue-100' : 'bg-green-50 border-green-100'}`}>
                  <div className="flex items-start gap-3">
                    {isCompleted ? <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" /> : <PlayCircle className="w-5 h-5 text-green-600 mt-0.5" />}
                    <div>
                      <h4 className={`font-bold ${isCompleted ? 'text-blue-800' : 'text-green-800'}`}>
                        {isCompleted ? 'Job Completed' : 'Job In Progress'}
                      </h4>
                      <p className={`text-sm ${isCompleted ? 'text-blue-700' : 'text-green-700'}`}>
                        {isCompleted 
                          ? `This job was successfully completed by ${job.selectedApplicantName}.` 
                          : isOwner 
                            ? `You've hired ${job.selectedApplicantName}. Mark as completed when the work is done.` 
                            : `You're working on this job! Coordinate via chat.`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button asChild variant="outline" className={isCompleted ? "border-blue-200 text-blue-700 hover:bg-blue-100" : "border-green-200 text-green-700 hover:bg-green-100"}>
                      <Link href={`/chat/${jobId}`}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Chat
                      </Link>
                    </Button>
                    {isOwner && isInProgress && (
                      <Button onClick={handleMarkAsCompleted} className="bg-blue-600 hover:bg-blue-700">
                        Mark Completed
                      </Button>
                    )}
                  </div>
                </div>

                {isCompleted && job.totalPrice !== undefined && (
                  <Card className="border-blue-200 bg-blue-50/30 overflow-hidden shadow-none">
                    <CardHeader className="py-4 px-6 border-b bg-blue-100/50">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-800">
                        <Banknote className="w-4 h-4" />
                        Payment Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-blue-700">Agreed Total Price</span>
                        <span className="font-bold text-foreground text-lg">₦{job.totalPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-destructive">
                        <div className="flex items-center gap-1">
                          <span>App Commission (10%)</span>
                          <AlertCircle className="w-3 h-3" />
                        </div>
                        <span className="font-medium">- ₦{(job.commissionAmount || 0).toLocaleString()}</span>
                      </div>
                      <Separator className="bg-blue-200" />
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-blue-900">Worker Payout</span>
                        <span className="font-black text-green-600 text-xl">₦{(job.workerPayout || 0).toLocaleString()}</span>
                      </div>
                      <p className="text-[10px] text-blue-600 italic">
                        The commission is used to maintain the WorkBee hive and ensure platform safety.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Review Section */}
            {isCompleted && isOwner && !job.isReviewed && (
              <div className="pt-8 mt-8 border-t border-dashed">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  Rate & Review {job.selectedApplicantName}
                </h3>
                <form onSubmit={handleSubmitReview} className="space-y-4 bg-amber-50/50 p-6 rounded-xl border border-amber-100">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-amber-900">Your Rating</Label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`transition-transform hover:scale-110 ${rating >= star ? 'text-amber-500' : 'text-muted'}`}
                        >
                          <Star className={`w-8 h-8 ${rating >= star ? 'fill-current' : ''}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="review" className="text-sm font-bold text-amber-900">Your Experience</Label>
                    <Textarea
                      id="review"
                      placeholder="How was the service? (optional)"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="bg-white"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={rating === 0 || isSubmittingReview}
                    className="bg-amber-600 hover:bg-amber-700 w-full"
                  >
                    {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                  </Button>
                </form>
              </div>
            )}

            {isCompleted && job.isReviewed && (
               <div className="pt-4 text-center">
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 py-1 px-3">
                    <Star className="w-3 h-3 mr-1 fill-amber-500" />
                    Reviewed
                  </Badge>
               </div>
            )}
          </CardContent>
        </Card>

        {isOwner && isOpen && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Applicants ({applications?.length || 0})
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingApps ? (
                <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
              ) : applications && applications.length > 0 ? (
                <div className="divide-y">
                  {applications.map((app) => (
                    <div key={app.id} className="py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold bg-primary/10 text-primary">
                          {app.applicantName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{app.applicantName}</p>
                          <p className="text-xs text-muted-foreground">Applied {new Date(app.appliedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Button 
                        variant="secondary" size="sm" className="bg-green-500 text-white hover:bg-green-600"
                        onClick={() => handleSelectWorker(app.applicantId, app.applicantName)}
                      >
                        Select Worker
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground italic">No applications yet.</div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
