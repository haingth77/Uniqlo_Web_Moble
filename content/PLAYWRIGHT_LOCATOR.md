### 1. getByRole:

Dưới đây là danh sách các role ARIA thường gặp khi test bằng `getByRole()` trong Playwright.  
Sắp xếp theo mức phổ biến *tham khảo* (ước lượng theo thực tế project, không phải thứ tự chuẩn ARIA).

| Độ phổ biến | Role        | Mô tả ngắn gọn                      | Tag HTML (Implicit) / Ghi chú             |
| ----------- | ----------- | ---------------------------------- | ----------------------------------------- |
| 1           | button      | Nút nhấn                            | `<button>`, `<input type="button|submit|reset|image">` |
| 2           | link        | Liên kết điều hướng                  | `<a href>`, `<area href>`                |
| 3           | textbox     | Ô nhập văn bản                       | `<input type="text|password|email|...">`, `<textarea>` |
| 4           | checkbox    | Hộp kiểm bật/tắt                     | `<input type="checkbox">`                 |
| 5           | heading     | Tiêu đề (h1-h6)                     | `<h1>`-`<h6>`                            |
| 6           | img         | Hình ảnh có alt text                 | `<img>`                                  |
| 7           | radio       | Nút radio                            | `<input type="radio">`                    |
| 8           | listbox     | Danh sách chọn                       | `<select>`, explicit `role="listbox"`      |
| 9           | option      | Tùy chọn trong listbox/combobox      | `<option>`, explicit `role="option"`       |
| 10          | list        | Danh sách                            | `<ul>`, `<ol>`                            |
| 11          | listitem    | Mục trong danh sách                  | `<li>`                                    |
| 12          | table       | Bảng                                 | `<table>`                                 |
| 13          | row         | Hàng trong bảng                      | `<tr>`                                    |
| 14          | cell        | Ô trong bảng                         | `<td>`, `<th>`                            |
| 15          | combobox    | Input mở dropdown/list liên quan       | explicit `role="combobox"`                |
| 16          | progressbar | Thanh tiến trình                      | `<progress>`                              |
| 17          | slider      | Thanh trượt                          | `<input type="range">`                    |
| 18          | spinbutton  | Nút xoay số (nhập số)               | `<input type="number">`                   |
| 19          | dialog      | Hộp thoại (modal/non-modal)          | `<dialog>`, explicit `role="dialog"`      |
| 20          | alert       | Thông báo cảnh báo/thời điểm khẩn cấp | explicit `role="alert"`                   |
| 21          | separator   | Dấu phân cách                        | `<hr>`                                    |
| 22          | menu        | Menu điều hướng/phụ lệnh             | explicit `role="menu"`                    |
| 23          | menuitem    | Mục trong menu                       | explicit `role="menuitem"`                |
| 24          | tablist     | Danh sách nhóm tab                   | explicit `role="tablist"`                 |
| 25          | tab         | Tab trong tablist                    | explicit `role="tab"`                     |
| 26          | tabpanel    | Nội dung của một tab                 | explicit `role="tabpanel"`                |

**Lưu ý**:

- Danh sách này không đầy đủ (ARIA có nhiều role hơn), đây là nhóm thường gặp nhất khi test UI.
- Bạn có thể kiểm tra đầy đủ tại [ARIA Roles](https://www.w3.org/TR/wai-aria-1.1/#roles).
- Độ phổ biến là tương đối theo thực tế, dự án của bạn có thể khác.
- Nếu role không có implicit tag, phải gán explicit như `role="button"`.
- Cú pháp cơ bản: `page.getByRole('button', { name: 'Submit' })`. Có thể thêm `exact: true`, `checked`, `disabled`, `expanded`...

### 2. getByText:

Tìm phần tử dựa trên văn bản hiển thị (visible text) trên trang. Phù hợp cho các phần tử không có role rõ ràng nhưng có text.

- **Ví dụ**: `page.getByText('Submit')` – Tìm phần tử có text "Submit".
- **Lưu ý**: Có thể thêm `exact: true` để khớp chính xác.
- Có thể lọc text trong một locator cha bằng `filter({ hasText: 'Submit' })`.

### 3. getByLabel:

Tìm phần tử form dựa trên text của label liên kết (thông qua `<label>` hoặc `aria-labelledby`).

- **Ví dụ**: `page.getByLabel('Username')` – Tìm input có label "Username".
- **Lưu ý**: Phù hợp cho accessibility, tự động liên kết với input.

### 4. getByPlaceholder:

Tìm phần tử input dựa trên placeholder text.

- **Ví dụ**: `page.getByPlaceholder('Enter your name')` – Tìm input có placeholder "Enter your name".
- **Lưu ý**: Chỉ áp dụng cho phần tử có attribute `placeholder`, thường là `<input>`/`<textarea>`.

### 5. getByAltText:

Tìm phần tử hình ảnh dựa trên alt text (cho accessibility).

- **Ví dụ**: `page.getByAltText('Company Logo')` – Tìm `<img alt="Company Logo">`.
- **Lưu ý**: Chủ yếu dùng cho `<img>`, `<area>`, `<input type="image">` hoặc phần tử có alt text tương đương.

### 6. getByTitle:

Tìm phần tử dựa trên title attribute (tooltip text).

- **Ví dụ**: `page.getByTitle('Close')` – Tìm element có `title="Close"`.
- **Lưu ý**: Ít phổ biến, nhưng hữu ích cho tooltips.

### 7. getByTestId:

Tìm phần tử dựa trên custom data attribute, thường là `data-testid` (khuyến nghị cho testing).

- **Ví dụ**: `page.getByTestId('submit-button')` – Tìm element có `data-testid="submit-button"`.
- **Lưu ý**: Thường ổn định hơn khi UI/layout hay text thay đổi.

### 8. Bảng detect nhanh cho các getBy còn lại

| Locator     | Dấu hiệu nhận diện | Khi nên dùng | Ví dụ |
| ----------- | ------------------ | ------------ | ----- |
| getByText   | Có text hiển thị trên màn hình | Phần tử không có role rõ ràng, hoặc nhanh nhất để đọc được nội dung | `page.getByText('Dashboard')` |
| getByLabel  | Có `<label>` gán cho control | Input/select/textarea theo chuẩn form accessibly | `page.getByLabel('Password')` |
| getByPlaceholder | Có `placeholder` text ổn định | Dùng khi chưa có id/testid ổn định | `page.getByPlaceholder('Search users')` |
| getByAltText | Có alt text rõ ràng | Hình ảnh, icon hoặc media | `page.getByAltText('Company Logo')` |
| getByTitle | Có `title` attribute | Tooltip hoặc text hover được đặt bằng title | `page.getByTitle('Close')` |
| getByTestId | Có `data-testid` hoặc custom attribute | Thành phần thay đổi text/DOM, muốn selector bền vững | `page.getByTestId('login-submit')` |
