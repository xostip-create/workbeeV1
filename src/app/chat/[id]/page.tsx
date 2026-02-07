'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, orderBy, limit, where } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Send, CreditCard, Loader2, Lock, Info } from 'lucide-react';
import Link from 'next/link';

/**
 * Functional Chat Screen.
 * Supports real-time messaging between job creator and selected worker.
 * Messaging is restricted until payment is confirmed for the job.
 */
export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const { user } = useUser();
  const db = useFirestore();
  const [messageText, setMessageText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Chat Room Metadata
  const chatRoomRef = useMemoFirebase(() => {
    if (!db || !jobId) return null;
    return doc(db, 'chatRooms', jobId);
  }, [db, jobId]);
  const { data: chatRoom, isLoading: isLoadingRoom } = useDoc(chatRoomRef);

  // Job Data (to get participant names and customer info)
  const jobRef = useMemoFirebase(() => {
    if (!db || !jobId) return null;
    return doc(db, 'jobs', jobId);
  }, [db, jobId]);
  const { data: job } = useDoc(jobRef);

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

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !user || !db || !jobId || !isPaid) return;

    const messagesRef = collection(db, 'chatRooms', jobId, 'messages');
    addDocumentNonBlocking(messagesRef, {
      senderId: user.uid,
      text: messageText.trim(),
      createdAt: new Date().toISOString(),
    });

    setMessageText('');
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
      <header className="flex items-center justify-between px-4 py-3 border-b bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Avatar className="w-10 h-10 border">
            <AvatarFallback className="bg-primary/10 text-primary">
              {otherParticipantName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-sm font-bold leading-none">{otherParticipantName}</h2>
            <p className="text-[10px] text-muted-foreground mt-1">Project Chat</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isPaid && user.uid === job?.customerId && (
            <Button asChild variant="outline" size="sm" className="gap-2 border-primary text-primary hover:bg-primary/5">
              <Link href={`/payments/${jobId}`}>
                <CreditCard className="w-4 h-4" />
                Pay Now
              </Link>
            </Button>
          )}
        </div>
      </header>

      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-4 max-w-2xl mx-auto">
          {!isPaid && (
            <Alert className="mb-4 bg-amber-50 border-amber-200">
              <Lock className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800 text-xs font-bold">Messaging Locked</AlertTitle>
              <AlertDescription className="text-amber-700 text-[11px]">
                {user.uid === job?.customerId 
                  ? "Please complete the payment for this job to start messaging the worker."
                  : "Communication will be enabled once the customer completes the payment for this job."}
              </AlertDescription>
            </Alert>
          )}

          {messages && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                <Info className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-sm">No messages yet. {isPaid ? "Start the conversation!" : "Messages will appear here after payment."}</p>
            </div>
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
              className={`bg-muted/30 border-none focus-visible:ring-primary ${!isPaid ? 'cursor-not-allowed opacity-50 pr-10' : ''}`}
              disabled={!isPaid}
            />
            {!isPaid && <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />}
          </div>
          <Button 
            type="submit" 
            size="icon" 
            className="rounded-full shrink-0" 
            disabled={!messageText.trim() || !isPaid}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </footer>
    </div>
  );
}
