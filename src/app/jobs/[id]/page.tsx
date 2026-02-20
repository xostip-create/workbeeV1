'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, orderBy, where, limit } from 'firebase/firestore';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
  Banknote,
  ShieldCheck,
  Lock,
  ChevronRight
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

  const paymentsQuery = useMemoFirebase(() => {
    if (!db || !jobId) return null;
    return query(
      collection(db, 'payments'),
      where('jobId', '==', jobId),
      where('status', '==', 'Paid'),
      limit(1)
    );
  }, [db, jobId]);
  const { data: payments } = useCollection(paymentsQuery);
  const isPaid = !!(payments && payments.length > 0);

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
        <Card className="max-w-3xl mx-auto shadow-sm">
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

  const handleMarkAsCompleted = () => {
    if (!jobDocRef || !isPaid) {
      toast({
        variant: "destructive",
        title: "Payment Not Found",
        description: "The escrow must be funded via chat before you can release funds and mark the task as done."
      });
      return;
    }
    
    let totalPrice = 0;
    let commissionAmount = 0;
    let workerPayout = 0;

    if (acceptedProposal) {
      totalPrice = acceptedProposal.amount;
      commissionAmount = totalPrice * 0.10;
      workerPayout = totalPrice - commissionAmount;
    } else {
      totalPrice = job.totalPrice || 0;
      commissionAmount = totalPrice * 0.10;
      workerPayout = totalPrice - commissionAmount;
    }

    updateDocumentNonBlocking(jobDocRef, { 
      status: 'Completed',
      totalPrice,
      commissionAmount,
      workerPayout
    });
    
    toast({ title: "Job Completed", description: "The Hive appreciates your trust. Funds are being released to the worker." });
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
      toast({ title: "Review Submitted", description: "Your feedback helps the hive grow!" });
      setIsSubmittingReview(false);
    }).catch(() => setIsSubmittingReview(false));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button asChild variant="ghost" className="mb-6 gap-2">
        <Link href={user && userProfile?.accountType === 'Worker' ? '/worker-dashboard' : '/customer-dashboard'}>
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </Button>
      
      <div className="max-w-3xl mx-auto space-y-6 pb-20">
        <Card className={`shadow-xl border-t-4 overflow-hidden bg-white ${isCompleted ? 'border-t-blue-500' : isInProgress ? 'border-t-green-500' : 'border-t-primary'}`}>
          <CardHeader className="bg-slate-50 border-b p-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className={
                      isCompleted ? "bg-blue-100 text-blue-700 border-none px-3" :
                      isInProgress ? "bg-green-100 text-green-700 border-none px-3" :
                      "bg-primary/10 text-primary border-none px-3"
                    }
                  >
                    {isCompleted ? <CheckCircle2 className="w-3 h-3 mr-2" /> :
                     isInProgress ? <PlayCircle className="w-3 h-3 mr-2" /> :
                     <Briefcase className="w-3 h-3 mr-2" />}
                    {job.status || 'Open'}
                  </Badge>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Just Now'}
                  </span>
                </div>
                
                {isEditing ? (
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="title" className="text-xs uppercase tracking-widest font-black text-muted-foreground">Request Title</Label>
                    <Input 
                      id="title"
                      value={editedTitle} 
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="text-2xl font-black h-14 bg-white shadow-inner"
                    />
                  </div>
                ) : (
                  <CardTitle className="text-4xl font-black font-headline leading-none text-slate-900">{job.title}</CardTitle>
                )}
              </div>

              {isOwner && !isEditing && isOpen && (
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="h-10 px-4 font-bold border-slate-200">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-10 px-4 font-bold text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove this request?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Once deleted, this task will no longer be visible to providers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete Request
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-10">
            <section className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Detailed Description</h3>
              {isEditing ? (
                <div className="space-y-4">
                  <Textarea 
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="min-h-[250px] text-lg leading-relaxed bg-white shadow-inner"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" onClick={() => setIsEditing(false)} className="font-bold">
                      Cancel
                    </Button>
                    <Button onClick={handleSave} className="px-8 font-black bg-primary">
                      <Save className="w-4 h-4 mr-2" />
                      Save Updates
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-lg leading-relaxed text-slate-700 font-medium whitespace-pre-wrap">
                  {job.description}
                </p>
              )}
            </section>

            {!isEditing && isOpen && !isOwner && (
              <div className="pt-6 border-t">
                <Button 
                  onClick={handleApply} 
                  disabled={isApplying || hasApplied} 
                  className="w-full h-16 text-xl font-black gap-2 bg-accent hover:bg-accent/90 shadow-xl shadow-accent/20"
                >
                  {hasApplied ? (
                    <>
                      <UserCheck className="w-6 h-6" />
                      APPLICATION SUBMITTED
                    </>
                  ) : (
                    <>
                      <Send className="w-6 h-6" />
                      {isApplying ? 'SENDING...' : 'APPLY FOR THIS GIG'}
                    </>
                  )}
                </Button>
              </div>
            )}

            {(isInProgress || isCompleted) && (isOwner || isSelectedWorker) && (
              <div className="pt-6 border-t space-y-6">
                <div className={`border-2 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 ${isCompleted ? 'bg-blue-50 border-blue-100 shadow-sm' : 'bg-green-50 border-green-100 shadow-sm'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isCompleted ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-700'}`}>
                      {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <PlayCircle className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className={`text-lg font-black tracking-tight ${isCompleted ? 'text-blue-900' : 'text-green-900'}`}>
                        {isCompleted ? 'Task Successfully Closed' : 'Contract in Motion'}
                      </h4>
                      <p className={`text-sm font-medium ${isCompleted ? 'text-blue-700/80' : 'text-green-700/80'}`}>
                        {isCompleted 
                          ? `Verification complete. Funds released to ${job.selectedApplicantName}.` 
                          : isOwner 
                            ? `You've assigned ${job.selectedApplicantName}. Mark as done once satisfied.` 
                            : `You are officially on this task! Coordinate via secure chat.`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 shrink-0 w-full md:w-auto">
                    <Button asChild variant="outline" className={`flex-1 md:flex-none h-12 font-bold ${isCompleted ? "border-blue-200 text-blue-700 hover:bg-blue-100" : "border-green-200 text-green-700 hover:bg-green-100"}`}>
                      <Link href={`/chat/${jobId}_${job.selectedApplicantId}`}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Workspace Chat
                      </Link>
                    </Button>
                    {isOwner && isInProgress && (
                      <Button 
                        onClick={handleMarkAsCompleted} 
                        className={`flex-1 md:flex-none h-12 font-black transition-all ${isPaid ? "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200" : "bg-slate-200 text-slate-400 cursor-not-allowed border-none opacity-50"}`}
                        disabled={!isPaid}
                      >
                        {isPaid ? 'MARK DONE & PAY' : 'PENDING ESCROW'}
                      </Button>
                    )}
                  </div>
                </div>

                {!isPaid && isInProgress && isOwner && (
                   <div className="flex items-center gap-3 bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-sm animate-pulse">
                     <Lock className="w-5 h-5 text-amber-600 shrink-0" />
                     <p className="text-xs font-bold text-amber-800 leading-tight">
                       ESCROW GATE: You must fund the agreed price via the chat interface before the Hive allows you to release payment and close the job.
                     </p>
                   </div>
                )}

                {isCompleted && job.totalPrice !== undefined && (
                  <Card className="border-none bg-slate-900 text-white overflow-hidden shadow-2xl">
                    <CardHeader className="py-4 px-6 border-b border-white/10 bg-white/5">
                      <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 opacity-80">
                        <Banknote className="w-4 h-4" />
                        Final Payout Statement
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold opacity-60">Contract Total</span>
                        <span className="text-2xl font-black">₦{job.totalPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2 opacity-60">
                          <span>Hive Maintenance Fee (10%)</span>
                          <AlertCircle className="w-3 h-3" />
                        </div>
                        <span className="font-bold text-red-400">- ₦{(job.commissionAmount || 0).toLocaleString()}</span>
                      </div>
                      <Separator className="bg-white/10" />
                      <div className="flex justify-between items-center py-2">
                        <span className="text-lg font-black text-primary">Provider Payout</span>
                        <span className="text-3xl font-black text-green-400">₦{(job.workerPayout || 0).toLocaleString()}</span>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-[10px] italic opacity-50 text-center">
                        Secure transaction completed via Paystack Escrow.
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {isCompleted && isOwner && !job.isReviewed && (
              <div className="pt-10 mt-10 border-t border-dashed">
                <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                  <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                  Rate your Expert
                </h3>
                <form onSubmit={handleSubmitReview} className="space-y-6 bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-500">Service Rating</Label>
                    <div className="flex gap-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`transition-all hover:scale-125 ${rating >= star ? 'text-amber-500' : 'text-slate-300'}`}
                        >
                          <Star className={`w-10 h-10 ${rating >= star ? 'fill-current' : ''}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="review" className="text-xs font-black uppercase tracking-widest text-slate-500">How was {job.selectedApplicantName}?</Label>
                    <Textarea
                      id="review"
                      placeholder="Share your experience to help others in the hive..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="bg-white min-h-[120px] rounded-xl"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={rating === 0 || isSubmittingReview}
                    className="w-full h-14 font-black text-lg bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-200"
                  >
                    {isSubmittingReview ? 'SUBMITTING...' : 'POST REVIEW'}
                  </Button>
                </form>
              </div>
            )}

            {isCompleted && job.isReviewed && (
               <div className="pt-6 text-center">
                  <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 py-2 px-6 rounded-full font-bold text-sm">
                    <Star className="w-4 h-4 fill-amber-500" />
                    PROFESSIONAL REVIEW SUBMITTED
                  </div>
               </div>
            )}
          </CardContent>
        </Card>

        {isOwner && isOpen && (
          <Card className="shadow-lg border-none bg-white rounded-3xl overflow-hidden">
            <CardHeader className="p-8 border-b">
              <CardTitle className="text-2xl font-black flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="w-6 h-6 text-primary" />
                  Active Applicants
                </div>
                <Badge variant="outline" className="px-4 py-1 border-primary/20 text-primary bg-primary/5">{applications?.length || 0}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingApps ? (
                <div className="p-8 space-y-4"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
              ) : applications && applications.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {applications.map((app) => (
                    <div key={app.id} className="p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black bg-primary text-white shadow-lg shadow-primary/20 text-xl">
                          {app.applicantName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-black text-lg text-slate-900">{app.applicantName}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Applied {new Date(app.appliedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-3 w-full sm:w-auto">
                        <Button 
                          asChild
                          variant="outline" 
                          size="lg" 
                          className="flex-1 sm:flex-none h-12 font-bold px-6 border-slate-200"
                        >
                          <Link href={`/chat/${jobId}_${app.applicantId}`}>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Negotiate & Pay
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-50/50">
                  <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-lg font-black text-slate-400">NO APPLICANTS YET</p>
                  <p className="text-sm text-slate-300">Wait for workers to find your request.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
