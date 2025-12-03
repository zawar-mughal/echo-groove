import { useState, useCallback, useRef, useEffect } from 'react';
import { MediaSubmission } from '@/types/submission';

interface UseAutoplayProps {
  submissions: MediaSubmission[];
  onSubmissionChange?: (submission: MediaSubmission) => void;
  enabled?: boolean;
}

export const useAutoplay = ({ 
  submissions, 
  onSubmissionChange, 
  enabled = false 
}: UseAutoplayProps) => {
  const [isAutoplayEnabled, setIsAutoplayEnabled] = useState(enabled);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffledOrder, setShuffledOrder] = useState<number[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Shuffle function
  const shuffleArray = (array: number[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startShuffle = useCallback(() => {
    // For mixed media, include all media types
    const allSubmissions = submissions.map((_, index) => index);
    
    const shuffled = shuffleArray(allSubmissions);
    setShuffledOrder(shuffled);
    setCurrentIndex(0);
    setIsShuffled(true);
    setIsAutoplayEnabled(true);
    
    if (shuffled.length > 0 && onSubmissionChange) {
      onSubmissionChange(submissions[shuffled[0]]);
    }
  }, [submissions, onSubmissionChange]);

  const stopAutoplay = useCallback(() => {
    setIsAutoplayEnabled(false);
    setIsShuffled(false);
  }, []);

  const goToNext = useCallback(() => {
    if (!isShuffled || shuffledOrder.length === 0) return;
    
    const nextIndex = (currentIndex + 1) % shuffledOrder.length;
    setCurrentIndex(nextIndex);
    
    if (onSubmissionChange) {
      onSubmissionChange(submissions[shuffledOrder[nextIndex]]);
    }
  }, [currentIndex, shuffledOrder, submissions, onSubmissionChange, isShuffled]);

  // Auto-advance when video ends
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isAutoplayEnabled) return;

    const handleVideoEnd = () => {
      goToNext();
    };

    video.addEventListener('ended', handleVideoEnd);
    return () => video.removeEventListener('ended', handleVideoEnd);
  }, [goToNext, isAutoplayEnabled]);

  const getCurrentSubmission = () => {
    if (!isShuffled || shuffledOrder.length === 0) return null;
    return submissions[shuffledOrder[currentIndex]] || null;
  };

  return {
    isAutoplayEnabled,
    isShuffled,
    currentSubmission: getCurrentSubmission(),
    currentIndex,
    shuffledOrder,
    videoRef,
    startShuffle,
    stopAutoplay,
    goToNext
  };
};