
# SAFE-PERSONAL-WEBSITE-SPEC
Project: Personal Skill Showcase Website
Purpose: Build a clear, honest, developer-focused personal website WITHOUT exaggeration or unsafe assumptions
Framework Target: Static Website / Next.js (Optional)
Language Chat : Indonesian

==================================================
GLOBAL RULES (NON-NEGOTIABLE)
==================================================

YOU MUST FOLLOW ALL RULES BELOW.

1. DO NOT invent skills, experiences, or achievements
2. DO NOT exaggerate proficiency levels
3. DO NOT add fake metrics, testimonials, or logos
4. DO NOT add animations unless explicitly specified
5. DO NOT add tracking, analytics, or cookies
6. DO NOT add backend logic
7. DO NOT assume authentication or dashboards
8. DO NOT collect user data
9. OUTPUT MUST BE STATIC WEBSITE ONLY
10. CLARITY, HONESTY, AND TRUST > VISUAL FANCINESS

==================================================
OBJECTIVE
==================================================

Create a personal website that:

- Clearly communicates who I am
- Shows what skills I actually have
- Demonstrates how I think and work
- Builds trust with technical and non-technical visitors
- Makes it easy to contact me (without forms or submission logic)

Primary goal:
➡️ Credibility and clarity

Secondary goal:
➡️ Opportunity discovery (jobs, freelance, collaboration)

==================================================
NON-GOALS
==================================================

This website MUST NOT:

- Act as a resume replacement
- Act as a blog platform
- Include fake storytelling or marketing hype
- Claim expertise without evidence
- Include complex UI interactions
- Include SEO hacks or keyword stuffing

==================================================
ASSUMPTIONS
==================================================

- Visitors include recruiters, founders, collaborators, or clients
- Visitors may not be technical
- Visitors scan first, read later
- Trust is built through clarity, not buzzwords

==================================================
LAYER 1 — ARCHITECTURE
==================================================

### Page Type
- Single-page personal website
- Vertical scroll
- Section-based layout

### Sections Order (STRICT)

1. Hero / Introduction
2. About Me
3. Skills
4. Experience / Work
5. Projects / Case Studies
6. How I Work
7. Tools & Stack
8. Availability / Opportunities
9. Contact
10. Footer Micro Copy

### Layout Principles
- Max width container
- Strong typography hierarchy
- Minimal color palette
- Mobile-first responsive design

### Trust Boundaries
- No data submission
- Contact links only (email / social)
- No tracking pixels
- No hidden scripts

⛔ STOP — HUMAN REVIEW REQUIRED

==================================================
LAYER 2 — CONTENT CONTRACT
==================================================

### HERO / INTRODUCTION

Required Elements:
- Name
- Primary role (one clear sentence)
- Short positioning statement

Rules:
- No buzzwords
- No inflated titles
- One sentence maximum for role

--------------------------------------------------

### ABOUT ME

Purpose:
Explain who I am and what I care about professionally.

Rules:
- Written in first person
- Honest tone
- No life story
- Focus on work mindset and values

--------------------------------------------------

### SKILLS

Skill Categories:
- Technical skills
- Non-technical skills (optional)

Rules:
- Skills must be grouped
- No percentage bars
- No "expert / guru" labels
- If listed, skill must be defensible in conversation

--------------------------------------------------

### EXPERIENCE / WORK

Content:
- Roles or types of work done
- Context instead of company prestige

Rules:
- Focus on responsibility, not title
- No inflated impact claims
- No fake numbers

--------------------------------------------------

### PROJECTS / CASE STUDIES

For each project:
- What problem it solves
- What I did
- What I learned

Rules:
- No confidential information
- No NDA violations
- Screenshots optional, not required
- Clarity over completeness

--------------------------------------------------

### HOW I WORK

Purpose:
Show thinking style and collaboration approach.

Examples:
- How I approach problems
- How I communicate
- How I handle feedback

Rules:
- Process > personality
- No buzzwords

--------------------------------------------------

### TOOLS & STACK

Content:
- Languages
- Frameworks
- Tools

Rules:
- Only tools actually used
- Group by category
- No logo wall required

--------------------------------------------------

### AVAILABILITY / OPPORTUNITIES

Content:
- What type of work I’m open to
- What I’m NOT looking for (optional)

Rules:
- Clear boundaries
- No desperation language

--------------------------------------------------

### CONTACT

Contact Methods:
- Email link
- Social links (GitHub, LinkedIn, etc.)

Rules:
- No contact forms
- No submission logic
- Links only

--------------------------------------------------

### FOOTER MICRO COPY

Allowed:
- Short principle or belief
- Copyright notice
- Tech stack used (optional)

==================================================
LAYER 3 — IMPLEMENTATION RULES
==================================================

- Use semantic HTML
- Use accessible headings
- No client-side state
- No animations by default
- Links only, no forms
- Tailwind or basic CSS allowed
- No JavaScript logic beyond layout

==================================================
SECURITY CHECKLIST
==================================================

- No inline scripts
- No external tracking
- No environment variables
- No cookies
- No user input handling

==================================================
FINAL WARNING
==================================================

If any information is missing:
DO NOT GUESS.

Leave placeholders or request human input.

HONESTY BUILDS TRUST.
ASSUMPTIONS DESTROY IT.

END OF DOCUMENT
