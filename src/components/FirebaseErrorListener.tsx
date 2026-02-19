
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * Better Solution: Instead of throwing (which crashes the app), we show a descriptive toast
 * to inform the user (or developer) about the security rule denial.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // Better solution: Inform the user via a toast instead of crashing.
      toast({
        variant: 'destructive',
        title: 'Security Notice',
        description: 'A data request was denied by security rules. Check your permissions or rule configuration.',
      });
      
      // Log to console for debugging without triggering the Next.js error overlay.
      console.warn('Firestore Permission Denied:', error.request);
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null;
}
