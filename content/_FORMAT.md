# Knowledge Base — Format & Contribution Guide

Spec chuẩn cho mọi file kiến thức trong `content/`. File mới **phải** theo format này
để render đẹp và nhất quán trong `knowledge.html` (build bằng `build-knowledge-suite.mjs`).

> [!NOTE]
> File bắt đầu bằng `_` (như file này) chỉ là tài liệu nội bộ — build **không** đọc,
> vì build chỉ đọc các file được khai báo trong `CATEGORIES` của `build-knowledge-suite.mjs`.

---

## 1. Cấu trúc file (bắt buộc)

Mỗi file `.md` đi theo đúng thứ tự sau:

```markdown
# Tiêu đề chính (H1 — chỉ 1 cái, đầu file)

> Blockquote intro: mục tiêu của file + dòng "Format: A → B → C".
> Ví dụ: **Format: Nó là gì → Thành phần → Ví dụ → Q&A → Gotcha**.

---

## A. Section lớn (H2 — đánh số 1,2,3 hoặc chữ A,B,C)

### Sub-heading (H3)

Nội dung...
```

Quy ước:
- **H1 (`#`)**: đúng **một** cái, là tên tài liệu, đặt ở dòng đầu.
- **Intro blockquote**: 1–3 dòng ngay sau H1, nêu mục tiêu + "Format:" của file.
- **`---`**: kẻ ngang sau intro và giữa các section lớn.
- **H2 (`##`)**: section chính, nên có tiền tố thứ tự (`## 1.`, `## A.`, `## 0.`).
- **H3 (`###`) / H4 (`####`)**: chia nhỏ. H2/H3 tự động lên **mục lục (TOC)** và **⌘K search**.

---

## 2. Callout boxes (GitHub Alert syntax)

Dùng để làm nổi bật điểm cần nhớ. Cú pháp: blockquote mở đầu bằng `[!TYPE]`.

```markdown
> [!TIP]
> Nội dung mẹo.

> [!GOTCHA]
> Cái bẫy hay mắc.
```

| Type | Hiển thị | Dùng khi |
|---|---|---|
| `[!TIP]` | 💡 Tip (xanh lá) | Mẹo, best practice |
| `[!NOTE]` / `[!INFO]` | 📝 Note (cyan) | Ghi chú, thông tin thêm |
| `[!IMPORTANT]` / `[!KEY]` | ⭐ Important (periwinkle) | Điểm cốt lõi phải nhớ |
| `[!WARNING]` / `[!GOTCHA]` | ⚠️ Warning (vàng) | Cảnh báo, bẫy thường gặp |
| `[!CAUTION]` / `[!DANGER]` | 🚨 Danger (đỏ) | Lỗi nghiêm trọng, đừng làm |

> [!IMPORTANT]
> Phải có **dòng trống** trước và sau block callout, và mỗi dòng nội dung bắt đầu bằng `>`.

---

## 3. Thành phần Markdown khác

- **Bảng**: dùng GFM table (`| ... | ... |`). Cho phép `**bold**` trong ô. Bảng tự scroll ngang trên mobile.
- **Code block**: luôn **ghi rõ ngôn ngữ** để highlight đúng — ` ```ts `, ` ```bash `, ` ```java `, ` ```yaml `...
- **Inline code**: `` `code` `` cho tên biến/lệnh/file.
- **Nhấn mạnh**: `**đậm**` cho label, `*nghiêng*` cho chú thích.
- **Blockquote thường** (không có `[!...]`) → render thành trích dẫn nghiêng.
- **Nhãn đoạn** (khuyến nghị để câu trả lời có cấu trúc): `**Summary:**`, `**Giải thích:**`, `**Ví dụ:**`, `**Pros:** / **Cons:**`.

Ngôn ngữ: tiếng Việt + giữ nguyên thuật ngữ tiếng Anh (locator, flaky, idempotent...).

---

## 4. Chế độ ôn tập (chỉ áp dụng cho file kiểu "Interview Answers")

Nếu muốn câu trả lời **ẩn/hiện được** (để tự ôn):
- Viết mỗi câu hỏi là một **H3 bắt đầu bằng số**: `### 12. Câu hỏi ...`
- Toàn bộ nội dung tới H3/H2 kế tiếp sẽ trở thành **answer** ẩn sau nút **See answer**.
- Cần cả nút "Show all answers" → tự động sinh, không cần viết gì thêm.

```markdown
### 1. Shift-left testing là gì?

**Summary:** ...        <- phần này bị ẩn cho tới khi bấm "See answer"
```

Cơ chế này chỉ bật cho category có `id: 'interview-answers'`. File khác thì H3 hiển thị bình thường.

---

## 5. Thêm 1 file kiến thức mới — checklist

1. Tạo file `.md` trong `content/` theo format trên (đặt tên rõ nghĩa, ví dụ `docker_knowledge.md`).
2. Mở `build-knowledge-suite.mjs` → thêm 1 entry vào mảng `CATEGORIES`:
   ```js
   { id: 'docker', title: 'Docker', sub: 'Image, layer, compose cho QA',
     accent: '#7AC0E8', glyph: '🐳', file: 'docker_knowledge.md' },
   ```
   - `id`: kebab-case, duy nhất (dùng cho URL hash `#docker`).
   - `title` / `sub`: hiện ở sidebar + card.
   - `accent`: mã hex — chọn tông **cool/blueprint** (cyan/teal/sky/indigo) cho hợp theme; chỉ dùng warm (amber/coral) để tạo điểm nhấn.
   - `glyph`: 1 emoji hoặc ký tự.
   - `file`: tên file trong `content/`. Nếu là HTML tự chứa (như sơ đồ), thêm `rawHtml: true`.
3. Build lại:
   ```bash
   node build-knowledge-suite.mjs
   ```
4. Mở `knowledge.html`, kiểm tra section mới + ⌘K tìm được.

> [!TIP]
> Thứ tự trong `CATEGORIES` = thứ tự sidebar và số thứ tự `01, 02, ...` hiển thị trên card/nav.
