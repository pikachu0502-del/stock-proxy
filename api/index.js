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
      const url = `https://tw.stock.yahoo.com/_td-stock/api/resource/StockServices.institutionalInvestors;symbol=${targetSymbol}`;
      const fetchRes = await fetch(url);
      if (fetchRes.ok) {
        const data = await fetchRes.json();
        const list = data.institutionalInvestors || [];
        
        let f = 0, t = 0, d = 0, total = 0;
        // 累加近五個交易日數值
        list.slice(0, 5).forEach(item => {
          const getVal = (obj) => (obj && typeof obj === 'object') ? (obj.raw || 0) : (parseFloat(obj) || 0);
          f += getVal(item.foreignInvestorBuySell);
          t += getVal(item.investmentTrustBuySell);
          d += getVal(item.dealerBuySell);
          total += getVal(item.totalBuySell);
        });

        return res.status(200).json({
          f: Math.round(f / 1000),
          t: Math.round(t / 1000),
          d: Math.round(d / 1000),
          total: Math.round(total / 1000),
          valid: list.length > 0
        });
      }
      return res.status(200).json({ valid: false });
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
