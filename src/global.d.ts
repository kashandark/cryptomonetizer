interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request: (request: { method: string; params?: Array<any> }) => Promise<any>;
    on: (eventName: string, callback: (...args: any[]) => void) => void;
    removeListener: (eventName: string, callback: (...args: any[]) => void) => void;
  };
}

declare namespace NodeJS {
  interface ProcessEnv {
    GEMINI_API_KEY: string;
    NODE_ENV: 'development' | 'production';
  }
}
