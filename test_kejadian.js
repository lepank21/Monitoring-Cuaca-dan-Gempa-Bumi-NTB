import fetch from 'node-fetch';
fetch("https://siaga.ntbprov.go.id/api/mobile/kejadian-bencana/")
  .then(res => res.json())
  .then(data => console.log(JSON.stringify(data, null, 2).slice(0, 1000)))
  .catch(err => console.error(err));
