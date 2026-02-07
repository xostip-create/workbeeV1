
'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CreditCard, Lock, ShieldCheck, Info, Loader2 } from 'lucide-react';
import { initializePayment } from '@/app/actions/payments';
import { useToast } from '@/hooks/use-toast';

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isInitializing, setIsInitializing] = useState(false);

  const jobRef = useMemoFirebase(() => {
    if (!db || !jobId) return null;
    return doc(db, 'jobs', jobId);
  }, [db, jobId]);

  const { data: job, isLoading } = useDoc(jobRef);

  const handlePayNow = async () => {
    if (!user || !job || !user.email) return;

    setIsInitializing(true);
    try {
      const amount = 15000; // Fixed amount for demo
      const { url } = await initializePayment(jobId, user.email, amount);
      window.location.href = url;
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Payment Error',
        description: error.message || 'Failed to connect to Paystack. Check your API keys.',
      });
    } finally {
      setIsInitializing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 flex justify-center items-center">
        <Skeleton className="h-[400px] w-full max-w-md" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 text-center">
        <h2 className="text-xl font-bold">Job not found</h2>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-md mx-auto">
        <Button variant="ghost" className="mb-6 gap-2" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <Card className="shadow-lg border-t-4 border-t-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <CreditCard className="w-6 h-6 text-primary" />
              Secure Payment
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Review and complete your payment for: <span className="font-bold text-foreground">"{job.title}"</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Service Amount</span>
                <span className="font-medium text-foreground">₦15,000.00</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <span>Service Fee (5%)</span>
                  <Info className="w-3 h-3 cursor-help" />
                </div>
                <span className="font-medium text-foreground">₦750.00</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total Amount</span>
                <span className="text-primary">₦15,750.00</span>
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg border border-dashed flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground leading-relaxed">
                <p className="font-bold text-foreground mb-1">Escrow Protection Active</p>
                Your payment is safely held in escrow. Funds are only released to the worker once you confirm the job is complete.
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button 
              className="w-full h-12 text-lg font-bold gap-2" 
              onClick={handlePayNow}
              disabled={isInitializing}
            >
              {isInitializing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Pay with Paystack
                </>
              )}
            </Button>
            <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
              <Lock className="w-3 h-3" />
              <span>Payments are processed securely via Paystack.</span>
            </div>
          </CardFooter>
        </Card>

        <div className="mt-8 flex flex-col items-center gap-4 opacity-70 grayscale transition-all hover:opacity-100 hover:grayscale-0">
          <div className="flex gap-4">
            <div className="w-12 h-8 bg-white border rounded flex items-center justify-center font-bold text-[8px] shadow-sm">VISA</div>
            <div className="w-12 h-8 bg-white border rounded flex items-center justify-center font-bold text-[8px] shadow-sm">MC</div>
            <div className="w-12 h-8 bg-white border rounded flex items-center justify-center font-bold text-[8px] shadow-sm">VERVE</div>
          </div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-medium">
            Secured by WorkBee Payment Gateway
          </p>
        </div>
      </div>
    </div>
  );
}
