export default async function handler(req, res) {
  const { symbol, type } = req.query;
  if (!symbol) return res.status(400).json({ error: "Missing symbol" });

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  try {
    const code = symbol.replace(".TW", "").replace(".TWO", "");

    if (type === "name") {
      const url = `https://tw.stock.yahoo.com/quote/${code}`;
      const fetchRes = await fetch(url);
      const html = await fetchRes.text();
      const titleMatch = html.match(/<title>([^<]+?)\s*\(\d+\)/);
      const name = (titleMatch && titleMatch[1]) ? titleMatch[1].trim() : "";
      return res.status(200).json({ name });
    } else if (type === "inst") {
      const targetSymbol = symbol.includes('.') ? symbol : `${symbol}.TW`;
      const url = `https://tw.stock.yahoo.com/_td-stock/api/resource/StockServices.institutionalInvestors;limit=5;symbol=${targetSymbol}`;
      const fetchRes = await fetch(url);
      if (fetchRes.ok) {
        const data = await fetchRes.json();
        const list = data.institutionalInvestors || [];
        // 將 Yahoo 特有的 {raw: 123} 結構轉為數值，並將股轉張
        const formatted = list.map(item => {
          const getRaw = (obj) => (obj && typeof obj === 'object') ? (obj.raw || 0) : (parseFloat(obj) || 0);
          return {
            f: Math.round(getRaw(item.foreignInvestorBuySell) / 1000),
            t: Math.round(getRaw(item.investmentTrustBuySell) / 1000),
            d: Math.round(getRaw(item.dealerBuySell) / 1000),
            total: Math.round(getRaw(item.totalBuySell) / 1000)
          };
        });
        return res.status(200).json(formatted);
      }
      return res.status(200).json([]);
    } else {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1y`;
      const fetchRes = await fetch(url);
      const data = await fetchRes.json();
      return res.status(200).json(data);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
