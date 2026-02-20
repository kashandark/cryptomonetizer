export interface Token {
  symbol: string;
  name: string;
  balance: string;
  price: number;
  value: number;
  logo?: string;
}

export interface ExchangeRate {
  exchange: string;
  price: number;
  fee: number;
  netAmount?: number;
}

export const SUPPORTED_TOKENS = [
  { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000' },
  { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
  { symbol: 'LINK', name: 'Chainlink', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA' },
];
