'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Send, Phone, MoreVertical } from 'lucide-react';
import Link from 'next/link';

/**
 * Placeholder Chat Screen.
 * Displays a visual mock-up of a conversation.
 */
export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.id;

  // Sample static messages for the placeholder UI
  const sampleMessages = [
    { id: '1', sender: 'partner', text: "Hello! I saw your post for the plumbing job.", time: '10:00 AM' },
    { id: '2', sender: 'me', text: "Hi! Yes, I'm looking for someone to fix a leak in the kitchen.", time: '10:02 AM' },
    { id: '3', sender: 'partner', text: "I can help with that. Are you available tomorrow morning for a quick look?", time: '10:05 AM' },
    { id: '4', sender: 'me', text: "Tomorrow works for me. Around 9 AM?", time: '10:07 AM' },
    { id: '5', sender: 'partner', text: "Perfect. See you then!", time: '10:10 AM' },
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Chat Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Avatar className="w-10 h-10 border">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary/10 text-primary">JD</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-sm font-bold leading-none">John Doe</h2>
            <p className="text-xs text-green-500 font-medium mt-1">Online</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon">
            <Phone className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </header>

      {/* Message Area */}
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
          
          <div className="text-center my-4">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold bg-muted/50 px-2 py-1 rounded">
              System Reference: {chatId}
            </span>
          </div>
        </div>
      </ScrollArea>

      {/* Message Input Footer */}
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
        <p className="text-[10px] text-center text-muted-foreground mt-2 italic">
          Messaging is currently disabled in this placeholder.
        </p>
      </footer>
    </div>
  );
}
