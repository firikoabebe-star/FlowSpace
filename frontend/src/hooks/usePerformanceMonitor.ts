"use client";

import { useEffect, useRef, useState } from "react";

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  connectionLatency?: number;
  messageLatency?: number;
}

interface PerformanceConfig {
  enableMemoryMonitoring?: boolean;
  enableNetworkMonitoring?: boolean;
  sampleRate?: number; // 0-1, percentage of renders to measure
}

export function usePerformanceMonitor(
  componentName: string,
  config: PerformanceConfig = {}
) {
  const {
    enableMemoryMonitoring = false,
    enableNetworkMonitoring = false,
    sampleRate = 0.1, // Monitor 10% of renders by default
  } = config;

  const renderStartTime = useRef<number>(0);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
  });

  // Start measuring render time
  const startMeasurement = () => {
    if (Math.random() > sampleRate) return;
    renderStartTime.current = performance.now();
  };

  // End measuring render time
  const endMeasurement = () => {
    if (renderStartTime.current === 0) return;
    
    const renderTime = performance.now() - renderStartTime.current;
    renderStartTime.current = 0;

    setMetrics(prev => ({
      ...prev,
      renderTime,
    }));

    // Log performance in development
    if (process.env.NODE_ENV === 'development' && renderTime > 16) {
      console.warn(
        `Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`
      );
    }
  };

  // Memory monitoring
  useEffect(() => {
    if (!enableMemoryMonitoring || !('memory' in performance)) return;

    const measureMemory = () => {
      const memory = (performance as any).memory;
      if (memory) {
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024, // MB
        }));
      }
    };

    measureMemory();
    const interval = setInterval(measureMemory, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, [enableMemoryMonitoring]);

  // Network latency monitoring
  useEffect(() => {
    if (!enableNetworkMonitoring) return;

    const measureNetworkLatency = async () => {
      try {
        const start = performance.now();
        await fetch('/health', { method: 'HEAD' });
        const latency = performance.now() - start;

        setMetrics(prev => ({
          ...prev,
          connectionLatency: latency,
        }));
      } catch (error) {
        // Network error, don't update metrics
      }
    };

    measureNetworkLatency();
    const interval = setInterval(measureNetworkLatency, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [enableNetworkMonitoring]);

  // Performance observer for navigation timing
  useEffect(() => {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          const pageLoadTime = navEntry.loadEventEnd - navEntry.navigationStart;
          
          if (process.env.NODE_ENV === 'development') {
            console.log(`Page load time: ${pageLoadTime.toFixed(2)}ms`);
          }
        }
      });
    });

    observer.observe({ entryTypes: ['navigation'] });

    return () => observer.disconnect();
  }, []);

  // Measure message send latency
  const measureMessageLatency = (startTime: number) => {
    const latency = performance.now() - startTime;
    setMetrics(prev => ({
      ...prev,
      messageLatency: latency,
    }));

    if (process.env.NODE_ENV === 'development' && latency > 100) {
      console.warn(`High message latency: ${latency.toFixed(2)}ms`);
    }
  };

  // Report performance metrics (for analytics)
  const reportMetrics = () => {
    if (process.env.NODE_ENV === 'production') {
      // Send to analytics service
      // Example: analytics.track('performance_metrics', {
      //   component: componentName,
      //   ...metrics,
      //   timestamp: Date.now(),
      // });
    }
  };

  return {
    metrics,
    startMeasurement,
    endMeasurement,
    measureMessageLatency,
    reportMetrics,
  };
}

// Hook for measuring specific operations
export function useOperationTimer() {
  const [timers, setTimers] = useState<Record<string, number>>({});

  const startTimer = (operationName: string) => {
    setTimers(prev => ({
      ...prev,
      [operationName]: performance.now(),
    }));
  };

  const endTimer = (operationName: string) => {
    const startTime = timers[operationName];
    if (!startTime) return 0;

    const duration = performance.now() - startTime;
    
    // Clean up timer
    setTimers(prev => {
      const { [operationName]: _, ...rest } = prev;
      return rest;
    });

    if (process.env.NODE_ENV === 'development') {
      console.log(`${operationName} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  };

  return {
    startTimer,
    endTimer,
  };
}

// Hook for FPS monitoring
export function useFPSMonitor() {
  const [fps, setFps] = useState(60);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    let animationId: number;

    const measureFPS = () => {
      frameCount.current++;
      const currentTime = performance.now();

      if (currentTime - lastTime.current >= 1000) {
        const currentFPS = Math.round(
          (frameCount.current * 1000) / (currentTime - lastTime.current)
        );
        
        setFps(currentFPS);
        frameCount.current = 0;
        lastTime.current = currentTime;

        if (process.env.NODE_ENV === 'development' && currentFPS < 30) {
          console.warn(`Low FPS detected: ${currentFPS}`);
        }
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);

    return () => cancelAnimationFrame(animationId);
  }, []);

  return fps;
}