'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Send, Phone, CreditCard } from 'lucide-react';
import Link from 'next/link';

/**
 * Enhanced Chat Screen Placeholder.
 * Includes a link to the Payment screen.
 */
export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.id;

  const sampleMessages = [
    { id: '1', sender: 'partner', text: "Hello! Is this still available?", time: '10:00 AM' },
    { id: '2', sender: 'me', text: "Hi! Yes it is. How can I help?", time: '10:02 AM' },
    { id: '3', sender: 'partner', text: "Great, I'm ready to proceed with the service.", time: '10:05 AM' },
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between px-4 py-3 border-b bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Avatar className="w-10 h-10 border">
            <AvatarFallback className="bg-primary/10 text-primary">JD</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-sm font-bold leading-none">User {chatId}</h2>
            <p className="text-xs text-green-500 font-medium mt-1">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-2 border-primary text-primary hover:bg-primary/5">
            <Link href={`/payments/pay-${chatId}`}>
              <CreditCard className="w-4 h-4" />
              Pay
            </Link>
          </Button>
          <Button variant="ghost" size="icon">
            <Phone className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-4 max-w-2xl mx-auto">
          {sampleMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                  msg.sender === 'me'
                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                    : 'bg-muted text-foreground rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
              <span className="text-[10px] text-muted-foreground mt-1 px-1">{msg.time}</span>
            </div>
          ))}
        </div>
      </ScrollArea>

      <footer className="p-4 border-t bg-white">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <Input 
            placeholder="Type a message..." 
            className="flex-1 bg-muted/30 border-none focus-visible:ring-primary"
            disabled 
          />
          <Button size="icon" className="rounded-full shrink-0" disabled>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
