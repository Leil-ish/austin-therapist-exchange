const { chromium } = require('playwright');

(async () => {
  const TOKEN = 'd980c668a2f19318fe9c78b7c0dee5423034d2e1f768ecccb8b495d7';
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  // Auth via token_hash
  const authUrl = `http://localhost:3000/auth/callback?token_hash=${TOKEN}&type=magiclink&next=/member/referrals`;
  const resp = await page.goto(authUrl, { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Auth redirect URL:', page.url());
  
  if (!page.url().includes('/member')) {
    console.error('Auth failed, on:', page.url());
    const body = await page.textContent('body');
    console.log('Body:', body?.slice(0, 300));
    await browser.close(); return;
  }

  // Ensure profile is bootstrapped
  await page.goto('http://localhost:3000/debug-auth', { waitUntil: 'networkidle', timeout: 10000 });

  // Navigate to referrals with all required params pre-filled
  const url = 'http://localhost:3000/member/referrals?loc=Weekly+Therapy&ct=Adult+Individual&pis=Anxiety&pay=Private+Pay&urg=Low+Urgency+-+needs+care+in+the+next+few+weeks&sub=1';
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Referrals URL:', page.url());

  await page.waitForTimeout(2000);

  const bodyText = await page.textContent('body') ?? '';
  const matchIdx = bodyText.indexOf('Matches');
  console.log('Matches context:', bodyText.slice(Math.max(0, matchIdx-20), matchIdx+300));

  // Screenshot top of results area
  await page.screenshot({ path: '/tmp/ref3_top.png', fullPage: false });
  
  // Scroll to show results and screenshot
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/ref3_results.png', fullPage: false });
  
  // Full page
  await page.screenshot({ path: '/tmp/ref3_full.png', fullPage: true });

  await browser.close();
  console.log('Screenshots saved: /tmp/ref3_*.png');
})();
