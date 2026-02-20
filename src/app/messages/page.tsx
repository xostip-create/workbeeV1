'use client';

import React from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, limit } from 'firebase/firestore';
import { useDoc } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  ArrowLeft, 
  Loader2, 
  ChevronRight, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  Banknote
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function ChatRoomListItem({ room, currentUserId }: { room: any, currentUserId: string }) {
  const db = useFirestore();
  const otherUserId = room.participants?.find((id: string) => id !== currentUserId);
  
  const jobRef = useMemoFirebase(() => {
    if (!db || !room.jobId) return null;
    return doc(db, 'jobs', room.jobId);
  }, [db, room.jobId]);
  const { data: job } = useDoc(jobRef);

  const otherUserRef = useMemoFirebase(() => {
    if (!db || !otherUserId) return null;
    return doc(db, 'users', otherUserId);
  }, [db, otherUserId]);
  const { data: otherUser } = useDoc(otherUserRef);

  if (!job || !otherUser) return null;

  const isHired = job.selectedApplicantId === room.workerId;
  const isCompleted = job.status === 'Completed';

  return (
    <Link href={`/chat/${room.id}`}>
      <Card className="hover:bg-slate-50 transition-colors border-none shadow-sm group">
        <CardContent className="p-4 flex items-center gap-4">
          <Avatar className="h-12 w-12 border-2 border-primary/10">
            <AvatarImage src={otherUser.photoUrl} />
            <AvatarFallback className="bg-primary/5 text-primary font-bold">
              {otherUser.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-bold text-slate-900 truncate">{otherUser.name}</h3>
              <Badge 
                variant="outline" 
                className={`text-[9px] font-black uppercase tracking-tight shrink-0 ${
                  isCompleted ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  isHired ? 'bg-green-50 text-green-700 border-green-200' :
                  'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {isCompleted ? 'Completed' : isHired ? 'Contract' : 'Negotiation'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-medium truncate flex items-center gap-1 mt-0.5">
              <Briefcase className="w-3 h-3" />
              {job.title}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {isHired && !isCompleted && (
              <div className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                <ShieldCheck className="w-3 h-3" />
                ACTIVE
              </div>
            )}
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function MessagesPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const roomsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'chatRooms'),
      where('participants', 'array-contains', user.uid),
      limit(50)
    );
  }, [db, user]);

  const { data: rooms, isLoading: isLoadingRooms } = useCollection(roomsQuery);

  if (isUserLoading || isLoadingRooms) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Please log in to view your messages.</h2>
        <Button onClick={() => router.push('/login')}>Login Now</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-9 w-9">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold font-headline tracking-tight">Messages</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold">
              {rooms?.length || 0} Conversations
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          {rooms && rooms.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {rooms.map((room) => (
                <ChatRoomListItem key={room.id} room={room} currentUserId={user.uid} />
              ))}
            </div>
          ) : (
            <div className="text-center py-32 space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                <MessageSquare className="w-10 h-10 text-slate-200" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">Inbox Empty</h2>
                <p className="text-sm text-slate-400 max-w-xs mx-auto">
                  Start a negotiation by applying for a job or contacting a professional provider.
                </p>
              </div>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/jobs">Browse Opportunities</Link>
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-blue-50 border-blue-100 shadow-none">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-900">
                <Clock className="w-4 h-4 text-blue-600" />
                Response Time
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                Fast responses build trust. Users who reply within 30 minutes are more likely to secure a contract.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-green-50 border-green-100 shadow-none">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-green-900">
                <Banknote className="w-4 h-4 text-green-600" />
                Price Proposals
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-[11px] text-green-800 leading-relaxed font-medium">
                Always use the official "OFFER PRICE" tool in chats to ensure your funds are protected by Zero Worries Escrow.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
