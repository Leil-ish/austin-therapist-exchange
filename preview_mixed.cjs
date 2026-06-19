const { chromium } = require('playwright');

(async () => {
  const TOKEN = 'a1df5ea7ac55db7c798bf98e1253e1fd77bf2f5ffa88f5243031a958';
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  // Auth
  await page.goto(`http://localhost:3000/auth/callback?token_hash=${TOKEN}&type=magiclink&next=/member`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.goto('http://localhost:3000/debug-auth', { waitUntil: 'networkidle', timeout: 10000 });
  console.log('Logged in.');

  // Use Group Therapy + rare focus to produce mixed high/low results
  // Group therapy with a niche focus that few therapists have will produce low-confidence for most
  await page.goto('http://localhost:3000/member/referrals?loc=Group+Therapy&ct=Adult+Individual&gf=Grief+%2F+Loss&fmt=Telehealth&pay=Private+Pay&urg=Low+Urgency+-+needs+care+in+the+next+few+weeks&sub=1', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  const body = await page.textContent('body') ?? '';
  const matchIdx = body.indexOf('Matches');
  console.log('Search 1:', body.slice(Math.max(0, matchIdx-10), matchIdx+500));

  const divider = await page.$('span:has-text("Broader matches")');
  console.log('Has broader divider:', !!divider);
  await page.screenshot({ path: '/tmp/mix1.png', fullPage: false });

  // Also try IOP with Aetna (insurance + specialty combo)
  await page.goto('http://localhost:3000/member/referrals?loc=Intensive+Outpatient+(IOP)&ct=Adult+Individual&pis=Trauma%2FPTSD&ins=Aetna&urg=Urgent+-+needs+care+in+the+next+few+days&sub=1', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  const body2 = await page.textContent('body') ?? '';
  const matchIdx2 = body2.indexOf('Matches');
  console.log('Search 2 (IOP+Aetna):', body2.slice(Math.max(0, matchIdx2-10), matchIdx2+500));
  const divider2 = await page.$('span:has-text("Broader matches")');
  console.log('Search 2 has broader divider:', !!divider2);
  if (divider2) {
    await divider2.scrollIntoViewIfNeeded();
    await page.screenshot({ path: '/tmp/mix2_divider.png' });
  }
  await page.screenshot({ path: '/tmp/mix2.png', fullPage: false });

  await browser.close();
  console.log('Done');
})();
