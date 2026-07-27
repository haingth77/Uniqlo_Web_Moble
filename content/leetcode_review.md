# LeetCode Review — 17 bài đã giải, bẫy đã vướng & pattern recall

> Nhật ký ôn luyện: mỗi bài gồm code đã viết, bẫy thực tế đã mắc, và key insight rút ra.
> Format: **Bài toán → Code → Bẫy đã vướng → Key Insight → Độ phức tạp**.

---

## 1. Two Pointers

### LeetCode #125 - Valid Palindrome (Easy) — Opposite Ends

**Bài toán:** Kiểm tra chuỗi có là palindrome sau khi convert lowercase + bỏ ký tự không phải alphanumeric.

**Code đã viết (Lần 2 — sau khi recall):**
```typescript
function isPalindrome(s: string): boolean {
    let left = 0, right = s.length - 1;
    while (left < right) {
        while (left < right && !/[a-zA-Z0-9]/.test(s[left])) left++;
        while (left < right && !/[a-zA-Z0-9]/.test(s[right])) right--;
        if (s[left].toLowerCase() !== s[right].toLowerCase()) return false;
        left++;
        right--;
    }
    return true;
}
```

**Bẫy đã vướng:**
- ❌ **Lần 1:** Tạo `filterString` rồi build chuỗi mới → vi phạm Space O(1), quên pattern Opposite Ends cốt lõi (soi trực tiếp trên chuỗi gốc).
- ❌ String concat trong loop (`result = result + char`) → string immutable, mỗi concat cấp phát mới → chậm.
- ❌ Sai cú pháp infinite loop:
  ```typescript
  while (left<right) if(!regex.test(s[left])) left++   // ❌
  ```
  Khi char hợp lệ → `if` không chạy → `left` không tăng → outer while loop mãi.
- ✅ **Fix:** Gộp điều kiện vào chính `while`:
  ```typescript
  while (left < right && !regex.test(s[left])) left++;
  ```

**Key Insight:**
- Pattern Opposite Ends = soi trực tiếp, không tạo chuỗi phụ
- Mỗi inner while phải có biến thay đổi để đảm bảo thoát được
- Time O(n), Space O(1)

---

### LeetCode #15 - 3Sum (Medium) — Opposite Ends

**Bài toán:** Tìm tất cả bộ ba `[a,b,c]` trong `nums` sao cho `a+b+c=0`, không trùng lặp giá trị.

**Code đã viết:**
```typescript
function threeSum(nums: number[]): number[][] {
    nums.sort((a, b) => a - b);
    const result: number[][] = [];
    
    for (let i = 0; i < nums.length - 2; i++) {
        if (i > 0 && nums[i] === nums[i - 1]) continue;  // skip dup i
        
        let left = i + 1, right = nums.length - 1;
        while (left < right) {
            const sum = nums[i] + nums[left] + nums[right];
            
            if (sum < 0) left++;
            else if (sum > 0) right--;
            else {
                result.push([nums[i], nums[left], nums[right]]);
                while (left < right && nums[left] === nums[left + 1]) left++;
                while (left < right && nums[right] === nums[right - 1]) right--;
                left++;
                right--;
            }
        }
    }
    return result;
}
```

**Bẫy đã vướng (Lần đầu chưa làm được):**
- ❌ Dùng 2 vòng `while` liên tiếp (sum<0 → left++, sum>0 → right--) thay vì 1 vòng `while` + if/else if/else → chỉ scan 1 lượt rồi thoát, bỏ qua nhiều cặp.
- ❌ Không skip duplicate ở left/right sau khi tìm được bộ ba.
- ❌ Loop bound `i <= nums.length` thay vì `i < nums.length - 2`.

**Key Insight:**
- Cố định `i`, dùng Two Pointers cho 2 số còn lại
- Skip duplicate ở **3 vị trí**: `i`, `left`, `right`
- 1 vòng `while (left < right)` duy nhất, bên trong là if/else if/else
- Tìm được bộ ba → vẫn phải `left++; right--` để tiếp tục tìm bộ khác
- Time O(n²), Space O(1) không tính output

---

### LeetCode #80 - Remove Duplicates from Sorted Array II (Medium) — Fast/Slow

**Bài toán:** Mảng sorted, giữ tối đa 2 phần tử trùng nhau, in-place, return k.

**Code đã viết (cách của bạn — dùng freq counter):**
```typescript
function removeDuplicates(nums: number[]): number {
    let slow = 0, freq = 1;
    for (let index = 1; index <= nums.length - 1; index++) {
        if ((nums[slow] === nums[index]) && (freq < 2)) {
            slow++;
            freq++;
            nums[slow] = nums[index];
        }
        if (nums[slow] !== nums[index]) {
            slow++;
            nums[slow] = nums[index];
            freq = 1;
        }
    }
    return slow + 1;
}
```

**Canonical pattern (gọn hơn):**
```typescript
function removeDuplicates(nums: number[]): number {
    if (nums.length <= 2) return nums.length;
    let slow = 2;
    for (let fast = 2; fast < nums.length; fast++) {
        if (nums[fast] !== nums[slow - 2]) {
            nums[slow] = nums[fast];
            slow++;
        }
    }
    return slow;
}
```

**Bài học:**
- ✅ Approach của bạn (freq counter) đúng nhưng phức tạp hơn cần thiết.
- ✅ **Canonical: so sánh `nums[fast]` với `nums[slow - 2]`** — generalize được cho "giữ tối đa K lần" → so với `nums[slow - K]`.
- ⚠️ 2 `if` riêng biệt (không phải `if/else`) → may mắn không bug. Nên dùng `else if` cho mutually exclusive.

**Key Insight:**
- Pattern Fast/Slow + ghi đè in-place
- KHÔNG dùng `.splice()` → O(n²) → TLE
- Time O(n), Space O(1)

---

### LeetCode #3 - Longest Substring Without Repeating Characters (Medium) — Sliding Window

**Bài toán:** Tìm chuỗi con liên tiếp dài nhất không có ký tự lặp.

**Code đã viết (Lần 2 — cleaner):**
```typescript
function lengthOfLongestSubstring(s: string): number {
    const set = new Set<string>();
    let left = 0, result = 0;
    
    for (let right = 0; right < s.length; right++) {
        while (set.has(s[right])) {
            set.delete(s[left]);
            left++;
        }
        set.add(s[right]);
        result = Math.max(result, right - left + 1);
    }
    return result;
}
```

**Bẫy đã vướng:**
- ❌ Khởi tạo `new Set<string>(s[left])` — JS treat string làm iterable → tình cờ chạy đúng nhưng fragile.
- ❌ Code 2 nhánh `if/else` (chưa có / đã có) — có thể gộp thành 1 luồng: `while-thu-hẹp` → `add`.
- ❌ Special case `if (s.length === 1) return 1` thừa — loop handle tự nhiên.

**Key Insight:**
- Pattern Sliding Window cốt lõi: 1 luồng duy nhất
- Khởi tạo Set rỗng, start `right = 0` → handle edge cases tự nhiên
- Time O(n), Space O(min(n, charset))

---

## 2. Hash Map / Hash Set

### LeetCode #1 - Two Sum (Easy/Medium) — Lookup + Complement

**Code đã viết:**
```typescript
function twoSum(nums: number[], target: number): number[] {
    const nMap = new Map();
    for (let i = 0; i < nums.length; i++) {
        const rest = target - nums[i];
        if (nMap.has(rest)) return [i, nMap.get(rest)];
        else nMap.set(nums[i], i);
    }
    return [];
}
```

**Nhận xét:** ✅ Xuất sắc — textbook solution. Pattern "check TRƯỚC, add SAU" áp dụng đúng.

**Bài học pattern:**
- ✅ Pattern: Lookup + Complement
- ⚠️ Kiểm tra TRƯỚC, thêm SAU → tránh bug khi `target = 2 * nums[i]` (vd `[3,3], target=6`)
- ✅ Early exit ngay khi tìm được
- ✅ O(n) time, O(n) space

---

### LeetCode #128 - Longest Consecutive (Medium) — Smart Start

**Code đã viết (Lần 2 — đã hiểu Smart Start):**
```typescript
function longestConsecutive(nums: number[]): number {
    const set = new Set(nums);
    let result = 0;
    
    for (const num of set) {
        if (set.has(num - 1)) continue;  // không phải start → skip
        
        let cur = num, len = 1;
        while (set.has(cur + 1)) { cur++; len++; }
        
        result = Math.max(result, len);
    }
    return result;
}
```

**Bẫy đã vướng:**
- ❌ `result = 1` khởi tạo sai → empty array trả về `1` (đúng phải `0`).
- ❌ Duyệt `nums` thay vì `nSet` → duplicates duyệt nhiều lần.
- ❌ Tách 2 vòng for (build `starter` array trước, rồi mới scan) → thừa Space O(n).
- ⚠️ Naming `broker` → đổi thành `cur` / `current`.

**Key Insight — Tại sao O(n) chứ không phải O(n²)?**
- Inner while chỉ chạy khi `num` là **start of sequence**
- Các số ở giữa dãy bị `continue` skip ở outer
- Mỗi số bị inner while thăm **tối đa 1 lần** trên toàn bộ chương trình
- Tổng work = n (outer) + n (inner amortized) = O(n)
- → Đây gọi là **Amortized Analysis** — for inside while không tự động là O(n²)

---

### LeetCode #242 - Valid Anagram (Easy) — Frequency Count

**Code đã viết:**
```typescript
function isAnagram(s: string, t: string): boolean {
    const sMap = new Map();
    if (s.length !== t.length) return false;
    
    for (const char of s) {
        if (sMap.has(char)) sMap.set(char, sMap.get(char) + 1);
        else sMap.set(char, 1);
    }
    
    for (const char of t) {
        if (!sMap.has(char)) return false;
        if (sMap.get(char) > 0) sMap.set(char, sMap.get(char) - 1);
        else return false;
    }
    return true;
}
```

**Tip clean code:**
- ✅ Shorthand: `sMap.set(char, (sMap.get(char) || 0) + 1)` thay cho if/else
- ✅ Gộp 2 if của t-loop:
  ```typescript
  const count = sMap.get(char);
  if (!count) return false;          // bắt cả undefined VÀ 0
  sMap.set(char, count - 1);
  ```

**Key Insight:**
- Pattern Frequency Count: build map từ `s`, decrement khi duyệt `t`
- Early exit khi length mismatch
- Time O(n), Space O(k) = O(1) cho latin lowercase

---

### LeetCode #49 - Group Anagrams (Medium) — Grouping

**Code đã viết (Lần 2 — dùng index indirection):**
```typescript
function groupAnagrams(strs: string[]): string[][] {
    let result: string[][] = [];
    let sMap = new Map();
    
    for (const ele of strs) {
        const sortEle = ele.split('').sort().join('');
        if (!sMap.has(sortEle)) {
            const newGroupIndex = result.length;
            result[newGroupIndex] = [ele];
            sMap.set(sortEle, newGroupIndex);
        } else {
            const groupIndex = sMap.get(sortEle);
            result[groupIndex].push(ele);
        }
    }
    return result;
}
```

**Canonical (đơn giản hơn — lưu array trực tiếp vào Map):**
```typescript
function groupAnagrams(strs: string[]): string[][] {
    const map = new Map<string, string[]>();
    
    for (const str of strs) {
        const key = str.split('').sort().join('');
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(str);
    }
    return Array.from(map.values());
}
```

**Bài học:**
- Map<key, array> > Map<key, index> — bớt 1 lớp indirection
- Time O(N · K log K), Space O(N · K)

**Key Insight:**
- 2 chuỗi anagram ⟺ sort ký tự ra cùng kết quả
- Pattern Grouping: dùng feature (sorted string) làm key

---

## 3. Stack

### LeetCode #20 - Valid Parentheses (Easy) — Matching Pairs

**Code đã viết:**
```typescript
function isValid(s: string): boolean {
    const bracketMap = {
        '{': '}',
        '[': ']',
        '(': ')'
    };
    let stack: string[] = [];
    for (const ele of s) {
        if (ele === '(' || ele === '{' || ele === '[') stack.push(ele);
        else {
            const lastInStack = stack[stack.length - 1];
            if (ele !== bracketMap[lastInStack]) return false;
            else stack.pop();
        }
    }
    return stack.length === 0;
}
```

**Nit cleanup:**
- `Array.from(s)` thừa — string đã iterable.
- Stack rỗng → `stack[-1] = undefined` → tình cờ chạy đúng do `bracketMap[undefined] === undefined`.
- Cần `Record<string, string>` để TS không complain trong strict mode.

**Alternative (Map<closing, opening>):**
```typescript
const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
for (const c of s) {
    if (c in pairs) {
        if (stack.pop() !== pairs[c]) return false;
    } else {
        stack.push(c);
    }
}
return stack.length === 0;
```
→ Bớt 3 phép so sánh `c === '(' || ...`, dùng `c in pairs` (1 check).

**Key Insight:**
- Pattern Matching Pairs: push mở, pop khi đóng, cuối phải rỗng
- `stack.pop()` trả `undefined` khi rỗng → so sánh `!==` tự bắt luôn case empty
- Time O(n), Space O(n)

---

### LeetCode #1047 - Remove All Adjacent Duplicates In String (Easy)

**Code đã viết:**
```typescript
function removeDuplicates(s: string): string {
    let stack: string[] = [];
    for (const ele of s) {
        if (ele !== stack[stack.length - 1]) stack.push(ele);
        else stack.pop();
    }
    return stack.join('');
}
```

**Nhận xét:** ✅ Hoàn hảo — textbook solution.

**Key Insight:**
- Stack lưu các ký tự "đang chờ partner"
- Khi `char === top` → đã tìm thấy partner → pop (hủy cặp)
- Sau pop, char dưới có thể tiếp tục match → tự nhiên handle cascade (`"abbaca"` → `"ca"`)
- Lợi dụng `stack[-1] === undefined` không khớp char nào → push tự nhiên
- Time O(n), Space O(n)

---

### LeetCode #496 - Next Greater Element I (Easy) — Monotonic Stack

**Code đã viết (Lần 2 — sau khi fix bug):**
```typescript
function nextGreaterElement(nums1: number[], nums2: number[]): number[] {
    const monoStack: number[] = [];
    const map = new Map<number, number>();
    
    for (const ele of nums2) {
        while (monoStack.length > 0 && ele > monoStack[monoStack.length - 1]) {
            const last = monoStack.pop()!;
            map.set(last, ele);
        }
        monoStack.push(ele);
    }
    
    return nums1.map(x => map.get(x) ?? -1);
}
```

**Bẫy đã vướng:**
- ❌ **Lần 1:** Tách `if (ele < top) push` / `else while (ele > top) pop` — quên `push(ele)` sau while → ele bị bỏ rơi.
- ❌ Stack rỗng → `monoStack[-1] = undefined` → `ele < undefined` và `ele > undefined` đều `false` → không log gì, không hoạt động.
- ⚠️ Thứ tự `&&` quan trọng cho safety:
  ```typescript
  // Đúng: check rỗng TRƯỚC
  while (monoStack.length > 0 && ele > monoStack[monoStack.length-1])
  ```

**Pattern Monotonic Stack — học thuộc cấu trúc:**
```typescript
for (const x of arr) {
    while (stack.length > 0 && CONDITION(x, top)) {
        pop();
        // ghi nhận: top vừa pop tìm được "next" là x
    }
    stack.push(x);    // 🔑 LUÔN push x ở cuối
}
```

**Phân biệt Decreasing vs Increasing Stack:**
| Bài toán | Stack type | Why |
|---|---|---|
| Next GREATER | **Decreasing** (đáy→đỉnh giảm) | Số nhỏ "đợi" số lớn |
| Next SMALLER | **Increasing** (đáy→đỉnh tăng) | Số lớn "đợi" số nhỏ |

> [!TIP]
> **Ẩn dụ "phòng chờ"** — cách nhớ Monotonic Stack nhanh nhất.

- Stack = phòng chờ những phần tử chưa tìm được next
- Khi `num` mới to hơn → pop những kẻ chờ → ghi đáp án
- Cuối loop, ai còn trong stack = không có next → `-1`

**Key Insight:**
- Mỗi phần tử push/pop tối đa 1 lần → **O(n+m) amortized**
- Mở khóa cho: #739 Daily Temperatures, #503 Next Greater II, #84 Largest Rectangle, #42 Trapping Rain Water

---

## 4. Binary Search

### LeetCode #704 - Binary Search (Easy) — Exact Search Template

**Code đã viết:**
```typescript
function search(nums: number[], target: number): number {
    let left = 0;
    let right = nums.length - 1;
    while (left <= right) {
        const mid = left + Math.floor((right - left) / 2);
        if (target > nums[mid]) left = mid + 1;
        else if (target < nums[mid]) right = mid - 1;
        else return mid;
    }
    return -1;
}
```

**Nhận xét:** ✅ Textbook — không có gì để sửa.

**Template Exact Search — học thuộc:**
```typescript
let left = 0, right = nums.length - 1;
while (left <= right) {                                  // <=
    const mid = left + Math.floor((right - left) / 2);   // tránh overflow
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) left = mid + 1;              // ±1
    else right = mid - 1;
}
return -1;
```

**4 điểm BẮT BUỘC nắm:**
1. `right = nums.length - 1` → closed range `[left, right]`
2. `while (left <= right)` → vì closed range, `left == right` còn 1 phần tử
3. `mid = left + Math.floor((right - left) / 2)` → tránh integer overflow (Java/C++)
4. `left = mid + 1` / `right = mid - 1` → tránh infinite loop

**Tại sao `left + (right-left)/2` thay vì `(left+right)/2`?**
- Toán học: 2 công thức tương đương
- `left` = gốc tọa độ để mid nằm đúng giữa range `[left, right]`
- Form `left + ...` tránh overflow ở Java/C++ (`int` 32-bit max ~2.1 tỷ)
- JS không tràn (Number lên 2^53) nhưng dùng form này theo convention cross-language

---

### LeetCode #278 - First Bad Version (Easy) — Boundary Search Template

**Code đã viết (Lần 2 — đúng template Boundary):**
```typescript
var solution = function(isBadVersion: any) {
    return function(n: number): number {
        let left = 1, right = n;
        while (left < right) {                              // <
            const mid = left + Math.floor((right - left) / 2);
            if (isBadVersion(mid)) right = mid;             // = mid (no -1)
            else left = mid + 1;
        }
        return left;                                        // left == right
    };
};
```

**Bẫy đã vướng (Lần 1):**
- ❌ Dùng template Exact Search + check `isBadVersion(mid-1)` → 2x API calls.
- ❌ Lý luận "tôi có early return nên ít call hơn" — đúng cho best case, sai worst case (2log n vs log n).
- ⚠️ Trên LeetCode runtime đo ms có noise lớn → "nhanh hơn" thường là noise, không phải thuật toán tốt hơn.

**Template Boundary Search — học thuộc:**
```typescript
let left = 0, right = arr.length;            // hoặc arr.length - 1
while (left < right) {                       // < (KHÔNG <=)
    const mid = left + Math.floor((right - left) / 2);
    if (condition(mid)) right = mid;         // mid CÓ THỂ là answer → giữ
    else left = mid + 1;                     // mid không phải → loại
}
return left;                                 // left == right == answer
```

**Khác biệt Exact vs Boundary:**

| | Exact Search | Boundary Search |
|---|---|---|
| Use case | Tìm phần tử | Tìm "biên" (first/last thỏa condition) |
| Loop | `while (left <= right)` | `while (left < right)` |
| Khi match | `return mid` | KHÔNG return, tiếp tục thu hẹp |
| Update right | `right = mid - 1` | `right = mid` |
| Return | `return -1` (không tìm thấy) | `return left` (luôn có) |

> [!KEY]
> **Invariant cốt lõi của Boundary Search:** đáp án luôn nằm trong range `[left, right]`.
> Khi `left == right`, đó chính là đáp án.

**Tại sao `Math.floor` BẮT BUỘC trong Boundary?**
- Boundary dùng `right = mid` (không -1)
- Nếu dùng `Math.round`: khi `left=0, right=1` → `mid = round(0.5) = 1 = right` → `right = mid = right` → KHÔNG ĐỔI → infinite loop
- `Math.floor`: `mid = 0` → progress

---

### LeetCode #34 - Find First and Last Position (Medium) — Dual Boundary [Chưa làm]

**Approach:**
- Chạy Boundary Search 2 lần
- Lần 1: tìm first = nhỏ nhất với `nums[i] >= target`
- Lần 2: tìm last = (nhỏ nhất với `nums[i] > target`) - 1 (đặt `right = nums.length`)
- Sau findFirst: check `nums[first] !== target` → return `[-1, -1]`

---

## 5. Linked List

### LeetCode #876 - Middle of the Linked List (Easy) — Fast/Slow Warm-up

**Code đã viết:**
```typescript
function middleNode(head: ListNode | null): ListNode | null {
    let slow = head, fast = head;
    while (fast !== null && fast.next !== null) {
        slow = slow!.next;
        fast = fast.next.next;
    }
    return slow;
}
```

**Key Insight:**
- Slow đi 1 bước, Fast đi 2 bước → khi fast tới cuối, slow ở chính giữa
- Loop condition `fast !== null && fast.next !== null` — vì fast làm `.next.next` cần đảm bảo cả 2 không null
- Khi list chẵn → trả về node thứ 2 của 2 node giữa (đúng yêu cầu đề bài)

**TS type bẫy:**
- `let slow: ListNode = head` ❌ — head có type `ListNode | null`
- Đúng: `let slow: ListNode | null = head` + `slow!.next` khi cần assert non-null

---

### LeetCode #206 - Reverse Linked List (Easy) — 3-pointer Reverse

**Code đã viết:**
```typescript
function reverseList(head: ListNode | null): ListNode | null {
    let prev = null;
    let cur = head;
    while (cur !== null) {
        const next = cur.next;
        cur.next = prev;
        prev = cur;
        cur = next;
    }
    return prev;
}
```

**Pattern 3-pointer reverse — HỌC THUỘC:**
```typescript
const next = cur.next;   // 1. LƯU next TRƯỚC khi đổi
cur.next = prev;          // 2. Đảo chiều
prev = cur;               // 3. Tiến prev
cur = next;               // 4. Tiến cur
```

**Bẫy:**
- ❌ Không lưu `next` trước → mất reference chain → đứt list
- ❌ Return `cur` thay vì `prev` → cur=null lúc thoát loop

**Mở khóa các bài:**
- #92 Reverse Linked List II (reverse 1 đoạn)
- #25 Reverse Nodes in k-Group
- #234 Palindrome Linked List

---

### LeetCode #141 - Linked List Cycle (Easy) — Floyd's Cycle Detection

**Code đã viết (Lần 2 — sau khi fix logic):**
```typescript
function hasCycle(head: ListNode | null): boolean {
    let slow = head;
    let fast = head;
    while (fast !== null && fast.next !== null) {
        slow = slow!.next;
        fast = fast.next.next;
        if (slow === fast) return true;
    }
    return false;
}
```

**Bẫy đã vướng (Lần 1):**
- ❌ Dùng `||` thay `&&` trong loop condition — quy tắc De Morgan
- ❌ So sánh `fast.next != slow.next` thay vì `slow === fast`
- ❌ Logic `if (fast.next == null) result = true` đảo ngược — gặp null nghĩa là KHÔNG cycle
- ❌ Loop không thoát khi có cycle → TLE

> [!IMPORTANT]
> **Bài học De Morgan:** loop condition viết **KHI NÀO TIẾP TỤC**, không phải khi nào thoát.
>
> Exit khi `A OR B` → Continue khi `NOT A AND NOT B`

**Key Insight:**
- Move TRƯỚC, check SAU — tránh false positive ở iter 0 (cả 2 cùng head)
- So sánh `slow === fast` (node identity), không phải `.val` hay `.next`
- Time O(n), Space O(1) — fast bắt slow trong tối đa cycle length vòng

---

### LeetCode #237 - Delete Node in a Linked List (Easy) — Trick Pattern

**Code đã viết:**
```typescript
function deleteNode(node: ListNode | null): void {
    node.val = node.next.val;
    node.next = node.next.next;
}
```

**Trick insight:** Không xóa được chính mình (không có head, không có prev) → **giả vờ thành node kế, rồi xóa node kế**.

**Bài học:**
- "Xóa" có 2 nghĩa: vật lý (bỏ khỏi memory) vs logic (list không còn giá trị đó)
- Trick này = xóa logic, vẫn đúng output
- Constraint đề bài "node không phải tail" → `node.next` luôn tồn tại → trick chạy được
- Time O(1) — bài duy nhất trong nhóm có time hằng số

---

## 6. Pattern summary & Big-O insights

### Pattern Recall Status

| Pattern | Bài | Status |
|---|---|---|
| Two Pointers - Opposite Ends | #125, #15 | ✅ |
| Two Pointers - Fast/Slow | #80 | ✅ |
| Two Pointers - Sliding Window | #3 | ✅ |
| Hash Map - Lookup | #1 | ✅ |
| Hash Map - Frequency | #242 | ✅ |
| Hash Map - Grouping | #49 | ✅ |
| Hash Map - Cycle (Smart Start) | #128 | ✅ |
| Stack - Matching Pairs | #20 | ✅ |
| Stack - Remove Duplicates | #1047 | ✅ |
| Stack - Monotonic | #496 | ✅ |
| Binary Search - Exact | #704 | ✅ |
| Binary Search - Boundary | #278 | ✅ |
| Binary Search - Dual Boundary | #34 | ✅ |
| Linked List - Fast/Slow (middle) | #876 | ✅ |
| Linked List - 3-pointer Reverse | #206 | ✅ |
| Linked List - Floyd's Cycle | #141 | ✅ |
| Linked List - Delete Trick | #237 | ✅ |

### Big-O Bẫy Quan Trọng

**For lồng While không tự động là O(n²)** — phải tính **amortized**:

| Pattern | Vẻ ngoài | Big-O thật | Lý do |
|---|---|---|---|
| Smart Start (#128) | for + inner while | **O(n)** | Inner chỉ chạy cho start, mỗi phần tử thăm 1 lần |
| Sliding Window (#3) | for + inner while | **O(n)** | `left` move tổng ≤ n lần |
| Monotonic Stack (#496) | for + inner while | **O(n)** | Mỗi phần tử push/pop ≤ 1 lần |
| Two Pointers Opposite (#125) | inner while | **O(n)** | left+right move tổng ≤ n |
| 3Sum (#15) | for + while | **O(n²)** | Inner while chạy n lần cho MỖI outer |

> [!IMPORTANT]
> **Quy tắc nhận diện:** khi thấy nested loop, hỏi *"mỗi phần tử bị inner thăm bao nhiêu lần tính trên TOÀN bộ?"*
> - ≤ hằng → outer × hằng = **O(n)**
> - n lần → **O(n²)**

### Common Mistakes Đã Vướng Trong Session

| Lỗi | Pattern | Fix |
|---|---|---|
| String concat trong loop | #125 | `arr.push() + join()` cuối |
| Tạo chuỗi phụ phá Space O(1) | #125 | 2-pointer trên chuỗi gốc |
| `while + if` thiếu progress → infinite loop | #125 | Gộp condition vào `while` |
| 2 while liên tiếp scan 1 lượt | #15 | 1 while + if/else if/else |
| Quên skip duplicate ở 3 vị trí | #15 | Skip `i`, `left`, `right` |
| Bug edge case empty array (init `result=1`) | #128 | Init `result=0` |
| Khởi tạo Set tricky `new Set(s[0])` | #3 | Set rỗng, start `right=0` |
| Map<key, index> indirection | #49 | Map<key, array> trực tiếp |
| Quên `push(ele)` sau while | #496 | Push **luôn** sau while |
| `ele > undefined` silently false | #496 | Check `length > 0` TRƯỚC |
| 2x API calls với "early return" | #278 | Dùng Boundary template thuần |
| Math.round trong Boundary | #278 | **Bắt buộc** Math.floor |

### Performance Tips

| Issue | Fix |
|---|---|
| Sort thay vì Smart Start | Set + skip non-start |
| Console.log trong loop | Xóa khi submit (111ms → 1ms) |
| Nested O(n²) brute force | Hash Map/Set lookup |
| `.shift()` O(n) | Dùng front pointer |
| `.splice()` ở giữa O(n²) total | Ghi đè với slow pointer |
| String concat trong loop | Array push + join cuối |
| `.includes()` trong loop | Set `.has()` O(1) |

### Coding Best Practices

1. **Lookup + Complement:** Check TRƯỚC, add SAU
   ```typescript
   if (map.has(complement)) return [map.get(complement), i];
   map.set(nums[i], i);
   ```

2. **Frequency Map shorthand:**
   ```typescript
   map.set(key, (map.get(key) || 0) + 1);
   ```

3. **Grouping với sorted key:**
   ```typescript
   const key = str.split('').sort().join('');
   ```

4. **Monotonic Stack template:**
   ```typescript
   while (stack.length > 0 && cond(x, top)) pop();
   stack.push(x);
   ```

5. **Boundary Binary Search template:**
   ```typescript
   while (left < right) {
       const mid = left + Math.floor((right - left) / 2);
       if (cond(mid)) right = mid;
       else left = mid + 1;
   }
   return left;
   ```

6. **Math.floor cho mid — luôn dùng, không exception**

7. **Early Exit khi có thể** — giảm work, dễ debug

---

## 7. Tóm tắt độ phức tạp

| Bài | Pattern | Time | Space |
|---|---|---|---|
| #125 | Two Pointer - Opposite | O(n) | O(1) |
| #15 | Two Pointer - Opposite | O(n²) | O(1) |
| #80 | Two Pointer - Fast/Slow | O(n) | O(1) |
| #3 | Sliding Window | O(n) | O(min(n,k)) |
| #1 | Hash Map - Lookup | O(n) | O(n) |
| #128 | Hash Set - Smart Start | O(n) | O(n) |
| #242 | Hash Map - Frequency | O(n) | O(k) |
| #49 | Hash Map - Grouping | O(N·K log K) | O(N·K) |
| #20 | Stack - Matching | O(n) | O(n) |
| #1047 | Stack - Remove Adj | O(n) | O(n) |
| #496 | Monotonic Stack | O(n+m) | O(n) |
| #704 | Binary Search - Exact | O(log n) | O(1) |
| #278 | Binary Search - Boundary | O(log n) | O(1) |
| #34 | Binary Search - Dual Boundary | O(log n) | O(1) |
| #876 | Linked List - Fast/Slow | O(n) | O(1) |
| #206 | Linked List - 3-pointer Reverse | O(n) | O(1) |
| #141 | Linked List - Floyd's Cycle | O(n) | O(1) |
| #237 | Linked List - Delete Trick | O(1) | O(1) |

---

## 8. Roadmap tiếp theo

✅ **Hoàn thành roadmap recall — 17/17 bài.**

**Mở rộng (nếu có thời gian):**
- **Mock interview:** Trộn pattern, giải bài lạ trong 25 phút
- **Stack nâng cao:** #739 Daily Temperatures (Monotonic Stack medium), #155 Min Stack
- **Sliding Window nâng cao:** #424 Longest Repeating Character Replacement
- **Linked List Medium:** #92 Reverse Linked List II, #19 Remove Nth Node From End
