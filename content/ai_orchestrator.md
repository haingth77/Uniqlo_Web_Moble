# AI QA Orchestrator — Multi-agent pipeline cho QA

> Mục tiêu: hiểu & trình bày dự án `ai-orchestrator/` — một **multi-agent QA pipeline** biến requirement tiếng Anh thành Playwright test + báo cáo triage, xây trên **Claude Agent SDK**. Dùng cho phỏng vấn SDET/AI-in-QA.
> Nguồn code: `ai-orchestrator/pipeline.ts`, `run.ts`, `tools.ts`, `html.ts`, `README.md`.
> **Format: Nó là gì → Khái niệm nền → Kiến trúc → Quyết định thiết kế → So sánh → Q&A → Gotcha**.

---

## 1. Một câu là gì?

Một **pipeline QA đa tầng, chạy tuần tự và tất định (deterministic)**, xây trên Claude Agent SDK. Mỗi tầng là một **AI agent riêng biệt** (một lời gọi `query()` có system prompt + toolset + model riêng); đầu ra tầng trước là đầu vào tầng sau. Nó tự động hoá chuỗi:

> *đọc requirement → khám phá UI thật → viết manual test case → sinh code Playwright → chạy test → báo cáo triage.*

**Điểm cốt lõi:** thứ tự các tầng do **code điều phối** (`runPipeline()`), KHÔNG để LLM tự quyết — vì mỗi tầng phụ thuộc chặt vào artifact của tầng trước (analysis → manual → script).

---

## 2. Khái niệm nền — 3 trục độc lập (hay bị nhầm)

Trước khi vào kiến trúc, phải tách rõ 3 khái niệm hay bị gộp thành "AI tự làm hết theo trigger":

| Trục | Nó trả lời câu hỏi | Của pipeline này |
|---|---|---|
| **Workflow / Orchestration** | *Ai quyết thứ tự các bước?* → code, tất định | ✅ Có (điều phối bằng code) |
| **Trigger / Schedule** | *Cái gì kích hoạt nó chạy?* → tay / cron / event | Chạy tay (chưa có trigger tự động) |
| **Human-in-the-loop** | *Có chèn người giữa các bước không?* | ✅ Có, mạnh (dừng mỗi tầng) |

3 trục **rời nhau**. Thêm cron vào không "biến nó thành workflow" — nó **đã là** workflow rồi (vì điều phối nhiều bước bằng code); cron chỉ đổi trục "trigger".

> [!KEY]
> **Workflow ≠ "không có người".** Workflow chỉ nói về *cách điều phối tất định bằng code*. Một workflow có thể có hoặc không có human gate, có hoặc không có trigger. Pipeline này = **workflow (✅) + chạy tay + có human gate mạnh**.

### "Workflow" là 2 nghĩa khác nhau

- **workflow (khái niệm chung)** — bất kỳ quy trình nhiều bước điều phối tất định. `ai-orchestrator` là **một** trong số đó.
- **`Workflow` (tool của Claude Code)** — công cụ Anthropic dựng sẵn với `pipeline()`/`parallel()`. Cũng là **một** hiện thực của khái niệm workflow.

→ Quan hệ phân tầng: `workflow` (loại) → `pipeline` (một kiểu workflow tuần tự) → `ai-orchestrator` (dự án cụ thể của tôi). Giống "phương tiện → xe 1 làn → chiếc xe biển số X".

---

## 3. Kiến trúc — 6 tầng

<style>
.aio-diagram { --aio-bg:#141033; --aio-panel:#1d1642; --aio-panel2:#251c52; --aio-line:#3a2e6e; --aio-ink:#ECEAFB; --aio-mute:#A79FD0; --aio-faint:#7C74A8; --aio-teal:#72D6C9; --aio-lav:#A78BFA; --aio-gold:#E8C275; --aio-mono:'IBM Plex Mono',ui-monospace,Menlo,monospace; background:radial-gradient(900px 460px at 10% -8%,rgba(114,214,201,.10),transparent 60%),radial-gradient(820px 480px at 98% 0%,rgba(167,139,250,.10),transparent 55%),var(--aio-bg); border:1px solid var(--aio-line); border-radius:16px; padding:26px 24px 22px; margin:6px 0 8px; color:var(--aio-ink); font-family:'IBM Plex Sans',system-ui,sans-serif; }
.aio-diagram * { box-sizing:border-box; }
.aio-diagram .aio-eyebrow { font-family:var(--aio-mono); font-size:11.5px; letter-spacing:.18em; text-transform:uppercase; color:var(--aio-faint); margin:0 0 16px; }
.aio-diagram .aio-src { display:inline-flex; align-items:center; gap:9px; font-family:var(--aio-mono); font-size:13px; color:var(--aio-teal); background:rgba(114,214,201,.08); border:1px solid rgba(114,214,201,.32); border-radius:999px; padding:7px 15px; margin-bottom:4px; }
.aio-diagram .aio-arrow { color:var(--aio-faint); text-align:center; font-size:15px; line-height:1; margin:6px 0; }
.aio-diagram .aio-gate { display:flex; align-items:center; gap:8px; justify-content:center; margin:5px 0; }
.aio-diagram .aio-gate span { font-family:var(--aio-mono); font-size:11px; color:var(--aio-gold); background:rgba(232,194,117,.09); border:1px dashed rgba(232,194,117,.4); border-radius:999px; padding:3px 11px; }
.aio-diagram .aio-stage { display:grid; grid-template-columns:44px 1fr; gap:14px; align-items:stretch; background:linear-gradient(180deg,var(--aio-panel),var(--aio-panel2)); border:1px solid var(--aio-line); border-radius:13px; padding:13px 15px; position:relative; }
.aio-diagram .aio-stage.browser { border-color:rgba(114,214,201,.45); box-shadow:0 0 0 1px rgba(114,214,201,.12) inset; }
.aio-diagram .aio-num { font-family:var(--aio-mono); font-weight:600; font-size:19px; color:var(--aio-bg); background:var(--aio-lav); border-radius:10px; display:flex; align-items:center; justify-content:center; }
.aio-diagram .aio-stage.browser .aio-num { background:var(--aio-teal); }
.aio-diagram .aio-body { min-width:0; }
.aio-diagram .aio-title { font-family:var(--aio-mono); font-weight:600; font-size:14.5px; color:var(--aio-ink); margin:1px 0 3px; }
.aio-diagram .aio-desc { font-size:12.5px; color:var(--aio-mute); line-height:1.5; margin:0 0 8px; }
.aio-diagram .aio-chips { display:flex; flex-wrap:wrap; gap:6px; }
.aio-diagram .aio-chip { font-family:var(--aio-mono); font-size:10.5px; padding:3px 9px; border-radius:6px; border:1px solid var(--aio-line); color:var(--aio-mute); background:rgba(255,255,255,.02); }
.aio-diagram .aio-chip.out { color:var(--aio-teal); border-color:rgba(114,214,201,.3); }
.aio-diagram .aio-chip.opus { color:var(--aio-gold); border-color:rgba(232,194,117,.4); }
.aio-diagram .aio-chip.sonnet { color:var(--aio-lav); border-color:rgba(167,139,250,.4); }
.aio-diagram .aio-chip.haiku { color:var(--aio-teal); border-color:rgba(114,214,201,.4); }
.aio-diagram .aio-chip.loop { color:var(--aio-gold); border-color:rgba(232,194,117,.4); background:rgba(232,194,117,.06); }
.aio-diagram .aio-chip.br { color:var(--aio-teal); border-color:rgba(114,214,201,.5); background:rgba(114,214,201,.08); }
.aio-diagram .aio-legend { display:flex; flex-wrap:wrap; gap:9px 18px; margin-top:16px; padding-top:14px; border-top:1px solid var(--aio-line); font-size:11.5px; color:var(--aio-faint); font-family:var(--aio-mono); }
.aio-diagram .aio-legend b { color:var(--aio-mute); font-weight:500; }
</style>
<div class="aio-diagram">
<div class="aio-eyebrow">Deterministic pipeline · điều phối bằng code (runPipeline)</div>
<div class="aio-src">📄 requirements/*.md</div>
<div class="aio-arrow">▼</div>
<div class="aio-stage"><div class="aio-num">1</div><div class="aio-body"><div class="aio-title">Analyze requirement</div><div class="aio-desc">Phân tích requirement → tách acceptance criteria (AC), traceability, verification level.</div><div class="aio-chips"><span class="aio-chip sonnet">Sonnet</span><span class="aio-chip loop">↻ review→rework ×2</span><span class="aio-chip out">→ 01-analysis.md</span></div></div></div>
<div class="aio-gate"><span>⏸ human gate · sửa .md = 0 token</span></div>
<div class="aio-stage browser"><div class="aio-num">2</div><div class="aio-body"><div class="aio-title">Explore UI &nbsp;<span style="color:var(--aio-teal)">[browser]</span></div><div class="aio-desc">Mở browser THẬT (Playwright MCP) dò UI live — label/role/flow thật, không đoán.</div><div class="aio-chips"><span class="aio-chip sonnet">Sonnet</span><span class="aio-chip br">🌐 browser chỉ bật ở tầng này</span><span class="aio-chip out">→ 02-ui-exploration.md</span></div></div></div>
<div class="aio-gate"><span>⏸ human gate</span></div>
<div class="aio-stage"><div class="aio-num">3</div><div class="aio-body"><div class="aio-title">Write manual test cases</div><div class="aio-desc">Viết manual test case bám UI thật + truy vết về AC.</div><div class="aio-chips"><span class="aio-chip sonnet">Sonnet</span><span class="aio-chip loop">↻ review→rework ×2</span><span class="aio-chip out">→ 03-manual-testcases.md</span></div></div></div>
<div class="aio-gate"><span>⏸ human gate</span></div>
<div class="aio-stage"><div class="aio-num">4</div><div class="aio-body"><div class="aio-title">Write Playwright script</div><div class="aio-desc">Sinh spec dùng POM + fixture sẵn có; thêm locator còn thiếu vào page object.</div><div class="aio-chips"><span class="aio-chip opus">Opus · việc khó nhất</span><span class="aio-chip out">→ tests/e2e/ai-generated/*.spec.ts</span></div></div></div>
<div class="aio-gate"><span>⏸ human gate</span></div>
<div class="aio-stage"><div class="aio-num">5</div><div class="aio-body"><div class="aio-title">Run tests</div><div class="aio-desc">Chạy suite; tool tự ghi JSON. Fail phía test → tự chữa; fail nghi bug → để nguyên.</div><div class="aio-chips"><span class="aio-chip haiku">Haiku · cơ học, rẻ nhất</span><span class="aio-chip loop">🔧 heal ×2 (fix+re-run)</span><span class="aio-chip out">→ 05-results.json</span></div></div></div>
<div class="aio-gate"><span>⏸ human gate</span></div>
<div class="aio-stage"><div class="aio-num">6</div><div class="aio-body"><div class="aio-title">Analyze results (triage)</div><div class="aio-desc">Phân loại mỗi fail: product bug / test issue / flaky + coverage gap + next actions.</div><div class="aio-chips"><span class="aio-chip sonnet">Sonnet</span><span class="aio-chip out">→ 06-report.md</span></div></div></div>
<div class="aio-legend"><span><b>Model:</b> Sonnet = suy luận vừa · <span style="color:var(--aio-gold)">Opus = sinh code</span> · <span style="color:var(--aio-teal)">Haiku = cơ học</span></span><span><b>↻ / 🔧</b> = self-heal loop</span><span><b>⏸</b> = dừng chờ người (bỏ qua với --auto)</span></div>
</div>

Mỗi tầng khai báo **4 field** trong mảng `stages` (`pipeline.ts`) — muốn chỉnh tầng chỉ sửa 4 field này, không viết lại prompt:

| Field | Ý nghĩa |
|---|---|
| `skill` | Agent là ai + method/rule phải theo (→ system prompt) |
| `inputs` | Các file (relative repo root) agent đọc trước |
| `output` | Đúng **1 file** tầng phải ghi |
| `task` | Chỉ dẫn cụ thể + format output |

`runStage()` tự ghép prompt từ `inputs`/`task`/`output`.

### Vì sao tầng ② Explore quan trọng

Tầng Explore lái **browser thật** vào site live (Playwright MCP) để **dò UI thực tế** — label, role, flow, control type, default state — thay vì đoán từ chữ trong requirement. Nhờ đó manual case (③) và script (④) **bám UI thật**, không bịa. Nó được phép click/type/select/submit nhưng **cấm** login, nhập dữ liệu cá nhân, checkout/payment.

---

## 4. Các quyết định kiến trúc (phần interviewer đào sâu)

### 4.1 Model routing — model rẻ cho việc cơ học, model mạnh cho suy luận

`MODELS` trong `pipeline.ts`:

| Tầng | Model | Vì sao |
|---|---|---|
| Analyze / Explore / Manual / Report | `claude-sonnet-4-6` | Suy luận vừa, cân bằng chi phí |
| **Script** (viết code) | `claude-opus-4-8` | Việc khó nhất — sinh code đúng cú pháp + đúng POM |
| **Run** (chạy test) | `claude-haiku-4-5` | Thuần cơ học, chỉ gọi 1 tool → model rẻ nhất |
| **Review** (phản biện artifact) | `claude-sonnet-4-6` | KHÔNG dùng model yếu — critic yếu sẽ "đóng dấu" bừa thứ nó không hiểu |

→ **Tối ưu chi phí theo độ khó từng tầng**, không "một model cho tất cả".

### 4.2 Human-in-the-loop gate — sửa artifact tốn 0 token

Mặc định pipeline **dừng sau mỗi tầng** (`checkpoint()` dùng `readline`): bạn đọc, **sửa tay file `.md`**, rồi approve. Vì tầng sau **đọc lại input tươi từ đĩa**, nên sửa artifact + approve **tốn 0 token** — cách fix rẻ nhất.

| Bạn chọn | Điều xảy ra | Token |
|---|---|---|
| Sửa file rồi `[Enter]` | Tầng sau đọc file bạn đã sửa | **0** — rẻ nhất |
| `r` (re-run) | Chạy lại tầng từ đầu (sau khi bạn sửa `skill`/`task` trong code) | tốn token tầng đó |
| `q` (quit) | Dừng + in lệnh resume để tiếp tục sau | 0 |

> [!GOTCHA]
> Gate dùng **terminal tương tác** (`readline`). Nếu chạy stdin không tương tác (piped, hoặc qua prefix `!` của Claude), prompt không nhận input được → phải dùng `--from/--to` (mỗi lần 1 tầng) hoặc `--auto`.

### 4.3 Sandboxing — blast radius rõ ràng

`tools.ts` chỉ expose **4 tool tự viết** qua `createSdkMcpServer`: `read_file`, `list_dir`, `write_file`, `run_playwright`. **Không** raw shell, **không** network. `safeResolve()` chặn path traversal ra ngoài repo và chặn vào `node_modules`/`.git`. → Agent chỉ đụng được file trong repo và chạy Playwright.

> [!IMPORTANT]
> `options.tools: []` tắt **toàn bộ** built-in tool của Claude Code (Bash, Read, Edit...). Chỉ đặt `allowedTools` là CHƯA đủ — model vẫn *thấy* built-in và đốt turn budget loay hoay với `cp`/`tee`/`base64` thay vì gọi `mcp__qa__write_file`. `tools: []` mới xoá chúng khỏi context; MCP tool đến từ `mcpServers` nên không bị ảnh hưởng.

### 4.4 Per-stage permission gate — least privilege

`gate`/`canUseTool`: **browser tool (Playwright MCP) chỉ bật ở tầng Explore**; mọi tầng khác gọi browser đều bị **deny**. Browser là quyền mạnh nhất (chạm site thật) nên chỉ mở đúng tầng cần → thu nhỏ blast radius.

### 4.5 Markdown canonical thay vì JSON

Artifact chính là **Markdown** (tự render `.html` sibling qua `html.ts` để người đọc — theme Catppuccin Mocha). Vì: (1) LLM parse Markdown **rẻ & ổn định hơn** JSON; (2) người **sửa tay giữa các tầng** dễ. `.html` là view sinh ra, ghi đè mỗi lần chạy/approve — sửa `.md` mới đổi input tầng sau. Có `npm run render` để dựng lại HTML mà **không tốn token**.

### 4.6 Self-heal — 2 vòng độc lập

- **Rework loop** (`--max-rework`, mặc định 2): sau tầng có `review: true`, một **reviewer agent phản biện** (adversarial, grounded vào source) chấm PASS/FAIL. Nếu FAIL → gửi findings ngược cho **chính tác giả tầng** điều tra & fix cái *thật sự* sai → review lại, tới PASS hoặc hết số vòng. Reviewer **chỉ báo, không sửa** — người vẫn là chốt cuối.
- **Heal loop** (`--max-heal`, mặc định 2): sau tầng Run, nếu test fail → **healer agent** (model đã viết spec) phân loại rồi chỉ fix **nguyên nhân phía test** (locator/action/wait sai) trong page object & spec → chạy lại, tới xanh hoặc hết vòng.

> [!WARNING]
> Nguy cơ self-heal: agent "chữa" bằng cách **nới lỏng assertion** cho pass giả. Chặn bằng: (1) giới hạn số vòng; (2) HEALER_SKILL cấm weaken/xoá assertion, cấm `sleep` vô điều kiện — phải fix **nguyên nhân, không phải triệu chứng**; (3) fail nghi là **product bug** để **nguyên** cho tầng triage phân loại, không tự sửa cho xanh.

### 4.7 Resilience — retry & resume

- `withRetry` bọc mỗi tầng: retry lỗi **tạm thời** (Cloudflare 5xx, 429/503, 529 overloaded, socket reset) với exponential backoff + tôn trọng `retry_after`. Lỗi 4xx (bug/auth của mình) **fail fast**, không retry. Artifact chỉ ghi khi thành công → chạy lại từ đầu tầng là an toàn.
- Chạm **turn cap** thì KHÔNG retry (sẽ đụng tường y hệt); nếu output đã ghi 1 phần thì cứu lấy và đi tiếp, nếu chưa thì báo lỗi kèm hướng dẫn.
- `--from <n>` / `--to <n>`: bỏ qua tầng cũ, **tái dùng artifact trên đĩa** (gồm cả chỗ bạn sửa tay). Khi `q`, tool in sẵn lệnh resume để dán.

---

## 5. Mapping sang khái niệm Agent SDK

| Khái niệm SDK | Ở đâu trong dự án |
|---|---|
| Orchestrator | `runPipeline()` — điều phối thứ tự tầng |
| Agent / sub-agent | mỗi `runStage()` = 1 `query()` có system prompt riêng |
| Tools (in-process) | `tools.ts` — 4 tool qua `createSdkMcpServer` |
| External MCP | `PLAYWRIGHT_SERVER` — Microsoft Playwright MCP (stdio), gắn RIÊNG tầng Explore |
| Permission control | `gate`/`canUseTool` per-stage |
| Model routing | `MODELS` — Haiku (run) ↔ Opus (script) ↔ Sonnet (còn lại) |
| Retry / resilience | `withRetry` bọc mỗi tầng |
| Resume | `--from/--to`, artifact đọc lại từ đĩa |

---

## 6. So sánh với Workflow của Claude Code

Cùng triết lý (điều phối tất định bằng code, agent riêng mỗi tầng, model routing, self-heal, resume). Khác ở tầng hiện thực & vận hành:

| Tiêu chí | **Workflow (Claude Code)** | **ai-orchestrator (dự án này)** |
|---|---|---|
| Xây trên gì | Công cụ Anthropic dựng sẵn — viết 1 script JS với `agent()`/`pipeline()`/`parallel()` | Tự xây **trực tiếp trên Agent SDK** — tự dựng MCP tool, permission gate, readline |
| Tầng kiểm soát | Cao — trừu tượng sẵn, viết ít | Thấp — cầm tay từng thứ (nhiều quyền hơn, nhiều code hơn) |
| Human-in-the-loop | **Không** dừng giữa run — người review *giữa các* workflow | **Có, mạnh** — dừng sau **mỗi tầng** để sửa `.md` (0 token) |
| Truyền data giữa bước | Trong bộ nhớ — return value / object theo schema | **Ghi Markdown ra đĩa** — người sửa tay được |
| Song song (parallel) | **Có sẵn** — `parallel()`/`pipeline()` fan-out | **Chưa** — thuần tuần tự (nằm trong roadmap) |
| Nơi chạy | Trong session Claude Code, chạy nền | Chương trình Node/tsx **độc lập**, chạy từ terminal |
| Tool / sandbox | Chạm mọi MCP tool của session qua ToolSearch | Bó còn **4 tool** + Playwright MCP, gate theo tầng |

> [!TIP]
> **Câu chốt phỏng vấn:** *"Cùng triết lý — điều phối tất định, agent riêng mỗi tầng, model routing, self-heal, resume. Khác ở 3 điểm: (1) em xây trực tiếp trên Agent SDK nên kiểm soát tầng thấp hơn; (2) human-in-the-loop mạnh hơn — dừng mỗi tầng, sửa artifact 0 token, hợp bản chất QA; (3) dùng Markdown trên đĩa để người chỉnh được thay vì chuyền object trong RAM. Workflow của Claude mạnh hơn ở parallel fan-out sẵn có — đúng là hướng em muốn mở rộng."*

---

## 7. Cách chạy (CLI)

```bash
cd ai-orchestrator
npm install && npx playwright install chromium     # lần đầu

# Auth — chọn 1:
claude setup-token && export CLAUDE_CODE_OAUTH_TOKEN=<token>   # dùng subscription (thường rẻ hơn)
# hoặc: export ANTHROPIC_API_KEY=sk-ant-...                    # trả theo token

npm run orchestrate                                 # dùng requirement mẫu
```

| Arg / flag | Tác dụng |
|---|---|
| `<requirementPath>` | Positional 1 — requirement cần test |
| `[specPath]` | Positional 2 — nơi ghi spec (default `tests/e2e/ai-generated/<name>.spec.ts`) |
| `--from <n>` | Bắt đầu từ tầng *n* (resume, tái dùng artifact) |
| `--to <n>` | Dừng sau tầng *n* |
| `--auto`, `-y` | Chạy thẳng, **không** review gate |
| `--headed` | Explore mở browser **thấy được** |
| `--max-rework <n>` | Cap self-heal review (default 2) |
| `--max-heal <n>` | Cap heal test script (default 2; 0 = tắt) |

> [!GOTCHA]
> Khi truyền `--from/--to`, chạy `npx tsx run.ts …` chứ **đừng** `npm run orchestrate -- …` — `npm` nuốt mất flag `--from/--to` trước khi tới script. Path luôn tính từ **repo root** (vì tool sandbox vào `REPO_ROOT`), nên truyền `ai-orchestrator/requirements/...` dù shell đang ở trong `ai-orchestrator/`.

---

## 8. Q&A phỏng vấn

### Vì sao điều phối bằng code mà không để 1 agent tự quyết gọi tầng nào?

Vì mỗi tầng phụ thuộc chặt output tầng trước (analysis → manual → script). Điều phối bằng code cho **tất định, dễ debug, dễ resume**; để LLM tự quyết sẽ khó tái lập và dễ nhảy sai thứ tự.

### Human-in-the-loop chống được gì?

LLM có xu hướng viết test *cho pass*. Gate cho phép người kiểm chứng artifact ở từng bước, sửa lỗi **sớm (rẻ)** trước khi lỗi lan xuống tầng tốn token hơn. Sửa Markdown + approve = 0 token.

### Vì sao chỉ tầng Explore được dùng browser?

**Least privilege.** Browser là quyền mạnh nhất (chạm site thật); các tầng khác chỉ cần đọc/ghi file nên bị chặn browser để thu nhỏ blast radius.

### Self-heal có nguy cơ gì? Vì sao giới hạn số vòng?

Nguy cơ agent "chữa" bằng cách nới lỏng assertion để pass giả. Vì vậy: (1) giới hạn số vòng (`--max-heal`/`--max-rework`); (2) skill cấm weaken assertion; (3) fail nghi product bug **để nguyên** cho tầng triage phân loại — không tự sửa cho xanh.

### Vì sao reviewer dùng model mạnh (Sonnet) chứ không phải Haiku rẻ?

Reviewer làm **phản biện ngữ nghĩa** artifact của một AI khác — không phải check cơ học. Model yếu sẽ "đóng dấu" thứ nó không đủ sức hiểu (rubber-stamp), làm vòng review vô nghĩa.

### Vì sao Markdown làm canonical mà không phải JSON?

LLM parse Markdown rẻ & ổn định hơn, và người **sửa tay giữa các tầng** dễ hơn nhiều so với JSON. Đây là trade-off có chủ đích: ưu tiên khả năng chỉnh sửa + chi phí, đổi lại chưa có schema validate chặt (đó là hướng harden tiếp).

### Điểm yếu / hướng harden tiếp?

1. **Adversarial verifier** riêng: một agent kiểm "test này có thật sự cover đúng AC không".
2. **Structured JSON output** có validate để máy hand-off (thay vì chỉ Markdown).
3. **Parallel fan-out**: chia manual case thành batch, viết spec song song (chính là thứ Workflow của Claude có sẵn).

---

## 9. Pitch 90 giây (học thuộc ý)

> "Em xây một **AI QA orchestrator** trên Claude Agent SDK. Nó nhận requirement tiếng Anh và chạy qua **6 tầng tuần tự**: phân tích → **khám phá UI thật bằng browser** qua Playwright MCP → viết manual test case → **sinh code Playwright dùng đúng Page Object và fixture của dự án** → chạy test → báo cáo triage.
>
> Điểm em tâm đắc là các **quyết định kiến trúc**: thứ tự tầng do code điều phối chứ không để LLM tự quyết, vì mỗi tầng phụ thuộc artifact tầng trước. Em **route model theo độ khó** — Haiku cho tầng chạy test, Opus cho tầng sinh code — để tối ưu chi phí. Có **human-in-the-loop gate**: sửa tay artifact Markdown giữa các tầng với chi phí 0 token. Toolset bị **sandbox** còn 4 tool, browser chỉ bật đúng tầng Explore (least privilege). Và có **2 vòng self-heal**: một vòng review→fix cho artifact, một vòng fix→chạy-lại cho test script — đều có chốt chặn để không làm pass giả.
>
> Nó chứng minh em không chỉ viết test, mà hiểu cách **dựng một hệ thống agent tất định, an toàn, tối ưu chi phí** — đúng hướng các framework orchestration lớn đang đi."
