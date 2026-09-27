# 靈曦之諭

使用 React、Vite 和 Google Gemini API 製作的 AI 占卜網站。

## 一鍵部署到 Vercel

點擊下面的按鈕，就能把這個專案複製到自己的 Vercel 專案：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/aleppolee/foutune-teller-a/tree/aleppolee-fix-free-gemini-model&env=GEMINI_API_KEY&envDescription=請填入你的 Google Gemini API Key)

部署時請在 **Environment Variables** 填入：

```text
GEMINI_API_KEY=你的 Google Gemini API Key
```

每位使用者都應該使用自己的 Gemini API key。API key 只需要填在自己的 Vercel 專案中，不要寫進程式碼或提交到 GitHub。

## 本機開發

安裝依賴：

```bash
npm install
```

設定環境變數後啟動開發伺服器：

```bash
GEMINI_API_KEY=你的 Google Gemini API Key npm run dev
```

Windows PowerShell 可使用：

```powershell
$env:GEMINI_API_KEY="你的 Google Gemini API Key"
npm run dev
```

## 使用技術

- React
- TypeScript
- Vite
- Google Gemini API
- Vercel Serverless Function
