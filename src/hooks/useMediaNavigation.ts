import { useState, useCallback, useEffect } from 'react';
import { MediaSubmission } from '@/types/submission';

interface UseMediaNavigationProps {
  submissions: MediaSubmission[];
  initialSubmissionId?: string;
  onSubmissionChange?: (submission: MediaSubmission) => void;
}

export const useMediaNavigation = ({ 
  submissions, 
  initialSubmissionId, 
  onSubmissionChange 
}: UseMediaNavigationProps) => {
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (!initialSubmissionId) return 0;
    const index = submissions.findIndex((s) => s.id === initialSubmissionId);
    return index >= 0 ? index : 0;
  });

  useEffect(() => {
    if (submissions.length === 0) {
      setCurrentIndex(0);
      return;
    }

    if (!initialSubmissionId) {
      setCurrentIndex((prev) =>
        prev >= submissions.length ? submissions.length - 1 : prev
      );
      return;
    }

    const index = submissions.findIndex((s) => s.id === initialSubmissionId);
    if (index >= 0 && index !== currentIndex) {
      setCurrentIndex(index);
    } else if (index === -1 && currentIndex >= submissions.length) {
      setCurrentIndex(submissions.length - 1);
    }
  }, [initialSubmissionId, submissions, currentIndex]);

  const currentSubmission = submissions[currentIndex] || null;

  const goToNext = useCallback(() => {
    if (submissions.length === 0) return;
    const nextIndex = (currentIndex + 1) % submissions.length;
    setCurrentIndex(nextIndex);
    if (onSubmissionChange && submissions[nextIndex]) {
      onSubmissionChange(submissions[nextIndex]);
    }
  }, [currentIndex, submissions, onSubmissionChange]);

  const goToPrevious = useCallback(() => {
    if (submissions.length === 0) return;
    const prevIndex = currentIndex === 0 ? submissions.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    if (onSubmissionChange && submissions[prevIndex]) {
      onSubmissionChange(submissions[prevIndex]);
    }
  }, [currentIndex, submissions, onSubmissionChange]);

  const goToSubmission = useCallback((submissionId: string) => {
    if (submissions.length === 0) return;
    const index = submissions.findIndex(s => s.id === submissionId);
    if (index !== -1) {
      setCurrentIndex(index);
      if (onSubmissionChange) {
        onSubmissionChange(submissions[index]);
      }
    }
  }, [submissions, onSubmissionChange]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToPrevious();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious]);

  return {
    currentSubmission,
    currentIndex,
    goToNext,
    goToPrevious,
    goToSubmission,
    hasNext: submissions.length > 1,
    hasPrevious: submissions.length > 1
  };
};
