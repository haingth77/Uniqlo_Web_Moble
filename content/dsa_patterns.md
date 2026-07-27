# Coding Interview Patterns — Two Pointers, Hash Map, Stack, Binary Search, Linked List

> Hệ thống hóa 5 nhóm kỹ thuật cốt lõi cho vòng coding interview vị trí Middle Automation Tester:
> dấu hiệu nhận diện, template học thuộc, bài tập đã giải và bẫy Big-O.
> Format: **Kỹ thuật là gì → Khi nào dùng → Template → Bài tập đã giải → Gotcha**.

---

## 1. Tổng quan các kỹ thuật cơ bản cần ôn

Vị trí này thường kiểm tra tư duy tối ưu hiệu năng cơ bản (Time/Space Complexity), kỹ năng xử lý Array/String
và cách viết code sạch — ít khi yêu cầu thuật toán hàn lâm (đồ thị, quy hoạch động phức tạp).

Để pass vòng coding interview, bạn cần nắm vững 5 nhóm kỹ thuật cốt lõi sau:

1. **Two Pointers (Hai con trỏ):**
  - Kỹ thuật tối ưu hóa vòng lặp lồng nhau (từ O(N^2) xuống O(N)).
  - Gồm 3 dạng chính: Ngược chiều (Opposite Ends), Cùng chiều (Fast/Slow), Cửa sổ trượt (Sliding Window).
2. **Hash Map / Hash Set (Bảng băm / Tập hợp):**
  - Kỹ thuật đánh đổi bộ nhớ (Space O(N)) lấy tốc độ (Time O(1)).
  - Ứng dụng: Đếm tần suất xuất hiện, kiểm tra phần tử trùng lặp, tra cứu nhanh thay cho vòng lặp ngầm (như `.includes()`, `.indexOf()`).
3. **Stack (Ngăn xếp - LIFO):**
  - Ứng dụng để giải quyết các bài toán có tính chất "đối xứng cục bộ" hoặc "hoàn tác" (Undo).
  - Ví dụ kinh điển: Kiểm tra dấu ngoặc hợp lệ (Valid Parentheses).
4. **Binary Search (Tìm kiếm nhị phân):**
  - Ứng dụng khi cần tìm kiếm một giá trị hoặc kết quả trên một MẢNG ĐÃ SẮP XẾP.
  - Tối ưu thời gian từ O(N) xuống O(log N).
5. **Linked List (Danh sách liên kết):**
  - Fast/Slow pointers, 3-pointer reverse, pointer manipulation trick.
  - Hay xuất hiện dạng Easy nhưng dễ vướng bẫy `null` và mất reference chain.

---

## 2. Chi tiết kỹ thuật và bài tập thực hành

### 2.1. Kỹ thuật Two Pointers (Hai con trỏ)

**Giải thích chung:**
Thay vì dùng 2 vòng lặp lồng nhau vét cạn mọi trường hợp, Two Pointers sử dụng 2 biến chỉ mục (index) di chuyển theo các quy luật nhất định dựa trên tính chất của bài toán để loại trừ các phép thử thừa thãi.

**Đặc điểm nhận diện khi nào nên sử dụng:**

- Đề bài cho mảng đã được sắp xếp (Sorted Array).
- Yêu cầu tìm các "Cặp" (Pairs) hoặc "Bộ ba" (Triplets) thỏa mãn điều kiện.
- Yêu cầu thao tác trực tiếp trên mảng gốc (In-place modification - Space O(1)).
- Tính đối xứng (Palindrome).
- Các bài toán tìm kiếm trên Linked List (như tìm điểm giữa, phát hiện vòng lặp).

---

#### 2.1.1. Dạng 1: Ngược chiều (Opposite Ends)

**Cách hoạt động:** 
Một con trỏ `left` xuất phát từ đầu mảng (0), một con trỏ `right` xuất phát từ cuối mảng (length - 1). Cả hai di chuyển ngược hướng và gặp nhau ở giữa.

**Bài tập đã giải:**

1. **Valid Palindrome (LeetCode 125)**
  - *Mục tiêu:* Kiểm tra chuỗi đối xứng, bỏ qua ký tự đặc biệt.
  - *Bài học:* Dùng 2 con trỏ soi trực tiếp trên chuỗi gốc, không tạo chuỗi phụ (tránh tốn bộ nhớ). Gặp ký tự đặc biệt thì nhích con trỏ bỏ qua.
2. **3Sum (LeetCode 15 - Medium)**
  - *Mục tiêu:* Tìm 3 số có tổng bằng 0, không lấy bộ trùng lặp.
  - *Bài học:* BẮT BUỘC phải sắp xếp mảng (Sort) trước. Cố định 1 số, dùng Two Pointers ngược chiều để tìm 2 số còn lại. Tận dụng tính chất mảng đã sắp xếp để dịch chuyển con trỏ (tổng thiếu thì tăng `left`, tổng thừa thì giảm `right`). Chú ý logic bỏ qua phần tử trùng lặp (`nums[i] == nums[i-1]`).

---

#### 2.1.2. Dạng 2: Cùng chiều (Fast/Slow Pointers)

**Cách hoạt động:**
Hai con trỏ xuất phát từ cùng một phía. 

- `fast`: Trinh sát đi trước để quét mảng, kiểm tra điều kiện.
- `slow`: Chốt chặn đi sau, lưu giữ vị trí hợp lệ để sẵn sàng ghi dữ liệu.

**Lưu ý cốt lõi (Vận dụng tính chất mảng):**

- **Sử dụng Ghi đè (Overwrite) thay vì Xóa (Splice/Delete):** Trong mảng, thao tác xóa phần tử ở giữa sẽ đẩy độ phức tạp lên O(N^2) do phải dịch chuyển các phần tử phía sau. Việc dùng con trỏ `slow` để ghi đè giá trị của `fast` giúp giữ nguyên tốc độ O(N).

**Bài tập đã giải:**

1. **Remove Duplicates from Sorted Array II (LeetCode 80 - Medium)**
  - *Mục tiêu:* Xóa phần tử trùng lặp trên mảng đã sắp xếp, chỉ giữ tối đa 2 phần tử giống nhau, làm trực tiếp trên mảng (In-place).
  - *Bài học:* So sánh `nums[fast]` với phần tử ở vị trí `nums[slow - 2]`. Nếu khác nhau, tiến hành **ghi đè** `nums[slow] = nums[fast]` và tăng `slow`. Không dùng `.splice()` để tránh lỗi Time/Output Limit Exceeded.

---

#### 2.1.3. Dạng 3: Cửa sổ trượt (Sliding Window)

**Cách hoạt động:**
Hai con trỏ `left` và `right` tạo thành một khung cửa sổ `[left...right]`.

- Mở rộng cửa sổ: Tăng `right` để nạp thêm phần tử.
- Thu hẹp cửa sổ: Khi cửa sổ vi phạm điều kiện bài toán, dùng vòng lặp `while` tăng `left` để loại bỏ dần phần tử cho đến khi cửa sổ hợp lệ trở lại.

**Lưu ý cốt lõi (Vận dụng tính chất ngôn ngữ):**

- **Tránh thao tác cắt/nối chuỗi liên tục:** String là kiểu dữ liệu bất biến (Immutable). Dùng `.slice()` hoặc `+` trong vòng lặp sẽ ép hệ thống liên tục cấp phát lại bộ nhớ, gây chậm chương trình nghiêm trọng.
- **Sử dụng Set/Map để tra cứu:** Thay vì dùng `.includes()` (bản chất là vòng lặp ẩn O(N)), hãy lưu trạng thái của cửa sổ vào cấu trúc `Set` hoặc `Map`. Việc `add`, `delete`, `has` trên Set chỉ tốn O(1), biến bài toán đa vòng lặp thành O(N) thực sự. Tính toán độ dài cửa sổ bằng công thức toán học `right - left + 1`.

**Bài tập đã giải:**

1. **Longest Substring Without Repeating Characters (LeetCode 3 - Medium)**
  - *Mục tiêu:* Tìm chuỗi con liên tiếp dài nhất không có ký tự lặp.
  - *Bài học:* Dùng `Set` để quản lý các ký tự đang có trong cửa sổ. Khi `right` gặp một ký tự đã tồn tại trong `Set`, dùng vòng lặp thu hẹp `left` (đồng thời `.delete()` các ký tự bị loại ra khỏi `Set`) cho đến khi hết trùng lặp. Tính toán kết quả thông qua biến lưu trữ kỷ lục (`maxLength = Math.max(maxLength, right - left + 1)`).

---

### 2.2. Kỹ thuật Hash Map / Hash Set (Bảng băm / Tập hợp)

**Giải thích chung:**
Hash Map / Hash Set là cấu trúc dữ liệu cho phép tra cứu, thêm, xóa phần tử với độ phức tạp O(1) bằng cách lưu trữ khóa-giá trị. Kỹ thuật này đánh đổi bộ nhớ (Space O(N)) để lấy tốc độ (Time O(1)), giúp tối ưu hóa các bài toán brute force từ O(N²) xuống O(N).

**Đặc điểm nhận diện khi nào nên sử dụng:**

- Bài toán yêu cầu tìm kiếm nhanh (thay vì dùng `.includes()` hay `.indexOf()`).
- Cần đếm tần suất xuất hiện của phần tử (Character frequency, Word count).
- Cần phát hiện phần tử trùng lặp hoặc phần tử duy nhất.
- Cần tìm cặp (Pair) thỏa mãn điều kiện nào đó (Complement).
- Cần nhóm các phần tử theo tiêu chí nào (Group anagrams, Group people by age).
- Cần kiểm tra chu kỳ hoặc phát hiện vòng lặp.

**Lưu ý cốt lõi (Chọn Hash Map vs Hash Set):**

- **Hash Set:** Chỉ lưu trữ khóa, kiểm tra sự tồn tại. Dùng khi chỉ quan tâm "có" hay "không có".
- **Hash Map:** Lưu trữ cặp khóa-giá trị, hữu ích khi cần lưu giữ thêm thông tin như tần suất, vị trí, hoặc giá trị liên quan.
- **Map vs Object:** JavaScript `Map` hỗ trợ khóa bất kỳ (object, number, string); `Object` chỉ hỗ trợ string/Symbol. Dùng `Map` khi cần tính năng đầy đủ.

---

#### 2.2.1. Pattern 1: Đếm Tần Suất (Frequency Count)

**Cách hoạt động:**
Duyệt qua mảng/chuỗi, sử dụng Hash Map lưu trữ từng phần tử và số lần xuất hiện của nó. Sau đó, tra cứu Hash Map để tìm câu trả lời.

**Bài tập đã giải:**

1. **Contains Duplicate (LeetCode 217 - Easy)**
  - *Mục tiêu:* Kiểm tra mảng có chứa phần tử trùng lặp không.
  - *Bài học:* Dùng `Set` để lưu các phần tử đã gặp. Khi gặp phần tử mới, kiểm tra nó có trong `Set` không (`.has()`). Nếu có → return `true`, nếu không → `.add()` vào `Set`. Độ phức tạp O(N) thay vì brute force O(N²).
2. **Valid Anagram (LeetCode 242 - Easy)**
  - *Mục tiêu:* Kiểm tra 2 chuỗi có phải anagram (chứa cùng bộ ký tự) không.
  - *Bài học:* Cách 1: Dùng 2 Hash Map (Map<char, count>) cho từng chuỗi, so sánh. Cách 2 nhanh hơn: Sắp xếp chuỗi rồi so sánh string. Lưu ý: Nếu độ dài khác nhau → ngay lập tức trả về `false`.
3. **Majority Element (LeetCode 169 - Easy)**
  - *Mục tiêu:* Tìm phần tử xuất hiện >N/2 lần trong mảng.
  - *Bài học:* Dùng `Map` để đếm tần suất từng phần tử. Khi tần suất của bất kỳ phần tử nào vượt quá N/2 → return phần tử đó. Bài toán này có solution khác (Boyer-Moore Voting Algorithm) nhưng Hash Map là cách tiếp cận dễ hiểu nhất.

---

#### 2.2.2. Pattern 2: Kiểm Tra Tồn Tại & Complement (Lookup)

**Cách hoạt động:**
Lưu trữ phần tử trong Hash Set hoặc Hash Map, sau đó tra cứu xem một phần tử hay giá trị "bù" nào đó có tồn tại không.

**Bài tập đã giải:**

1. **Two Sum (LeetCode 1 - Medium)**
  - *Mục tiêu:* Tìm 2 index của 2 số có tổng bằng `target`.
  - *Bài học:* Dùng `Map<value, index>` để lưu giá trị đã gặp. Khi duyệt qua phần tử thứ i, kiểm tra `target - nums[i]` có trong `Map` không. Nếu có → return indices, nếu không → thêm `nums[i]` vào `Map`. Độ phức tạp O(N), không cần sắp xếp như Two Pointers.
2. **Intersection of Two Arrays (LeetCode 349 - Easy)**
  - *Mục tiêu:* Tìm phần tử chung giữa 2 mảng.
  - *Bài học:* Dùng `Set` để lưu các phần tử của mảng thứ nhất. Duyệt mảng thứ hai, nếu phần tử nào tồn tại trong `Set` → thêm vào kết quả (lưu ý: không lặp lại). Độ phức tạp O(M + N).

---

#### 2.2.3. Pattern 3: Nhóm & Phân Loại (Grouping)

**Cách hoạt động:**
Sử dụng Hash Map với khóa tạo từ tiêu chí nào đó (ví dụ: chuỗi sorted, hash value), sau đó nhóm các phần tử cùng khóa lại.

**Bài tập đã giải:**

1. **Group Anagrams (LeetCode 49 - Medium)**
  - *Mục tiêu:* Nhóm các chuỗi là anagram của nhau.
  - *Bài học:* Khóa của mỗi nhóm là chuỗi được sắp xếp lại từ các ký tự (ví dụ: "listen" → "eilnst", "silent" → "eilnst"). Dùng `Map<sorted, list>` để lưu. Duyệt qua input, sort từng chuỗi làm khóa, thêm chuỗi gốc vào list tương ứng. Cuối cùng return tất cả value (các list) từ Map. Độ phức tạp O(N * K log K) với K là độ dài chuỗi.

---

#### 2.2.4. Pattern 4: Phát Hiện Chu Kỳ (Cycle Detection)

**Cách hoạt động:**
Lưu trữ trạng thái trong Hash Map / Hash Set, duyệt qua quá trình biến đổi, kiểm tra xem trạng thái nào đã gặp trước đó chưa (phát hiện chu kỳ).

**Bài tập đã giải:**

1. **Happy Number (LeetCode 202 - Easy)**
  - *Mục tiêu:* Kiểm tra một số có phải "happy number" không (nếu lặp lại quá trình bình phương tổng các chữ số, cuối cùng có đạt tới 1 không).
  - *Bài học:* Dùng `Set` để lưu các giá trị trung gian đã gặp. Mỗi vòng lặp tính tổng bình phương các chữ số. Nếu kết quả = 1 → return `true`. Nếu kết quả đã tồn tại trong `Set` → bài toán rơi vào vòng lặp vô hạn → return `false`. Nếu chưa tồn tại → thêm vào `Set` rồi tiếp tục. Bài toán này thể hiện ý tưởng phát hiện chu kỳ hiệu quả.
2. **Longest Consecutive (LeetCode 128 - Medium)**
  - *Mục tiêu:* Tìm dãy số liên tiếp dài nhất trong mảng không sắp xếp.
  - *Bài học:* Brute force là sắp xếp O(N log N) rồi duyệt. Cách tối ưu: Dùng `Set` lưu tất cả phần tử. Duyệt qua Set, nếu phần tử hiện tại là "bắt đầu" của dãy (`num - 1` không có trong Set) → từ đó bắt đầu duyệt dãy tiếp theo (`num`, `num + 1`, `num + 2`, ...). Lưu trữ độ dài dãy dài nhất. Độ phức tạp O(N) vì mỗi phần tử chỉ được xử lý một lần.

---

**Bảng tóm tắt các bài tập Hash Map:**


| #   | Bài Tập                    | LeetCode | Độ khó | Pattern               | Ghi chú                  |
| --- | -------------------------- | -------- | ------ | --------------------- | ------------------------ |
| 1   | Contains Duplicate         | #217     | Easy   | Frequency Count (Set) | Kiểm tra trùng lặp       |
| 2   | Valid Anagram              | #242     | Easy   | Frequency Count (Map) | So sánh bộ ký tự         |
| 3   | Majority Element           | #169     | Easy   | Frequency Count (Map) | Tìm phần tử >N/2         |
| 4   | Intersection of Two Arrays | #349     | Easy   | Lookup (Set)          | Tìm phần tử chung        |
| 5   | Two Sum                    | #1       | Medium | Lookup (Map)          | Tìm cặp có tổng = target |
| 6   | Group Anagrams             | #49      | Medium | Grouping (Map)        | Nhóm anagrams            |
| 7   | Longest Consecutive        | #128     | Medium | Cycle Detection (Set) | Dãy dài nhất             |
| 8   | Happy Number               | #202     | Medium | Cycle Detection (Set) | Kiểm tra chu kỳ          |


---

### 2.3. Kỹ thuật Stack (Ngăn xếp - LIFO: Last In First Out)

**Giải thích chung:**
Stack là cấu trúc dữ liệu LIFO (phần tử được thêm vào sau cùng sẽ được lấy ra đầu tiên). Kỹ thuật này hữu ích khi giải quyết các bài toán có tính chất "đối xứng cục bộ" (matching pairs), "hoàn tác" (undo), hoặc "tìm phần tử gần nhất".

**Đặc điểm nhận diện khi nào nên sử dụng:**

- Bài toán yêu cầu kiểm tra "cặp khớp" (matching pairs) - ví dụ: dấu ngoặc, tags HTML.
- Cần tìm phần tử "gần nhất" thỏa mãn điều kiện (ví dụ: phần tử nhỏ hơn gần nhất).
- Bài toán có tính chất "hoàn tác" hoặc "quay lui" (backtrack).
- Yêu cầu xử lý theo thứ tự ngược lại (LIFO).

**Lưu ý cốt lõi (JavaScript Stack):**

- Stack có thể dùng **Array** với phương thức `.push()` (thêm) và `.pop()` (lấy ra).
- **push** — `stack.push(x)`: thêm phần tử vào đỉnh stack → O(1)
- **pop** — `stack.pop()`: lấy phần tử ở đỉnh ra → O(1)
- **peek** — `stack[stack.length - 1]`: xem đỉnh mà không lấy ra → O(1)
- **isEmpty** — `stack.length === 0`: kiểm tra stack rỗng → O(1)

---

#### 2.3.1. Pattern 1: Kiểm Tra Cặp Khớp (Matching Pairs)

**Cách hoạt động:**
Duyệt qua chuỗi/mảng, khi gặp ký tự mở (opening character), push vào stack. Khi gặp ký tự đóng (closing character), kiểm tra xem top của stack có khớp không. Nếu khớp → pop, nếu không → return false.

**Bài tập:**

1. **Valid Parentheses (LeetCode 20 - Easy)**
  - *Mục tiêu:* Kiểm tra chuỗi dấu ngoặc có hợp lệ không (đối xứng, đóng đúng thứ tự).
  - *Ví dụ:* `"()[]{}"` → true, `"([)]"` → false (đóng sai thứ tự)
  - *Bài học:* Dùng stack lưu dấu mở. Khi gặp dấu đóng, kiểm tra top stack có khớp không. Nếu khớp → pop, không → return false. Cuối cùng stack phải rỗng.

---

#### 2.3.2. Pattern 2: Monotonic Stack (Tìm Phần Tử Gần Nhất - Next Greater Element)

**Định nghĩa Monotonic Stack:**
Là một Stack thường nhưng có thêm **invariant** rằng các phần tử trong stack luôn theo thứ tự **đơn điệu** (tăng dần hoặc giảm dần) từ đáy lên đỉnh. Để duy trì invariant, **trước khi push** ta phải **pop bớt** các phần tử vi phạm.

**Phân biệt loại:**
- **Monotonic DECREASING** (đáy→đỉnh giảm): dùng cho "next GREATER" — số nhỏ chờ số lớn
- **Monotonic INCREASING** (đáy→đỉnh tăng): dùng cho "next SMALLER" — số lớn chờ số nhỏ

**Template chuẩn — HỌC THUỘC:**
```typescript
for (const x of arr) {
    while (stack.length > 0 && CONDITION(x, top)) {
        const top = stack.pop()!;
        // ghi nhận: top vừa tìm được "next" là x
        map.set(top, x);
    }
    stack.push(x);    // 🔑 LUÔN push x ở cuối, ngoài while
}
```

Trong đó `CONDITION`:
- Next greater → `x > top` (decreasing stack)
- Next smaller → `x < top` (increasing stack)

**Ẩn dụ "phòng chờ":**
- Stack = phòng chờ những kẻ chưa tìm được next
- Khi `x` mới to hơn → "giải thoát" những kẻ chờ → ghi đáp án
- Cuối loop, ai còn trong stack = không có next → return `-1`

> [!GOTCHA]
> - Quên `push(x)` ở cuối (sau `while`) — phần tử bị bỏ rơi, không bao giờ vào stack.
> - Stack rỗng → `stack[-1] === undefined`, mà `x > undefined` luôn `false` → vòng lặp im lặng không chạy.
> - Thứ tự `&&`: **PHẢI** check `stack.length > 0` TRƯỚC, rồi mới so sánh giá trị.

**Bài tập:**

1. **Next Greater Element I (LeetCode 496 - Easy)**
  - *Mục tiêu:* Cho 2 mảng `nums1` (subset của `nums2`), tìm phần tử lớn hơn gần nhất của từng phần tử trong `nums1` từ `nums2`.
  - *Ví dụ:* `nums1 = [4,1,2], nums2 = [1,3,4,2]` → `[-1,3,-1]`
  - *Bài học:* Duyệt `nums2` 1 lần, dùng Monotonic Decreasing Stack. Khi `ele > top` → pop, lưu vào `Map<value, nextGreater>`. Cuối duyệt `nums1`, lookup map (không có → -1).
  - *Time:* O(n+m) — mỗi phần tử push/pop ≤ 1 lần (amortized)

**Tại sao for + while = O(n)?**
Pattern Monotonic Stack có inner while nhưng vẫn là O(n) vì **amortized analysis**: mỗi phần tử push 1 lần và pop tối đa 1 lần trong toàn bộ chương trình. Tổng work ≤ 2n = O(n).

**Mở khóa các bài Medium/Hard:**
- #739 Daily Temperatures (Medium)
- #503 Next Greater Element II - mảng vòng tròn (Medium)
- #84 Largest Rectangle in Histogram (Hard)
- #42 Trapping Rain Water (Hard)

---

#### 2.3.3. Pattern 3: Loại Bỏ Các Phần Tử Dư Thừa (Remove Duplicates)

**Cách hoạt động:**
Duyệt qua chuỗi, nếu ký tự hiện tại khác top stack → push. Nếu bằng và điều kiện thỏa mãn → pop.

**Bài tập:**

1. **Remove All Adjacent Duplicates In String (LeetCode 1047 - Easy)**
  - *Mục tiêu:* Xóa tất cả các ký tự trùng lặp liên tiếp trong chuỗi.
  - *Ví dụ:* `"abbaca"` → `"ca"` (xóa "bb", rồi "aa" mới lộ ra)
  - *Bài học:* Dùng stack, khi ký tự hiện tại bằng top stack → pop (loại bỏ cặp), nếu không → push.

---

**Bảng tóm tắt các bài tập Stack:**


| #   | Bài Tập                                  | LeetCode | Độ khó | Pattern           | Ghi chú                     |
| --- | ---------------------------------------- | -------- | ------ | ----------------- | --------------------------- |
| 1   | Valid Parentheses                        | #20      | Easy   | Matching Pairs    | Kiểm tra dấu ngoặc hợp lệ   |
| 2   | Remove All Adjacent Duplicates In String | #1047    | Easy   | Remove Duplicates | Xóa ký tự trùng liền kề     |
| 3   | Next Greater Element I                   | #496     | Easy   | Monotonic Stack   | Decreasing stack + Map      |
| 4   | Backspace String Compare                 | #844     | Easy   | Stack Simulation  | So sánh chuỗi với backspace |
| 5   | Daily Temperatures                       | #739     | Medium | Monotonic Stack   | Next greater (khoảng cách)  |


---

### 2.4. Kỹ thuật Binary Search (Tìm kiếm nhị phân)

**Giải thích chung:**
Binary Search là kỹ thuật tối ưu hóa tìm kiếm trên mảng/danh sách **đã sắp xếp** từ O(N) xuống O(log N) bằng cách chia nhỏ vấn đề thành nửa mỗi lần (divide and conquer). Nó không chỉ dùng để tìm phần tử, mà còn tìm kiếm câu trả lời trên một không gian tìm kiếm có tính chất đơn điệu (monotonic).

**Đặc điểm nhận diện khi nào nên sử dụng:**

- Mảy đã được sắp xếp (hoặc được sắp xếp ẩn).
- Cần tìm kiếm một phần tử hoặc một câu trả lời trong không gian có tính chất đơn điệu.
- Độ phức tạp yêu cầu O(log N) hoặc tốt hơn (dấu hiệu cần Binary Search).
- Bài toán có tính chất "tìm đầu tiên", "tìm cuối cùng" trên mảng sắp xếp.

**Lưu ý cốt lõi (Tránh Off-by-One Error):**

- **2 templates riêng biệt:** Exact Search (tìm phần tử cụ thể) vs Boundary Search (tìm biên)
- **Tránh overflow:** Sử dụng `mid = left + Math.floor((right - left) / 2)` thay vì `mid = (left + right) / 2`
- **PHẢI dùng `Math.floor`, KHÔNG được `Math.round`:** Trong Boundary Search dùng `right = mid` (không -1), nếu mid biased về right (như khi `Math.round`) → infinite loop khi `left=0, right=1`
- **Vai trò `left` trong công thức:** `left` đóng vai trò gốc tọa độ để mid nằm đúng giữa range `[left, right]` (không phải `[0, right-left]`)

---

#### 2.4.1. Template 1: Exact Search (Tìm Phần Tử Chính Xác)

**Cách hoạt động:**
Duy trì 2 con trỏ `left` và `right`, tính `mid`. Nếu `nums[mid] === target` → return, nếu nhỏ hơn → tăng `left`, lớn hơn → giảm `right`. Lặp cho đến khi tìm thấy hoặc `left > right`.

**Template chuẩn — HỌC THUỘC:**
```typescript
let left = 0, right = nums.length - 1;       // closed range
while (left <= right) {                       // <=
    const mid = left + Math.floor((right - left) / 2);
    if (nums[mid] === target) return mid;     // early return khi match
    if (nums[mid] < target) left = mid + 1;   // ±1
    else right = mid - 1;
}
return -1;                                    // không tìm thấy
```

**Bài tập:**

1. **Binary Search (LeetCode 704 - Easy)**
  - *Mục tiêu:* Tìm index của phần tử trong mảng đã sắp xếp.
  - *Bài học:* Template chuẩn, cơ bản nhất.

---

#### 2.4.2. Template 2: Boundary Search (Tìm Biên)

**Cách hoạt động:**
Tìm vị trí nhỏ nhất thỏa điều kiện (first true). KHÔNG return khi match — phải tiếp tục thu hẹp để tìm true ĐẦU TIÊN. Khi `left == right` → đó là đáp án.

**Template chuẩn — HỌC THUỘC:**
```typescript
let left = 0, right = nums.length;            // hoặc nums.length - 1 tùy bài
while (left < right) {                         // < (KHÔNG <=)
    const mid = left + Math.floor((right - left) / 2);
    if (condition(mid)) right = mid;           // mid CÓ THỂ là answer → giữ (KHÔNG -1)
    else left = mid + 1;                       // mid không phải → loại
}
return left;                                   // left == right == answer
```

> [!KEY]
> **Invariant cốt lõi:** đáp án luôn nằm trong range `[left, right]`. Khi `left == right`, đó chính là đáp án.

**So sánh Exact vs Boundary:**

| | Exact Search | Boundary Search |
|---|---|---|
| Loop | `while (left <= right)` | `while (left < right)` |
| Khi match | `return mid` | KHÔNG return, tiếp tục |
| Update right | `right = mid - 1` | `right = mid` |
| Return | `return -1` | `return left` |

> [!GOTCHA]
> - Trộn 2 template (Exact + check neighbor) → gấp đôi công việc, không generalize được.
> - Dùng `Math.round` thay `Math.floor` → **infinite loop** khi `left = 0, right = 1`.
> - Quên invariant: khi `condition(mid) = true`, `mid` có thể chính là đáp án → **KHÔNG** `-1`.

**Bài tập:**

1. **First Bad Version (LeetCode 278 - Easy)**
  - *Mục tiêu:* Tìm version bad đầu tiên (sau đó tất cả bad).
  - *Bài học:* Template Boundary thuần. 1 API call/iteration. Tránh trộn với Exact Search template.

2. **Find First and Last Position (LeetCode 34 - Medium)**
  - *Mục tiêu:* Tìm vị trí đầu tiên và cuối cùng của một phần tử trong mảng.
  - *Ví dụ:* `nums = [5,7,7,8,8,10], target = 8` → `[3,4]`
  - *Bài học:* Chạy Boundary Search 2 lần:
    - First: nhỏ nhất với `nums[i] >= target`. Sau đó check `nums[first] !== target` → return `[-1, -1]`
    - Last: nhỏ nhất với `nums[i] > target`, trừ 1. **Đặt `right = nums.length`** (không -1) để handle case target là max.

---

**Bảng tóm tắt các bài tập Binary Search (Easy/Medium):**


| #   | Bài Tập                      | LeetCode | Độ khó | Pattern         | Ghi chú                             |
| --- | ---------------------------- | -------- | ------ | --------------- | ----------------------------------- |
| 1   | Binary Search                | #704     | Easy   | Exact Search    | Template chuẩn                      |
| 2   | First Bad Version            | #278     | Easy   | Boundary Search | Tìm phần tử đầu tiên thỏa điều kiện |
| 3   | Find First and Last Position | #34      | Medium | Dual Boundary   | Chạy Boundary 2 lần                 |

---

### 2.5. Kỹ thuật Linked List (Danh Sách Liên Kết)

**Giải thích chung:**
Linked List là cấu trúc dữ liệu trong đó mỗi phần tử (node) chứa giá trị (`val`) và con trỏ đến phần tử tiếp theo (`next`). Khác với Array (lưu trữ liên tục), Linked List lưu trữ rải rác → duyệt O(N), nhưng chèn/xóa ở giữa nhanh O(1) (nếu có ref tới node trước).

**LeetCode ListNode structure:**
```typescript
class ListNode {
    val: number
    next: ListNode | null
    constructor(val?: number, next?: ListNode | null) {
        this.val = val ?? 0;
        this.next = next ?? null;
    }
}
```

---

#### 2.5.1. Pattern 1: Fast/Slow Pointers

**Cách hoạt động:**
- `slow` đi 1 bước/vòng
- `fast` đi 2 bước/vòng
- Khi `fast` chạm null → `slow` ở giữa (#876)
- Trong cycle → `fast` bắt kịp `slow` (#141)

**Template chuẩn:**
```typescript
let slow = head, fast = head;
while (fast !== null && fast.next !== null) {
    slow = slow!.next;
    fast = fast.next.next;
    // optional: if (slow === fast) ... (cycle detect)
}
```

**Bẫy:**
- Phải check `fast.next !== null` vì fast làm `.next.next`
- Move TRƯỚC, check SAU (tránh false positive ở init)
- Cycle detect: so sánh `slow === fast` (node), KHÔNG `slow.val === fast.val`
- Quy tắc De Morgan: "Exit khi A OR B" → "Continue khi NOT A AND NOT B"

**Bài tập:**
- **Middle of Linked List (#876 - Easy):** Trả về node giữa (khi chẵn, trả node thứ 2).
- **Linked List Cycle (#141 - Easy):** Floyd's Algorithm — fast bắt kịp slow trong cycle.

---

#### 2.5.2. Pattern 2: 3-Pointer Reverse

**Cách hoạt động:**
Dùng 3 con trỏ `prev`, `cur`, `next` để đảo chiều từng pointer một, in-place.

**Template — HỌC THUỘC:**
```typescript
let prev: ListNode | null = null;
let cur = head;
while (cur !== null) {
    const next = cur.next;   // 1. LƯU next TRƯỚC khi đổi
    cur.next = prev;          // 2. Đảo chiều
    prev = cur;               // 3. Tiến prev
    cur = next;               // 4. Tiến cur
}
return prev;  // prev là head mới
```

**Bẫy:**
- ❌ Không lưu `next` trước → đứt chain ngay sau `cur.next = prev`
- ❌ Return `cur` thay vì `prev` — cur=null khi thoát loop

**Bài tập:**
- **Reverse Linked List (#206 - Easy):** Template gốc, áp dụng cho toàn list.
- **Mở khóa:** #92 (reverse 1 đoạn), #25 (reverse k-group), #234 (palindrome list)

---

#### 2.5.3. Pattern 3: Pointer Manipulation Trick

**Cách hoạt động:**
Khi không có đủ thông tin (vd không có `head`, không có `prev`), thay đổi **data** của node thay vì cấu trúc.

**Bài tập:**
- **Delete Node (#237 - Easy):**
  ```typescript
  node.val = node.next.val;       // copy giá trị từ node sau
  node.next = node.next.next;     // skip node sau
  ```
  Trick: "giả vờ thành node sau, rồi xóa node sau" — vì không có `prev` để xóa thông thường.
  Time **O(1)**.

---

**Bảng tóm tắt các bài tập Linked List:**


| #   | Bài Tập                      | LeetCode | Độ khó | Pattern              | Ghi chú                             |
| --- | ---------------------------- | -------- | ------ | -------------------- | ----------------------------------- |
| 1   | Middle of the Linked List    | #876     | Easy   | Fast/Slow            | Warm-up Fast/Slow                   |
| 2   | Reverse Linked List          | #206     | Easy   | 3-pointer Reverse    | Pattern base cho nhiều bài Medium   |
| 3   | Linked List Cycle            | #141     | Easy   | Floyd's Cycle Detect | De Morgan + move-trước-check-sau    |
| 4   | Delete Node in a Linked List | #237     | Easy   | Pointer Trick        | O(1) — copy val + skip next         |

**Medium follow-up (mở rộng):**
- #92 Reverse Linked List II — reverse 1 đoạn
- #19 Remove Nth Node From End — Fast/Slow với gap
- #2 Add Two Numbers — Dummy head technique
- #21 Merge Two Sorted Lists — Dummy head + 2 con trỏ

---

## 3. Amortized Analysis — bẫy Big-O quan trọng

**Vấn đề:** `for` lồng `while` không tự động là O(N²). Phải tính **tổng số phép tính** thực sự xảy ra, không phải nhân thuần.

> [!IMPORTANT]
> **Quy tắc nhận diện:** khi thấy nested loop, hỏi *"mỗi phần tử bị inner thăm bao nhiêu lần tính trên TOÀN bộ chương trình?"*
> - ≤ hằng số → outer × hằng = **O(N)**
> - N lần → **O(N²)**

**Các pattern O(N) "trông giống" O(N²):**

| Pattern | Vẻ ngoài | Big-O thật | Lý do |
|---|---|---|---|
| Smart Start (#128) | for + inner while | **O(N)** | Inner chỉ chạy cho start; mỗi phần tử thăm 1 lần |
| Sliding Window (#3) | for + inner while | **O(N)** | `left` move tổng ≤ N lần |
| Monotonic Stack (#496) | for + inner while | **O(N)** | Mỗi phần tử push/pop ≤ 1 lần |
| Two Pointers Opposite | inner while | **O(N)** | left + right move tổng ≤ N |

**Câu hỏi follow-up interviewer hay hỏi:**
> "Why is this O(N) and not O(N²)?"

Phải trả lời được bằng amortized argument — đếm tổng work, không phải nhân outer × inner_max.
