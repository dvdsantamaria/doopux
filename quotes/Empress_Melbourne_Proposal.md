# Proposal: Empress Melbourne — Static Site Migration & CMS Integration

**Prepared for:** Grant, Empress Melbourne  
**Date:** May 2026  
**Prepared by:** Matt — Lead Developer & UX Specialist  
**Project:** Migration from Shopify to Cloudflare-hosted static site with Decap CMS

---

## 1. Executive Summary

This proposal covers the end-to-end migration of the Empress Melbourne website from Shopify to a static-site architecture hosted on Cloudflare, with Decap CMS (formerly Netlify CMS) for in-house content editing.

The scope assumes **22 static HTML pages** have already been designed and will be provided by the client. Our work is strictly **integration and CMS setup**, not design or frontend bug-fixing.

---

## 2. Scope of Work

### Phase 1 — Asset Preparation & CSS Consolidation (Day 1)
- Receive and audit all 22 HTML files.
- Extract shared CSS (navigation, footer, typography, buttons, design tokens) into a common layout/template.
- Leave page-specific CSS scoped to each template.
- **Note:** CSS re-adaptation is included in this quote.

### Phase 2 — Decap CMS Architecture & Configuration (Day 1–2)
Set up 6 CMS collections:

| Collection | Type | Pages Covered |
|---|---|---|
| **Home** | Singleton | `/` |
| **Pages** | Singletons | `/pages/frontpage`, `/pages/contact-us`, `/pages/brands` |
| **Legal** | Singletons | `/pages/privacy-policy`, `/pages/terms-and-conditions` |
| **Brands** | Folder | `/pages/alquema`, `/pages/brax`, `/pages/foil`, `/pages/fragonard`, `/pages/hanro`, `/pages/ivko`, `/pages/liverpool`, `/pages/yerse`, `/pages/zaket-plover`, `/pages/joseph-ribkoff`, `/pages/nydj`, `/pages/raffaello-rossi`, `/pages/regn`, `/pages/salus`, `/pages/vassalli`, `/pages/velvet` |
| **Settings** | Singleton | Global data (phone, address, hours, social links) |
| **Blog** *(Add-on)* | Folder | `/blogs/news/*`, `/blogs/latest-news/*` |

**Assumption:** All 16 brand pages share the exact same HTML structure. If any brand page deviates significantly, re-scoping may be required.

### Phase 3 — Template Development (Day 2–3)
- Build page templates that consume Decap-generated Markdown/YAML.
- Ensure templates handle **empty fields gracefully** without breaking the layout.
- Wire global settings (contact info, hours) into footer and contact sections.
- Integrate provided meta titles and descriptions from current Shopify SEO work.

### Phase 4 — Deploy & DNS Cutover (Day 4)
- Deploy to Cloudflare Pages with a temporary `.pages.dev` domain.
- Run mobile, link, form, and speed tests.
- Configure DNS cutover for `empressmelbourne.com.au`.
- Submit new sitemap to Google Search Console.
- Set up 301 redirects from old Shopify URLs.
- **Google Maps iframe will remain hardcoded** unless otherwise requested.

### Phase 5 — Stabilisation (Post-launch, 2–4 weeks)
- Monitor 404s and search performance.
- One round of minor CMS tweaks if needed.
- **Shopify cancellation only after 100% confirmation** that the new site is live and stable.

---

## 3. What Is Included

- Decap CMS setup with 6 collections (5 core + 1 optional Blog add-on).
- CSS consolidation into shared layout + page-specific scoping.
- Static site generation pipeline (11ty / Astro / equivalent).
- Cloudflare Pages deployment + DNS configuration.
- 301 redirect mapping from old Shopify URLs.
- Google Search Console re-verification + sitemap submission.
- Mobile responsiveness testing **within the constraints of the provided HTML**.
- Empty-field fail-safes in all templates.

---

## 4. What Is NOT Included (Exclusions)

To avoid scope creep, the following are explicitly excluded:

| Item | Status |
|---|---|
| **Frontend bug fixes / responsive fixes** in the provided HTML | Excluded — can be quoted separately if issues are found |
| **Image CDN / optimisation service** (Cloudinary, imgix, etc.) | Excluded — images must be uploaded at correct size via CMS |
| **Blog setup** | Excluded — available as an add-on |
| **Google Maps iframe editing** | Excluded — remains hardcoded unless requested |
| **Design changes or new page creation** | Excluded |
| **Copywriting or SEO strategy** | Excluded — existing meta data will be ported as-is |
| **Advanced image cropping / transforms** | Excluded — aspect ratios handled by frontend CSS only |

**Important:** Decap CMS outputs Markdown and frontmatter. If raw HTML is pasted into rich-text fields, it may break templates. Content must be entered as plain text or Markdown. We will enforce this via field configuration.

---

## 5. Assumptions

1. All 22 pages follow the same structural patterns demonstrated in the sample files (homepage split-hero, brand page split-hero, full-bleed secondary pages).
2. All 16 brand pages share an identical HTML structure.
3. Images will be provided at correct dimensions; the CMS will not perform server-side resizing.
4. The client will provide the complete set of 22 HTML files, plus any new images/assets, at project kickoff.
5. Domain DNS management is accessible and can be pointed to Cloudflare.

---

## 6. Timeline

| Phase | Duration |
|---|---|
| Asset prep & CSS consolidation | 1 day |
| CMS config & template build | 2 days |
| Deploy, DNS & testing | 1 day |
| **Total execution** | **4 business days** |
| Post-launch monitoring | 2–4 weeks |

---

## 7. Investment

**Total project fee: $700 AUD**

### Payment Schedule

| Milestone | Amount | Trigger |
|---|---|---|
| **Deposit** | 33% ($233.33) | Before work commences |
| **Mid-payment** | 33% ($233.33) | After homepage + 1 brand page + 1 legal page are integrated and demo-ready |
| **Final payment** | 34% ($233.34) | Upon final delivery, DNS cutover, and GSC verification |

*If engaging via Airtasker, the platform fee will be added to the total invoice.*

---

## 8. Add-Ons (Optional)

| Add-On | Est. Fee |
|---|---|
| Blog collection setup (`/blogs/news`, `/blogs/latest-news`) | $150 AUD |
| Image CDN integration (Cloudinary / Cloudflare Images) | $100 AUD |
| Frontend bug-fix / responsive repair block (5 hrs) | $200 AUD |
| Additional brand page template variations (if structure differs) | Quote on review |

---

## 9. Next Steps

1. Confirm acceptance of this proposal and assumptions.
2. Provide the full set of 22 HTML files + any new image assets.
3. Share Cloudflare / domain registrar access (or DNS instructions).
4. Kickoff call to confirm CMS field requirements (15 min).

---

**Best regards,**  
Matt  
Lead Developer & UX Specialist
