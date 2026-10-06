
import * as cheerio from 'cheerio';
fetch('https://magma.esdm.go.id/v1/gunung-api/tingkat-aktivitas').then(r=>r.text()).then(html => {
  const $ = cheerio.load(html);
  const results = {};
  $('td').each((i, el) => {
    const text = $(el).text().trim();
    if(text.includes('Level')) {
       const level = text.split('\n')[0].trim();
       let tr = $(el).closest('tr');
       while(tr.length) {
         const vText = tr.find('td').last().text().trim();
         if(vText.includes('Rinjani') || vText.includes('Tambora') || vText.includes('Sangeangapi')) {
             results[vText.split('-')[0].trim()] = level;
         }
         tr = tr.next();
         if(tr.find('td').first().text().trim().includes('Level')) break;
       }
    }
  });
  console.log(results);
});

