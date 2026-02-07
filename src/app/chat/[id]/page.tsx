
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, query, orderBy, limit } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Send, Phone, CreditCard, Loader2 } from 'lucide-react';
import Link from 'next/link';

/**
 * Functional Chat Screen.
 * Now supports real-time messaging between job creator and selected worker.
 * The 'id' in params is the jobId, which also serves as the chatRoomId.
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

  // Job Data (to get participant names)
  const jobRef = useMemoFirebase(() => {
    if (!db || !jobId) return null;
    return doc(db, 'jobs', jobId);
  }, [db, jobId]);
  const { data: job } = useDoc(jobRef);

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
    if (!messageText.trim() || !user || !db || !jobId) return;

    const messagesRef = collection(db, 'chatRooms', jobId, 'messages');
    addDocumentNonBlocking(messagesRef, {
      senderId: user.uid,
      text: messageText.trim(),
      createdAt: new Date().toISOString(),
    });

    setMessageText('');
  };

  if (isLoadingRoom || isLoadingMessages) {
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
      <header className="flex items-center justify-between px-4 py-3 border-b bg-white sticky top-0 z-10">
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
          <Button asChild variant="outline" size="sm" className="gap-2 border-primary text-primary hover:bg-primary/5">
            <Link href={`/payments/${jobId}`}>
              <CreditCard className="w-4 h-4" />
              Pay
            </Link>
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-4 max-w-2xl mx-auto">
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
          <Input 
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your message..." 
            className="flex-1 bg-muted/30 border-none focus-visible:ring-primary"
          />
          <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={!messageText.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </footer>
    </div>
  );
}
