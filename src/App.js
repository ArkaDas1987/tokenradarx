import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
import blacklist from '../config/blacklist.json';

const RUGCHECK_API = 'https://api.rugcheck.xyz/check/';

const FILTERS = {
  volumeMin: 10000,
  refreshSec: 30
};

function App() {
  const [tokens, setTokens] = useState([]);

  const fetchTokens = async () => {
    try {
      const { data } = await axios.get('https://api.dexscreener.com/latest/dex/pairs/bsc');
      const filtered = [];

      for (let token of data.pairs.slice(0, 50)) {
        const devAddress = token.pairCreatedBy || "";
        const volume = parseFloat(token.volume.h24USD || 0);

        if (blacklist.tokens.includes(token.baseToken.name.toLowerCase())) continue;
        if (blacklist.devs.includes(devAddress.toLowerCase())) continue;
        if (volume < FILTERS.volumeMin) continue;

        // Rugcheck validation
        const check = await axios.get(RUGCHECK_API + token.pairAddress).catch(() => null);
        const status = check?.data?.verdict || "Unknown";
        if (status !== "Good") continue;

        filtered.push({
          name: token.baseToken.name,
          symbol: token.baseToken.symbol,
          price: token.priceUsd,
          volume,
          liquidity: token.liquidity?.usd,
          time: token.pairCreatedAt,
          pairAddress: token.pairAddress,
          status
        });
      }

      setTokens(filtered);
    } catch (err) {
      console.error("Error fetching tokens:", err);
    }
  };

  useEffect(() => {
    fetchTokens();
    const timer = setInterval(fetchTokens, FILTERS.refreshSec * 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ padding: '1rem', fontFamily: 'Arial' }}>
      <h2>TokenRadarX – Live BSC Tracker</h2>
      <table border="1" cellPadding="8" cellSpacing="0">
        <thead>
          <tr>
            <th>Name</th><th>Symbol</th><th>Price ($)</th><th>Volume</th><th>Liquidity</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((t, i) => (
            <tr key={i}>
              <td>{t.name}</td>
              <td>{t.symbol}</td>
              <td>{Number(t.price).toFixed(6)}</td>
              <td>{Math.floor(t.volume)}</td>
              <td>{Math.floor(t.liquidity)}</td>
              <td>{t.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;