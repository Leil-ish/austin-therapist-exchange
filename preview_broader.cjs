const { chromium } = require('playwright');

(async () => {
  // Use existing cookies from previous session by reusing ctx
  const TOKEN = 'd980c668a2f19318fe9c78b7c0dee5423034d2e1f768ecccb8b495d7';
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  // Try to reuse auth by going through debug-auth (session cookie should still exist)
  await page.goto('http://localhost:3000/debug-auth', { waitUntil: 'networkidle', timeout: 10000 });
  const debugBody = await page.textContent('body');
  const userId = JSON.parse(debugBody || '{}').userId;
  console.log('userId:', userId);

  if (!userId) {
    console.log('Not logged in, stopping');
    await browser.close(); return;
  }

  // Use a very specific search that might hit some low-confidence (broader) results
  // Residential treatment would typically produce more varied confidence
  const url = 'http://localhost:3000/member/referrals?loc=Residential+Treatment&ct=Adult+Individual&pis=Trauma%2FPTSD&ins=Aetna&age=Adult+(18%2B)&urg=Urgent+-+needs+care+in+the+next+few+days&sub=1';
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  const bodyText = await page.textContent('body') ?? '';
  const matchIdx = bodyText.indexOf('Match');
  console.log('Match area:', bodyText.slice(Math.max(0, matchIdx-20), matchIdx+400));

  await page.screenshot({ path: '/tmp/ref_broader1.png', fullPage: true });
  
  // Try "Show more" on the original Anxiety search 
  const url2 = 'http://localhost:3000/member/referrals?loc=Weekly+Therapy&ct=Adult+Individual&pis=Anxiety&pay=Private+Pay&urg=Low+Urgency+-+needs+care+in+the+next+few+weeks&sub=1';
  await page.goto(url2, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);

  // Click "Show more"
  const showMoreBtn = await page.$('button:has-text("Show")');
  if (showMoreBtn) {
    const btnText = await showMoreBtn.textContent();
    console.log('Show more button:', btnText);
    await showMoreBtn.click();
    await page.waitForTimeout(800);
    await page.evaluate(() => window.scrollTo(0, 2000));
    await page.waitForTimeout(300);
    await page.screenshot({ path: '/tmp/ref_showmore.png', fullPage: false });
    // Look for divider
    const divider = await page.$('text=Broader matches');
    console.log('Has broader divider:', !!divider);
    if (divider) {
      await divider.scrollIntoViewIfNeeded();
      await page.screenshot({ path: '/tmp/ref_divider.png', fullPage: false });
    }
  }

  await browser.close();
  console.log('Done');
})();
