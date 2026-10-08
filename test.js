import * as cheerio from 'cheerio';
fetch('https://siaga.ntbprov.go.id/api/lapor/lists')
  .then(r => r.text())
  .then(html => {
    const $ = cheerio.load(html);
    const reports = [];
    $('div.d-flex.flex-stack').each((i, el) => {
      const time = $(el).find('.fs-5').first().text().trim();
      const title = $(el).find('a.text-hover-primary').text().trim();
      const user = $(el).find('.text-gray-400 a').text().trim();
      if (title) reports.push({ time, title, user });
    });
    console.log(reports);
  });
