import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock API for exchange rates
  // In a real app, you'd fetch from Binance, Coinbase, Kraken APIs
  app.get("/api/rates", (req, res) => {
    const { symbol } = req.query;
    const basePrice = symbol === 'ETH' ? 2800 : symbol === 'BTC' ? 65000 : 100;
    
    const rates = [
      { exchange: "Coinbase", price: basePrice * (1 + (Math.random() * 0.01 - 0.005)), fee: 0.015 },
      { exchange: "Binance", price: basePrice * (1 + (Math.random() * 0.01 - 0.005)), fee: 0.001 },
      { exchange: "Kraken", price: basePrice * (1 + (Math.random() * 0.01 - 0.005)), fee: 0.0026 },
      { exchange: "Uniswap (DEX)", price: basePrice * (1 + (Math.random() * 0.01 - 0.005)), fee: 0.003 },
    ];

    res.json(rates);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
