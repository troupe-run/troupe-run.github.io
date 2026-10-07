# troupe brand guide

This is the reference for anything that carries the troupe brand: the site, the docs, GitHub, slides and
social posts. If something here is wrong or missing, fix this file first, then the thing you were making.

- **Direction:** "Matinee". Playful, characterful and warm, with geometric characters, light by default.
- **Status:** v0.1, 2026-10-07. The colours, type, metaphor rule and voice are decided. The mark's exact
  geometry is set when its SVG is first drawn; the values below are the starting point.
- **Owner:** hps.gd.

## 1. Name

- The product is **troupe**, always lowercase, including at the start of a sentence and in headings.
- **troupe.run** is the website and domain. Use it when you mean the site, not the product.
- Attribution is "a project by hps.gd", with hps.gd written as a domain.
- Don't attach suffixes or invented forms ("Troupe AI", "trouping"). Don't refer to predecessor projects.

## 2. The mark and wordmark

- **The mark** is three heads in a row, like a cast at a curtain call:
  1. a **lilac circle**: a human;
  2. a **teal rounded square**: an agent;
  3. a **tomato circle**: the brand colour.
- **The wordmark** is "troupe" in Bricolage Grotesque, weight 800, lowercase, tracking −0.02em.
- **Lock-up:** the mark sits to the left of the wordmark, centred vertically on the x-height.
- **Starting geometry**, where h is the height of one head:
  - all three heads are the same height, h, and share a baseline;
  - the gap between heads is 0.25h;
  - the corner radius of the agent square is 0.28h.
- **Clear space:** keep one head's width (h) clear on every side of the mark or lock-up.
- **Small sizes:**
  - Below 24px wide, use the **two-head mark**: the lilac circle and the teal square.
  - The favicon is always the two-head mark.
- **Don't:**
  - recolour the heads, or change their order or shapes;
  - add outlines, shadows or gradients;
  - set the wordmark in any other face;
  - stretch or rotate the mark;
  - put the light mark on a mid-tone background.

## 3. Colour

The tokens are CSS custom properties. The dark values apply under `prefers-color-scheme: dark` and under
an explicit dark theme.

| Token | Role | Light | Dark |
|---|---|---|---|
| `--bg` | Page background (cream) | `#FFF8EE` | `#1A1830` |
| `--surface` | Cards and panels | `#FFFFFF` | `#24213F` |
| `--ink` | Body text, headings | `#1D1B2F` | `#FFF4E2` |
| `--muted` | Secondary text | `#4A4760` | `#C9C2D8` |
| `--tomato` | Brand. Fills, large shapes, curtain | `#FF5A3C` | `#FF7A5F` |
| `--tomato-text` | Tomato for text and small UI | `#CE3D21` | `#FF8E76` |
| `--teal` | Agents | `#14857D` | `#3CC7BC` |
| `--teal-text` | Teal for text | `#137E76` | `#3CC7BC` |
| `--lilac` | Humans | `#7461D9` | `#A79AF0` |
| `--lilac-text` | Lilac for text | `#715ED8` | `#A79AF0` |
| `--sunflower` | Highlights, the curtain trim, badges | `#FFC93C` | `#FFD666` |

**Rules:**
- **Teal means agents and lilac means humans, everywhere.** Never swap them, and don't use either one for
  anything unrelated to agents or humans.
- **Tomato is the brand and the call to action.** Use it for one primary action per view.
- **Text colour:**
  - Body text is always `--ink` or `--muted`.
  - Coloured text uses only the `-text` tokens.
  - In light mode, `--tomato` and `--sunflower` are never used for text.
- **Buttons:**
  - A tomato button takes ink text (contrast 5.4:1).
  - Don't put white text on `--tomato` (3.1:1).
  - If white text is needed, fill with `--tomato-text` instead (4.9:1).
- **Sunflower is decoration only:** no text on the cream background, and never the only signal of meaning.
  Ink text on a sunflower badge is fine (10.9:1).
- **The `-text` token values were adjusted on 2026-10-07.**
  - The original "text-safe" values from the Matinee direction were `#D63F22` (4.34:1 on `--bg`), and
    teal and lilac at 4.25 and 4.47. All three failed WCAG AA for body-size text.
  - The current values are the nearest of the same hue that reach at least 4.6:1 on `--bg`.

**Measured contrast in light mode** (WCAG; AA needs 4.5:1 for normal text and 3:1 for large text and UI):

| On `--bg` | Ratio | On `--bg` | Ratio |
|---|---|---|---|
| `--ink` | 15.9 | `--teal-text` | 4.66 |
| `--muted` | 8.4 | `--lilac-text` | 4.64 |
| `--tomato-text` | 4.62 | `--tomato` (shapes only) | 2.94 |

**Dark mode:** every listed text colour measures above 6:1 on both dark backgrounds.

## 4. Type

| Use | Face | Weights | Notes |
|---|---|---|---|
| Display: headings, wordmark, step names | **Bricolage Grotesque** | 700–800 | Tracking −0.02em, line-height about 1.1 |
| Body, UI | **DM Sans** | 400, 600 | Line-height about 1.55, measure at most 65ch |
| Code, labels, eyebrows | **DM Mono** | 400, 500 | 500 is the heaviest cut that exists; don't fake bold |

- **Eyebrows** (the small label above a section heading): DM Mono, 11–12px, uppercase, tracking +0.06em,
  `--tomato-text`.
- **Docs sidebar section labels** ("Programme", "Opening night", and so on):
  - DM Mono 500, 17px, `--tomato-text`, sentence case;
  - a 2px divider and roughly 26px of space above each label;
  - no subtitle under the label.
- All three faces are on Google Fonts under the OFL licence. Self-host them in the site build.

## 5. Characters and illustration

- **The cast:**
  - humans are **circles**, in lilac;
  - agents are **rounded squares**, in teal.
  - The shape tells you which is which, and so does the colour; never rely on colour alone.
- **Style:**
  - flat geometry, with no outlines, gradients or drop shadows;
  - faces are optional and minimal: two dots at most;
  - props (a tick, a diff, a clipboard) are simple shapes in `--ink` or `--sunflower`.
- **One character per section, doing that section's job.** For example, a reviewer circle holding a tick,
  or an agent square carrying a diff.
- **Stage devices** are the curtain (a tomato and tomato-text stripe with a sunflower trim), the spotlight (a
  soft sunflower radial wash) and the curtain-call line-up. Use at most one device per section.
- **Motion:**
  - Characters may "bow" on hover: a small dip and tilt of about 200ms.
  - Nothing moves on its own.
  - Every animation is turned off under `prefers-reduced-motion`.

## 6. The theatre metaphor

**The rule: theatre in headings and visuals, plain words in body copy.** One stage device per section.
Every sentence should still say what troupe does to someone who skips the headings.

**Product vocabulary.** Use these terms with their exact meanings:

| Term | Meaning | Status |
|---|---|---|
| theatre | A project: a directory with troupe config | In use |
| role | A job in your process (product owner, engineer, reviewer) | In use |
| actor | Whoever holds a role: an agent or a person | In use |
| performance | One run of your process | In use |
| cast | The actors assigned to a performance | Reserved |
| notes | What's learned from a run and fed into the next | Landing-page term, 2026-10-07 |
| guest | An installable pack | Decided "for now" |
| the house | The daemon | Suggested, not agreed. Mark it "TBC" where it appears |
| house rules | Effect policy | Suggested, not agreed |
| ~~repertoire~~, ~~rep~~, ~~company~~ (as a product noun) | — | Rejected |

- **Docs section labels** may be theatrical: Programme, Opening night, The company, Stagecraft, Prompt book,
  Backstage. Page titles are always plain ("Install", "Roles and actors").
- **Don't** use pun headlines, "break a leg", standing ovations or emoji theatre masks. The test is whether
  it clarifies or decorates. Only the first is allowed.

## 7. Voice

**Dry and precise, with a thread of warm wry humour.** Short sentences. Every claim is something we can
check.

- **Do:**
  - say what it does, plainly, before anything clever;
  - name the real problem: one agent working in a line, one person answering everything, no research done,
    no record kept;
  - label anything unbuilt as intent ("pre-alpha", "illustrative");
  - allow one wry line per section at most.
- **Don't:**
  - use hype ("revolutionise", "supercharge", "10x", "the future of");
  - borrow authority (logo walls, "trusted by");
  - claim a feature that hasn't shipped;
  - use exclamation marks.
- **Examples:**
  - Yes: "Decisions go to whoever owns them, with the research done."
  - No: "Supercharge your AI workflow with intelligent human-in-the-loop orchestration!"
  - Yes, the wry thread: "A long run, not one night."
- **Before 1.0, claims are principles and intent only.** No benchmarks, no customer claims, no licence or
  pricing statements beyond what has been decided and published.

## 8. Assets

| Asset | Formats | Status |
|---|---|---|
| Mark (three heads), light and dark | SVG | To make |
| Two-head mark | SVG | To make |
| Lock-up (mark plus wordmark), light and dark | SVG | To make |
| Favicon set (two-head mark) | SVG, ICO, 180px apple-touch | To make |
| Social preview for the site | PNG 1200×630 | To make |
| GitHub org avatar | PNG 500×500 | To make |
| Repo social previews | PNG 1280×640 | To make |
| README header banner | SVG | To make |
| Colour and type tokens | CSS custom properties | Defined above; ship with the site |

The source SVGs live in this repo under `brand/`. The built copies the site serves go in `public/`.

## 9. Licensing and trademark

- The troupe name, mark, wordmark and characters are trademarks of **HPS.GD PTY LTD**. They are not licensed
  under the site's MIT (code) or CC BY 4.0 (content) licences.
- Community use is welcome for referring to troupe: "works with troupe", or an article about it. It is not
  allowed in a way that suggests endorsement, or as the name or logo of another product or a fork.

## 10. Open points

- **The tomato head's shape.**
  - Under the character rule, a circle reads as a human, so the mark currently says "human, agent, human".
  - The options:
    - keep that (two people and an agent, "humans and agents together");
    - or make the tomato head a distinct, non-role shape.
  - Decide when the SVG is drawn.
- **Problem-section layout on the landing page:** parked until it can be judged in context.
- **"The house" and "house rules":** not yet agreed as names.
