
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { collection, doc, getDoc, query, where, limit, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, Info } from 'lucide-react';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

/**
 * Inner component that handles post-payment logic.
 * Retrieves job and proposal data to record the correct transaction amount.
 */
function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  
  const reference = searchParams.get('reference');
  const jobId = searchParams.get('jobId');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [amount, setAmount] = useState<number | null>(null);

  useEffect(() => {
    async function processPayment() {
      if (!reference || !jobId || !user || !db) {
        if (!reference) setStatus('error');
        return;
      }

      try {
        // Fetch the accepted proposal for this job to get the real amount
        const proposalsRef = collection(db, 'jobs', jobId, 'proposals');
        const q = query(proposalsRef, where('status', '==', 'Accepted'), limit(1));
        const proposalSnap = await getDocs(q);
        
        let finalAmount = 0;
        if (!proposalSnap.empty) {
          finalAmount = proposalSnap.docs[0].data().amount;
        } else {
          // Fallback: Check if job has a totalPrice set
          const jobSnap = await getDoc(doc(db, 'jobs', jobId));
          if (jobSnap.exists()) {
            finalAmount = jobSnap.data().totalPrice || 0;
          }
        }

        setAmount(finalAmount);

        // Record the payment in Firestore
        const paymentsRef = collection(db, 'payments');
        await addDocumentNonBlocking(paymentsRef, {
          jobId,
          customerId: user.uid,
          amount: finalAmount,
          status: 'Paid',
          reference,
          paidAt: new Date().toISOString(),
        });

        setStatus('success');
      } catch (err) {
        console.error("Payment recording failed:", err);
        setStatus('error');
      }
    }

    processPayment();
  }, [reference, jobId, user, db]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-none overflow-hidden bg-white">
        <div className={`h-2 w-full ${status === 'success' ? 'bg-green-500' : status === 'error' ? 'bg-destructive' : 'bg-primary animate-pulse'}`} />
        <CardContent className="pt-12 pb-10 text-center space-y-6">
          {status === 'loading' && (
            <>
              <div className="relative mx-auto">
                <Loader2 className="w-16 h-16 animate-spin text-primary opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Info className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="space-y-2 px-6">
                <CardTitle className="text-2xl font-black font-headline">Syncing Transaction</CardTitle>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We're retrieving your job records and confirming the funding amount. Almost there!
                </p>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-3xl font-black font-headline text-slate-900">Payment Secured</CardTitle>
                <div className="bg-slate-50 border rounded-xl p-4 my-4">
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Transaction Amount</p>
                   <p className="text-2xl font-black text-primary mt-1">₦{(amount || 0).toLocaleString()}</p>
                </div>
                <p className="text-sm text-slate-600 px-6">
                  The funds are now held in escrow. Your worker can begin tasks immediately.
                </p>
              </div>
              <div className="pt-2">
                <p className="text-[10px] font-mono text-slate-400 bg-slate-100 py-1.5 px-3 rounded-full inline-block">
                  REF: {reference}
                </p>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-12 h-12 text-destructive" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-black font-headline text-slate-900">Update Failed</CardTitle>
                <p className="text-sm text-muted-foreground leading-relaxed px-6">
                  We confirmed the payment but couldn't sync the record to your job dashboard. Please contact support with your reference ID.
                </p>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="pb-8 px-8">
          <Button 
            className="w-full h-12 font-bold shadow-lg shadow-primary/10" 
            onClick={() => router.push(jobId ? `/jobs/${jobId}` : '/')}
          >
            {status === 'success' ? 'Return to Job Workspace' : 'Go Back Home'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
