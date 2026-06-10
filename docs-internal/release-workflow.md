# DeskPane 發版流程

> 每次要發新版本時照這份文件操作。

---

## 快速參考（每次發版複製這段）

```bash
# 1. 確認在 main 分支且程式碼已 commit
git checkout main
git status

# 2. 更新版本號（選一個）
npm version patch   # bug 修正：0.1.0 → 0.1.1
npm version minor   # 新功能：0.1.0 → 0.2.0
npm version major   # 破壞性變更：0.1.0 → 1.0.0

# 3. 重新 build
npm run build:lib

# 4. 發佈到 npm
npm publish

# 5. Push commit + tag 到 GitHub
git push && git push --tags
```

然後去 GitHub 手動補 Release Note（見下方說明）。

---

## 詳細步驟說明

### Step 1：確認目前版本與分支

```bash
git checkout main
git pull                  # 確保本地是最新的
git status                # 應該是 clean（沒有未 commit 的變更）
node -e "console.log(require('./package.json').version)"  # 查看目前版本
```

### Step 2：選擇版本號類型

| 情況 | 指令 | 範例 |
|------|------|------|
| **修了 bug、小修正** | `npm version patch` | `0.1.0` → `0.1.1` |
| **新增功能（向下相容）** | `npm version minor` | `0.1.0` → `0.2.0` |
| **有 breaking change** | `npm version major` | `0.1.0` → `1.0.0` |
| **測試版（不影響正式）** | `npm version prerelease --preid=beta` | `0.1.0` → `0.1.1-beta.0` |

> `npm version` 會自動：
> 1. 修改 `package.json` 的版本號
> 2. 建立一個 git commit（訊息如 `1.0.0`）
> 3. 建立一個 git tag（如 `v1.0.0`）

### Step 3：重新 Build

```bash
npm run build:lib
```

確認 `dist/` 裡的檔案都是最新的。

### Step 4：發佈到 npm

```bash
npm publish
```

> ⚠️ 如果 npm token 過期（預設 90 天），要去重新產生：  
> https://www.npmjs.com/settings/~/tokens  
> 然後執行：`npm config set //registry.npmjs.org/:_authToken <新token>`

發佈測試版（不影響 latest tag）：

```bash
npm publish --tag beta
# 使用者要 npm install deskpane@beta 才會裝到
```

### Step 5：Push 到 GitHub

```bash
git push && git push --tags
```

`git push --tags` 會把 `npm version` 自動建立的 tag（如 `v0.2.0`）push 上去。

### Step 6：在 GitHub 建立 Release

1. 前往 → https://github.com/0obriano0/DeskPane/releases/new
2. **Tag** → 選剛剛 push 上去的版本 tag（如 `v0.2.0`）
3. **Title** → `v0.2.0 — <本次重點>`
4. **Description** → 寫 changelog（格式見下方範本）
5. 點 **Publish release**

---

## Release Note 範本

```markdown
## ✨ What's New

- 新功能描述

## 🐛 Bug Fixes

- 修正了 xxx 問題

## 💥 Breaking Changes

- （如果有的話）

## Install

```bash
npm install deskpane@x.y.z
```
```

---

## 版本號對應表（自行記錄）

| 版本 | 日期 | 重點 |
|------|------|------|
| `v0.1.0` | 2026-06-10 | Initial release，改名自 WebOS-Core |

---

## 常見問題

### npm token 過期怎麼辦？

```bash
# 1. 去 https://www.npmjs.com/settings/~/tokens 產生新 token
# 2. 設定到本機
npm config set //registry.npmjs.org/:_authToken npm_xxxx...
# 3. 確認
npm whoami
```

### 發錯版本怎麼辦？

npm 不允許刪除已發佈的版本（72 小時內可以，但強烈不建議）。  
正確做法是立刻發一個新版本修正：

```bash
npm version patch
npm publish
```

### 想撤銷某個版本（deprecated）？

```bash
npm deprecate deskpane@0.1.1 "此版本有重大 bug，請升級到 0.1.2"
```

---

## 相關連結

- npm 套件頁面：https://www.npmjs.com/package/deskpane
- GitHub Releases：https://github.com/0obriano0/DeskPane/releases
- npm token 管理：https://www.npmjs.com/settings/~/tokens
