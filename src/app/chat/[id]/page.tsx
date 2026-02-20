'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, orderBy, limit, where } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Send, 
  CreditCard, 
  Loader2, 
  Banknote, 
  Check, 
  X, 
  MessageCircle,
  Clock,
  Phone,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Zap,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Functional Chat Screen with Price Proposals and Hiring Workflow.
 * Supports multiple parallel chats per job (chatId = jobId_workerId).
 */
export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.id as string;
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [messageText, setMessageText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Parse jobId and workerId from chatId (format: jobId_workerId)
  const [jobId, workerIdFromPath] = React.useMemo(() => {
    if (!chatId) return [null, null];
    const parts = chatId.split('_');
    return [parts[0], parts[1]];
  }, [chatId]);

  // Proposal State
  const [proposalAmount, setProposalAmount] = useState('');
  const [proposalDesc, setProposalDesc] = useState('');
  const [isProposalDialogOpen, setIsProposalDialogOpen] = useState(false);

  // Chat Room Metadata
  const chatRoomRef = useMemoFirebase(() => {
    if (!db || !chatId) return null;
    return doc(db, 'chatRooms', chatId);
  }, [db, chatId]);
  const { data: chatRoom, isLoading: isLoadingRoom } = useDoc(chatRoomRef);

  // Job Data
  const jobRef = useMemoFirebase(() => {
    if (!db || !jobId) return null;
    return doc(db, 'jobs', jobId);
  }, [db, jobId]);
  const { data: job } = useDoc(jobRef);

  // Determine who the "other user" is
  const otherUserId = React.useMemo(() => {
    if (!job || !user || !workerIdFromPath) return null;
    return user.uid === job.customerId ? workerIdFromPath : job.customerId;
  }, [job, user, workerIdFromPath]);

  // Other User's Profile
  const otherUserRef = useMemoFirebase(() => {
    if (!db || !otherUserId) return null;
    return doc(db, 'users', otherUserId);
  }, [db, otherUserId]);
  const { data: otherUserProfile } = useDoc(otherUserRef);

  // Check for successful payment record in Firestore
  const paymentsQuery = useMemoFirebase(() => {
    if (!db || !jobId) return null;
    return query(
      collection(db, 'payments'),
      where('jobId', '==', jobId),
      where('status', '==', 'Paid'),
      limit(1)
    );
  }, [db, jobId]);
  const { data: payments, isLoading: isLoadingPayment } = useCollection(paymentsQuery);

  const isPaid = !!(payments && payments.length > 0);

  // Messages
  const messagesQuery = useMemoFirebase(() => {
    if (!db || !chatId) return null;
    return query(
      collection(db, 'chatRooms', chatId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
  }, [db, chatId]);
  const { data: messages, isLoading: isLoadingMessages } = useCollection(messagesQuery);

  // Price Proposals - fetching recent ones for this specific pairing
  const proposalsQuery = useMemoFirebase(() => {
    if (!db || !jobId || !user || !otherUserId) return null;
    return query(
      collection(db, 'jobs', jobId, 'proposals'),
      where('proposerId', 'in', [user.uid, otherUserId]),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
  }, [db, jobId, user, otherUserId]);
  const { data: proposals } = useCollection(proposalsQuery);

  // Active or most recent accepted proposal for this specific negotiation
  const activeProposal = proposals?.find(p => p.status === 'Accepted' && (p.proposerId === workerIdFromPath || p.recipientId === workerIdFromPath)) 
                        || proposals?.find(p => (p.status === 'Pending' || p.status === 'Countered') && (p.proposerId === workerIdFromPath || p.recipientId === workerIdFromPath));

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, proposals]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = messageText.trim();
    if (!text || !user || !db || !chatId) return;

    // Safety filter for contact details before payment
    if (!isPaid) {
      const contactRegex = /(\d{7,15}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
      if (contactRegex.test(text.replace(/\s/g, ''))) {
        toast({
          variant: 'destructive',
          title: '⚠️ Safety Notice',
          description: 'Sharing contact details is restricted before payment for security.',
        });
        return;
      }
    }

    const messagesRef = collection(db, 'chatRooms', chatId, 'messages');
    addDocumentNonBlocking(messagesRef, {
      senderId: user.uid,
      text: text,
      createdAt: new Date().toISOString(),
    });

    setMessageText('');
  };

  const handleProposePrice = () => {
    if (!user || !db || !jobId || !job || !proposalAmount || !otherUserId) return;
    
    const proposalsRef = collection(db, 'jobs', jobId, 'proposals');
    
    addDocumentNonBlocking(proposalsRef, {
      jobId,
      proposerId: user.uid,
      recipientId: otherUserId,
      amount: parseFloat(proposalAmount),
      description: proposalDesc,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    });

    setProposalAmount('');
    setProposalDesc('');
    setIsProposalDialogOpen(false);
    toast({ title: "Proposal Sent", description: "The price offer is now live." });
  };

  const handleRespondToProposal = (proposalId: string, status: 'Accepted' | 'Rejected') => {
    if (!db || !jobId) return;
    const proposalRef = doc(db, 'jobs', jobId, 'proposals', proposalId);
    
    updateDocumentNonBlocking(proposalRef, {
      status,
      respondedAt: new Date().toISOString(),
    });

    toast({ 
      title: `Price ${status}`, 
      description: status === 'Accepted' ? 'Deal agreed! You can now hire this worker.' : 'Price rejected.' 
    });
  };

  const handleHireWorker = () => {
    if (!db || !jobRef || !job || !otherUserId || !otherUserProfile) return;
    
    updateDocumentNonBlocking(jobRef as any, {
      selectedApplicantId: otherUserId,
      selectedApplicantName: otherUserProfile.name,
      status: 'In Progress',
    });

    toast({ title: "Worker Hired!", description: `${otherUserProfile.name} is now officially assigned.` });
  };

  const handleCall = () => {
    if (isPaid && otherUserProfile?.phoneNumber) {
      window.location.href = `tel:${otherUserProfile.phoneNumber}`;
    } else if (!isPaid) {
      toast({ title: "Payment Required", description: "Secure the funds first to unlock voice calls." });
    } else {
      toast({ title: "No Phone Number", description: "User hasn't provided a contact number." });
    }
  };

  if (isLoadingRoom || isLoadingMessages || isLoadingPayment) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If chat room doesn't exist yet, we can create it if the user is authorized
  if (!chatRoom) {
    const isAuthorized = user && job && (user.uid === job.customerId || user.uid === workerIdFromPath);
    if (isAuthorized) {
       setDocumentNonBlocking(chatRoomRef as any, {
         jobId,
         workerId: workerIdFromPath,
         participants: [job.customerId, workerIdFromPath]
       }, { merge: true });
    } else {
      return (
        <div className="flex flex-col h-screen items-center justify-center p-4 text-center space-y-4">
          <h2 className="text-xl font-bold">Privacy Restriction</h2>
          <p className="text-muted-foreground">This secure channel is only for assigned participants.</p>
          <Button onClick={() => router.push('/')}>Return Home</Button>
        </div>
      );
    }
  }

  const otherParticipantName = otherUserProfile?.name || 'Partner';
  const isCustomer = user?.uid === job?.customerId;
  const isHired = job?.selectedApplicantId === workerIdFromPath;

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="flex flex-col border-b bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar className="w-10 h-10 border shadow-sm">
              <AvatarImage src={otherUserProfile?.photoUrl} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {otherParticipantName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-sm font-bold leading-none">{otherParticipantName}</h2>
              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                {isPaid ? (
                  <span className="text-green-600 font-black flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    FUNDED
                  </span>
                ) : isHired ? (
                  <span className="flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    HIRED
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    <Clock className="w-2.5 h-2.5" />
                    NEGOTIATING
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isPaid && !isHired && (
              <Dialog open={isProposalDialogOpen} onOpenChange={setIsProposalDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 font-black gap-2 text-primary border-primary/20 bg-primary/5 hover:bg-primary/10">
                    <Banknote className="w-4 h-4" />
                    OFFER PRICE
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Make a Final Offer</DialogTitle>
                    <DialogDescription>
                      Propose the final amount for this service. This will be the amount held in escrow.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount (₦)</Label>
                      <Input 
                        id="amount" 
                        type="number" 
                        placeholder="e.g. 15000" 
                        value={proposalAmount}
                        onChange={(e) => setProposalAmount(e.target.value)}
                        className="h-12 text-xl font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="desc">Scope / Notes</Label>
                      <Textarea 
                        id="desc" 
                        placeholder="Explain exactly what is included in this price..." 
                        value={proposalDesc}
                        onChange={(e) => setProposalDesc(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleProposePrice} disabled={!proposalAmount} className="w-full font-black h-12 text-lg">Send Proposal</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            
            {isCustomer && !isHired && (
              <Button size="sm" onClick={handleHireWorker} className="h-8 font-black gap-2 bg-green-600 hover:bg-green-700 shadow-md shadow-green-100">
                <UserCheck className="w-4 h-4" />
                HIRE NOW
              </Button>
            )}
          </div>
        </div>
        
        {/* Contact Strip */}
        <div className="px-4 py-1.5 border-t flex items-center gap-4 bg-slate-50/50">
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("flex-1 h-8 text-[11px] font-bold gap-2", isPaid ? "text-primary" : "text-muted-foreground opacity-50")}
            onClick={handleCall}
          >
            <Phone className="w-3 h-3" />
            {isPaid ? 'Direct Call' : 'Call (LOCKED)'}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("flex-1 h-8 text-[11px] font-bold gap-2", isPaid ? "text-primary" : "text-muted-foreground opacity-50")}
            disabled={!isPaid}
            onClick={() => toast({ title: "Tracking Active", description: "Worker's live location shared." })}
          >
            <MapPin className="w-3 h-3" />
            {isPaid ? 'Live Location' : 'Location (LOCKED)'}
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-4 max-w-2xl mx-auto pb-10">
          {/* Active / Accepted Proposal Card */}
          {activeProposal && (
            <Card className={cn(
              "border-2 shadow-xl mb-6 overflow-hidden transition-all",
              activeProposal.status === 'Accepted' 
                ? "border-green-600 bg-green-50/50 ring-4 ring-green-500/5" 
                : "border-primary/30 bg-primary/5"
            )}>
               <CardHeader className={cn(
                 "py-3 px-5 flex flex-row items-center justify-between border-b",
                 activeProposal.status === 'Accepted' ? "bg-green-100" : "bg-primary/10"
               )}>
                 <div className="flex items-center gap-2">
                    {activeProposal.status === 'Accepted' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-700" />
                    ) : (
                      <Banknote className="w-5 h-5 text-primary" />
                    )}
                    <CardTitle className={cn(
                      "text-xs font-black uppercase tracking-[0.1em]",
                      activeProposal.status === 'Accepted' ? "text-green-800" : "text-primary"
                    )}>
                      {activeProposal.status === 'Accepted' ? 'Agreed Price' : 'Current Proposal'}
                    </CardTitle>
                 </div>
                 <Badge 
                    variant={activeProposal.status === 'Accepted' ? 'default' : 'outline'}
                    className={cn(
                      "text-[9px] font-black uppercase px-3",
                      activeProposal.status === 'Accepted' ? "bg-green-600 border-none" : "bg-white border-primary/20 text-primary"
                    )}
                  >
                    {activeProposal.status}
                  </Badge>
               </CardHeader>
               <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-1.5 flex-1">
                    <div className={cn(
                      "text-4xl font-black tracking-tighter",
                      activeProposal.status === 'Accepted' ? "text-green-800" : "text-primary"
                    )}>
                      ₦{activeProposal.amount.toLocaleString()}
                    </div>
                    {activeProposal.description && (
                      <p className="text-xs text-slate-600 italic font-medium">"{activeProposal.description}"</p>
                    )}
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tight mt-2">
                      Proposed by {activeProposal.proposerId === user?.uid ? 'You' : otherParticipantName}
                    </p>
                  </div>
                  
                  {activeProposal.status === 'Accepted' && !isPaid && isCustomer && isHired && (
                    <Button asChild size="lg" className="w-full md:w-auto bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 font-black h-14 px-10 rounded-2xl animate-bounce">
                      <Link href={`/payments/${jobId}`} className="gap-2">
                        <ShieldCheck className="w-5 h-5" />
                        SECURE PAY NOW
                      </Link>
                    </Button>
                  )}

                  {activeProposal.status === 'Accepted' && !isHired && isCustomer && (
                    <Button onClick={handleHireWorker} size="lg" className="w-full md:w-auto bg-green-600 hover:bg-green-700 font-black h-14 px-10 rounded-2xl">
                       OFFICIALLY HIRE
                    </Button>
                  )}
               </CardContent>
               {activeProposal.recipientId === user?.uid && activeProposal.status === 'Pending' && (
                 <CardFooter className="bg-white p-3 flex gap-3 border-t">
                    <Button variant="outline" size="lg" className="flex-1 h-12 font-black text-green-700 border-green-200 bg-green-50 hover:bg-green-100" onClick={() => handleRespondToProposal(activeProposal.id, 'Accepted')}>
                      <Check className="w-4 h-4 mr-2" /> ACCEPT
                    </Button>
                    <Button variant="outline" size="lg" className="flex-1 h-12 font-black text-destructive border-destructive/10 hover:bg-destructive/5" onClick={() => handleRespondToProposal(activeProposal.id, 'Rejected')}>
                      <X className="w-4 h-4 mr-2" /> REJECT
                    </Button>
                 </CardFooter>
               )}
            </Card>
          )}

          {activeProposal?.status === 'Accepted' && isHired && !isPaid && (
            <Alert className="mb-6 bg-blue-50 border-blue-200 shadow-md">
              <Zap className="h-5 w-5 text-blue-600" />
              <AlertTitle className="text-blue-900 text-sm font-black uppercase tracking-tight">Hiring Complete - Funding Required</AlertTitle>
              <AlertDescription className="text-blue-800 text-xs font-medium leading-tight mt-1">
                {isCustomer 
                  ? "Final step: Deposit the funds into escrow. This unlocks contact details and confirms the task for the provider."
                  : "Waiting for the customer to deposit funds. Your dashboard will update and contact details will unlock automatically."}
              </AlertDescription>
            </Alert>
          )}

          {!isHired && isCustomer && (
             <Alert className="mb-6 bg-amber-50 border-amber-200 shadow-sm border-l-4 border-l-amber-500">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <AlertTitle className="text-amber-900 text-sm font-black uppercase tracking-tight">Agreement Phase</AlertTitle>
                <AlertDescription className="text-amber-800 text-xs font-medium leading-tight mt-1">
                  Once you agree on terms, click <strong>"OFFICIALLY HIRE"</strong> to assign this worker. You can negotiate with multiple applicants simultaneously.
                </AlertDescription>
             </Alert>
          )}

          <div className="space-y-4">
            {messages?.length === 0 && (
              <div className="text-center py-20 opacity-20">
                <MessageCircle className="w-16 h-16 mx-auto mb-4" />
                <p className="text-lg font-black tracking-widest uppercase">Start the Negotiation</p>
              </div>
            )}
            
            {messages?.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.senderId === user?.uid ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={cn(
                    "max-w-[85%] px-5 py-3 rounded-3xl text-[14px] shadow-sm leading-relaxed font-medium",
                    msg.senderId === user?.uid
                      ? 'bg-primary text-primary-foreground rounded-tr-none'
                      : 'bg-white border text-slate-800 rounded-tl-none border-slate-200'
                  )}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] text-slate-400 mt-2 px-2 font-bold uppercase tracking-tight">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <footer className="p-4 border-t bg-white shadow-lg">
        <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto flex items-center gap-3">
          <Input 
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Discuss specific terms..." 
            className="flex-1 bg-slate-50 border-slate-200 h-14 rounded-2xl px-6 focus-visible:ring-primary font-medium"
          />
          <Button 
            type="submit" 
            size="icon" 
            className="rounded-2xl h-14 w-14 shadow-xl shadow-primary/20" 
            disabled={!messageText.trim()}
          >
            <Send className="w-6 h-6" />
          </Button>
        </form>
      </footer>
    </div>
  );
}
