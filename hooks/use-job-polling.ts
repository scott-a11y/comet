import { useEffect, useState } from 'react';

interface UseJobPollingOptions {
  jobId: string | null;
  onComplete: (data: any) => void;
}

// TODO: Implement proper job status checking
// For now, immediately return COMPLETED since analysis is synchronous
const checkAnalysisStatus = async ({ jobId }: { jobId: string }): Promise<[{ status: string; data: any } | null, Error | null]> => {
  // Stub implementation - in production this would check actual job status
  return [{ status: 'COMPLETED', data: null }, null];
};

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

        if (error || !result) {
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
