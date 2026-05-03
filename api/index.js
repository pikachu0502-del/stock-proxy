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
      const url = `https://tw.stock.yahoo.com/quote/${code}/institutional-investors`;
      const fetchRes = await fetch(url);
      const html = await fetchRes.text();
      const match = html.match(/"institutionalInvestors":(\[.*?\])/);
      let data = [];
      if (match) {
        data = JSON.parse(match[1]).slice(0, 5);
      }
      return res.status(200).json(data);
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
