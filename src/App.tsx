import React, { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import { 
  Wallet, 
  TrendingUp, 
  ArrowRightLeft, 
  ShieldCheck, 
  ChevronRight, 
  RefreshCw,
  Info,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';
import { Token, ExchangeRate, SUPPORTED_TOKENS } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Mock chart data
const generateChartData = (base: number) => {
  return Array.from({ length: 20 }, (_, i) => ({
    time: i,
    price: base + (Math.random() * base * 0.05) - (base * 0.025)
  }));
};

export default function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSelling, setIsSelling] = useState(false);
  const [sellSuccess, setSellSuccess] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_request_accounts", []);
        setAccount(accounts[0]);
        fetchBalances(accounts[0], provider);
      } catch (error) {
        console.error("User denied account access", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const fetchBalances = async (address: string, provider: ethers.BrowserProvider) => {
    setLoading(true);
    try {
      // In a real app, you'd use multicall or fetch from an indexer
      // Here we mock the balances for demonstration
      const ethBalance = await provider.getBalance(address);
      const ethPrice = 2845.20;
      
      const mockTokens: Token[] = [
        { 
          symbol: 'ETH', 
          name: 'Ethereum', 
          balance: ethers.formatEther(ethBalance), 
          price: ethPrice,
          value: parseFloat(ethers.formatEther(ethBalance)) * ethPrice
        },
        { 
          symbol: 'USDC', 
          name: 'USD Coin', 
          balance: '1250.00', 
          price: 1.00,
          value: 1250.00
        },
        { 
          symbol: 'LINK', 
          name: 'Chainlink', 
          balance: '45.5', 
          price: 18.25,
          value: 45.5 * 18.25
        }
      ];
      setTokens(mockTokens);
    } catch (error) {
      console.error("Error fetching balances", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRates = async (token: Token) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/rates?symbol=${token.symbol}`);
      const data = await response.json();
      
      const processedRates = data.map((r: ExchangeRate) => ({
        ...r,
        netAmount: (token.value * (r.price / token.price)) * (1 - r.fee)
      })).sort((a: any, b: any) => b.netAmount - a.netAmount);
      
      setRates(processedRates);
      analyzeWithAI(token, processedRates);
    } catch (error) {
      console.error("Error fetching rates", error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeWithAI = async (token: Token, currentRates: ExchangeRate[]) => {
    setAnalyzing(true);
    try {
      const bestExchange = currentRates[0];
      const prompt = `Analyze the current crypto market for ${token.symbol}. 
      The user wants to sell their ${token.balance} ${token.symbol} (Value: $${token.value.toFixed(2)}).
      Available rates: ${currentRates.map(r => `${r.exchange}: $${r.price.toFixed(2)} (Fee: ${r.fee * 100}%)`).join(', ')}.
      Explain why ${bestExchange.exchange} is the best choice and mention any potential risks or market trends. Keep it concise and professional.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      setAiAnalysis(response.text || '');
    } catch (error) {
      console.error("AI Analysis failed", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSell = () => {
    setIsSelling(true);
    setTimeout(() => {
      setIsSelling(false);
      setSellSuccess(true);
      setTimeout(() => setSellSuccess(false), 3000);
    }, 2000);
  };

  const totalValue = useMemo(() => tokens.reduce((acc, t) => acc + t.value, 0), [tokens]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1D1F] font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">Monetizer</span>
          </div>
          
          <button 
            onClick={connectWallet}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
              account 
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
            )}
          >
            <Wallet className="w-4 h-4" />
            {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Wallet"}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!account ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
              <ShieldCheck className="w-10 h-10 text-indigo-600" />
            </div>
            <h1 className="text-4xl font-bold mb-4 tracking-tight">Your Multi-Exchange Portal</h1>
            <p className="text-gray-500 max-w-md mb-8 text-lg">
              Connect your wallet to detect your assets and find the best rates across all major exchanges instantly.
            </p>
            <button 
              onClick={connectWallet}
              className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 flex items-center gap-2"
            >
              Get Started <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar: Portfolio */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold text-gray-500 text-sm uppercase tracking-wider">Total Balance</h2>
                  <RefreshCw className={cn("w-4 h-4 text-gray-400 cursor-pointer", loading && "animate-spin")} />
                </div>
                <div className="text-4xl font-bold mb-2">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                <div className="text-emerald-500 text-sm font-medium flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> +2.4% past 24h
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-500 text-sm uppercase tracking-wider mb-4">Your Assets</h2>
                <div className="space-y-4">
                  {tokens.map((token) => (
                    <button
                      key={token.symbol}
                      onClick={() => {
                        setSelectedToken(token);
                        fetchRates(token);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-2xl transition-all border",
                        selectedToken?.symbol === token.symbol 
                          ? "bg-indigo-50 border-indigo-100 ring-1 ring-indigo-200" 
                          : "bg-white border-transparent hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600">
                          {token.symbol[0]}
                        </div>
                        <div className="text-left">
                          <div className="font-semibold">{token.symbol}</div>
                          <div className="text-xs text-gray-400">{token.balance} {token.symbol}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${token.value.toLocaleString()}</div>
                        <div className="text-xs text-gray-400">${token.price.toFixed(2)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content: Rates & Execution */}
            <div className="lg:col-span-8 space-y-6">
              {selectedToken ? (
                <>
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-2xl font-bold mb-1">{selectedToken.name} Price</h2>
                        <p className="text-gray-500">Live market data from multiple sources</p>
                      </div>
                      <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1 rounded-full text-indigo-600 text-sm font-medium">
                        <ArrowRightLeft className="w-4 h-4" /> Best Rate Found
                      </div>
                    </div>

                    <div className="h-64 w-full mb-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={generateChartData(selectedToken.price)}>
                          <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                          <XAxis dataKey="time" hide />
                          <YAxis domain={['auto', 'auto']} hide />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="price" 
                            stroke="#4F46E5" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorPrice)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {rates.map((rate, idx) => (
                        <div 
                          key={rate.exchange}
                          className={cn(
                            "p-5 rounded-2xl border transition-all relative overflow-hidden",
                            idx === 0 
                              ? "border-indigo-200 bg-indigo-50/30 ring-1 ring-indigo-100" 
                              : "border-gray-100 bg-white"
                          )}
                        >
                          {idx === 0 && (
                            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase tracking-tighter">
                              Best Value
                            </div>
                          )}
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <div className="font-bold text-lg">{rate.exchange}</div>
                              <div className="text-xs text-gray-400">Fee: {(rate.fee * 100).toFixed(2)}%</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-indigo-600">${rate.price.toFixed(2)}</div>
                              <div className="text-xs text-gray-400">per {selectedToken.symbol}</div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="text-sm text-gray-500">You receive</div>
                            <div className="font-bold text-xl">${rate.netAmount?.toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* AI Insights Section */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-indigo-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <TrendingUp className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-4 text-indigo-200">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-widest">AI Market Analysis</span>
                      </div>
                      <h3 className="text-xl font-bold mb-4">Why sell on {rates[0]?.exchange}?</h3>
                      <div className="prose prose-invert max-w-none text-indigo-100 text-sm leading-relaxed">
                        {analyzing ? (
                          <div className="flex items-center gap-2 py-4">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Analyzing market depth and liquidity...
                          </div>
                        ) : (
                          <Markdown>{aiAnalysis}</Markdown>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* Action Bar */}
                  <div className="sticky bottom-8 bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-gray-100 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Estimated Payout</div>
                      <div className="text-3xl font-bold">${rates[0]?.netAmount?.toFixed(2)}</div>
                    </div>
                    <button 
                      onClick={handleSell}
                      disabled={isSelling || sellSuccess}
                      className={cn(
                        "px-10 py-4 rounded-2xl font-bold text-lg transition-all flex items-center gap-2",
                        sellSuccess 
                          ? "bg-emerald-500 text-white" 
                          : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                      )}
                    >
                      {isSelling ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : sellSuccess ? (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Sold Successfully
                        </>
                      ) : (
                        <>
                          Sell on {rates[0]?.exchange}
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="h-full min-h-[400px] bg-white rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center p-12">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <ArrowRightLeft className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Select an Asset</h3>
                  <p className="text-gray-400 max-w-xs">
                    Choose a token from your portfolio to compare rates and monetize your holdings.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-gray-100 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
                <TrendingUp className="text-white w-4 h-4" />
              </div>
              <span className="font-bold">Monetizer</span>
            </div>
            <p className="text-gray-400 text-sm max-w-sm">
              The world's first multi-exchange crypto monetization platform. We aggregate liquidity from centralized and decentralized exchanges to ensure you always get the best rate.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">Security</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Non-custodial</li>
              <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Audited Smart Contracts</li>
              <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Secure API Tunnels</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>API Documentation</li>
              <li>Supported Exchanges</li>
              <li>Help Center</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-100 text-center text-xs text-gray-400">
          © 2026 Crypto Monetizer. All rights reserved. Trading crypto involves risk.
        </div>
      </footer>
    </div>
  );
}
