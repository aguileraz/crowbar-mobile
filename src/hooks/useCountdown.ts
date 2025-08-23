import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  totalSeconds: number;
  formattedTime: string;
}

interface UseCountdownOptions {
  onExpire?: () => void;
  onTick?: (state: CountdownState) => void;
  updateInterval?: number;
}

export const useCountdown = (
  targetDate: string | Date,
  options: UseCountdownOptions = {}
): CountdownState => {
  const { onExpire, onTick, updateInterval = 1000 } = options;
  
  const [timeLeft, setTimeLeft] = useState<CountdownState>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    totalSeconds: 0,
    formattedTime: '00:00:00',
  });

  const intervalRef = useRef<NodeJS.Timeout>();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const hasExpiredRef = useRef(false);

  const calculateTimeLeft = useCallback(() => {
    const target = new Date(targetDate).getTime();
    const now = new Date().getTime();
    const difference = target - now;

    if (difference <= 0 && !hasExpiredRef.current) {
      hasExpiredRef.current = true;
      onExpire?.();
      
      const expiredState: CountdownState = {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true,
        totalSeconds: 0,
        formattedTime: 'EXPIRADO',
      };
      
      setTimeLeft(expiredState);
      return expiredState;
    }

    if (difference <= 0) {
      return timeLeft;
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);
    const totalSeconds = Math.floor(difference / 1000);

    // Formatar tempo baseado na duração
    let formattedTime = '';
    if (days > 0) {
      formattedTime = `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      formattedTime = `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      formattedTime = `${minutes}m ${seconds}s`;
    } else {
      formattedTime = `${seconds}s`;
    }

    const newState: CountdownState = {
      days,
      hours,
      minutes,
      seconds,
      isExpired: false,
      totalSeconds,
      formattedTime,
    };

    setTimeLeft(newState);
    onTick?.(newState);
    
    return newState;
  }, [targetDate, onExpire, onTick]);

  // Gerenciar estado do app para pausar/retomar timer
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App voltou ao foreground, recalcular tempo
        calculateTimeLeft();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [calculateTimeLeft]);

  // Timer principal
  useEffect(() => {
    calculateTimeLeft();
    
    intervalRef.current = setInterval(() => {
      calculateTimeLeft();
    }, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [targetDate, updateInterval, calculateTimeLeft]);

  return timeLeft;
};

// Hook auxiliar para múltiplos countdowns
export const useMultipleCountdowns = (
  targets: Array<{ id: string; date: string | Date; onExpire?: () => void }>
): Record<string, CountdownState> => {
  const [countdowns, setCountdowns] = useState<Record<string, CountdownState>>({});

  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];

    targets.forEach(({ id, date, onExpire }) => {
      const calculateTime = () => {
        const target = new Date(date).getTime();
        const now = new Date().getTime();
        const difference = target - now;

        if (difference <= 0) {
          onExpire?.();
          setCountdowns(prev => ({
            ...prev,
            [id]: {
              days: 0,
              hours: 0,
              minutes: 0,
              seconds: 0,
              isExpired: true,
              totalSeconds: 0,
              formattedTime: 'EXPIRADO',
            },
          }));
          return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        let formattedTime = '';
        if (days > 0) {
          formattedTime = `${days}d ${hours}h`;
        } else if (hours > 0) {
          formattedTime = `${hours}h ${minutes}m`;
        } else {
          formattedTime = `${minutes}m ${seconds}s`;
        }

        setCountdowns(prev => ({
          ...prev,
          [id]: {
            days,
            hours,
            minutes,
            seconds,
            isExpired: false,
            totalSeconds: Math.floor(difference / 1000),
            formattedTime,
          },
        }));
      };

      calculateTime();
      const interval = setInterval(calculateTime, 1000);
      intervals.push(interval);
    });

    return () => {
      intervals.forEach(clearInterval);
    };
  }, [targets]);

  return countdowns;
};

// Utilitários auxiliares
export const getUrgencyLevel = (totalSeconds: number): 'low' | 'medium' | 'high' | 'critical' => {
  if (totalSeconds <= 0) return 'critical';
  if (totalSeconds < 3600) return 'critical'; // Menos de 1 hora
  if (totalSeconds < 86400) return 'high'; // Menos de 1 dia
  if (totalSeconds < 259200) return 'medium'; // Menos de 3 dias
  return 'low';
};

export const formatCountdownCompact = (state: CountdownState): string => {
  if (state.isExpired) return 'Expirado';
  
  if (state.days > 0) {
    return `${state.days}d`;
  } else if (state.hours > 0) {
    return `${state.hours}h`;
  } else if (state.minutes > 0) {
    return `${state.minutes}m`;
  }
  return `${state.seconds}s`;
};