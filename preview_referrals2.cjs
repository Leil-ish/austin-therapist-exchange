const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  // Auth
  await page.goto('http://localhost:3000/auth/callback?token_hash=6a9829fbdbacddcf9f28709df39ffcb00ba1dbac348ca99b9a3b4e23&type=magiclink&next=/member/referrals', { waitUntil: 'networkidle', timeout: 30000 });
  await page.goto('http://localhost:3000/debug-auth', { waitUntil: 'networkidle', timeout: 15000 });
  await page.goto('http://localhost:3000/member/referrals', { waitUntil: 'networkidle', timeout: 30000 });
  console.log('URL:', page.url());

  // Select "Weekly Therapy" level of care (it's likely already selected as default or via a radio/button)
  // Look for the select elements
  const selects = await page.$$('select, [role="combobox"]');
  console.log('Found', selects.length, 'select/combobox elements');
  
  // Find level of care select - try selecting by label
  await page.selectOption('select', { label: 'Weekly Therapy' }).catch(async () => {
    // Try clicking the level of care buttons if they're radio buttons
    const btn = await page.$('button:has-text("Weekly Therapy")');
    if (btn) {
      await btn.click();
      console.log('Clicked Weekly Therapy button');
    }
  });

  await page.waitForTimeout(500);

  // Use URL approach to pre-fill all required params
  await page.goto('http://localhost:3000/member/referrals?loc=Weekly+Therapy&ct=Adult+Individual&pis=Anxiety&pay=Private+Pay&urg=Low+Urgency+-+needs+care+in+the+next+few+weeks', { waitUntil: 'networkidle', timeout: 30000 });
  
  await page.waitForTimeout(2000);

  // Screenshot showing form filled
  await page.screenshot({ path: '/tmp/ref_filled.png', fullPage: false });
  
  // Check what text is on page related to matches
  const text = await page.textContent('body');
  const matchIdx = text?.indexOf('Match') ?? -1;
  if (matchIdx >= 0) {
    console.log('Match context:', text?.slice(Math.max(0, matchIdx-30), matchIdx+200));
  }
  
  // Scroll down to results area and screenshot
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/ref_results.png', fullPage: false });
  
  // Try full page
  await page.screenshot({ path: '/tmp/ref_full.png', fullPage: true });

  await browser.close();
  console.log('Screenshots done');
})();
