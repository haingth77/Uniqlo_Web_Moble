# AI QA Orchestrator — Giới thiệu & Kịch bản phỏng vấn

> Tài liệu giới thiệu dự án `ai-orchestrator/` — một **multi-agent QA pipeline** biến requirement tiếng Anh thành Playwright test + báo cáo triage. Dùng để trình bày trong phỏng vấn.
> Nguồn code: `ai-orchestrator/pipeline.ts`, `run.ts`, `tools.ts`, `README.md`.

---

## 1. Một câu là gì?

Một **pipeline QA đa tầng, chạy tuần tự và tất định (deterministic)**, xây trên **Claude Agent SDK**. Mỗi tầng là một AI agent riêng biệt; đầu ra của tầng trước là đầu vào của tầng sau. Nó tự động hoá chuỗi: *đọc requirement → khám phá UI thật → viết test case → sinh code Playwright → chạy → báo cáo lỗi*.

**Điểm cốt lõi:** thứ tự các tầng do **code điều phối**, không phải để LLM tự quyết — vì mỗi tầng phụ thuộc chặt vào artifact của tầng trước.

---

## 2. Kiến trúc — 6 tầng

```
requirements/*.md
   │
   ▼ ① Analyze   → phân tích requirement, tách acceptance criteria   → 01-analysis.md
   ▼ ② Explore   → mở BROWSER THẬT (Playwright MCP) dò UI live         → 02-ui-exploration.md
   ▼ ③ Manual    → viết manual test case bám UI thật                   → 03-manual-testcases.md
   ▼ ④ Script    → sinh Playwright spec (dùng POM + fixture sẵn có)     → tests/e2e/ai-generated/*.spec.ts
   ▼ ⑤ Run       → chạy test, ghi kết quả JSON                          → 05-results.json
   ▼ ⑥ Report    → phân tích run, triage pass/fail                      → 06-report.md
```

Mỗi tầng = 1 lời gọi `query()` của Agent SDK với system prompt + toolset + model riêng.

---

## 3. Các quyết định kiến trúc (phần interviewer đào sâu)

### 3.1 Model routing — model rẻ cho việc cơ học, model mạnh cho suy luận
`pipeline.ts` (`MODELS`):

| Tầng | Model | Vì sao |
|---|---|---|
| Analyze / Explore / Manual / Report | `claude-sonnet-4-6` | Suy luận vừa, cân bằng chi phí |
| **Script** (viết code) | `claude-opus-4-8` | Việc khó nhất — sinh code đúng cú pháp + đúng POM |
| **Run** (chạy test) | `claude-haiku-4-5` | Thuần cơ học, chỉ gọi tool → dùng model rẻ nhất |

→ **Tối ưu chi phí theo độ khó từng tầng**, không "một model cho tất cả".

### 3.2 Human-in-the-loop gate — sửa artifact tốn 0 token
Mặc định pipeline **dừng sau mỗi tầng** (`readline`): bạn đọc, **sửa tay file `.md`**, rồi approve. Vì tầng sau **đọc lại input tươi từ đĩa**, nên sửa artifact + approve **tốn 0 token** — cách fix rẻ nhất. Ngoài ra có `r` (chạy lại tầng), `q` (thoát + in lệnh resume).

### 3.3 Sandboxing — blast radius rõ ràng
`tools.ts` chỉ expose **4 tool tự viết**: `read_file`, `list_dir`, `write_file`, `run_playwright`. **Không** raw shell, **không** network. `safeResolve()` chặn path traversal ra ngoài repo và vào `node_modules`/`.git`. → Agent chỉ có thể đụng file trong repo và chạy Playwright.

### 3.4 Per-stage permission gate
`gate`/`canUseTool`: **browser tool (Playwright MCP) chỉ bật ở tầng Explore**; các tầng khác bị từ chối. Explore còn bị cấm login/nhập dữ liệu cá nhân/checkout. → Nguyên tắc **least privilege** theo từng tầng.

### 3.5 Markdown canonical thay vì JSON
Artifact chính là **Markdown** (tự render `.html` sibling để người đọc). Vì: (1) LLM parse Markdown **rẻ & ổn định hơn** JSON; (2) người **sửa tay giữa các tầng** dễ. → Một trade-off có chủ đích: ưu tiên khả năng chỉnh sửa + chi phí.

### 3.6 Self-heal loops (2 vòng độc lập)
- **Rework loop** (`--max-rework`, mặc định 2): sau tầng review, gửi nhận xét ngược lại cho tác giả tầng → fix → review lại tới PASS.
- **Heal loop** (`--max-heal`, mặc định 2): sau khi chạy test, nếu fail → agent (model đã viết spec) fix locator/action → chạy lại tới khi xanh. Fail còn lại (nghi bug thật) để tầng triage phân loại.

### 3.7 Resume & chạy từng tầng
`--from <n>` / `--to <n>`: bỏ qua tầng cũ, tái dùng artifact trên đĩa. `withRetry` bọc mỗi tầng để retry lỗi API/CDN tạm thời mà không giết cả pipeline.

---

## 4. Kịch bản pitch 90 giây (học thuộc ý)

> "Em xây một **AI QA orchestrator** trên Claude Agent SDK. Nó nhận một requirement viết bằng tiếng Anh và chạy qua **6 tầng tuần tự**: phân tích → **khám phá UI thật bằng browser** qua Playwright MCP → viết manual test case → **sinh code Playwright dùng đúng Page Object và fixture của dự án** → chạy test → báo cáo triage.
>
> Điểm em tâm đắc nhất là các **quyết định kiến trúc**: thứ tự tầng do code điều phối chứ không để LLM tự quyết, vì mỗi tầng phụ thuộc artifact tầng trước. Em **route model theo độ khó** — Haiku cho tầng chạy test cơ học, Opus cho tầng sinh code — để tối ưu chi phí. Có **human-in-the-loop gate**: em sửa tay artifact Markdown giữa các tầng với chi phí 0 token. Toolset bị **sandbox** còn 4 tool, browser chỉ bật đúng tầng Explore. Và có **2 vòng self-heal**: một vòng review→fix cho artifact, một vòng fix→chạy-lại cho test script.
>
> Nó chứng minh em không chỉ viết test, mà hiểu cách **dựng một hệ thống agent tất định, an toàn, tối ưu chi phí** — đúng hướng các framework orchestration lớn đang đi."

---

## 5. Câu hỏi interviewer hay hỏi (+ hướng trả lời)

**Q: Vì sao điều phối bằng code mà không để 1 agent tự quyết gọi tầng nào?**
→ Vì mỗi tầng phụ thuộc chặt output tầng trước (analysis → manual → script). Điều phối bằng code cho **tất định, dễ debug, dễ resume**; để LLM tự quyết sẽ khó tái lập và dễ nhảy sai thứ tự.

**Q: Human-in-the-loop chống được gì?**
→ LLM có xu hướng viết test *cho pass*. Gate cho phép người kiểm chứng artifact ở từng bước, sửa lỗi sớm (rẻ) trước khi lỗi lan xuống tầng tốn token hơn. Sửa Markdown + approve = 0 token.

**Q: Vì sao chỉ tầng Explore được dùng browser?**
→ Least privilege. Browser là quyền mạnh nhất (chạm site thật); các tầng khác chỉ cần đọc/ghi file nên bị chặn browser để thu nhỏ blast radius.

**Q: Self-heal có nguy cơ gì? Vì sao giới hạn số vòng?**
→ Nguy cơ agent "chữa" bằng cách nới lỏng assertion để test pass giả. Vì vậy: (1) giới hạn số vòng (`--max-heal`), (2) fail còn lại **để nguyên** cho tầng triage phân loại là bug thật hay lỗi test — không tự ý sửa cho xanh.

**Q: Điểm yếu / hướng harden tiếp?**
→ Cần **adversarial verifier**: một agent riêng kiểm "test này có thật sự cover đúng acceptance criteria không" (README mục Next steps). Ngoài ra: structured JSON output có validate, và **parallel fan-out** cho tầng viết spec nhiều case.

**Q: So với framework orchestration lớn (vd Workflow của Claude Code) thì sao?**
→ Cùng triết lý (điều phối bằng code, agent/tầng riêng, model routing, structured output, self-heal, resume). Khác: dự án của em xây **trực tiếp trên Agent SDK** (tự dựng MCP tool, tự quản permission gate) nên kiểm soát tầng thấp hơn; và **human-in-the-loop mạnh hơn** (dừng chờ người sửa mỗi tầng). Framework lớn cung cấp sẵn `pipeline()`/`parallel()` — chính là mục "parallel fan-out" trong roadmap của em.

---

## 6. Mapping sang khái niệm Agent SDK (để trả lời câu kỹ thuật)

| Khái niệm | Ở đâu trong dự án |
|---|---|
| Orchestrator | `runPipeline()` — điều phối thứ tự tầng |
| Agent / sub-agent | mỗi `runStage()` = 1 `query()` có system prompt riêng |
| Tools | `tools.ts` — `read_file`/`list_dir`/`write_file`/`run_playwright` qua `createSdkMcpServer` |
| External MCP | `PLAYWRIGHT_SERVER` — Microsoft Playwright MCP (stdio), gắn riêng tầng Explore |
| Permission control | `gate`/`canUseTool` per-stage |
| Model routing | `MODELS` — Haiku (run) ↔ Opus (script) ↔ Sonnet (còn lại) |
| Retry/resilience | `withRetry` bọc mỗi tầng |
| Resume | `--from/--to`, artifact đọc lại từ đĩa |

---

## 7. Cách demo nhanh (nếu được hỏi "cho xem chạy")

```bash
cd ai-orchestrator
npm install && npx playwright install chromium     # lần đầu
claude setup-token && export CLAUDE_CODE_OAUTH_TOKEN=<token>

npm run orchestrate                                 # dùng requirement mẫu
# hoặc từng tầng để dễ giải thích:
npx tsx run.ts ai-orchestrator/requirements/item-list-sort.md --to 1   # chỉ tầng Analyze
npx tsx run.ts ai-orchestrator/requirements/item-list-sort.md --from 2 --to 2  # tầng Explore (browser)
```

Điểm nhấn khi demo: mở `artifacts/*.md` cho họ thấy **output từng tầng** — chứng minh pipeline tất định và có thể kiểm chứng ở mỗi bước.
