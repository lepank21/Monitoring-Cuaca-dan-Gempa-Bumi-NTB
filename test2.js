import fetch from 'node-fetch';

async function fetchBMKG(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "BMKG-Disaster-Monitor-NTB/1.0",
        Accept: "*/*",
      },
    });
    clearTimeout(id);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from ${url}`);
    }
    return await res.text();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

fetchBMKG("https://siaga.ntbprov.go.id/api/lapor/lists").then(d => console.log(d.slice(0, 100))).catch(console.error);

