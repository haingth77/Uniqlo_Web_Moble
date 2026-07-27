# Git — Command-line & Advanced Branching/Merge

> Bù feedback: **thành thạo Git CLI + chiến lược branch/merge nâng cao**.
> Format: **Nó là gì → Lệnh/Thành phần → Ví dụ → Q&A → Gotcha**.

---

## A. Mental model — Git hoạt động thế nào

### Nó là gì

Git là **distributed version control**: mỗi clone là 1 repo đầy đủ (có toàn bộ history). Git không lưu "diff" mà lưu **snapshot** của cây file qua các **commit**; mỗi commit trỏ tới commit cha → tạo thành **DAG** (đồ thị có hướng). Branch chỉ là **con trỏ** (pointer) tới 1 commit. `HEAD` trỏ tới branch/commit hiện tại.

### 3 khu vực (cực quan trọng)

| Khu vực | Là gì | Lệnh đưa vào |
|---|---|---|
| **Working directory** | File bạn đang sửa | (edit) |
| **Staging area (index)** | Khu chuẩn bị cho commit kế | `git add` |
| **Repository (.git)** | History đã commit | `git commit` |

```
working dir  --git add-->  staging  --git commit-->  local repo  --git push-->  remote
     ^------------- git checkout/restore ------|
```

---

## B. Lệnh CLI hàng ngày

```bash
# --- Trạng thái & xem ---
git status                      # file nào modified/staged/untracked
git status -sb                  # gọn (short + branch)
git diff                        # thay đổi CHƯA staged
git diff --staged               # thay đổi ĐÃ staged (sắp commit)
git log --oneline --graph --all # history dạng đồ thị
git log --oneline -5            # 5 commit gần nhất
git show <commit>               # chi tiết 1 commit
git blame <file>                # ai sửa dòng nào

# --- Staging & commit ---
git add <file>                  # stage 1 file
git add -p                      # stage TỪNG HUNK (chọn lọc thay đổi) ⭐
git commit -m "feat: add login"
git commit --amend              # sửa commit gần nhất (message/nội dung)
git restore --staged <file>     # bỏ stage (giữ thay đổi)
git restore <file>              # vứt thay đổi working dir (NGUY HIỂM)

# --- Branch ---
git branch                      # list local
git branch -a                   # list cả remote
git switch <branch>             # đổi branch (mới, rõ nghĩa hơn checkout)
git switch -c feature/login     # tạo + chuyển
git branch -d <branch>          # xoá (an toàn, đã merge)
git branch -D <branch>          # xoá ép (chưa merge)
git branch -m old new           # đổi tên

# --- Remote ---
git fetch                       # tải về, KHÔNG merge
git pull                        # = fetch + merge (hoặc rebase nếu config)
git pull --rebase               # fetch + rebase (history phẳng)
git push -u origin feature/x    # push lần đầu, set upstream
git push --force-with-lease     # force AN TOÀN (không đè người khác) ⭐
git remote -v                   # xem remote
```

> [!TIP]
> `git add -p` và `git push --force-with-lease` là 2 lệnh phân biệt người "biết Git" với người "thuộc lệnh". Nhắc tới chúng trong interview ghi điểm.

---

## C. Merge vs Rebase — câu hỏi kinh điển

### Nó là gì

Cả hai gộp thay đổi từ branch này sang branch khác, nhưng khác về **history**:

| | `git merge` | `git rebase` |
|---|---|---|
| Cách làm | Tạo **merge commit** nối 2 nhánh | **Replay** commit của bạn lên trên đỉnh nhánh đích |
| History | Giữ nguyên, có nhánh rẽ (non-linear) | **Phẳng** (linear), như thể làm tuần tự |
| Commit hash | Giữ nguyên | **Thay đổi** (commit được tạo lại) |
| An toàn trên shared branch? | ✅ | ❌ (đừng rebase branch người khác đang dùng) |
| Khi nào | Tích hợp feature vào main, giữ context | Dọn history local trước khi push/PR |

```bash
# MERGE — tạo merge commit
git switch main
git merge feature/login          # tạo commit gộp
git merge --no-ff feature/login  # luôn tạo merge commit (giữ dấu vết feature)
git merge --squash feature/login # gộp mọi commit thành 1, tự commit

# REBASE — replay commit lên main mới nhất
git switch feature/login
git rebase main                  # đưa feature lên đỉnh main hiện tại
# (xử lý conflict nếu có) → git add ... → git rebase --continue
git rebase --abort               # huỷ, quay lại trạng thái trước

# INTERACTIVE REBASE — dọn history (squash/reorder/sửa message)
git rebase -i HEAD~3             # chỉnh 3 commit gần nhất
# pick / squash / fixup / reword / drop / edit
```

### Quy tắc vàng

> [!IMPORTANT]
> **Golden rule of rebase:** KHÔNG rebase commit đã push lên branch chung (người khác dùng). Rebase đổi hash → người khác bị "history phân kỳ", phải force push gây loạn. Rebase chỉ trên commit **local/chưa share**.

### Q&A

**Q: Merge hay rebase, chọn khi nào?** Rebase **feature branch local** lên main mới nhất để history phẳng + giải quyết conflict sớm, TRƯỚC khi mở PR. Merge khi đưa feature vào main (đặc biệt `--no-ff` để giữ dấu vết). Nguyên tắc: "rebase riêng tư, merge công khai".

**Q: `git pull` mặc định làm gì? Vì sao nhiều team set `pull --rebase`?** `pull` = `fetch` + `merge` → sinh merge commit "Merge branch..." rác. `pull --rebase` replay commit local lên trên → history sạch, không merge commit thừa.

**Q: Squash merge là gì, lợi/hại?** Gộp tất cả commit của feature thành **1 commit** trên main → history main gọn, mỗi PR = 1 commit. Hại: mất commit chi tiết của feature (chấp nhận được vì PR đã review).

**Q: Fast-forward merge là gì?** Khi main không có commit mới kể từ lúc tách nhánh, Git chỉ "dời con trỏ" main tới đỉnh feature → không tạo merge commit. `--no-ff` ép tạo merge commit dù có thể fast-forward.

---

## D. Branching strategies

### Nó là gì

Quy ước tổ chức branch để team phối hợp + release ổn định. Chọn theo nhịp release và quy mô team.

| Strategy | Branch chính | Hợp với |
|---|---|---|
| **GitHub Flow** | `main` + feature branch ngắn, deploy liên tục | CI/CD, team nhỏ-vừa, SaaS |
| **Git Flow** | `main` + `develop` + `feature/*` + `release/*` + `hotfix/*` | Release theo phiên bản, app cài đặt |
| **Trunk-Based** | 1 `trunk`/`main`, commit nhỏ + feature flag | Team lớn, CI mạnh, deploy nhiều lần/ngày |
| **Release branching** | `release/x.y` tách ra để stabilize | Sản phẩm cần hỗ trợ nhiều version |

```bash
# GitHub Flow (phổ biến nhất hiện nay)
git switch -c feature/JIRA-123-add-cart main
# ...code, commit...
git push -u origin feature/JIRA-123-add-cart
# mở PR → CI chạy → review → squash merge vào main → deploy

# Git Flow hotfix
git switch -c hotfix/1.2.1 main
# fix → merge vào CẢ main VÀ develop
```

### Q&A

**Q: GitHub Flow vs Git Flow?** GitHub Flow đơn giản: chỉ `main` + feature branch, merge là deploy được — hợp CI/CD liên tục. Git Flow phức tạp hơn với `develop`/`release`/`hotfix` — hợp release theo version (mobile, desktop). Xu hướng hiện đại nghiêng GitHub Flow/Trunk-based.

**Q: Feature flag liên quan branching thế nào?** Trunk-based merge code chưa hoàn thiện vào main nhưng **tắt bằng flag** → tránh long-lived branch (giảm merge hell), bật tính năng khi sẵn sàng.

**Q: Tại sao branch nên ngắn (short-lived)?** Branch sống lâu → diverge xa main → merge conflict lớn + tích hợp muộn (phát hiện lỗi trễ). Branch ngắn = tích hợp liên tục, conflict nhỏ.

---

## E. Conflict, undo, và lệnh cứu nguy

```bash
# --- Resolve conflict ---
git merge feature        # báo CONFLICT
# sửa file (giữ <<<<<<< ======= >>>>>>> markers) → chọn nội dung đúng
git add <file>           # đánh dấu đã resolve
git merge --continue     # (hoặc git commit)
git merge --abort        # huỷ, quay lại trước merge

# --- Undo an toàn ---
git revert <commit>      # tạo commit ĐẢO NGƯỢC (an toàn cho shared history) ⭐
git reset --soft HEAD~1  # bỏ commit, GIỮ thay đổi ở staging
git reset --mixed HEAD~1 # bỏ commit, giữ thay đổi ở working dir (default)
git reset --hard HEAD~1  # bỏ commit + XOÁ thay đổi (NGUY HIỂM)

# --- Tạm cất ---
git stash                # cất thay đổi đang dở
git stash pop            # lấy lại (và xoá khỏi stash)
git stash list

# --- Cherry-pick: lấy 1 commit cụ thể từ branch khác ---
git cherry-pick <commit> # áp commit đó lên branch hiện tại

# --- Cứu nguy: reflog (lịch sử mọi nơi HEAD từng tới) ---
git reflog               # tìm commit "đã mất" sau reset/rebase hỏng
git reset --hard <hash từ reflog>   # khôi phục

# --- Bisect: tìm commit gây bug bằng binary search ---
git bisect start
git bisect bad           # commit hiện tại lỗi
git bisect good <hash>   # commit cũ tốt
# Git checkout giữa → test → git bisect good/bad → lặp đến khi tìm ra
git bisect reset
```

### Q&A

**Q: `revert` vs `reset` khác gì?** `revert` tạo **commit mới đảo ngược** → an toàn cho history đã push (không viết lại lịch sử). `reset` **di chuyển con trỏ về sau** (viết lại history) → chỉ dùng trên commit local chưa share.

**Q: `reset --soft / --mixed / --hard`?** `soft`: bỏ commit, giữ thay đổi ở **staging**. `mixed` (default): giữ ở **working dir** (unstaged). `hard`: **xoá luôn** thay đổi (mất data nếu chưa commit).

**Q: Lỡ `reset --hard` mất commit, cứu thế nào?** `git reflog` để tìm hash cũ → `git reset --hard <hash>` hoặc `git cherry-pick`. Reflog giữ lịch sử HEAD ~90 ngày → hầu như luôn cứu được.

**Q: `git bisect` dùng khi nào?** Tìm commit gây regression khi không biết nó ở đâu — binary search qua history (log₂N bước thay vì N). Cực mạnh khi bug "tự nhiên xuất hiện".

**Q: Cherry-pick dùng khi nào?** Lấy 1 commit cụ thể (vd hotfix) áp sang branch khác mà không merge cả nhánh. Cẩn thận tạo commit trùng nội dung khác hash.

> [!GOTCHA]
> `git reset --hard` và `git checkout -- <file>`/`git restore` **xoá vĩnh viễn** thay đổi chưa commit. Không có reflog cho working dir. Cân nhắc `git stash` trước.

> [!GOTCHA]
> `git push --force` đè lên remote, có thể xoá commit người khác. Luôn dùng `--force-with-lease` (chỉ force nếu remote chưa thay đổi so với bản bạn biết).

> [!KEY]
> Bộ "cứu nguy" đáng nhớ: `reflog` (tìm lại commit mất), `revert` (undo an toàn đã push), `bisect` (truy commit gây bug), `stash` (cất tạm), `cherry-pick` (lấy lẻ commit).
