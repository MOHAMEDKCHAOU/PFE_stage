# Faymoos: practical route to revenue

Faymoos should not be sold as "another portfolio builder". That market is crowded and price-sensitive. The commercial product is:

> **interactive proof + guided conversion + Smart 360 + leads + measurable optimization**.

## Beachhead customer

Start with **real-estate agencies, interior designers and architecture studios**. They already need visual proof, frequently sell high-value work, and a Smart 360 space has an obvious reason to exist.

Do not market to every creator at launch. A narrow problem is easier to explain, price and sell.

## Paid offers

### Free
Acquisition and product-led trial. Faymoos branding, limited presences/experiences, basic analytics, 1 Smart Scan credit and limited AI.

### Pro — launch default €19/month
For independent designers/consultants/creators. Premium branding, richer analytics, AI Copilot and 2 Smart Scan credits/month.

### Studio — launch default €69/month
For agencies. Client workspaces, invitation flows, reports, 12 Smart Scan credits/month and larger AI/export quotas.

### Studio+ — launch default €179/month
For higher-volume agencies. More clients, 50 Smart Scan credits/month, larger AI quotas and priority workflow.

These prices are hypotheses, not market facts. Validate them with real checkout experiments and interviews.

## Expansion revenue

1. **Smart Scan credit packs** after the included monthly quota. This protects gross margin because reconstruction has a real compute/storage cost.
2. **Done-for-you onboarding** for agencies: configure branding, import portfolio, create templates and train the team.
3. **Custom domain / white-label** as retention features on paid tiers.
4. **Premium vertical templates**: property tour, architecture case study, gallery/showroom, hospitality venue.
5. **Extra client seats/workspaces** for agencies.
6. **CRM/webhook integrations** on Studio tiers.
7. Only later: **transaction/booking fee** if Faymoos itself processes payments or bookings. Do not tax transactions Faymoos does not actually facilitate.

## The sales story

Do not demo menu items. Demo an outcome:

1. scan a property/project space;
2. add proof and a CTA;
3. publish a branded interactive page;
4. a visitor explores it and requests a quote/visit;
5. the lead appears in Faymoos;
6. analytics show which rooms/projects/branches produced action.

That is much easier to pay for than "identity CRUD + capsules + AI".

## 90-day launch motion

### Days 1–30: prove activation
- Recruit a small set of design/real-estate pilot users.
- Personally onboard them.
- Measure time from signup to first published experience/Smart Space.
- Record every point where users ask "what do I do now?" and remove it from the UI.
- Do not optimize acquisition yet.

### Days 31–60: prove willingness to pay
- Turn on real Stripe prices.
- Offer Free and Pro self-service.
- Sell Studio directly to agencies.
- Test annual billing and paid onboarding.
- Track why trials upgrade or refuse.

### Days 61–90: repeat the winning use case
- Keep the best-performing vertical and template.
- Publish before/after case studies using real customer permission.
- Add referral links to published Faymoos spaces.
- Add only integrations requested by multiple paying customers.

## Metrics that actually matter

- Activation: signup → first published Presence/Experience/Smart Space.
- Scan success: Smart Scan started → reconstruction ready without full rescan.
- Visitor → CTA action rate.
- Visitor → lead rate.
- Trial → paid conversion.
- Smart Scan compute/storage cost per successful space.
- Gross margin by plan.
- Monthly paid churn.
- Expansion revenue from extra scans/seats.

Vanity page views are not a business model. Leads, paid retention and healthy scan economics are.

## Unit-economics guardrail

Smart Scan must be credit-based until real processing cost is known. Log per job:

- input frames/bytes,
- CPU/GPU seconds,
- output storage,
- retries/rescans,
- egress,
- support intervention.

Once enough real jobs exist, set included scan credits so the paid plan retains a strong gross margin. This is why the codebase now tracks monthly Smart Scan and AI usage separately.

## Positioning sentence

> **Faymoos turns your work into an interactive presence that proves what you do, guides each visitor to the right action, and shows you what actually converts.**

For the first vertical:

> **Create an interactive property/project experience from your portfolio and a guided Smart 360 scan, then capture and understand every serious lead.**
