
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, orderBy, limit, where } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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
  Lock, 
  Info, 
  ShieldAlert, 
  Banknote, 
  Check, 
  X, 
  MessageCircle,
  Clock,
  Phone,
  MapPin,
  Eye,
  EyeOff
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

/**
 * Functional Chat Screen with Price Proposals and Post-Payment Contact Unlocking.
 */
export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [messageText, setMessageText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Proposal State
  const [proposalAmount, setProposalAmount] = useState('');
  const [proposalDesc, setProposalDesc] = useState('');
  const [isProposalDialogOpen, setIsProposalDialogOpen] = useState(false);

  // Chat Room Metadata
  const chatRoomRef = useMemoFirebase(() => {
    if (!db || !jobId) return null;
    return doc(db, 'chatRooms', jobId);
  }, [db, jobId]);
  const { data: chatRoom, isLoading: isLoadingRoom } = useDoc(chatRoomRef);

  // Job Data
  const jobRef = useMemoFirebase(() => {
    if (!db || !jobId) return null;
    return doc(db, 'jobs', jobId);
  }, [db, jobId]);
  const { data: job } = useDoc(jobRef);

  // Other User's Profile (for phone number)
  const otherUserId = job && user ? (user.uid === job.customerId ? job.selectedApplicantId : job.customerId) : null;
  const otherUserRef = useMemoFirebase(() => {
    if (!db || !otherUserId) return null;
    return doc(db, 'users', otherUserId);
  }, [db, otherUserId]);
  const { data: otherUserProfile } = useDoc(otherUserRef);

  // Check for successful payment
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

  const isPaid = (payments && payments.length > 0);

  // Messages
  const messagesQuery = useMemoFirebase(() => {
    if (!db || !jobId) return null;
    return query(
      collection(db, 'chatRooms', jobId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
  }, [db, jobId]);
  const { data: messages, isLoading: isLoadingMessages } = useCollection(messagesQuery);

  // Price Proposals
  const proposalsQuery = useMemoFirebase(() => {
    if (!db || !jobId) return null;
    return query(
      collection(db, 'jobs', jobId, 'proposals'),
      orderBy('createdAt', 'desc')
    );
  }, [db, jobId]);
  const { data: proposals } = useCollection(proposalsQuery);

  const activeProposal = proposals?.find(p => p.status === 'Pending' || p.status === 'Countered');

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, proposals]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const text = messageText.trim();
    if (!text || !user || !db || !jobId) return;

    if (!isPaid) {
      const phoneRegex = /\d{7,15}/;
      if (phoneRegex.test(text.replace(/\s/g, ''))) {
        toast({
          variant: 'destructive',
          title: '⚠️ Safety Notice',
          description: 'Sharing contact details is not allowed before payment. Please use in-app chat and price proposal.',
        });
        return;
      }
    }

    if (!isPaid) {
      toast({
        title: 'Payment Required',
        description: 'You must complete the payment for this job before you can send messages.',
      });
      return;
    }

    const messagesRef = collection(db, 'chatRooms', jobId, 'messages');
    addDocumentNonBlocking(messagesRef, {
      senderId: user.uid,
      text: text,
      createdAt: new Date().toISOString(),
    });

    setMessageText('');
  };

  const handleProposePrice = () => {
    if (!user || !db || !jobId || !job || !proposalAmount) return;
    
    const recipientId = user.uid === job.customerId ? job.selectedApplicantId : job.customerId;
    const proposalsRef = collection(db, 'jobs', jobId, 'proposals');
    
    addDocumentNonBlocking(proposalsRef, {
      jobId,
      proposerId: user.uid,
      recipientId,
      amount: parseFloat(proposalAmount),
      description: proposalDesc,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    });

    setProposalAmount('');
    setProposalDesc('');
    setIsProposalDialogOpen(false);
    toast({ title: "Proposal Sent", description: "Your price proposal has been sent to the other party." });
  };

  const handleRespondToProposal = (proposalId: string, status: 'Accepted' | 'Rejected' | 'Countered', counterAmount?: number) => {
    if (!db || !jobId) return;
    const proposalRef = doc(db, 'jobs', jobId, 'proposals', proposalId);
    
    const updateData: any = {
      status,
      respondedAt: new Date().toISOString(),
    };

    updateDocumentNonBlocking(proposalRef, updateData);

    if (status === 'Countered' && counterAmount) {
       const recipientId = user?.uid === job?.customerId ? job?.selectedApplicantId : job?.customerId;
       const proposalsRef = collection(db, 'jobs', jobId, 'proposals');
       addDocumentNonBlocking(proposalsRef, {
         jobId,
         proposerId: user?.uid,
         recipientId,
         amount: counterAmount,
         status: 'Pending',
         createdAt: new Date().toISOString(),
       });
    }

    toast({ 
      title: `Proposal ${status}`, 
      description: status === 'Countered' ? "New counter-offer sent." : `You have ${status.toLowerCase()} the proposal.` 
    });
  };

  const handleCall = () => {
    if (otherUserProfile?.phoneNumber) {
      window.location.href = `tel:${otherUserProfile.phoneNumber}`;
    } else {
      toast({ title: "No Phone Number", description: "This user hasn't added a phone number to their profile." });
    }
  };

  const handleShareLocation = () => {
    toast({ title: "Location Sharing", description: "Sharing your current location with the other party..." });
  };

  if (isLoadingRoom || isLoadingMessages || isLoadingPayment) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!chatRoom || !user) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-4 text-center">
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-4">You must be a participant in this job's chat to view this page.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const otherParticipantName = user.uid === job?.customerId 
    ? job?.selectedApplicantName 
    : 'Job Owner';

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex flex-col border-b bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar className="w-10 h-10 border">
              <AvatarImage src={otherUserProfile?.photoUrl} alt={otherParticipantName} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {otherParticipantName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-sm font-bold leading-none">{otherParticipantName}</h2>
              {isPaid && otherUserProfile?.phoneNumber && (
                <p className="text-[10px] text-primary font-bold mt-1 flex items-center gap-1">
                  <Phone className="w-2.5 h-2.5" />
                  {otherUserProfile.phoneNumber}
                </p>
              )}
              {!isPaid && (
                <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  Contact Hidden
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isPaid && (
              <Dialog open={isProposalDialogOpen} onOpenChange={setIsProposalDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 border-primary text-primary h-8">
                    <Banknote className="w-4 h-4" />
                    Propose Price
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Propose a Price</DialogTitle>
                    <DialogDescription>
                      Suggest a budget for this job. You can negotiate until both parties agree.
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
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="desc">Notes (Optional)</Label>
                      <Textarea 
                        id="desc" 
                        placeholder="Explain your pricing..." 
                        value={proposalDesc}
                        onChange={(e) => setProposalDesc(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleProposePrice} disabled={!proposalAmount}>Send Proposal</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {!isPaid && user.uid === job?.customerId && (
              <Button asChild variant="outline" size="sm" className="gap-2 border-primary text-primary hover:bg-primary/5 h-8">
                <Link href={`/payments/${jobId}`}>
                  <CreditCard className="w-4 h-4" />
                  Pay
                </Link>
              </Button>
            )}
          </div>
        </div>
        
        {/* Post-Payment Action Bar */}
        <div className="px-4 py-2 border-t flex items-center gap-4 bg-muted/20">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex-1 h-8 text-[11px] gap-2 ${isPaid ? 'text-primary' : 'text-muted-foreground cursor-not-allowed opacity-50'}`}
            disabled={!isPaid}
            onClick={handleCall}
          >
            <Phone className="w-3.5 h-3.5" />
            Call
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex-1 h-8 text-[11px] gap-2 ${isPaid ? 'text-primary' : 'text-muted-foreground cursor-not-allowed opacity-50'}`}
            disabled={!isPaid}
            onClick={handleShareLocation}
          >
            <MapPin className="w-3.5 h-3.5" />
            Location
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-4 max-w-2xl mx-auto pb-8">
          {/* Active Proposal Card */}
          {activeProposal && (
            <Card className="border-primary/20 bg-primary/5 mb-4 overflow-hidden">
               <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b bg-primary/10">
                 <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm font-bold">Price Proposal</CardTitle>
                 </div>
                 <Badge variant="secondary" className="text-[10px]">{activeProposal.status}</Badge>
               </CardHeader>
               <CardContent className="p-4 space-y-2">
                  <div className="text-2xl font-bold text-primary">₦{activeProposal.amount.toLocaleString()}</div>
                  {activeProposal.description && <p className="text-xs text-muted-foreground">{activeProposal.description}</p>}
                  <p className="text-[10px] text-muted-foreground">Proposed by {activeProposal.proposerId === user.uid ? 'you' : otherParticipantName}</p>
               </CardContent>
               {activeProposal.recipientId === user.uid && (
                 <CardFooter className="bg-white p-2 flex gap-2 border-t">
                    <Button variant="outline" size="sm" className="flex-1 text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleRespondToProposal(activeProposal.id, 'Accepted')}>
                      <Check className="w-4 h-4 mr-1" /> Accept
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => handleRespondToProposal(activeProposal.id, 'Rejected')}>
                      <X className="w-4 h-4 mr-1" /> Reject
                    </Button>
                 </CardFooter>
               )}
            </Card>
          )}

          {!isPaid && (
            <Alert className="mb-4 bg-amber-50 border-amber-200">
              <Lock className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800 text-xs font-bold">Contact & Messaging Restricted</AlertTitle>
              <AlertDescription className="text-amber-700 text-[11px]">
                {user.uid === job?.customerId 
                  ? "Agree on a price and complete payment to unlock full messaging, calling, and location sharing."
                  : "Contact info and messaging will be enabled once the customer completes the payment for this job."}
              </AlertDescription>
            </Alert>
          )}

          {messages?.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.senderId === user.uid ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                  msg.senderId === user.uid
                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                    : 'bg-muted text-foreground rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 px-1">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <footer className="p-4 border-t bg-white">
        <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <Input 
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder={isPaid ? "Type your message..." : "Payment required to chat"} 
              className="bg-muted/30 border-none focus-visible:ring-primary"
            />
            {!isPaid && <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />}
          </div>
          <Button 
            type="submit" 
            size="icon" 
            className="rounded-full shrink-0" 
            disabled={!messageText.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </footer>
    </div>
  );
}
