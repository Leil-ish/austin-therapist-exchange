const { chromium } = require('playwright');

(async () => {
  const TOKEN = 'bcff23193ba40c51c04ef47d4e4dd5734530bdfddcc84c7dfe832b9f';
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  // Auth + bootstrap profile
  await page.goto(`http://localhost:3000/auth/callback?token_hash=${TOKEN}&type=magiclink&next=/member`, { waitUntil: 'networkidle', timeout: 30000 });
  console.log('Post-auth URL:', page.url());
  if (!page.url().includes('/member')) {
    console.error('Auth failed'); await browser.close(); return;
  }
  await page.goto('http://localhost:3000/debug-auth', { waitUntil: 'networkidle', timeout: 10000 });
  const debugBody = await page.textContent('body');
  console.log('debug-auth:', debugBody?.slice(0, 120));

  // ── Test 1: Standard search — verify confidence-tier sort ──────────────
  await page.goto(
    'http://localhost:3000/member/referrals?loc=Weekly+Therapy&ct=Adult+Individual&pis=Anxiety&pay=Private+Pay&urg=Low+Urgency+-+needs+care+in+the+next+few+weeks&sub=1',
    { waitUntil: 'networkidle', timeout: 30000 }
  );
  await page.waitForTimeout(2000);

  const body1 = await page.textContent('body') ?? '';
  // Extract confidence badges from the result list area
  const matchIdx = body1.indexOf('Matches');
  const resultSnippet = body1.slice(matchIdx, matchIdx + 800);
  console.log('\n=== Test 1 (Anxiety/Weekly): first 800 chars after Matches header ===');
  console.log(resultSnippet);

  // Check for broader divider
  const divider1 = await page.$('span:has-text("Broader matches")');
  console.log('Broader divider present:', !!divider1);

  await page.screenshot({ path: '/tmp/trust_t1_top.png', fullPage: false });
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/trust_t1_mid.png', fullPage: false });

  // ── Test 2: Show all, then look for "Broader matches" divider ────────────
  const showBtn = await page.$('button:has-text("Show")');
  if (showBtn) {
    const btnText = await showBtn.textContent();
    console.log('\nShow-more button:', btnText);
    await showBtn.click();
    await page.waitForTimeout(800);

    const divider2 = await page.$('span:has-text("Broader matches")');
    console.log('Broader divider after show-all:', !!divider2);
    if (divider2) {
      await divider2.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.screenshot({ path: '/tmp/trust_t1_divider.png', fullPage: false });
      console.log('Divider screenshot saved');
    }

    // Screenshot the bottom of the full list
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    await page.screenshot({ path: '/tmp/trust_t1_bottom.png', fullPage: false });
  }

  // ── Test 3: Specific/narrow search — more likely to get low-confidence ──
  await page.goto(
    'http://localhost:3000/member/referrals?loc=Weekly+Therapy&ct=Couples&pis=Infidelity+%2F+Affairs&pay=Private+Pay&urg=Urgent+-+needs+care+in+the+next+few+days&sub=1',
    { waitUntil: 'networkidle', timeout: 30000 }
  );
  await page.waitForTimeout(2000);

  const body3 = await page.textContent('body') ?? '';
  const m3 = body3.indexOf('Matches');
  console.log('\n=== Test 3 (Couples/Infidelity) ===');
  console.log(body3.slice(m3, m3 + 600));

  const div3 = await page.$('span:has-text("Broader matches")');
  console.log('Broader divider present:', !!div3);
  if (div3) {
    await div3.scrollIntoViewIfNeeded();
    await page.screenshot({ path: '/tmp/trust_t3_divider.png', fullPage: false });
  }
  await page.screenshot({ path: '/tmp/trust_t3.png', fullPage: false });

  // Show all for test 3
  const showBtn3 = await page.$('button:has-text("Show")');
  if (showBtn3) {
    await showBtn3.click();
    await page.waitForTimeout(600);
    const div3b = await page.$('span:has-text("Broader matches")');
    console.log('Broader divider after show-all (test3):', !!div3b);
    if (div3b) {
      await div3b.scrollIntoViewIfNeeded();
      await page.screenshot({ path: '/tmp/trust_t3_divider_showall.png', fullPage: false });
      console.log('Test3 divider screenshot saved');
    }
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await page.screenshot({ path: '/tmp/trust_t3_bottom.png', fullPage: false });
  }

  await browser.close();
  console.log('\nAll screenshots done.');
})();
