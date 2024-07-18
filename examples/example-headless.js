import { exitAll, GologinApi } from '../src/gologin-api.js';

const token = process.env.GOLOGIN_API_TOKEN; // get token https://app.gologin.com/personalArea/TokenApi
const gologin = GologinApi({ token, debug: true });

async function main() {
  const { browser } = await gologin.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://iphey.com/', { waitUntil: 'networkidle2' });
  await gologin.delay(1000);
  await page.screenshot({ path: 'headless-1sec.jpg', fullPage: true });
  let innerHTML = await page.$eval('.title-block', (elt) => elt.innerHTML);
  const prematureStatus = await page.$eval('.title>.title:not(.hide)', (elt) =>
    elt?.innerText?.trim(),
  );
  gologin.debug({ prematureStatus });
  gologin.debug(innerHTML);

  await gologin.delay(5000);
  await page.screenshot({ path: 'headless-6sec.jpg', fullPage: true });
  innerHTML = await page.$eval('.title-block', (elt) => elt.innerHTML);
  gologin.debug(innerHTML);

  const status = await page.$eval('.title>.title:not(.hide)', (elt) =>
    elt?.innerText?.trim(),
  );
  gologin.debug({ status });

  return status; // Expecting 'Trustworthy'
}

main().catch(console.error).then(console.info).finally(exitAll);
