# JavaScript Data Structures — Hash Map, Hash Set, Stack, Queue

> Bốn cấu trúc dữ liệu nền cho coding interview: chọn đúng cái nào, API JavaScript tương ứng, và bẫy hiệu năng hay mắc.
> Format: **Tổng quan → Khái niệm → API → Ví dụ LeetCode → Cheatsheet → Gotcha**.

---

## 1. Tổng quan nhanh — chọn cấu trúc nào?

### Hash Set vs Hash Map

| Khái niệm      | Hash Set                                       | Hash Map                           |
| -------------- | ---------------------------------------------- | ---------------------------------- |
| **Định nghĩa** | Tập hợp các giá trị duy nhất (không trùng lặp) | Cặp khóa-giá trị (Key-Value pairs) |
| **Khóa**       | Chỉ lưu khóa                                   | Lưu cả khóa và giá trị             |
| **Dùng khi**   | Kiểm tra "có hay không"                        | Lưu dữ liệu kèm thông tin thêm     |
| **Ví dụ**      | `{1, 2, 3, 4, 5}`                              | `{1: 'a', 2: 'b', 3: 'c'}`         |
| **Thời gian**  | O(1) add, has, delete                          | O(1) set, get, has, delete         |

### Stack vs Queue

| Khái niệm | Stack | Queue |
|-----------|-------|-------|
| **Định nghĩa** | LIFO (Last In First Out) | FIFO (First In First Out) |
| **Cấu trúc** | Phần tử vào/ra cùng 1 đầu | Phần tử vào 1 đầu, ra đầu kia |
| **Ví dụ thực tế** | Xếp chồng đĩa, undo/redo | Hàng chờ, bfs traversal |
| **Dùng khi** | Matching pairs, backtrack | Level-order traverse, BFS |
| **Implementation** | Array: `.push()`, `.pop()` | Array: `.push()`, `.shift()` |

> [!IMPORTANT]
> Câu hỏi định hướng khi đọc đề:
> - Cần biết **"có hay không"** → `Set`
> - Cần lưu **thông tin kèm theo** (tần suất, index, group) → `Map`
> - Có **cặp khớp / hoàn tác / phần tử gần nhất** → `Stack`
> - Xử lý **theo thứ tự / BFS theo tầng** → `Queue`

---

## 2. Hash Set — tập hợp giá trị duy nhất

### 2.1 Khái niệm cơ bản

Hash Set lưu trữ các phần tử **duy nhất** (không trùng lặp). Nó rất hữu ích khi bạn cần:

- ✅ Kiểm tra một phần tử có tồn tại hay không
- ✅ Loại bỏ phần tử trùng lặp
- ✅ Tìm phần tử giao nhau giữa các tập hợp

### 2.2 Setup & Cú pháp cơ bản

```javascript
// Tạo một Set mới
const mySet = new Set();

// Tạo Set từ một mảng
const mySet2 = new Set([1, 2, 3, 3, 4]); // {1, 2, 3, 4} - bỏ trùng lặp

// Tạo Set từ chuỗi
const charSet = new Set('hello'); // {'h', 'e', 'l', 'o'} - bỏ trùng lặp
```

### 2.3 Các phương thức chính

```javascript
const set = new Set();

// ➕ ADD: Thêm phần tử vào Set
set.add(1);
set.add(2);
set.add(3);
set.add(2); // Không thêm vì 2 đã tồn tại
console.log(set); // Set { 1, 2, 3 }

// ✔️ HAS: Kiểm tra phần tử có tồn tại không
console.log(set.has(2)); // true
console.log(set.has(5)); // false

// 🗑️ DELETE: Xóa phần tử
set.delete(2);
console.log(set.has(2)); // false

// 📏 SIZE: Lấy kích thước
console.log(set.size); // 2 (chỉ còn 1, 3)

// 🔄 CLEAR: Xóa tất cả phần tử
set.clear();
console.log(set.size); // 0
```

### 2.4 Duyệt qua Set

```javascript
const set = new Set(['a', 'b', 'c']);

// Cách 1: for...of loop
for (const value of set) {
  console.log(value); // 'a', 'b', 'c'
}

// Cách 2: forEach
set.forEach((value) => {
  console.log(value); // 'a', 'b', 'c'
});

// Cách 3: Chuyển thành mảng rồi duyệt
const arr = [...set]; // ['a', 'b', 'c']
console.log(arr);
```

### 2.5 Ví dụ thực tế: Kiểm tra phần tử trùng lặp

```javascript
// ❌ Cách cũ (Brute force - O(N²))
function hasDuplicate_bruteforce(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] === arr[j]) return true;
    }
  }
  return false;
}

// ✅ Cách tối ưu (Set - O(N))
function hasDuplicate_optimized(arr) {
  const seen = new Set();
  for (const num of arr) {
    if (seen.has(num)) return true; // Gặp phần tử trùng
    seen.add(num);
  }
  return false;
}

// Kiểm tra
console.log(hasDuplicate_optimized([1, 2, 3, 3, 4])); // true
console.log(hasDuplicate_optimized([1, 2, 3, 4, 5])); // false
```

---

## 3. Hash Map — bảng băm key-value

### 3.1 Khái niệm cơ bản

Hash Map (hoặc Map trong JavaScript) lưu trữ cặp **khóa-giá trị**. Nó rất hữu ích khi bạn cần:

- ✅ Lưu tần suất xuất hiện của phần tử
- ✅ Lưu index hoặc vị trí của phần tử
- ✅ Lưu bất kỳ dữ liệu nào gắn liền với một khóa

### 3.2 Setup & Cú pháp cơ bản

```javascript
// Tạo một Map mới
const myMap = new Map();

// Tạo Map từ một mảng các cặp [key, value]
const myMap2 = new Map([
  ['name', 'John'],
  ['age', 25],
  ['city', 'New York'],
]);

// Tạo Map với Object (cách cũ - không đủ linh hoạt)
const myObj = {
  name: 'John',
  age: 25,
  city: 'New York',
};
```

### 3.3 Các phương thức chính

```javascript
const map = new Map();

// 🔧 SET: Thêm hoặc cập nhật cặp key-value
map.set('name', 'Alice');
map.set('age', 30);
map.set('name', 'Bob'); // Cập nhật giá trị của 'name' từ 'Alice' thành 'Bob'
console.log(map); // Map { 'name' => 'Bob', 'age' => 30 }

// 📖 GET: Lấy giá trị theo khóa
console.log(map.get('name')); // 'Bob'
console.log(map.get('city')); // undefined (không tồn tại)

// ✔️ HAS: Kiểm tra khóa có tồn tại không
console.log(map.has('name')); // true
console.log(map.has('city')); // false

// 🗑️ DELETE: Xóa cặp key-value
map.delete('age');
console.log(map.has('age')); // false

// 📏 SIZE: Lấy kích thước
console.log(map.size); // 1

// 🔄 CLEAR: Xóa tất cả
map.clear();
console.log(map.size); // 0
```

### 3.4 Duyệt qua Map

```javascript
const map = new Map([
  ['name', 'Alice'],
  ['age', 30],
  ['city', 'NYC'],
]);

// Cách 1: for...of loop (duyệt cặp [key, value])
for (const [key, value] of map) {
  console.log(`${key}: ${value}`);
  // name: Alice
  // age: 30
  // city: NYC
}

// Cách 2: forEach
map.forEach((value, key) => {
  console.log(`${key}: ${value}`);
});

// Cách 3: Duyệt chỉ khóa
for (const key of map.keys()) {
  console.log(key); // name, age, city
}

// Cách 4: Duyệt chỉ giá trị
for (const value of map.values()) {
  console.log(value); // Alice, 30, NYC
}
```

### 3.5 Ví dụ thực tế: Đếm tần suất xuất hiện (Character Frequency)

```javascript
// ❌ Cách cũ (Nested loop - O(N²))
function charFrequency_bruteforce(str) {
  const result = {};
  for (let i = 0; i < str.length; i++) {
    let count = 0;
    for (let j = 0; j < str.length; j++) {
      if (str[i] === str[j]) count++;
    }
    result[str[i]] = count;
  }
  return result;
}

// ✅ Cách tối ưu (Map - O(N))
function charFrequency_optimized(str) {
  const freqMap = new Map();
  for (const char of str) {
    if (freqMap.has(char)) {
      freqMap.set(char, freqMap.get(char) + 1);
    } else {
      freqMap.set(char, 1);
    }
  }
  return freqMap;
}

// Kiểm tra
const freq = charFrequency_optimized('hello');
console.log(freq); // Map { 'h' => 1, 'e' => 1, 'l' => 2, 'o' => 1 }
console.log(freq.get('l')); // 2
```

> [!TIP]
> `map.set(k, (map.get(k) || 0) + 1)` là shorthand đếm tần suất — thay cả khối `if/else`.
> Cẩn thận khi value có thể là `0` hợp lệ: khi đó dùng `??` thay `||`.

### 3.6 Shorthand — viết ngắn hơn

```javascript
const map = new Map();

// Thay vì:
if (map.has('count')) {
  map.set('count', map.get('count') + 1);
} else {
  map.set('count', 1);
}

// Dùng shorthand:
map.set('count', (map.get('count') || 0) + 1);

// Hoặc dùng getOrDefault (giống Java):
const getOrDefault = (map, key, defaultVal) => map.get(key) ?? defaultVal;
map.set('count', getOrDefault(map, 'count', 0) + 1);
```

---

## 4. Map vs Object — khi nào dùng cái nào

### Bảng so sánh

| Tiêu chí        | Map                                      | Object                               |
| --------------- | ---------------------------------------- | ------------------------------------ |
| **Khóa**        | Bất kỳ kiểu nào (object, number, string) | Chỉ string hoặc Symbol               |
| **Kích thước**  | `.size` property                         | Không có (phải duyệt)                |
| **Duyệt**       | Dễ dàng (for...of, forEach)              | Phức tạp hơn (for...in, Object.keys) |
| **Performance** | Tối ưu cho tra cứu liên tục              | Tốt cho dữ liệu cố định              |
| **JSON**        | ❌ Không serialize được                  | ✅ Dễ serialize                      |

### Ví dụ: Khi nào dùng Map?

```javascript
// ✅ Dùng Map khi khóa là object hoặc number
const userMap = new Map();
userMap.set(1, 'Alice'); // khóa là number
userMap.set(2, 'Bob');
console.log(userMap.get(1)); // 'Alice'

// ✅ Dùng Map khi cần duyệt hiệu quả
const frequencyMap = new Map();
for (const char of 'hello') {
  frequencyMap.set(char, (frequencyMap.get(char) || 0) + 1);
}
console.log(frequencyMap.size); // 4
for (const [char, count] of frequencyMap) {
  console.log(`${char}: ${count}`);
}

// ❌ Không dùng Map nếu cần JSON
const obj = { name: 'Alice', age: 30 };
const json = JSON.stringify(obj); // ✅ Hoạt động
const mapJson = JSON.stringify(userMap); // ❌ Thành "{}}"
```

### Đối chiếu API: Object vs Map

#### Cách 1: Object (cách cũ)

```javascript
// Tạo object
const countObj = {};

// Thêm/cập nhật
countObj['a'] = 1;
countObj['b'] = 2;

// Lấy
console.log(countObj['a']); // 1

// Kiểm tra
console.log('a' in countObj); // true
console.log(countObj.hasOwnProperty('a')); // true

// Xóa
delete countObj['a'];

// Kích thước (phức tạp)
console.log(Object.keys(countObj).length); // 1
```

#### Cách 2: Map (cách mới — khuyến nghị cho LeetCode)

```javascript
// Tạo Map
const countMap = new Map();

// Thêm/cập nhật
countMap.set('a', 1);
countMap.set('b', 2);

// Lấy
console.log(countMap.get('a')); // 1

// Kiểm tra
console.log(countMap.has('a')); // true

// Xóa
countMap.delete('a');

// Kích thước (đơn giản)
console.log(countMap.size); // 1
```

---

## 5. Stack — LIFO (Last In First Out)

### 5.1 Khái niệm cơ bản
Stack lưu trữ các phần tử theo nguyên tắc **LIFO (Last In First Out)** - phần tử vào sau cùng sẽ ra đầu tiên. Nó hữu ích khi:
- ✅ Kiểm tra cặp khớp (dấu ngoặc, tags HTML)
- ✅ Thực hiện undo/redo
- ✅ Tìm phần tử gần nhất
- ✅ Duyệt theo thứ tự ngược

### 5.2 Setup & Cú pháp cơ bản

```javascript
// Tạo một Stack mới (dùng Array)
const stack = [];

// Hoặc dùng Class (tùy chọn, nhưng thường dùng Array cho đơn giản)
class Stack {
    constructor() {
        this.items = [];
    }
}
```

### 5.3 Các phương thức chính

```javascript
const stack = [];

// ➕ PUSH: Thêm phần tử vào stack
stack.push(1);
stack.push(2);
stack.push(3);
console.log(stack); // [1, 2, 3]

// 🔝 TOP / PEEK: Xem phần tử trên cùng mà không lấy ra
const top = stack[stack.length - 1];
console.log(top); // 3

// 🗑️ POP: Lấy phần tử trên cùng ra khỏi stack
const popped = stack.pop();
console.log(popped); // 3
console.log(stack); // [1, 2]

// 📏 SIZE / LENGTH: Lấy kích thước stack
console.log(stack.length); // 2

// 📭 ISEMPTY: Kiểm tra stack rỗng
console.log(stack.length === 0); // false

// 🔄 CLEAR: Xóa tất cả phần tử
stack.length = 0; // hoặc stack.splice(0);
console.log(stack); // []
```

### 5.4 Ví dụ thực tế: Valid Parentheses (LeetCode #20)

```javascript
// ❌ Cách cũ (Brute Force - O(N²))
function isValid_bruteforce(s) {
    while (s.includes('()') || s.includes('[]') || s.includes('{}')) {
        s = s.replace('()', '').replace('[]', '').replace('{}', '');
    }
    return s.length === 0;
}

// ✅ Cách tối ưu (Stack - O(N))
function isValid_optimized(s) {
    const stack = [];
    const pairs = { ')': '(', ']': '[', '}': '{' };
    
    for (const char of s) {
        if (char === '(' || char === '[' || char === '{') {
            // Ký tự mở → push vào stack
            stack.push(char);
        } else {
            // Ký tự đóng → check top stack có khớp không
            if (stack.length === 0 || stack.pop() !== pairs[char]) {
                return false;
            }
        }
    }
    
    // Cuối cùng stack phải rỗng (tất cả dấu đóng đã khớp)
    return stack.length === 0;
}

// Kiểm tra
console.log(isValid_optimized("()")); // true
console.log(isValid_optimized("()[]{}")); // true
console.log(isValid_optimized("([)]")); // false (đóng sai thứ tự)
```

### 5.5 Ví dụ thực tế: Remove Adjacent Duplicates (LeetCode #1047)

```javascript
// ❌ Cách cũ (String replacement - chậm)
function removeDuplicates_bruteforce(s) {
    while (s.includes('aa') || s.includes('bb') || /* ... */) {
        s = s.replace('aa', '').replace('bb', '').replace(/* ... */);
    }
    return s;
}

// ✅ Cách tối ưu (Stack - O(N))
function removeDuplicates_optimized(s) {
    const stack = [];
    
    for (const char of s) {
        // Nếu ký tự hiện tại bằng top stack → pop (loại bỏ cặp)
        if (stack.length > 0 && stack[stack.length - 1] === char) {
            stack.pop();
        } else {
            // Nếu khác → push vào stack
            stack.push(char);
        }
    }
    
    // Chuyển stack thành chuỗi
    return stack.join('');
}

// Kiểm tra
console.log(removeDuplicates_optimized("abbaca")); // "ca"
// Giải thích: a, ab, abb → pop → ab, abb → pop → a, ac, aca → bỏ a, ca
console.log(removeDuplicates_optimized("a")); // "a"
```

---

## 6. Queue — FIFO (First In First Out)

### 6.1 Khái niệm cơ bản
Queue lưu trữ các phần tử theo nguyên tắc **FIFO (First In First Out)** - phần tử vào đầu tiên sẽ ra đầu tiên. Nó hữu ích khi:
- ✅ Duyệt theo thứ tự (BFS - Breadth First Search)
- ✅ Xử lý task theo thứ tự
- ✅ Simulating real-world queues (hàng chờ)

### 6.2 Setup & Cú pháp cơ bản

```javascript
// Tạo một Queue mới (dùng Array)
const queue = [];

// Hoặc dùng Class (tùy chọn)
class Queue {
    constructor() {
        this.items = [];
    }
}
```

### 6.3 Các phương thức chính

```javascript
const queue = [];

// ➕ ENQUEUE: Thêm phần tử vào cuối queue
queue.push(1);
queue.push(2);
queue.push(3);
console.log(queue); // [1, 2, 3]

// 🔝 FRONT / PEEK: Xem phần tử ở đầu queue
const front = queue[0];
console.log(front); // 1

// 🗑️ DEQUEUE: Lấy phần tử ở đầu queue ra
const dequeued = queue.shift(); // ⚠️ Shift O(N) vì phải dịch chuyển tất cả phần tử
console.log(dequeued); // 1
console.log(queue); // [2, 3]

// 📏 SIZE / LENGTH: Lấy kích thước queue
console.log(queue.length); // 2

// 📭 ISEMPTY: Kiểm tra queue rỗng
console.log(queue.length === 0); // false

// 🔄 CLEAR: Xóa tất cả phần tử
queue.length = 0;
console.log(queue); // []
```

### 6.4 Bẫy hiệu năng: `.shift()` là O(N)

> [!WARNING]
> `.shift()` phải dịch toàn bộ phần tử còn lại sang trái → **O(N) mỗi lần dequeue**.
> BFS trên n node dùng `.shift()` biến O(n) thành O(n²). Dùng **front pointer** thay thế.

```javascript
// ❌ CHẬM: Sử dụng .shift() liên tục O(N) mỗi lần
const queue = [1, 2, 3, 4, 5];
queue.shift(); // O(N) - phải dịch chuyển [2, 3, 4, 5]
queue.shift(); // O(N) - phải dịch chuyển [3, 4, 5]

// ✅ NHANH: Sử dụng con trỏ front (O(1))
const queue2 = [1, 2, 3, 4, 5];
let front = 0;
queue2[front]; // O(1) - không dịch chuyển, chỉ trỏ
front++; // Dịch con trỏ
queue2[front]; // O(1)

// ✅ HOẶC: Sử dụng Deque (Double-ended Queue) từ thư viện
```

### 6.5 Ví dụ thực tế: BFS (Breadth First Search)

```javascript
// ❌ Cách chậm (dùng .shift())
function bfs_slow(root) {
    const queue = [root];
    const result = [];
    
    while (queue.length > 0) {
        const node = queue.shift(); // O(N) - CHẬM!
        result.push(node.val);
        if (node.left) queue.push(node.left);
        if (node.right) queue.push(node.right);
    }
    
    return result;
}

// ✅ Cách nhanh (dùng con trỏ front)
function bfs_fast(root) {
    const queue = [root];
    let front = 0; // Con trỏ đầu queue
    const result = [];
    
    while (front < queue.length) {
        const node = queue[front]; // O(1)
        front++; // Dịch con trỏ
        result.push(node.val);
        if (node.left) queue.push(node.left);
        if (node.right) queue.push(node.right);
    }
    
    return result;
}
```

### 6.6 Ví dụ thực tế: Recently Viewed (Simulating Queue)

```javascript
function logItems(queue, maxSize = 3) {
    const items = [];
    let front = 0;
    
    while (front < queue.length) {
        items.push(queue[front]);
        front++;
    }
    
    return items.slice(-maxSize); // Lấy maxSize phần tử gần đây nhất
}

// Simulation
const viewed = [];
viewed.push('product1');  // Queue: [product1]
viewed.push('product2');  // Queue: [product1, product2]
viewed.push('product3');  // Queue: [product1, product2, product3]
viewed.push('product4');  // Queue: [product1, product2, product3, product4]

console.log(logItems(viewed, 3)); // ['product2', 'product3', 'product4']
```

---

## 7. Stack vs Queue — so sánh chi tiết

| Tiêu chí | Stack | Queue |
|---------|-------|-------|
| **Nguyên tắc** | LIFO | FIFO |
| **Thêm** | `.push()` O(1) | `.push()` O(1) |
| **Lấy ra** | `.pop()` O(1) | `.shift()` O(N) ⚠️ |
| **Dùng con trỏ** | Không cần (luôn pop) | Có thể dùng front pointer |
| **Ứng dụng** | Parentheses, undo, DFS | BFS, hàng chờ |
| **Performance** | O(1) mọi phép toán | O(N) nếu dùng `.shift()` |

---

## 8. Cheatsheet nhanh

### Hash Set

```javascript
const set = new Set();

// Thêm
set.add(value);

// Kiểm tra
set.has(value);

// Xóa
set.delete(value);

// Xóa tất cả
set.clear();

// Kích thước
set.size;

// Duyệt
for (const val of set) {
}
```

### Hash Map

```javascript
const map = new Map();

// Thêm/cập nhật
map.set(key, value);

// Lấy
map.get(key);

// Kiểm tra
map.has(key);

// Xóa
map.delete(key);

// Xóa tất cả
map.clear();

// Kích thước
map.size;

// Duyệt
for (const [key, value] of map) {
}
```

### Stack

```javascript
const stack = [];

// Thêm
stack.push(value);

// Lấy
stack.pop();

// Xem top
stack[stack.length - 1];

// Kích thước
stack.length;

// Rỗng?
stack.length === 0;

// Duyệt
for (const item of stack) { }
```

### Queue

```javascript
const queue = [];

// Thêm (enqueue)
queue.push(value);

// Lấy (dequeue) - ⚠️ O(N)
queue.shift();

// Hoặc dùng con trỏ (⭐ Recommended)
let front = 0;
queue[front++]; // Lấy phần tử hiện tại, dịch con trỏ

// Xem front
queue[0];

// Kích thước
queue.length;

// Rỗng?
queue.length === 0;

// Duyệt
for (const item of queue) { }
```

---

## 9. Bài tổng hợp

### 9.1 Two Sum (LeetCode #1) — Hash Map

#### Bài toán

Cho mảng `nums` và một số `target`, tìm 2 index i, j sao cho `nums[i] + nums[j] = target`.

#### ❌ Cách 1: Brute Force (O(N²))

```javascript
function twoSum_bruteforce(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  return [];
}
```

#### ✅ Cách 2: Hash Map (O(N))

```javascript
function twoSum_optimized(nums, target) {
  const numMap = new Map(); // {value => index}

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];

    // Kiểm tra số "bù" có tồn tại không
    if (numMap.has(complement)) {
      return [numMap.get(complement), i]; // Trả về 2 index
    }

    // Lưu số hiện tại và index của nó
    numMap.set(nums[i], i);
  }

  return [];
}

// Kiểm tra
console.log(twoSum_optimized([2, 7, 11, 15], 9)); // [0, 1]
console.log(twoSum_optimized([3, 2, 4], 6)); // [1, 2]
```

### 9.2 Backspace String Compare (LeetCode #844) — Stack vs Two Pointers

#### Bài toán
Cho 2 chuỗi có chứa ký tự backspace (`#`), so sánh chuỗi cuối cùng sau khi xử lý backspace.

**Ví dụ:**
- `s = "ab#c"` → `"ac"` (xóa b)
- `t = "ad#c"` → `"ac"` (xóa d)
- Result: `true` (cả 2 bằng "ac")

#### ✅ Cách 1: Stack (O(N) time, O(N) space)

```javascript
function backspaceCompare(s, t) {
    const buildString = (str) => {
        const stack = [];
        
        for (const char of str) {
            if (char === '#') {
                if (stack.length > 0) {
                    stack.pop(); // Xóa ký tự trước
                }
            } else {
                stack.push(char);
            }
        }
        
        return stack.join('');
    };
    
    return buildString(s) === buildString(t);
}

// Kiểm tra
console.log(backspaceCompare("ab#c", "ad#c")); // true
console.log(backspaceCompare("a#c", "b")); // false
```

#### ✅ Cách 2: Two Pointers từ phải (O(N) time, O(1) space)

```javascript
function backspaceCompare(s, t) {
    let i = s.length - 1;
    let j = t.length - 1;
    
    while (i >= 0 || j >= 0) {
        i = getNextValidIndex(s, i);
        j = getNextValidIndex(t, j);
        
        if (i >= 0 && j >= 0 && s[i] !== t[j]) {
            return false;
        }
        
        if ((i >= 0) !== (j >= 0)) {
            return false; // Một bên hết, một bên còn
        }
        
        i--;
        j--;
    }
    
    return true;
}

function getNextValidIndex(str, index) {
    let backspaceCount = 0;
    
    while (index >= 0) {
        if (str[index] === '#') {
            backspaceCount++;
        } else if (backspaceCount > 0) {
            backspaceCount--;
        } else {
            break;
        }
        index--;
    }
    
    return index;
}
```

---

## 10. Tổng kết

- **Hash Set:** Dùng khi chỉ cần kiểm tra "có hay không", loại trùng lặp.
- **Hash Map:** Dùng khi cần lưu dữ liệu thêm (tần suất, vị trí, giá trị).
- **Cả hai** đều có độ phức tạp O(1) cho các phép toán cơ bản.
- **JavaScript:** Dùng `Set` và `Map` thay vì `Object` để có đầy đủ tính năng.
- **Stack:** LIFO, dùng cho matching pairs, undo/redo, DFS
- **Queue:** FIFO, dùng cho BFS, xử lý theo thứ tự
- **JavaScript Stack:** Array dùng `.push()` `.pop()`
- **JavaScript Queue:** Array dùng `.push()` và con trỏ front (tránh `.shift()` O(N))
