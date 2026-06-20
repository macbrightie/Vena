# Lead Magnet System
### A Build Spec for an AI System — Compiled from Source Material

This document compiles every lead-magnet, funnel, and email-monetization principle found in the source material into a buildable spec. It's structured so an AI system can use it as an input/output blueprint: what a lead magnet needs to contain, where it lives, how it's distributed, and how it converts to revenue.

---

## 1. The Revenue Bridge (Where the Lead Magnet Sits)
**Source: LARA Strategies**

A lead magnet is never the end goal — it's one link in a four-step chain the source calls the "revenue bridge." Content alone does not convert; the lead magnet is what bridges attention into an owned channel (email) where the actual selling happens.

| Step | Function |
|---|---|
| 1. Content | Attracts the right people (educational, story, case-study posts). |
| 2. Profile | Converts attention into followers — your profile/headline/banner must make it instantly obvious who you help and how. |
| 3. Lead magnet | Converts followers into email subscribers by capturing their email in exchange for solving one specific problem. |
| 4. Email | Where the actual sales happen — described as where **70–80% of revenue** is generated, not LinkedIn directly. |

**Key takeaway for the AI system:** every lead magnet output needs to be designed as a deliberate handoff into an email sequence — the lead magnet itself is not where conversion happens; the emails that follow it are.

---

## 2. Core Principles of a Good Lead Magnet
**Source: LARA Strategies**

- **Solve one problem for one person, incredibly well.** That is the entire bar for a lead magnet to be effective — not production value, not design.
- **It does not need to be "hyper-designed."** It doesn't need to live in a polished Canva pitch-deck format. Simplicity is explicitly fine.
- **Build time should be short.** The best-performing lead magnets referenced took anywhere from under 30 minutes, to a few hours, to a few days — never described as a long production project.
- **The lead magnet's job is capture, not conversion.** Conversion to paying client comes from the emails sent after the lead magnet, not from the lead magnet content itself.

---

## 3. Two Required Placements for Every Lead Magnet
**Source: LARA Strategies**

### A. The weekly lead magnet post
One post per week should exist purely to drive opt-ins to the lead magnet (this is the "1" in the 4-3-2-1 content framework — see the Post Playbook document). It uses the PASS structure with an explicit, single CTA (comment a keyword / click a link) per the ending rules in that document.

### B. The permanent, always-on profile placement
A lead magnet should also live permanently on the profile so it's discoverable any time, not just the week it was posted.

- **Do not just pin the one viral post you had.** This is flagged as the single most common mistake — 99% of users pin their best post and leave it there forever, which wastes the most prominent real estate on the profile.
- **Use the Featured section instead.** It has far more potential than a pinned post — it should be used to drive traffic to the actual offer (the lead magnet or service), not to a one-off post that, at best, gets a single like from a profile visitor.

---

## 4. Lead Magnet Content Architecture
**Source: Ayman Strategies (long-form free-resource structure, adapted from the equivalent "free course" format)**

The source material includes a detailed structure for a long-form free resource (a "free course") designed to build trust and pre-sell a paid offer. The same Hook / Body / CTA architecture applies directly to a written or video lead magnet.

### Hook (opening of the lead magnet itself)
- State plainly that this resource gives the reader everything they need on the specific topic — don't hold back the promise.
- Include social proof immediately: a specific result you've gotten, plus proof you can replicate it for others ("I scaled from this to that in this time frame, and I've also helped X and Y get this result").
- State that the method is current/repeatable, not an outdated thing you did "back in the day."

### Body (the actual value delivery)
- **Be a 97% open book.** Give away almost everything — people pay for execution, hand-holding, and "permission" (being told "yes, do that" for their specific situation), not for information scarcity.
- **Gatekeep only 1–2 specific assets.** Keep back only the few things that are genuinely your unique mechanism — e.g. the exact outreach script, or your specific project-management/automation system. Everything else can be taught in full.
- **Use a visual aid / walkthrough format where possible** (screen-share style over straight talking-head) — info-dense material is easier to follow with something to look at, which is also why an attached image/visual matters for written lead-magnet posts (see Post Playbook, Section 8).
- **Length:** for a long-form resource (a "free course" style lead magnet), the tested sweet spot is roughly **60–90 minutes** of content — shorter versions were tested but the longer format performed better for this specific format. A shorter lead magnet (a checklist, template, swipe file) does not need to hit this length — this guidance applies specifically to in-depth, trust-building resources.

### CTA (inside and at the end of the lead magnet)
Don't save the CTA only for the very end — drop an early, soft CTA within roughly the **first 8 minutes** of a long-form resource (average watch/read time tends to fall in the 8–16 minute range), then close with a clear final CTA.

The closing CTA should present three honest paths and let the reader self-select, rather than hard-selling once:

1. **Do nothing now** ("save this for later") — acknowledged as the most common, lowest-friction default.
2. **Do it yourself, slower, without support** — true, but acknowledge the time cost (could take years to get the same result alone).
3. **Shortcut it by working with you** — the paid offer, explained briefly and concretely (what's included, what they get access to).

Keep the actual CTA language short, concrete, and almost "scripted" in its simplicity — literally tell people what to click and what happens next. Always include a short transition sentence before pivoting into the CTA so it doesn't feel abrupt (this mirrors the Post Playbook's ending guidance).

---

## 5. Distribution After Capture
**Source: Ayman Strategies + LARA Strategies**

- **Email nurture sequence (primary).** Once someone opts in, they should be entered into an email flow. The email list — not the platform — is where most revenue is made; email weekly and offer something whenever there's a launch, a new cohort/spot, or a relevant resource.
- **Manual warm-up sending.** Beyond automated flows, manually re-sending a relevant resource to warm leads (no-shows, people who opted in but didn't book a call, stalled prospects) is called out as highly effective — it re-engages someone with proof/value right before or after a sales touchpoint, without being so frequent it becomes annoying.
- **Cross-platform promotion.** Share/repurpose the lead magnet (or a teaser of it) across other platforms the same audience is on. For giveaway-style promotion on LinkedIn specifically, sending it out manually is recommended over automation tools, due to platform risk (account restrictions) associated with automated DMs/comment-triggers.
- **Newsletter cross-promotion.** Whenever new content or a lead magnet goes out, promote it in the regular newsletter too — even a newsletter used only to promote new content will outperform not mailing the list at all.

---

## 6. Build Spec — Inputs & Outputs for an AI Lead-Magnet System

This section translates the above into a concrete spec an AI system can implement: what to ask the user, and what to generate.

### Required inputs from the user

| Field | Purpose |
|---|---|
| Niche / industry | Determines vocabulary, examples, and credibility signals. |
| Specific ICP (one person, not a broad market) | Lead magnets must solve one problem for one person — this field forces specificity. |
| The one problem being solved | The entire premise of the lead magnet; should be narrow and concrete, not broad. |
| Proof / social proof the user has | Used to write the Hook of the lead magnet (results achieved, people helped). |
| The 1–2 things to gatekeep | What stays exclusive to the paid offer — used to scope the Body so it doesn't give away the core paid mechanism. |
| Format preference | Checklist / template / swipe file / short guide vs. long-form "free course" — determines target length and depth. |
| The paid offer it should bridge to | Used to write the 3-path CTA at the end. |

### System output structure

1. **Hook block:** promise statement + social proof line(s).
2. **Body outline:** 2–5 main teaching points (mirroring the "two-to-three main points" body-structuring rule), each broken into bullet-style sub-points rather than a verbatim script, so a human can deliver it naturally rather than reading robotically.
3. **Gatekeep flag:** explicit marker in the outline showing which 1–2 elements are intentionally left out or only summarized.
4. **Early soft-CTA insertion point:** flagged roughly at the 1/8 mark of the resource for long-form formats.
5. **Closing 3-path CTA block:** Path 1 (do nothing), Path 2 (DIY, slower), Path 3 (work with you) — auto-filled using the user's paid-offer input.
6. **Distribution checklist:** auto-generated reminder list — add to email welcome flow, set a manual-resend trigger for stalled leads, add to Featured section, schedule a cross-platform repost.
7. **Linked weekly promo post:** a PASS-framework LinkedIn post (per the Post Playbook) that drives opt-ins, generated alongside the lead magnet itself.

### Quality checks the system should run before finalizing output

- Is the problem statement narrow enough to be "one problem for one person," not a broad topic?
- Does the Hook include a specific, stated result (not just a vague promise)?
- Is at least one specific element clearly gatekept rather than the whole system being given away?
- Does the CTA present a genuine choice (3 paths) rather than a single hard pitch?
- Is there a follow-up email sequence attached, since the lead magnet itself is not where conversion happens?

---

## 7. Reference Numbers From the Source
**Source: LARA Strategies**

| Metric | Value cited in source |
|---|---|
| Share of revenue from email vs. LinkedIn directly | 70–80% from email |
| Lead magnet build time (typical) | 30 minutes to a few hours; some took a few days |
| Lead magnet posting cadence | 1x per week (the "1" in the 4-3-2-1 content framework) + always-on permanent placement |
| What converts the lead, ultimately | The email sequence after opt-in, not the lead magnet content itself |
