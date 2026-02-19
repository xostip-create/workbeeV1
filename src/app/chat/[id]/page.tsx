
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
  EyeOff,
  AlertTriangle
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
 * Allows negotiation (chatting) before payment, but filters contact info.
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

  // Determine who the "other user" is
  const otherUserId = React.useMemo(() => {
    if (!job || !user) return null;
    return user.uid === job.customerId ? job.selectedApplicantId : job.customerId;
  }, [job, user]);

  // Other User's Profile
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

    // Safety filter for contact details before payment
    if (!isPaid) {
      const contactRegex = /(\d{7,15}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
      if (contactRegex.test(text.replace(/\s/g, ''))) {
        toast({
          variant: 'destructive',
          title: '⚠️ Safety Notice',
          description: 'Sharing contact details (phone/email) is restricted before payment for platform safety.',
        });
        return;
      }
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
    toast({ title: "Proposal Sent", description: "Your price proposal has been sent." });
  };

  const handleRespondToProposal = (proposalId: string, status: 'Accepted' | 'Rejected') => {
    if (!db || !jobId) return;
    const proposalRef = doc(db, 'jobs', jobId, 'proposals', proposalId);
    
    updateDocumentNonBlocking(proposalRef, {
      status,
      respondedAt: new Date().toISOString(),
    });

    toast({ 
      title: `Proposal ${status}`, 
      description: `You have ${status.toLowerCase()} the proposal.` 
    });
  };

  const handleCall = () => {
    if (isPaid && otherUserProfile?.phoneNumber) {
      window.location.href = `tel:${otherUserProfile.phoneNumber}`;
    } else if (!isPaid) {
      toast({ title: "Payment Required", description: "Phone calls are unlocked after payment is secured." });
    } else {
      toast({ title: "No Phone Number", description: "This user hasn't added a phone number to their profile." });
    }
  };

  if (isLoadingRoom || isLoadingMessages || isLoadingPayment) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Access check: Only participants can view
  if (!chatRoom || !user || !chatRoom.participants?.includes(user.uid)) {
    return (
      <div className="flex flex-col h-screen items-center justify-center p-4 text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground max-w-xs">You are not authorized to view this chat. Only the customer and selected worker can participate.</p>
        <Button onClick={() => router.push('/')}>Return Home</Button>
      </div>
    );
  }

  const otherParticipantName = otherUserProfile?.name || 'User';

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="flex flex-col border-b bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar className="w-10 h-10 border shadow-sm">
              <AvatarImage src={otherUserProfile?.photoUrl} alt={otherParticipantName} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {otherParticipantName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-sm font-bold leading-none">{otherParticipantName}</h2>
              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                {isPaid ? (
                  <span className="text-green-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Verified Partner
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    Negotiation Phase
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isPaid && (
              <Dialog open={isProposalDialogOpen} onOpenChange={setIsProposalDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 border-primary text-primary h-8 font-bold">
                    <Banknote className="w-4 h-4" />
                    Propose Price
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Propose a Price</DialogTitle>
                    <DialogDescription>
                      Suggest a budget for this job. Negotiation is key to a fair deal.
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
                        placeholder="Explain your pricing or scope..." 
                        value={proposalDesc}
                        onChange={(e) => setProposalDesc(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleProposePrice} disabled={!proposalAmount} className="w-full">Send Proposal</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            {!isPaid && user.uid === job?.customerId && (
              <Button asChild size="sm" className="gap-2 bg-accent hover:bg-accent/90 h-8 font-bold shadow-sm">
                <Link href={`/payments/${jobId}`}>
                  <CreditCard className="w-4 h-4" />
                  Pay Now
                </Link>
              </Button>
            )}
          </div>
        </div>
        
        {/* Post-Payment Action Bar */}
        <div className="px-4 py-2 border-t flex items-center gap-4 bg-slate-50/80">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex-1 h-8 text-[11px] font-bold gap-2 ${isPaid ? 'text-primary' : 'text-muted-foreground opacity-60'}`}
            onClick={handleCall}
          >
            <Phone className="w-3.5 h-3.5" />
            {isPaid ? 'Call Now' : 'Call (Locked)'}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`flex-1 h-8 text-[11px] font-bold gap-2 ${isPaid ? 'text-primary' : 'text-muted-foreground opacity-60'}`}
            disabled={!isPaid}
            onClick={() => toast({ title: "Location Shared", description: "Current location sent to partner." })}
          >
            <MapPin className="w-3.5 h-3.5" />
            {isPaid ? 'Share Location' : 'Location (Locked)'}
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-4 max-w-2xl mx-auto pb-8">
          {/* Active Proposal Card */}
          {activeProposal && (
            <Card className="border-primary/20 bg-primary/5 shadow-sm mb-4 overflow-hidden border-2">
               <CardHeader className="py-2.5 px-4 flex flex-row items-center justify-between border-b bg-primary/10">
                 <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-primary" />
                    <CardTitle className="text-xs font-black uppercase tracking-wider">Price Negotiation</CardTitle>
                 </div>
                 <Badge variant="outline" className="text-[9px] bg-white border-primary/20">{activeProposal.status}</Badge>
               </CardHeader>
               <CardContent className="p-4 space-y-2">
                  <div className="text-2xl font-black text-primary">₦{activeProposal.amount.toLocaleString()}</div>
                  {activeProposal.description && <p className="text-xs text-muted-foreground leading-relaxed italic">"{activeProposal.description}"</p>}
                  <p className="text-[10px] text-muted-foreground font-medium">Proposed by {activeProposal.proposerId === user.uid ? 'you' : otherParticipantName}</p>
               </CardContent>
               {activeProposal.recipientId === user.uid && activeProposal.status === 'Pending' && (
                 <CardFooter className="bg-white p-2 flex gap-2 border-t">
                    <Button variant="outline" size="sm" className="flex-1 h-9 text-xs font-bold text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleRespondToProposal(activeProposal.id, 'Accepted')}>
                      <Check className="w-3.5 h-3.5 mr-1.5" /> Accept
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 h-9 text-xs font-bold text-destructive border-destructive/20 hover:bg-destructive/5" onClick={() => handleRespondToProposal(activeProposal.id, 'Rejected')}>
                      <X className="w-3.5 h-3.5 mr-1.5" /> Reject
                    </Button>
                 </CardFooter>
               )}
            </Card>
          )}

          {!isPaid && (
            <Alert className="mb-4 bg-amber-50 border-amber-200 shadow-sm">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800 text-xs font-black uppercase tracking-tight">Escrow Required</AlertTitle>
              <AlertDescription className="text-amber-700 text-[11px] leading-tight">
                {user.uid === job?.customerId 
                  ? "Negotiate the price using the proposal tool. Once agreed, complete payment to unlock voice calls and location sharing."
                  : "Chat is open for negotiation. Your contact details will be automatically shared once the customer funds the escrow."}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {messages?.length === 0 && (
              <div className="text-center py-10 opacity-40">
                <MessageCircle className="w-10 h-10 mx-auto mb-2" />
                <p className="text-xs font-medium">No messages yet. Start the conversation!</p>
              </div>
            )}
            
            {messages?.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.senderId === user.uid ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                    msg.senderId === user.uid
                      ? 'bg-primary text-primary-foreground rounded-tr-none'
                      : 'bg-white border text-foreground rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] text-muted-foreground mt-1.5 px-1 font-medium">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <footer className="p-4 border-t bg-white">
        <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto flex items-center gap-2">
          <Input 
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..." 
            className="flex-1 bg-slate-50 border-slate-200 focus-visible:ring-primary h-11"
          />
          <Button 
            type="submit" 
            size="icon" 
            className="rounded-full shrink-0 h-11 w-11 shadow-lg shadow-primary/20" 
            disabled={!messageText.trim()}
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </footer>
    </div>
  );
}
