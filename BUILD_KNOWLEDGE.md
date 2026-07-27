# Build `knowledge.html`

`knowledge.html` là **file được generate** — không sửa tay. Mọi thay đổi phải đi qua
`content/` + `build-knowledge-suite.mjs`, rồi build lại.

```bash
node build-knowledge-suite.mjs
```

Không cần `npm install`, không cần build step — script chỉ dùng `fs` của Node. Output là
một file HTML self-contained ~387 KB, mở trực tiếp bằng browser (`file://` cũng chạy).

---

## Thêm một tài liệu mới

### 1. Đặt file vào `content/`

Markdown (`.md`) hoặc HTML thô (`.html`, cho sơ đồ interactive). Nội dung được render
**verbatim** — builder không bao giờ sửa/rút gọn file của bạn.

```bash
cp ~/my_notes.md content/observability_knowledge.md
```

### 2. Khai báo trong `CATEGORIES`

Mở `build-knowledge-suite.mjs`, thêm một dòng vào mảng `CATEGORIES` (khoảng dòng 28–43):

```js
{ id: 'observability', title: 'Observability', sub: 'Tracing, metrics, log cho QA', accent: BLUE, spec: 'observability.notes', file: 'observability_knowledge.md' },
```

| Field | Ý nghĩa |
|---|---|
| `id` | slug duy nhất — dùng cho URL hash (`knowledge.html#observability`) và `data-id` của tab |
| `title` | tên hiển thị ở heading trang và card |
| `sub` | một dòng mô tả, in italic dưới title |
| `accent` | `CLAY` / `BLUE` / `GREEN` — hằng số ở đầu file. **Luân phiên theo thứ tự** để các tab liền nhau không cùng màu |
| `spec` | tên "spec file" giả, hiện ở tab / breadcrumb / terminal. Motif: `<domain>.<aspect>`, ví dụ `kafka.streaming`, `patterns.solid`, `k8s.autotest`. Đây là chất liệu design chính — đặt tên cho khớp |
| `file` | tên file trong `content/` |
| `rawHtml: true` | thêm field này nếu là `.html` — builder sẽ inject thẳng, không parse markdown |

Thứ tự trong mảng = thứ tự tab, thứ tự dòng trong terminal, và số `N°xx` ở header doc.
`home` phải luôn là phần tử đầu.

### 3. Build

```bash
node build-knowledge-suite.mjs
# ✓ knowledge.html (387.5 KB) — Suite · test-runner identity · ...
```

### 4. Kiểm tra

Mở `knowledge.html`, xác nhận:

- Terminal ở trang chủ stream ra dòng `✓ observability.notes   1,234w`
- Stat "SPEC FILES" tăng lên đúng số
- Tab mới xuất hiện, click vào render đúng nội dung
- `⌘K` tìm được doc mới

---

## Sửa nội dung sẵn có

Sửa file trong `content/`, chạy lại builder. Không cần touch `CATEGORIES`.

Word count, terminal output, stat "WORDS" đều tự tính lại từ nội dung file.

---

## Những thứ hardcode cần để ý

| Chỗ | Giá trị | Khi nào phải sửa |
|---|---|---|
| `QA_COUNT` (~dòng 423) | `198` | Khi thêm/bớt câu trong `qa_automation_interview_answers.md`. Đếm bằng `grep -cE '^### [0-9]+\.' content/qa_automation_interview_answers.md` |
| `sub` của 2 doc interview | `'... 198 câu ...'` | Cùng lúc với `QA_COUNT` |
| `CLAY` / `BLUE` / `GREEN` (dòng 25) | `#d97757` / `#6a9bcc` / `#788c5d` | Chỉ khi đổi palette — xem `KNOWLEDGE_SUITE_DESIGN_PROMPT.md` trước |

`content/_FORMAT.md` **cố ý không** nằm trong `CATEGORIES` — nó là doc mô tả format, không
phải nội dung học.

---

## Ba builder — đừng lẫn

Repo có 3 builder độc lập, cùng đọc `content/` nhưng khác identity design:

| Builder | Output | Identity |
|---|---|---|
| **`build-knowledge-suite.mjs`** | **`knowledge.html`** ← canonical, cái được commit | Suite — test runner · charcoal + clay · Poppins/Lora/Space Mono |
| `build-knowledge-codex.mjs` | `knowledge-codex.html` | Codex — Anthropic brand |
| `build-knowledge-html.mjs` | `knowledge-galaxy.html` + `interview-answers.html` | Midnight Galaxy — tím/violet · Sora/IBM Plex |

Chỉ `build-knowledge-suite.mjs` ghi ra `knowledge.html`. Hai builder kia ghi ra file
riêng, chạy chúng **không** ảnh hưởng `knowledge.html`.

> Trước 2026-07-27, `build-knowledge-html.mjs` cũng ghi thẳng ra `knowledge.html` — chạy nó
> là âm thầm ghi đè bản Suite bằng bản tím. Đã đổi output thành `knowledge-galaxy.html`
> để hết va nhau.

Lưu ý: `CATEGORIES` của mỗi builder là **riêng biệt**. Thêm doc mới vào `suite.mjs` không
tự động thêm vào 2 builder kia. Nếu muốn cả 3 đều có, phải thêm vào cả 3.

---

## Đổi design

Xem `KNOWLEDGE_SUITE_DESIGN_PROMPT.md` — có full design brief (palette, typography,
layout, signature moment) để gen lại hoặc tạo identity mới.

---

## Checklist trước khi push

```bash
node build-knowledge-suite.mjs        # rebuild
git diff --stat knowledge.html        # xem thay đổi có đúng như mong đợi
```

Nếu `git diff` cho thấy CSS/JS thay đổi mà bạn chỉ sửa `content/` → có ai đó đã chạy sai
builder. Chạy lại `build-knowledge-suite.mjs` là xong.
