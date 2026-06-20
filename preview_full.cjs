const { chromium } = require('playwright');

(async () => {
  const TOKEN = '6b7c85e41513cda6e3a8940723d330010704895f65b5cfdfc90ffbb5';
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  // Auth
  await page.goto(`http://localhost:3000/auth/callback?token_hash=${TOKEN}&type=magiclink&next=/member`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.goto('http://localhost:3000/debug-auth', { waitUntil: 'networkidle', timeout: 10000 });
  console.log('Logged in. Now testing referrals.');

  // Test 1: anxiety search → should show top matches + show-more
  await page.goto('http://localhost:3000/member/referrals?loc=Weekly+Therapy&ct=Adult+Individual&pis=Anxiety&pay=Private+Pay&urg=Low+Urgency+-+needs+care+in+the+next+few+weeks&sub=1', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  
  // Screenshot the Matches header area
  const header = await page.$('h2:has-text("Matches")');
  if (header) {
    await header.scrollIntoViewIfNeeded();
    console.log('Found Matches header');
  }
  await page.screenshot({ path: '/tmp/full_header.png' });

  // Click "Show N more"
  const showBtn = await page.$('button:has-text("Show")');
  if (showBtn) {
    const t = await showBtn.textContent();
    console.log('Show button text:', t);
    await showBtn.click();
    await page.waitForTimeout(600);
  }

  // Check for broader divider
  const dividerEl = await page.$('span:has-text("Broader matches")');
  console.log('Has broader divider:', !!dividerEl);

  // Scroll to bottom of list
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/full_bottom.png' });

  // Test 2: very specific search to get low-confidence/broader results
  // Use specific modality that few therapists have to force some broader results
  await page.goto('http://localhost:3000/member/referrals?loc=Residential+Treatment&ct=Child+Individual&pis=ADHD&ins=Aetna&age=Child+(0-12)&urg=Urgent+-+needs+care+in+the+next+few+days&sub=1&mods=EMDR', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  
  const body2 = await page.textContent('body') ?? '';
  const matchIdx2 = body2.indexOf('Matches');
  console.log('Test2 matches area:', body2.slice(Math.max(0, matchIdx2-10), matchIdx2+250));

  const divider2 = await page.$('span:has-text("Broader matches")');
  console.log('Test2 broader divider:', !!divider2);
  if (divider2) {
    await divider2.scrollIntoViewIfNeeded();
    await page.screenshot({ path: '/tmp/full_broader_divider.png' });
    console.log('Broader divider screenshot saved');
  }

  await page.screenshot({ path: '/tmp/full_test2.png', fullPage: false });

  await browser.close();
  console.log('All done');
})();
