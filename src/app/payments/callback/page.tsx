
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

/**
 * Inner component that uses search params.
 * Must be wrapped in Suspense for Next.js build.
 */
function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  
  const reference = searchParams.get('reference');
  const jobId = searchParams.get('jobId');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (reference && jobId && user && db) {
      // In a real app, you would verify the transaction on the server first
      // For this demo, we assume Paystack redirect back means success
      const paymentsRef = collection(db, 'payments');
      
      addDocumentNonBlocking(paymentsRef, {
        jobId,
        customerId: user.uid,
        amount: 15000,
        status: 'Paid',
        reference,
        paidAt: new Date().toISOString(),
      }).then(() => {
        setStatus('success');
      }).catch(() => {
        setStatus('error');
      });
    } else if (!reference) {
      setStatus('error');
    }
  }, [reference, jobId, user, db]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
        <CardContent className="pt-10 pb-10 text-center space-y-6">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto" />
              <div className="space-y-2">
                <CardTitle className="text-2xl">Confirming Payment</CardTitle>
                <p className="text-muted-foreground">Please wait while we secure your transaction record...</p>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
              <div className="space-y-2">
                <CardTitle className="text-2xl">Payment Successful!</CardTitle>
                <p className="text-muted-foreground">Your payment has been recorded. The worker can now see that the job is funded.</p>
              </div>
              <p className="text-xs text-muted-foreground bg-muted/50 py-2 rounded">Ref: {reference}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-destructive mx-auto" />
              <div className="space-y-2">
                <CardTitle className="text-2xl">Payment Failed</CardTitle>
                <p className="text-muted-foreground">We couldn't confirm your payment or the transaction was cancelled.</p>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={() => router.push(jobId ? `/jobs/${jobId}` : '/')}
          >
            {status === 'success' ? 'Return to Job' : 'Go Back Home'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
