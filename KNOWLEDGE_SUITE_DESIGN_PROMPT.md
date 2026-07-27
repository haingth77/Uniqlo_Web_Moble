# Knowledge Suite — Design Prompt (reusable)

Prompt để gen lại design của `knowledge.html` bản đang ở trên GitHub (commit `8a5dd6c`).

## Provenance — bản này đến từ đâu

| | |
|---|---|
| Generator | `build-knowledge-suite.mjs` |
| Output | `knowledge.html` (trước 2026-07-27 là `knowledge-suite.html` rồi rename tay) |
| Identity name | **Suite** (test-runner) |
| Xác nhận | Toàn bộ block `<style>` trong `build-knowledge-suite.mjs` giống **byte-for-byte** với `origin/main:knowledge.html` |

Có 3 builder song song trong repo, cùng đọc `content/` nhưng khác identity — đừng lẫn:

| Builder | Output | Identity | Palette | Type |
|---|---|---|---|---|
| `build-knowledge-suite.mjs` | **`knowledge.html`** | **Suite** — test runner | Anthropic charcoal + clay | Poppins / Lora / Space Mono |
| `build-knowledge-codex.mjs` | `knowledge-codex.html` | Codex — Anthropic brand | Anthropic brand | Poppins / Lora |
| `build-knowledge-html.mjs` | `knowledge-galaxy.html` | Midnight Galaxy | Tím/violet `#A78BFA` | Sora / IBM Plex |

Cách chạy / thêm doc mới: xem `BUILD_KNOWLEDGE.md`.

---

## PROMPT — copy khối dưới đây

````
Build một single-file HTML knowledge base viewer, self-contained, không build step.
Nội dung là các file Markdown trong `content/` — nhúng inline dưới dạng JSON, render
client-side. Nội dung phải render VERBATIM, không bao giờ được sửa/rút gọn.

## CONCEPT — bắt buộc dẫn dắt mọi quyết định design

Knowledge base được render như một TEST RUNNER. Vernacular của QA chính là chất liệu
design — spec files, run, pass ticks, coverage, terminal output. Không phải "trang docs
có theme màu": mỗi doc LÀ một spec file, trang chủ LÀ một run summary, navigation LÀ
editor tabs.

Đây là điều kiện quan trọng nhất: design phải có IDENTITY và SIGNATURE MOMENT, không
chỉ đổi màu/font trên một layout docs thông thường.

## PALETTE — Anthropic charcoal instrument shell

Dark là default. Không tự sáng tác màu đỏ — dùng clay cho cả trạng thái lỗi.

Dark:
  ground   #141413   ground-2 #1a1917
  panel    #1d1c19   panel-2  #232220
  line     #34322c   line-soft #2a2823
  text     #faf9f5   soft     #cbc8bd   mute #8f897b
  clay     #e2896b   (đã lift để đủ contrast trên nền tối), clay-ink #1a1917
  pass     #9cb67f   (họ green #788c5d) — trạng thái "passing"
  info     #8bb2dc   (họ blue #6a9bcc) — link / info
  accent   = clay,   accent-soft rgba(226,137,107,0.14)
  code-bg  #131211   code-text #ecab8c   stripe #201f1c
  term-bg  #0f0e0d
  shadow   0 1px 2px rgba(0,0,0,.5), 0 18px 44px rgba(0,0,0,.42)

Light (warm Anthropic paper):
  ground   #faf9f5   ground-2 #f4f1ea
  panel    #fffefb   panel-2  #f4f1e8
  line     #e4e0d3   line-soft #ede9dd
  text     #141413   soft     #4a463d   mute #8a8578
  clay     #d97757   clay-ink #ffffff
  pass     #5f7346   info     #4f7bab
  accent-soft rgba(217,119,87,0.12)
  code-bg  #f3efe4   code-text #b0562f   stripe #faf7ef
  term-bg  #201f1c   ← terminal GIỮ NGUYÊN nền tối ở light mode, vì nó là một cái màn hình
  shadow   0 1px 2px rgba(20,20,19,.05), 0 14px 34px rgba(20,20,19,.10)

Callout tokens (dark / light):
  tip    #9cb67f / #5f7346      note  #8bb2dc / #4f7bab
  warn   #d5a35f / #a9722a      danger #e08a68 / #c0563a
  imp    #e2896b / #c25a3a      quote  #a29d90 / #8a8578
  Mỗi cái kèm một `-bg` rgba cùng hệ, alpha .08–.15.

Per-doc accent: mỗi spec có một accent riêng, luân phiên clay #d97757 / blue #6a9bcc /
green #788c5d. Khi navigate tới một doc, ghi đè `--accent` + `--accent-soft` ở
:root bằng JS → toàn bộ trang recolor theo doc đang mở.

## TYPOGRAPHY — cold shell, warm prose (tương phản có chủ đích)

  display : Poppins 500/600/700  → heading, brand, stat number
  body    : Lora 400/500/600 + italic  → prose (SERIF, đây là điểm nhấn)
  mono    : Space Mono 400/700  → toàn bộ chrome, label, path, meta, terminal

Nguyên tắc: vỏ máy đo thì lạnh và mono; chữ đọc bên trong thì ấm và serif.
body 16px / line-height 1.72. Heading letter-spacing âm (-.015em → -.03em).
Label mono thì uppercase + letter-spacing rộng (.1em → .2em).

## LAYOUT — không sidebar

  progress hairline  2px fixed top, fill bằng accent, width theo % scroll
  header   58px sticky, blur(10px), bg color-mix(ground 86%, transparent)
           ├ brand: live dot (pass color, có ring `ping` animation 2.4s) + "QA//SUITE"
           │        (dấu `//` tô accent) + crumb mono hiện spec đang mở
           ├ cmd-hint: pill "Tìm nhanh ⌘K"
           └ icon-btn: theme toggle ☀️/🌙
  tabs     46px sticky dưới header — EDITOR TABS, một tab / spec, scroll ngang,
           ẩn scrollbar. Tab active: border-bottom 2px accent của doc đó +
           background color-mix(accent 8%, transparent). Mỗi tab có tick ✓ mono.
  wrap     flex, max-width 1240px, padding 34px 28px 80px
           ├ reader → sheet max-width 760px  (cột đọc)
           └ toc    → 218px right mini-map, sticky, scrollspy

## SIGNATURE MOMENT — live test run streaming

Trang chủ có một terminal window (bar 3 đèn clay/amber/green + label mono
`qa-suite — run --all`, screen nền term-bg, mono 13px, min-height 232px).

Khi load, terminal STREAM từng dòng ra như một lần chạy test thật:

  $ qa-suite run --all                         ← class cmd, màu code-text
  Loading N spec files…                        ← class dim
    ✓ answers.spec.ts        12,431w           ← class ok, spec name padEnd(20)
    ✓ questions.spec.ts       8,207w
    … (một dòng / spec)
                                               ← dòng trống
  ✓ N passed · 0 failed · M words indexed      ← class sum, màu info
  Ready. Chọn một spec ở dưới, hoặc ⌘K.        ← class dim

Timing: 260ms cho 2 dòng đầu, 90ms mỗi dòng sau. Con trỏ block nhấp nháy
(1s steps(2)) ở cuối dòng đang chạy. Auto-scroll xuống đáy. Kết thúc: all-green.
`prefers-reduced-motion: reduce` → paint hết một lần, bỏ animation.

Đây là moment duy nhất được "dàn dựng" — mọi thứ khác phải điềm tĩnh.

## HOME = RUN SUMMARY

  kicker    mono uppercase letter-spacing .2em, màu accent: "QA Automation · Knowledge Runner"
  h1        clamp(34px, 6vw, 54px), letter-spacing -.03em: "Mọi spec đang passing."
            — chữ cuối tô màu mute (dim) để tạo nhịp
  lede      soft, 17px, max-width 60ch
  terminal  (signature ở trên)
  stats     grid 4 cột: spec files / words / Q&A / PASS
            mỗi stat có thanh dọc 3px accent ở cạnh trái, số dùng font display 24px,
            nhãn mono 10.5px uppercase. Stat "PASS" tô màu pass.
  section-label  mono 11px uppercase, có đường kẻ 1px chạy hết phần còn lại của dòng
  specs     grid auto-fill minmax(280px, 1fr) — mỗi card là một RUNNER ROW:
            row1 = ✓ tick + spec path (mono, màu accent của doc) + size ("12,431w")
            rồi h3 title (display) + p sub (italic serif)
            thanh dọc 3px accent bên trái, hover: translateY(-3px) + border accent + shadow

## DOC PAGE = TEST FILE HEADER

  path      mono: ✓ <spec-filename> · N°03      (spec name tô accent của doc)
  h1        display 700, 33px, letter-spacing -.022em
  sub       italic serif, màu soft
  metaline  border-top, mono 11.5px: status passing · size 12,431 words · index 03 / 13

Prose bên dưới:
  h1  26px màu accent + border-bottom
  h2  21px + border-bottom soft, có `§` mono màu accent làm prefix ::before
  h3  18px màu accent
  h4  16px màu soft
  a          màu info, underline offset 3px, hover dày lên 2px
  li::marker màu accent, font mono
  hr         dashed
  code       inline: code-bg + code-text + border line-soft, .8em
  pre        code-bg + border, thanh dọc 3px accent ở cạnh trái (opacity .45)
  table      thead nền accent chữ clay-ink; tbody zebra bằng stripe; overflow-x auto
  blockquote border-left 3px quote + quote-bg, italic, radius 0 9px 9px 0

## CALLOUTS — GitHub alert syntax

Parse `> [!TIP]`, `[!NOTE]`, `[!INFO]`, `[!WARNING]`, `[!GOTCHA]`, `[!CAUTION]`,
`[!DANGER]`, `[!IMPORTANT]`, `[!KEY]` trong blockquote (override renderer của marked).
Render thành box: border-left 3px màu callout + bg alpha, header mono uppercase
letter-spacing .06em kèm emoji (💡📝ℹ️⚠️🚨⭐🔑).

## REVISION RUNNER — collapsible answers

Với doc kiểu Q&A: mỗi `h3` bắt đầu bằng số ("### 1. ...") thì gom toàn bộ nội dung
tới h3/h2 kế tiếp vào một wrapper ẩn, chèn một toggle button phía trên.

  toggle đóng : `▶ run`
  toggle mở   : `▼ output`
  wrapper mở  : border-left 2px màu pass, padding-left 16px, animation slide-in 4px

Trên cùng doc chèn answer-bar: nền accent-soft, nút "Run all" / "Hide all" +
hint italic "N câu — đáp án ẩn (▶ run để hiện) để ôn tập."

## COMMAND PALETTE — ⌘K

Overlay nền rgba(10,9,8,.55) + blur(4px), box max 620px, popIn
cubic-bezier(.2,.7,.3,1). Input mono có prompt `›` màu accent.
Index gồm: mọi spec (num = số thứ tự pad 2, home = ◆) + mọi h2/h3 của doc đang mở
(num = #). Row: num badge trong border + title display + sub mono + kind mono
uppercase bên phải. Điều hướng ↑↓, Enter chọn, Esc đóng, click ra ngoài đóng.
Row selected/hover: nền accent-soft.

## BACKDROP — dotted coordinate field

`position: fixed; inset: 0; z-index: -1` — máy đo, không phải cosmic:
  radial-gradient(60% 40% at 100% 0%,  rgba(217,119,87,0.07), transparent 66%)   ← clay glow góc trên phải
  radial-gradient(50% 40% at 0% 100%,  rgba(106,155,204,0.05), transparent 70%)  ← blue glow góc dưới trái
  radial-gradient(circle at center, var(--line-soft) 1px, transparent 1px)       ← dot grid
  background-size: cover, cover, 26px 26px

DOT grid 26px — không phải line grid. Rất mờ.

## MOTION — điềm tĩnh, một moment duy nhất

Tất cả nằm trong `@media (prefers-reduced-motion: no-preference)`:
  rise      opacity 0 → 1, translateY(9px) → 0, .45s cubic-bezier(.22,.61,.36,1)
            áp cho filehead / home-head / mdBody / spec
  stagger   spec card delay .03s × index, tới card thứ 12
  theme     transition background-color/border-color/color .3s trên body/header/tabs/spec/stat
Không parallax, không scroll-jacking, không hover 3D.

## RESPONSIVE

  ≤1080px  ẩn right mini-map
  ≤680px   stats về 2 cột
  ≤620px   ẩn crumb; wrap padding 22px 16px 60px; filehead h1 → 27px
  ≤520px   cmd-hint chỉ còn kbd ⌘K, ẩn chữ

## KỸ THUẬT

  marked 12.0.0 + highlight.js 11.9.0 (atom-one-dark / atom-one-light, swap theo theme
  bằng cách toggle `disabled` trên 2 thẻ <link>). Google Fonts + jsdelivr có preconnect.
  Data nhúng qua `<script id="docs-data" type="application/json">`, escape `</script>`.
  Routing bằng `location.hash` + `history.replaceState` — không reload.
  Theme persist ở `localStorage['suite-theme']`, default `dark`.
  Scrollspy bằng IntersectionObserver, rootMargin '-20% 0px -70% 0px'.
  Slug hỗ trợ tiếng Việt: NFD normalize → strip combining marks → đ→d.
  Scrollbar 10px, thumb màu line. `:focus-visible` outline 2px accent offset 2px.
  Lang = `vi`. UI text tiếng Việt.

## KHÔNG ĐƯỢC

  - Sidebar navigation (đã dùng editor tabs)
  - Bảng màu tím/violet/neon — đây là Anthropic charcoal
  - Sans-serif cho phần prose — prose PHẢI là Lora serif
  - Line grid ở backdrop — phải là dot grid
  - Tự sáng tác màu đỏ
  - Terminal chuyển sang nền sáng ở light mode
  - Sửa nội dung markdown trong `content/`
````

---

## Cách dùng lại

**Gen lại design này** — không cần prompt, chạy builder:

```bash
node build-knowledge-suite.mjs   # → knowledge.html
```

**Thêm/sửa nội dung** — xem `BUILD_KNOWLEDGE.md`. Không cần prompt, chỉ cần thêm file vào
`content/` + một dòng vào `CATEGORIES`.

**Gen một identity mới cùng chất lượng** — đưa prompt ở trên cho AI, thay phần
PALETTE / TYPOGRAPHY / CONCEPT bằng hướng mới, giữ nguyên phần LAYOUT / SIGNATURE /
KỸ THUẬT làm khung xương. Output nên là builder mới (`build-knowledge-<name>.mjs` ghi ra
`knowledge-<name>.html`), đừng ghi đè `knowledge.html`.
