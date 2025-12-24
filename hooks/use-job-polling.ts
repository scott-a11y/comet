import { useEffect, useState } from 'react';
import { checkAnalysisStatus } from '@/actions/analyze';

interface UseJobPollingOptions {
  jobId: string | null;
  onComplete: (data: any) => void;
}

export function useJobPolling({ jobId, onComplete }: UseJobPollingOptions) {
  const [status, setStatus] = useState<'PENDING' | 'COMPLETED' | 'FAILED' | null>(null);
  const [data, setData] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (!jobId) {
      setStatus(null);
      setData(null);
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    setStatus('PENDING');

    const pollStatus = async () => {
      try {
        const [result, error] = await checkAnalysisStatus({ jobId });

        if (error) {
          console.error('Polling error:', error);
          setStatus('FAILED');
          setIsPolling(false);
          return;
        }

        setStatus(result.status as 'PENDING' | 'COMPLETED' | 'FAILED');

        if (result.status === 'COMPLETED') {
          setData(result.data);
          setIsPolling(false);
          onComplete(result.data);
        } else if (result.status === 'FAILED') {
          setIsPolling(false);
        } else {
          // Continue polling
          setTimeout(pollStatus, 2000); // Poll every 2 seconds
        }
      } catch (error) {
        console.error('Polling error:', error);
        setStatus('FAILED');
        setIsPolling(false);
      }
    };

    // Start polling immediately
    pollStatus();

    // Cleanup function
    return () => {
      setIsPolling(false);
    };
  }, [jobId, onComplete]);

  return { status, data, isPolling };
}
