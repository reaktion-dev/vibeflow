/**
 * Server-Sent Events helper for streaming responses
 */
export function createSSEStream() {
  let isOpen = true;

  return {
    write: (data: any) => {
      if (!isOpen) return;
      return `data: ${JSON.stringify(data)}\n\n`;
    },

    writeComment: (comment: string) => {
      if (!isOpen) return;
      return `: ${comment}\n\n`;
    },

    close: () => {
      isOpen = false;
    },

    isOpen: () => isOpen,
  };
}

/**
 * Format SSE response for streaming
 */
export function formatSSEResponse(data: any): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

/**
 * Create a readable stream for command execution
 */
export function createCommandStream(
  command: string,
  onData: (chunk: string) => void,
  onComplete: (data: any) => void,
  onError: (error: Error) => void
) {
  return {
    command,
    onData,
    onComplete,
    onError,
  };
}

/**
 * Buffer stream chunks and emit periodically
 */
export function createStreamBuffer(flushInterval: number = 100) {
  let buffer: string[] = [];
  let timer: NodeJS.Timeout | null = null;

  return {
    push: (data: string) => {
      buffer.push(data);
    },

    flush: (): string => {
      const result = buffer.join('');
      buffer = [];
      return result;
    },

    startAutoFlush: (callback: (data: string) => void) => {
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        const data = this.flush();
        if (data) callback(data);
      }, flushInterval);

      return () => {
        if (timer) clearInterval(timer);
        timer = null;
      };
    },

    reset: () => {
      buffer = [];
      if (timer) clearInterval(timer);
      timer = null;
    },
  };
}
