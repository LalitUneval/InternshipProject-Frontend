declare module 'sockjs-client' {
  class SockJS {
    constructor(url: string, _reserved?: any, options?: any);
    close(code?: number, reason?: string): void;
    send(data: string): void;
    readyState: number;
    onopen: (() => void) | null;
    onclose: ((e: any) => void) | null;
    onmessage: ((e: MessageEvent) => void) | null;
  }
  export = SockJS;
}