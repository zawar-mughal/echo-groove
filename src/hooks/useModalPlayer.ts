import { useState, useCallback } from 'react';
import { MediaSubmission } from '@/types/submission';

export interface ModalPlayerState {
  activePlayer: string | null; // Which song is currently playing
  visibleModal: string | null; // Which song's modal is currently shown
  isPlaying: boolean;
  shuffleEnabled: boolean;
}

interface UseModalPlayerOptions {
  shufflePoolIds?: string[];
}

export const useModalPlayer = (
  submissions: MediaSubmission[],
  options: UseModalPlayerOptions = {}
) => {
  const [state, setState] = useState<ModalPlayerState>({
    activePlayer: null,
    visibleModal: null,
    isPlaying: false,
    shuffleEnabled: false
  });
  const { shufflePoolIds } = options;

  const setActivePlayer = useCallback((submissionId: string | null) => {
    setState(prev => ({ ...prev, activePlayer: submissionId }));
  }, []);

  const setVisibleModal = useCallback((submissionId: string | null) => {
    setState(prev => ({ ...prev, visibleModal: submissionId }));
  }, []);

  const setIsPlaying = useCallback((playing: boolean) => {
    setState(prev => ({ ...prev, isPlaying: playing }));
  }, []);

  const toggleModal = useCallback((submissionId: string) => {
    setState(prev => ({
      ...prev,
      visibleModal: prev.visibleModal === submissionId ? null : submissionId
    }));
  }, []);

  const startPlayback = useCallback((submissionId: string, showModal = false) => {
    setState(prev => ({
      ...prev,
      activePlayer: submissionId,
      isPlaying: true,
      visibleModal: showModal ? submissionId : prev.visibleModal
    }));
  }, []);

  const pausePlayback = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const stopPlayback = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      activePlayer: null, 
      isPlaying: false 
    }));
  }, []);

  const getRandomSubmission = useCallback((excludeId?: string | null, poolIds?: string[]) => {
    if (submissions.length === 0) return null;
    const workingSet = poolIds && poolIds.length > 0
      ? submissions.filter(submission => poolIds.includes(submission.id))
      : submissions;
    if (workingSet.length === 0) return null;

    const filteredPool = excludeId
      ? workingSet.filter(sub => sub.id !== excludeId)
      : workingSet;
    const pool = filteredPool.length > 0 ? filteredPool : workingSet;
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
  }, [submissions]);

  const playNextRandom = useCallback(() => {
    setState(prev => {
      if (!prev.shuffleEnabled) return prev;
      const nextSubmission = getRandomSubmission(prev.activePlayer, shufflePoolIds);
      if (!nextSubmission) return prev;

      return {
        ...prev,
        activePlayer: nextSubmission.id,
        isPlaying: true,
        visibleModal: prev.visibleModal ? nextSubmission.id : prev.visibleModal,
      };
    });
  }, [getRandomSubmission, shufflePoolIds]);

  const toggleShuffle = useCallback(() => {
    setState(prev => {
      const enableShuffle = !prev.shuffleEnabled;
      if (!enableShuffle) {
        return { ...prev, shuffleEnabled: false };
      }

      const nextSubmission = getRandomSubmission(prev.activePlayer, shufflePoolIds);

      if (!nextSubmission) {
        return { ...prev, shuffleEnabled: true };
      }

      return {
        ...prev,
        shuffleEnabled: true,
        activePlayer: nextSubmission.id,
        isPlaying: true,
        visibleModal: prev.visibleModal ? nextSubmission.id : prev.visibleModal,
      };
    });
  }, [getRandomSubmission, shufflePoolIds]);

  const disableShuffle = useCallback(() => {
    setState(prev => ({ ...prev, shuffleEnabled: false }));
  }, []);

  return {
    state,
    setActivePlayer,
    setVisibleModal,
    setIsPlaying,
    toggleModal,
    startPlayback,
    pausePlayback,
    stopPlayback,
    toggleShuffle,
    disableShuffle,
    playNextRandom
  };
};
