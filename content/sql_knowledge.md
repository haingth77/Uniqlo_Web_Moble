# SQL Knowledge — Middle Automation Tester

> Kiến thức SQL cho QA/Automation: verify data sau API call, setup/cleanup test data, viết query không sập production.
> Focus MySQL (mặc định của LeetCode), có note khác biệt cross-DB khi cần.
> Format: **Cú pháp → Ví dụ → Bẫy → QA habit**.

---


## 1. Concepts Overview

### Kiến thức cần nắm theo độ ưu tiên

**Level 1 — Bắt buộc (90% câu interview QA):**
- SELECT, WHERE, ORDER BY, LIMIT, DISTINCT
- JOIN (INNER, LEFT, RIGHT)
- GROUP BY + HAVING + Aggregate (COUNT, SUM, AVG, MAX, MIN)
- NULL handling (IS NULL, IS NOT NULL)
- CASE WHEN
- INSERT, UPDATE, DELETE cơ bản

**Level 2 — Nâng cao:**
- Subqueries (trong WHERE, FROM, SELECT)
- Self-join
- Window functions (ROW_NUMBER, RANK, DENSE_RANK)
- CTE (WITH clause)
- UPDATE/DELETE với JOIN

**Level 3 — Tuỳ chọn:**
- UNION, INTERSECT
- Date functions (DATEDIFF, DATE_ADD)
- String functions nâng cao (REGEXP, REPLACE)
- Transactions (BEGIN, COMMIT, ROLLBACK)

### Vai trò SQL trong QA/Automation
- **Verify data sau API calls** — query DB để confirm side effects
- **Setup test data** — INSERT bulk data trước test
- **Cleanup** — DELETE/TRUNCATE test data sau test
- **Modify state** — UPDATE để simulate test scenarios
- **Generate reports** — aggregate test results

---

## 2. SELECT cơ bản

### Cú pháp tổng quát
```sql
SELECT column1, column2, ...
FROM table_name [alias]
WHERE condition
GROUP BY column1
HAVING aggregate_condition
ORDER BY column1 ASC | DESC
LIMIT n OFFSET m;
```

### Examples cơ bản

```sql
-- Chọn cột
SELECT name, age FROM Users;

-- WHERE với AND/OR
SELECT * FROM Users WHERE age >= 18 AND status = 'active';
SELECT * FROM Users WHERE country = 'VN' OR country = 'US';

-- IN, NOT IN
SELECT * FROM Users WHERE country IN ('VN', 'US', 'JP');

-- BETWEEN
SELECT * FROM Users WHERE age BETWEEN 18 AND 65;

-- LIKE pattern matching
SELECT * FROM Users WHERE email LIKE '%@gmail.com';     -- kết thúc bằng @gmail.com
SELECT * FROM Users WHERE name LIKE 'A%';                 -- bắt đầu bằng A
SELECT * FROM Users WHERE name LIKE '_a%';                -- ký tự thứ 2 là 'a'

-- DISTINCT (loại trùng)
SELECT DISTINCT country FROM Users;

-- ORDER BY
SELECT * FROM Users ORDER BY age DESC, name ASC;

-- LIMIT + OFFSET (phân trang)
SELECT * FROM Users LIMIT 10;                  -- 10 rows đầu
SELECT * FROM Users LIMIT 10 OFFSET 20;        -- 10 rows, skip 20 đầu
```

### Alias

```sql
-- Alias cột với AS
SELECT name AS user_name, age AS user_age FROM Users;

-- Alias bảng (không cần AS, nhưng dùng cho clear)
SELECT u.name, u.age FROM Users u;
SELECT u.name, u.age FROM Users AS u;
```

→ **Habit QA tốt:** Luôn dùng alias bảng khi có JOIN. Giúp code đọc dễ và tránh ambiguous column.

---

## 3. String & NULL Handling

### String Length

| DB | Function | Note |
|---|---|---|
| MySQL | `CHAR_LENGTH(str)` | Đếm ký tự (multi-byte safe) |
| MySQL | `LENGTH(str)` | Đếm byte (1 ký tự UTF-8 có thể 1-4 byte) |
| PostgreSQL | `LENGTH(str)` hoặc `CHAR_LENGTH(str)` | Tương đương |
| SQL Server | `LEN(str)` | Đếm ký tự |
| Oracle/SQLite | `LENGTH(str)` | Đếm ký tự |

```sql
-- Bài #1683 — Invalid Tweets
SELECT tweet_id FROM Tweets WHERE CHAR_LENGTH(content) > 15;

-- Khác biệt LENGTH vs CHAR_LENGTH
LENGTH("héllo")       → 6   (é = 2 byte)
CHAR_LENGTH("héllo")  → 5   (5 ký tự)
LENGTH("你好")        → 6   (mỗi ký tự 3 byte)
CHAR_LENGTH("你好")   → 2   (2 ký tự)
```

→ **QA rule:** Dùng `CHAR_LENGTH` khi muốn đếm ký tự theo cảm nhận user. `LENGTH` chỉ khi quan tâm storage size.

### Các string function khác

```sql
-- Concat
CONCAT('Hello', ' ', 'World')   → 'Hello World'

-- Lowercase / Uppercase
LOWER('HELLO')   → 'hello'
UPPER('hello')   → 'HELLO'

-- Substring
SUBSTRING('Hello World', 1, 5)   → 'Hello'   -- (string, start_1indexed, length)

-- Trim
TRIM('  hello  ')   → 'hello'
LTRIM(...)          → trim trái
RTRIM(...)          → trim phải

-- Replace
REPLACE('Hello World', 'World', 'SQL')   → 'Hello SQL'
```

### NULL — bẫy lớn nhất trong SQL

> [!GOTCHA]
> Mọi phép so sánh với `NULL` (kể cả `=` và `<>`) đều trả về **UNKNOWN**, nên row bị loại khỏi kết quả —
> query không báo lỗi, chỉ **thiếu row**. Luôn dùng `IS NULL` / `IS NOT NULL`, hoặc bọc `COALESCE()`.

```sql
-- NULL không bắt bằng =
WHERE col = NULL      -- ❌ KHÔNG bao giờ true
WHERE col IS NULL     -- ✅

-- NULL không bắt bằng <>
WHERE col <> 'A'      -- ❌ KHÔNG bắt rows có col = NULL
WHERE col <> 'A' OR col IS NULL   -- ✅ explicit handle

-- NULL trong arithmetic luôn ra NULL
SELECT 5 + NULL       -- → NULL
SELECT 'abc' || NULL  -- → NULL (PostgreSQL)
SELECT CONCAT('abc', NULL)   -- → 'abc' (MySQL, ignore NULL); → NULL (PostgreSQL)

-- COALESCE — trả về giá trị non-NULL đầu tiên
COALESCE(NULL, NULL, 'default')   → 'default'
COALESCE(col, 0)                    -- nếu col NULL → trả 0

-- IFNULL (MySQL) / ISNULL (SQL Server) / NVL (Oracle)
IFNULL(col, 0)   -- MySQL tương đương COALESCE(col, 0) nhưng chỉ 2 tham số
```

### Bài #584 — bẫy NULL kinh điển

```sql
-- Đề: Find customers có referee_id KHÁC 2
-- SAI:
SELECT name FROM Customer WHERE referee_id <> 2;
-- → Miss rows có referee_id = NULL

-- ĐÚNG:
SELECT name FROM Customer WHERE referee_id IS NULL OR referee_id <> 2;
```

---

## 4. JOIN

### 4 loại JOIN chính

```sql
-- INNER JOIN: chỉ lấy rows match ở CẢ 2 bảng
SELECT u.name, o.amount
FROM Users u
INNER JOIN Orders o ON u.id = o.user_id;

-- LEFT JOIN: lấy hết bảng TRÁI, NULL cho rows không match
SELECT u.name, o.amount
FROM Users u
LEFT JOIN Orders o ON u.id = o.user_id;
-- → Users không có order vẫn xuất hiện, amount = NULL

-- RIGHT JOIN: lấy hết bảng PHẢI (ít dùng, thường viết lại bằng LEFT cho rõ)
SELECT u.name, o.amount
FROM Users u
RIGHT JOIN Orders o ON u.id = o.user_id;

-- CROSS JOIN: Cartesian product (mọi cặp)
SELECT u.name, p.name
FROM Users u
CROSS JOIN Products p;
-- → Mỗi user kết hợp với mỗi product
```

### Anti-join (LEFT JOIN + IS NULL)

Tìm rows ở bảng A nhưng KHÔNG có ở bảng B:

```sql
-- Bài #183 — Customers who never order
SELECT c.name
FROM Customers c
LEFT JOIN Orders o ON c.id = o.customer_id
WHERE o.id IS NULL;
```

### Self-join

Bảng JOIN với chính nó (qua alias khác nhau):

```sql
-- Bài #181 — Employees earning more than managers
SELECT e.name AS Employee
FROM Employee e
INNER JOIN Employee m ON e.managerId = m.id
WHERE e.salary > m.salary;

-- Bài #197 — Rising Temperature (so sánh ngày liên tiếp)
SELECT w1.id
FROM Weather w1
JOIN Weather w2 ON w1.recordDate = DATE_ADD(w2.recordDate, INTERVAL 1 DAY)
WHERE w1.temperature > w2.temperature;
```

### Multi-table JOIN

```sql
SELECT u.name, p.title, c.name AS category
FROM Users u
JOIN Posts p ON u.id = p.user_id
JOIN Categories c ON p.category_id = c.id
WHERE u.active = 1;
```

---

## 5. Aggregate Functions & GROUP BY

### Functions

| Function | Trả về | Bỏ qua NULL? |
|---|---|---|
| `COUNT(*)` | Số rows | Không (đếm tất cả) |
| `COUNT(col)` | Số rows có col ≠ NULL | Có |
| `COUNT(DISTINCT col)` | Số giá trị unique của col | Có |
| `SUM(col)` | Tổng | Có |
| `AVG(col)` | Trung bình | Có |
| `MAX(col)` | Lớn nhất | Có |
| `MIN(col)` | Nhỏ nhất | Có |

### COUNT(*) vs COUNT(col) — bẫy NULL

```sql
-- Orders có 5 rows, 1 row có user_id = NULL

COUNT(*)        → 5  (đếm tất cả)
COUNT(user_id)  → 4  (bỏ qua row có NULL)
```

→ **Best practice:** Khi muốn "đếm số rows", dùng `COUNT(*)`. Khi muốn "đếm rows có giá trị", dùng `COUNT(col)`.

### GROUP BY

```sql
-- Đếm số orders mỗi user
SELECT user_id, COUNT(*) AS order_count, SUM(amount) AS total
FROM Orders
GROUP BY user_id;
```

### Quy tắc GROUP BY — học thuộc

> [!IMPORTANT]
> **Mọi cột non-aggregate trong SELECT PHẢI có trong GROUP BY.**

```sql
-- ❌ SAI (MySQL strict mode error)
SELECT user_id, name, COUNT(*)
FROM Orders JOIN Users ON ...
GROUP BY user_id;
-- name không trong GROUP BY

-- ✅ ĐÚNG
SELECT user_id, name, COUNT(*)
FROM Orders JOIN Users ON ...
GROUP BY user_id, name;
```

**MySQL "lỏng lẻo":** Default cho phép select cột không trong GROUP BY → trả **giá trị tùy ý** từ group. Silent bug! Các DB khác (PostgreSQL, SQL Server) strict → báo lỗi.

→ **Best practice cho QA:** Viết theo strict mode để code chạy được trên mọi DB.

---

## 6. WHERE vs HAVING

### Quy tắc cốt lõi — bẫy quan trọng nhất

> [!KEY]
> `WHERE` filter **row** trước khi gộp; `HAVING` filter **group** sau khi gộp.
> Aggregate (`COUNT`, `SUM`, …) chỉ được xuất hiện trong `HAVING`, không bao giờ trong `WHERE`.

| Clause | Khi nào chạy | Có dùng aggregate được không? |
|---|---|---|
| `WHERE` | Filter **từng row gốc TRƯỚC khi GROUP BY** | ❌ Không |
| `HAVING` | Filter **các group SAU khi GROUP BY** | ✅ Có |

### Examples

```sql
-- Tìm các user có TỔNG amount > 10000
-- ❌ SAI
SELECT user_id FROM Orders
WHERE SUM(amount) > 10000      -- Error: aggregate in WHERE
GROUP BY user_id;

-- ✅ ĐÚNG
SELECT user_id FROM Orders
GROUP BY user_id
HAVING SUM(amount) > 10000;
```

```sql
-- Kết hợp WHERE và HAVING (rất phổ biến)
-- "Tìm user có > 5 orders amount > 100 trong tháng 6"
SELECT user_id, COUNT(*) AS cnt
FROM Orders
WHERE amount > 100                     -- filter từng order TRƯỚC
  AND MONTH(order_date) = 6
GROUP BY user_id
HAVING COUNT(*) > 5;                   -- filter các user GROUP SAU
```

### Quiz quick check

```sql
-- A
SELECT user_id, COUNT(*) FROM Orders WHERE COUNT(*) > 5 GROUP BY user_id;
-- ❌ SAI — aggregate trong WHERE

-- B
SELECT user_id, COUNT(*) FROM Orders WHERE amount > 100 GROUP BY user_id HAVING COUNT(*) > 5;
-- ✅ ĐÚNG

-- C
SELECT user_id, COUNT(*) FROM Orders GROUP BY user_id HAVING amount > 100;
-- ❌ SAI — amount không phải aggregate và không trong GROUP BY
```

---

## 7. INSERT

### Form 1: VALUES (data tĩnh)

```sql
INSERT INTO Users (id, name, age, email) VALUES
    (1, 'Alice', 25, 'alice@a.com'),
    (2, 'Bob', 30, 'bob@b.com'),
    (3, 'Charlie', NULL, 'charlie@c.com');
```

### Form 2: INSERT...SELECT (từ query)

```sql
-- Copy users >=18 sang AdultUsers
INSERT INTO AdultUsers (id, name, age, email)
SELECT id, name, age, email
FROM Users
WHERE age >= 18;
```

**Quan trọng:** Khi dùng SELECT, **KHÔNG có `VALUES`**:
```sql
INSERT INTO target (cols) VALUES SELECT ...   -- ❌ SAI
INSERT INTO target (cols) SELECT ...           -- ✅
```

### Form 3: INSERT với aggregate

```sql
-- Tổng hợp thống kê từ Orders vào UserStats
INSERT INTO UserStats (user_id, total_orders, total_amount)
SELECT user_id, COUNT(*), SUM(amount)
FROM Orders
GROUP BY user_id;
```

### Form 4: Bỏ column list (nguy hiểm)

```sql
-- Bắt buộc cung cấp đủ TẤT CẢ cột theo thứ tự schema
INSERT INTO Users VALUES (1, 'Alice', 25, 'alice@a.com');
```

→ **Tránh cách này** vì khi schema thay đổi → fail silent.

### Form 5: Dùng DEFAULT

```sql
-- Với cột có DEFAULT (AUTO_INCREMENT, CURRENT_TIMESTAMP):
INSERT INTO Users (name, email) VALUES ('Alice', 'a@a.com');
-- → id và created_at tự fill bởi DEFAULT

-- Explicit DEFAULT
INSERT INTO Users VALUES (DEFAULT, 'Alice', 25, 'a@a.com', DEFAULT);
```

### Bẫy INSERT thường gặp

1. **String literal thiếu nháy đơn:**
   ```sql
   VALUES (Alice, ...)        -- ❌ → Error "Unknown column 'Alice'"
   VALUES ('Alice', ...)      -- ✅
   ```

2. **NULL ≠ 'NULL':**
   ```sql
   VALUES ('NULL')   -- string "NULL" (4 ký tự)
   VALUES (NULL)      -- NULL thật
   ```

3. **Thiếu cột NOT NULL:**
   ```sql
   -- Schema: email VARCHAR NOT NULL
   INSERT INTO Users (id, name) VALUES (1, 'Alice');   -- ❌ thiếu email
   ```

4. **Sai thứ tự cột:**
   ```sql
   INSERT INTO Users (name, id) VALUES (1, 'Alice');   -- ❌ thứ tự ngược
   ```

---

## 8. UPDATE

### Form 1: UPDATE đơn giản

```sql
-- Update 1 column
UPDATE Users SET email = 'new@a.com' WHERE id = 1;

-- Update nhiều columns
UPDATE Users
SET name = 'Alice Smith', email = 'alice@a.com'
WHERE id = 1;
```

### Form 2: UPDATE với arithmetic

```sql
-- Tăng giá 10% cho tất cả Electronics
UPDATE Products
SET price = price * 1.1
WHERE category = 'Electronics';

-- Cộng/trừ
UPDATE Inventory SET stock = stock - 1 WHERE id = 5;
```

### Form 3: UPDATE với CASE WHEN

```sql
-- Set tax_rate theo bracket
UPDATE Employees
SET tax_rate = CASE
    WHEN salary < 5000 THEN 0.05
    WHEN salary < 10000 THEN 0.10      -- nếu không match WHEN trên, salary >= 5000
    WHEN salary < 20000 THEN 0.15
    ELSE 0.20
END;

-- Bài #627 — Swap Salary
UPDATE Salary
SET sex = CASE
    WHEN sex = 'f' THEN 'm'
    WHEN sex = 'm' THEN 'f'
END;
```

**Quan trọng:** CASE phải kết thúc bằng `END`. Có thể có hoặc không `ELSE`.

### Form 4: UPDATE với SUBQUERY

```sql
-- Set status = 'vip' cho users có tổng orders > 10000
UPDATE Users
SET status = 'vip'
WHERE id IN (
    SELECT user_id FROM Orders
    GROUP BY user_id
    HAVING SUM(amount) > 10000
);
```

**Bẫy:** Subquery dùng `HAVING` cho aggregate, không phải `WHERE`.

### Form 5: UPDATE với JOIN (Multi-table UPDATE)

**Khi nào dùng?** Khi cần update bảng A dựa trên data của bảng B, hoặc update **NHIỀU bảng cùng lúc**.

#### MySQL syntax

```sql
-- Pattern cơ bản: UPDATE table_a JOIN table_b ON ... SET ...
UPDATE Users u
JOIN Orders o ON u.id = o.user_id
SET u.status = 'vip'
WHERE o.amount > 1000;
-- → Update users có ÍT NHẤT 1 order > 1000 → status = vip
```

#### Update từ aggregate JOIN

```sql
-- Tương đương Form 4 nhưng dùng JOIN
UPDATE Users u
JOIN (
    SELECT user_id, SUM(amount) AS total
    FROM Orders
    GROUP BY user_id
) o ON u.id = o.user_id
SET u.status = 'vip'
WHERE o.total > 10000;
```

→ **Khi nào prefer JOIN over subquery?**
- Subquery (form 4): khi chỉ filter, code đơn giản hơn
- JOIN (form 5): khi cần **gán giá trị từ bảng khác** vào row update

#### Update nhiều bảng cùng lúc (MySQL specific)

```sql
-- Update Users và Logs cùng 1 statement
UPDATE Users u
JOIN UserLogs ul ON u.id = ul.user_id
SET u.status = 'inactive',
    ul.last_action = 'auto_inactivate'
WHERE u.last_login < '2024-01-01';
```

#### Update với LEFT JOIN

```sql
-- Set status = 'new' cho users CHƯA có order
UPDATE Users u
LEFT JOIN Orders o ON u.id = o.user_id
SET u.status = 'new'
WHERE o.id IS NULL;
-- → o.id IS NULL nghĩa là không có order match → user chưa từng order
```

#### Update copy giá trị từ bảng khác

```sql
-- Schema:
--   Users(id, name, status)
--   Backup(user_id, status)
-- Yêu cầu: restore status từ Backup vào Users

UPDATE Users u
JOIN Backup b ON u.id = b.user_id
SET u.status = b.status;
```

### Cú pháp UPDATE...JOIN ở các DB khác

```sql
-- PostgreSQL: dùng FROM clause
UPDATE Users
SET status = 'vip'
FROM Orders
WHERE Users.id = Orders.user_id AND Orders.amount > 1000;

-- SQL Server: tương tự PostgreSQL
UPDATE u
SET u.status = 'vip'
FROM Users u
JOIN Orders o ON u.id = o.user_id
WHERE o.amount > 1000;
```

→ **LeetCode mặc định MySQL** nên focus syntax MySQL. Nhưng trong production, biết cross-DB là điểm cộng.

### Bẫy UPDATE quan trọng

> [!DANGER]
> `UPDATE` thiếu `WHERE` = ghi đè **toàn bộ bảng**, không có undo nếu ngoài transaction.
> Habit bắt buộc: chạy `SELECT` với đúng điều kiện đó trước, đếm số row, rồi mới `UPDATE`.

1. **Quên WHERE = update toàn bảng (THẢM HỌA):**
   ```sql
   UPDATE Users SET status = 'inactive';   -- ❌ update HẾT
   ```
   → **Habit QA:** SELECT trước để verify:
   ```sql
   SELECT * FROM Users WHERE id = 5;       -- verify
   UPDATE Users SET ... WHERE id = 5;      -- xong mới update
   ```

2. **Quên `END` của CASE:**
   ```sql
   SET col = CASE WHEN ... THEN ... END    -- ✅
   ```

3. **UPDATE với JOIN và alias:**
   ```sql
   -- MySQL bắt buộc dùng alias đúng cách
   UPDATE Users u SET status = ...    -- ✅ alias trong UPDATE
   ```

4. **Aggregate trong WHERE:**
   ```sql
   UPDATE Users SET ... WHERE COUNT(*) > 5    -- ❌
   -- → Phải dùng subquery với HAVING
   ```

---

## 9. DELETE

### Form 1: DELETE đơn giản

```sql
-- Xóa 1 row
DELETE FROM Users WHERE id = 1;

-- Xóa nhiều rows theo condition
DELETE FROM Users WHERE status = 'inactive' AND last_login < '2024-01-01';

-- Xóa toàn bảng (NGUY HIỂM)
DELETE FROM Users;
-- Nhanh hơn (nhưng không trigger ON DELETE):
TRUNCATE TABLE Users;
```

### Form 2: DELETE với self-join

```sql
-- Bài #196 — Xóa duplicate emails, giữ row id nhỏ nhất
DELETE p1 FROM Person p1, Person p2
WHERE p1.email = p2.email AND p1.id > p2.id;
```

**Giải thích:**
- `DELETE p1` — xóa rows từ alias p1
- `FROM Person p1, Person p2` — self-join qua alias
- `p1.email = p2.email AND p1.id > p2.id` — chỉ xóa row có id LỚN hơn

### Form 3: DELETE với JOIN

```sql
-- Xóa orders của users đã bị inactive
DELETE o FROM Orders o
JOIN Users u ON o.user_id = u.id
WHERE u.status = 'inactive';
```

### Form 4: DELETE với subquery

```sql
-- MySQL không cho DELETE và SELECT cùng bảng trực tiếp → phải wrap subquery
DELETE FROM Person
WHERE id NOT IN (
    SELECT * FROM (
        SELECT MIN(id) FROM Person GROUP BY email
    ) AS sub
);
```

### Khác biệt DELETE vs TRUNCATE vs DROP

| Lệnh | Tác dụng | Tốc độ | Rollback? |
|---|---|---|---|
| `DELETE FROM t` | Xóa rows, có thể WHERE | Chậm (log từng row) | ✅ |
| `TRUNCATE TABLE t` | Xóa hết rows, không WHERE | Nhanh | ❌ (DDL) |
| `DROP TABLE t` | Xóa CẢ TABLE + schema | Nhanh | ❌ |

→ **QA habit:** Trong test cleanup, dùng `TRUNCATE` nếu cần reset bảng nhanh. `DELETE` khi cần filter.

### Bẫy DELETE

> [!DANGER]
> `DELETE FROM t;` không có `WHERE` xoá sạch bảng. Trên môi trường có dữ liệu thật,
> bọc trong `BEGIN; … ROLLBACK/COMMIT;` để còn đường lùi.

1. **Quên WHERE:**
   ```sql
   DELETE FROM Users;   -- ❌ xóa HẾT
   ```

2. **Foreign Key constraints:**
   ```sql
   DELETE FROM Users WHERE id = 1;
   -- ❌ Error nếu có Orders.user_id = 1 và FK constraint ON DELETE NO ACTION
   ```
   → Cần xóa Orders trước, hoặc DB phải có `ON DELETE CASCADE`.

3. **DELETE với JOIN: phải alias bảng cần xóa**
   ```sql
   -- ✅
   DELETE u FROM Users u JOIN ...
   -- ❌
   DELETE FROM Users JOIN ...   -- (không có alias rõ)
   ```

---

## 10. CASE WHEN

### Trong SELECT (return column)

```sql
SELECT name,
    CASE
        WHEN salary < 5000 THEN 'Low'
        WHEN salary < 10000 THEN 'Mid'
        ELSE 'High'
    END AS salary_level
FROM Employees;
```

### Trong UPDATE (set value)

```sql
UPDATE Employees
SET bonus = CASE
    WHEN performance = 'A' THEN salary * 0.20
    WHEN performance = 'B' THEN salary * 0.10
    WHEN performance = 'C' THEN salary * 0.05
    ELSE 0
END;
```

### Trong WHERE (conditional filter, ít dùng)

```sql
SELECT * FROM Orders
WHERE CASE
    WHEN status = 'active' THEN amount > 100
    ELSE amount > 50
END;
```

### Trong ORDER BY (custom sort)

```sql
SELECT * FROM Tasks
ORDER BY CASE priority
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'normal' THEN 3
    ELSE 4
END;
```

### Cú pháp 2 dạng

```sql
-- Searched CASE (tổng quát)
CASE
    WHEN condition1 THEN value1
    WHEN condition2 THEN value2
    ELSE default_value
END

-- Simple CASE (so khớp 1 cột với nhiều giá trị)
CASE col
    WHEN 'A' THEN 'Alpha'
    WHEN 'B' THEN 'Beta'
    ELSE 'Other'
END
```

### Bẫy CASE WHEN

1. **Thiếu `END`** — bug syntax phổ biến nhất
2. **Thứ tự WHEN quan trọng** — gặp WHEN đầu tiên match thì dùng, không check tiếp
3. **`ELSE` optional** — không có ELSE và không match WHEN nào → return NULL

---

## 11. Common QA Pitfalls

### Pitfall 1: SELECT trước khi DELETE/UPDATE

```sql
-- ❌ Mạo hiểm
DELETE FROM Users WHERE complex_condition;

-- ✅ QA safe
SELECT * FROM Users WHERE complex_condition;     -- verify
SELECT COUNT(*) FROM Users WHERE complex_condition;   -- check số row
DELETE FROM Users WHERE complex_condition;       -- xong mới chạy
```

### Pitfall 2: Transaction để rollback

```sql
BEGIN;
DELETE FROM Users WHERE id = 1;
-- Verify
SELECT * FROM Users WHERE id = 1;
-- Nếu sai:
ROLLBACK;
-- Nếu đúng:
COMMIT;
```

### Pitfall 3: NULL trong comparison

```sql
-- Bug kinh điển #584
WHERE col <> 'X'                          -- ❌ miss NULL
WHERE col <> 'X' OR col IS NULL           -- ✅
WHERE COALESCE(col, '') <> 'X'            -- ✅ alternative
```

### Pitfall 4: COUNT(*) vs COUNT(col)

```sql
-- Đếm "có giá trị" vs "có rows"
COUNT(*)         → đếm rows
COUNT(col)       → đếm rows có col ≠ NULL
COUNT(DISTINCT col) → đếm giá trị unique
```

### Pitfall 5: GROUP BY thiếu cột

```sql
SELECT dept, name, COUNT(*)
FROM Employees
GROUP BY dept;   -- ❌ MySQL strict / cross-DB error

-- ✅
GROUP BY dept, name;
```

### Pitfall 6: WHERE vs HAVING confusion

```sql
WHERE aggregate(...) ...    -- ❌
HAVING aggregate(...)        -- ✅
```

### Pitfall 7: String literal nháy

```sql
'string'    -- ✅ nháy đơn (cross-DB)
"string"    -- MySQL OK, PostgreSQL coi là identifier
```

### Pitfall 8: Trailing semicolon trong subquery

```sql
-- ❌
DELETE FROM Person WHERE id NOT IN (
    SELECT MIN(id) FROM Person GROUP BY email;   -- ❌ semicolon trong subquery
);
```

### Pitfall 9: Case sensitivity

| | Windows MySQL | Linux MySQL | PostgreSQL |
|---|---|---|---|
| Tên bảng | Không nhạy case | **Nhạy case** | Không nhạy nếu không quote |
| Tên column | Không nhạy case | Không nhạy case | Không nhạy nếu không quote |
| Keyword (SELECT, FROM) | Không nhạy case | Không nhạy case | Không nhạy case |

→ **Habit:** Viết KEYWORDS UPPERCASE, identifiers lowercase. Match đúng tên schema.

---

## 12. SQL Execution Order

> [!TIP]
> Nhớ thứ tự **logical** (khác thứ tự viết) là chìa khoá giải thích hầu hết lỗi cú pháp SQL:
> `FROM → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT`.

**Thứ tự cú pháp (viết):**
```sql
SELECT
FROM
WHERE
GROUP BY
HAVING
ORDER BY
LIMIT
```

**Thứ tự logical (DB thực thi):**
```
1. FROM         → xác định bảng nguồn
2. WHERE        → filter rows TRƯỚC khi gộp
3. GROUP BY     → nhóm rows
4. HAVING       → filter các group SAU khi gộp
5. SELECT       → chọn columns/expressions
6. DISTINCT     → loại trùng
7. ORDER BY     → sắp xếp
8. LIMIT/OFFSET → cắt rows
```

→ Hiểu thứ tự này giải thích **tại sao:**
- Không dùng được alias từ SELECT trong WHERE (vì SELECT chạy sau WHERE)
- Có thể dùng alias trong ORDER BY (vì ORDER BY chạy sau SELECT)
- WHERE không dùng được aggregate (vì aggregate ở GROUP BY/HAVING, chạy sau)

```sql
-- ❌ SAI
SELECT salary * 1.1 AS new_salary FROM Employees WHERE new_salary > 5000;
-- new_salary alias chưa tồn tại khi WHERE chạy

-- ✅ ĐÚNG
SELECT salary * 1.1 AS new_salary FROM Employees ORDER BY new_salary DESC;
-- ORDER BY chạy sau SELECT → alias có sẵn
```

---

## 13. Practice Reference

### LeetCode SQL bài đã làm

| # | Bài | Difficulty | Pattern | Key Skill |
|---|---|---|---|---|
| #595 | Big Countries | Easy | WHERE + OR | Basic filter |
| #1757 | Recyclable and Low Fat | Easy | WHERE + AND | Multi-condition |
| #584 | Find Customer Referee | Easy | NULL handling | `IS NULL` bẫy |
| #1683 | Invalid Tweets | Easy | CHAR_LENGTH | String function |
| #1148 | Article Views I | Easy | DISTINCT + ORDER | Self-comparison row |
| #627 | Swap Salary | Easy | UPDATE + CASE WHEN | Conditional update |
| #196 | Delete Duplicate Emails | Easy | DELETE self-join | Duplicate cleanup |

### Scenarios CRUD đã luyện (không LeetCode)

| # | Scenario | Skill |
|---|---|---|
| INSERT 1 | Insert tĩnh nhiều rows | VALUES syntax, nháy đơn |
| INSERT 2 | Copy bảng A → bảng B với filter | INSERT...SELECT |
| INSERT 3 | Insert từ aggregate query | INSERT...SELECT với GROUP BY |
| UPDATE 1 | Tăng giá theo category | Arithmetic + WHERE |
| UPDATE 2 | Set tax_rate theo bracket | CASE WHEN nhiều nhánh |
| UPDATE 3 | Set status theo SUM orders | Subquery + HAVING |

### Bài mở rộng (khi có thời gian)

| # | Bài | Difficulty | Pattern |
|---|---|---|---|
| #183 | Customers Who Never Order | Easy | LEFT JOIN + IS NULL |
| #1378 | Replace Employee ID | Easy | LEFT JOIN |
| #181 | Employees Earning More Than Managers | Easy | Self-join |
| #182 | Duplicate Emails | Easy | GROUP BY + HAVING |
| #1075 | Project Employees I | Easy | JOIN + GROUP BY + AVG |
| #176 | Second Highest Salary | Medium | Subquery + LIMIT OFFSET |
| #197 | Rising Temperature | Easy | Self-join + DATEDIFF |
| #1934 | Confirmation Rate | Medium | JOIN + CASE + AVG |
| #178 | Rank Scores | Medium | DENSE_RANK() window function |
| #180 | Consecutive Numbers | Medium | LAG() / self-join |

---

## 14. Summary — cheat sheet 1 trang

### Cú pháp căn bản
```sql
SELECT cols FROM table [a]
[JOIN other_table o ON a.id = o.id]
WHERE row_condition                  -- filter trước aggregate
GROUP BY cols
HAVING aggregate_condition           -- filter sau aggregate
ORDER BY cols ASC|DESC
LIMIT n OFFSET m;
```

### Aggregate
```sql
COUNT(*) | COUNT(col) | COUNT(DISTINCT col)
SUM(col) | AVG(col) | MAX(col) | MIN(col)
```

### NULL
```sql
IS NULL | IS NOT NULL          -- không dùng = NULL
COALESCE(col, default)         -- thay NULL bằng default
IFNULL(col, default)           -- MySQL only
```

### CASE WHEN
```sql
CASE
    WHEN cond1 THEN val1
    WHEN cond2 THEN val2
    ELSE default
END
```

### CRUD
```sql
-- INSERT
INSERT INTO t (cols) VALUES (...), (...);
INSERT INTO t (cols) SELECT ... FROM ...;

-- UPDATE
UPDATE t SET col = value WHERE cond;
UPDATE t JOIN other o ON ... SET t.col = o.col WHERE ...;

-- DELETE
DELETE FROM t WHERE cond;
DELETE t1 FROM t t1, t t2 WHERE t1.id > t2.id AND ...;   -- self-join
DELETE t FROM t JOIN other o ON ... WHERE ...;            -- với JOIN
```

### Quy tắc cốt lõi
1. **WHERE filter row TRƯỚC, HAVING filter group SAU**
2. **GROUP BY phải include mọi non-aggregate column trong SELECT**
3. **NULL không bắt bằng `=` hay `<>`, phải dùng `IS [NOT] NULL`**
4. **String literal dùng nháy đơn `'...'`**
5. **Luôn SELECT verify TRƯỚC khi UPDATE/DELETE production**
6. **CASE phải đóng bằng `END`**
7. **INSERT...SELECT KHÔNG đi cùng `VALUES`**
8. **DELETE/UPDATE quên WHERE = thảm họa** — luôn double check
