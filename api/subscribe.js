export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, tool, result } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const toolNames = {
    'mortgage': 'Mortgage Affordability',
    'compound-interest': 'Compound Interest',
    'debt-payoff': 'Debt Payoff',
    'tracker': '10/10/80 Budget Tracker'
  };

  const toolLabel = toolNames[tool] || 'Financial';

  let resultHtml = '';
  let extrasHtml = '';
  let emailSubject = `Your ${toolLabel} Report is Ready`;

  if (tool === 'mortgage' && result) {
    resultHtml = `
      <div style="padding: 16px; background: #F7F6F3; border-radius: 8px; margin-bottom: 16px;">
        <p style="font-size: 13px; color: #6B6B6B; margin: 0 0 4px;">Estimated max home price</p>
        <p style="font-size: 22px; font-weight: 600; margin: 0 0 12px;">$${(result.maxHomePrice || 0).toLocaleString()}</p>
        <p style="font-size: 13px; color: #444; margin: 0;">Monthly payment: $${(result.monthlyPayment || 0).toLocaleString()} · DTI: ${result.dti || 0}%</p>
      </div>`;

    // Personalized insight based on their actual DTI, not just a repeat of the number
    const dtiNote = (result.dti || 0) >= 44
      ? `Your number sits near the "Typical" approval range — where most real conventional approvals actually land, not just the conservative textbook number. If you're carrying other monthly debt (a car payment, student loans), paying that down before you apply could meaningfully raise this number, sometimes by tens of thousands of dollars on the same income.`
      : `Your number is on the conservative end, which usually means you have more room than this shows. It's worth knowing this isn't necessarily your ceiling — see the full breakdown of how debt and down payment size change your range below.`;

    extrasHtml = `
      <div style="padding: 20px; background: #EFF6FF; border-radius: 8px; margin-bottom: 20px;">
        <p style="font-size: 13px; color: #1E40AF; line-height: 1.6; margin: 0 0 16px;">${dtiNote}</p>
        <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #1E40AF; font-weight: 600; margin: 0 0 10px;">Worth reading next</p>
        <p style="font-size: 13px; margin: 0 0 8px;"><a href="https://financescored.com/home-buying.html" style="color: #2563EB; text-decoration: none;">→ How Much House Can You Really Afford? (full breakdown by DTI tier)</a></p>
        <p style="font-size: 13px; margin: 0 0 8px;"><a href="https://financescored.com/mortgage-application-checklist.html" style="color: #2563EB; text-decoration: none;">→ Mortgage Application Checklist: what you'll actually need</a></p>
        <p style="font-size: 13px; margin: 0 0 8px;"><a href="https://financescored.com/mortgage-broker-vs-bank-vs-lender.html" style="color: #2563EB; text-decoration: none;">→ Bank vs. Broker vs. Retail Lender: which one to use</a></p>
        <p style="font-size: 13px; margin: 0;"><a href="https://financescored.com/first-time-home-buyer-roadmap.html" style="color: #2563EB; text-decoration: none;">→ First-Time Home Buyer Roadmap: every step, in order</a></p>
      </div>`;

  } else if (tool === 'compound-interest' && result) {
    resultHtml = `
      <div style="padding: 16px; background: #F7F6F3; border-radius: 8px; margin-bottom: 16px;">
        <p style="font-size: 13px; color: #6B6B6B; margin: 0 0 4px;">Estimated future value</p>
        <p style="font-size: 22px; font-weight: 600; margin: 0 0 12px;">$${(result.futureValue || 0).toLocaleString()}</p>
        <p style="font-size: 13px; color: #444; margin: 0;">Total interest earned: $${(result.totalInterest || 0).toLocaleString()} over ${result.years || 0} years</p>
      </div>`;

    extrasHtml = `
      <div style="padding: 20px; background: #EFF6FF; border-radius: 8px; margin-bottom: 20px;">
        <p style="font-size: 13px; color: #1E40AF; line-height: 1.6; margin: 0;">One thing this calculator won't show you: starting the same contribution just 5 years earlier can add tens of thousands to the ending number by the same target date — not from contributing more, purely from extra time for compounding to work. Time in the market is the single biggest lever most people underuse, and it's the one thing you can't buy back later.</p>
      </div>`;
    // Note: no article link included here yet — the Investing silo (Simple vs. Compound
    // Interest, 401k/IRA/Roth) isn't built on the site yet. Add real links here once it is,
    // rather than linking to a page that doesn't exist.

  } else if (tool === 'debt-payoff' && result) {
    resultHtml = `
      <div style="padding: 16px; background: #F7F6F3; border-radius: 8px; margin-bottom: 16px;">
        <p style="font-size: 13px; color: #6B6B6B; margin: 0 0 4px;">Debt-free in</p>
        <p style="font-size: 22px; font-weight: 600; margin: 0 0 12px;">${Math.floor((result.months || 0) / 12)} yr ${(result.months || 0) % 12} mo</p>
        <p style="font-size: 13px; color: #444; margin: 0;">Total interest paid: $${(result.totalInterest || 0).toLocaleString()}</p>
      </div>`;

    extrasHtml = `
      <div style="padding: 20px; background: #EFF6FF; border-radius: 8px; margin-bottom: 20px;">
        <p style="font-size: 13px; color: #1E40AF; line-height: 1.6; margin: 0;">Every extra dollar you put toward this debt is a guaranteed return equal to its interest rate. Paying off a 20%+ APR card, for example, is mathematically similar to earning a risk-free 20% return — a bar almost no investment clears reliably. If you're deciding between paying extra here or investing instead, that comparison is usually the one that matters most.</p>
      </div>`;
    // Note: same as above — link to a dedicated Debt Payoff article once that silo is built.

  } else if (tool === 'tracker') {
    // No calculator result to show — this is the interactive tracker download flow.
    // The tracker itself lives as a static page on the site; the email just links to it,
    // so future updates to the tool don't require re-sending anything.
    emailSubject = 'Your 10/10/80 Budget Tracker Is Ready';
    resultHtml = `
      <div style="padding: 16px; background: #F7F6F3; border-radius: 8px; margin-bottom: 16px; text-align: center;">
        <p style="font-size: 13px; color: #6B6B6B; margin: 0 0 16px;">Your interactive tracker is ready whenever you are — bookmark it, it saves your progress right in your browser.</p>
        <a href="https://financescored.com/tools/10-10-80-tracker.html" style="display: inline-block; background: #2563EB; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
          Open Your Tracker →
        </a>
      </div>`;
  }

  // ---- Send the transactional email (unchanged pattern, works today) ----
  try {
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'FinanceScored <hello@resumescored.com>',
        to: email,
        subject: emailSubject,
        html: `
          <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #F7F6F3;">
            <div style="background: #1A1A1A; border-radius: 12px; padding: 40px; text-align: center; margin-bottom: 24px;">
              <h1 style="font-family: Georgia, serif; color: #fff; font-size: 2rem; font-weight: 400; margin: 0 0 8px;">
                Your ${toolLabel} ${tool === 'tracker' ? '' : 'Report'}
              </h1>
              <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin: 0;">
                Here ${tool === 'tracker' ? 'it is' : 'are your results'} from FinanceScored
              </p>
            </div>

            <div style="background: #fff; border-radius: 12px; padding: 32px; margin-bottom: 16px;">
              ${resultHtml}
              ${extrasHtml}
              <p style="font-size: 13px; color: #6B6B6B; line-height: 1.6; margin: 0;">
                This ${tool === 'tracker' ? 'tool' : 'estimate'} is a helpful starting point, but always confirm specifics with a licensed financial professional before making major decisions.
              </p>
            </div>

            <div style="text-align: center; padding: 24px 0 0;">
              <a href="https://financescored.com" style="display: inline-block; background: transparent; color: #2563EB; border: 1px solid #2563EB; padding: 11px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
                Explore more free tools →
              </a>
            </div>

            <p style="font-size: 11px; color: #9A9A9A; text-align: center; margin-top: 32px;">
              You received this because you requested this at FinanceScored.com<br>
              <a href="https://financescored.com" style="color: #9A9A9A;">financescored.com</a>
            </p>
          </div>
        `
      })
    });

    if (!emailResponse.ok) {
      const err = await emailResponse.text();
      console.error('Resend send error:', err);
      return res.status(500).json({ error: 'Email failed to send' });
    }

    // ---- NEW: save the contact so future marketing is actually possible ----
    // This is intentionally non-blocking for the response — if contact creation
    // fails, the user still gets their email; we just log it for follow-up
    // rather than showing them an error over a background list-building step.
    try {
      await fetch('https://api.resend.com/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          email: email,
          unsubscribed: false
          // If your Resend account still uses the older Audience-scoped model
          // instead of global Contacts, add: "audience_id": process.env.RESEND_AUDIENCE_ID
        })
      });
    } catch (contactErr) {
      console.error('Resend contact-save error (non-fatal):', contactErr);
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Subscribe handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
