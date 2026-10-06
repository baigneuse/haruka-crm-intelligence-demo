# Public demo deployment

[English](#english) · [日本語](#日本語) · [简体中文](#简体中文)

## Live demo

The release candidate is runnable locally. A public URL will be listed here only after the deployed application has been verified. No hosted availability is claimed yet.

## English

The deployment is synthetic-only and read-only. No environment variables, account, database, API credential, analytics integration, or external model is required. `DATA_MODE=synthetic` is the only optional runtime mode; other values fail closed. Do not configure a database connection.

1. Run `npm ci --ignore-scripts` and `npm run verify` from this repository.
2. Create a dedicated Vercel project from this repository, with framework preset **Other** and Node.js **22.x**. Do not reuse a production project or inherit its environment variables.
3. The checked-in `vercel.json` runs `npm run build:vercel`. This produces Vercel Build Output API v3 assets under `.vercel/output`.
4. Review the artifact: four static assets and one bounded, read-only API function. The PostgreSQL adapter, SQL files, source maps, tests, environment files, dependencies and Git metadata are not shipped to the runtime.
5. Verify the deployed home page, `/api/health`, the CUST-002 campaign workflow and all three languages. Initial page load and “Try this example” do not execute a decision.
6. Confirm write/import/reset/admin routes return 404. Only then add the verified URL to the README and repository website field.

The API accepts at most 8 KiB of valid UTF-8 JSON. It does not log or store submitted questions, use cookies, localStorage, or tracking. The hosting provider may still retain access metadata such as IP address and URL. Do not enter personal information in the demo. Platform rate limits and cost protection remain the deployer's responsibility; no application authentication or per-user quota is claimed.

The HTTP `POST /api/agent/run` computes a result; it does not mutate records or dispatch a campaign. The word `agent` in the route describes the deterministic tool interface, not LLM inference.

## 日本語

公開デモは合成データ専用・読み取り専用です。認証、DB、APIキー、外部モデルは不要です。専用VercelプロジェクトでNode.js 22.xと`vercel.json`を使用し、本番設定を流用しないでください。必要なら`DATA_MODE=synthetic`のみ設定します。

ビルド成果物からPostgreSQL adapter、SQL、source map、環境ファイルを除外します。公開後はCUST-002の施策分析、三言語、禁止された書き込みルートの404を確認してください。質問はアプリに保存されませんが、ホスティング事業者がアクセスメタデータを保持する可能性があります。個人情報を入力しないでください。公開URLは実動作確認後に記載します。

## 简体中文

公开演示仅使用合成数据、只读运行，不需要认证、数据库、API 密钥或外部模型。使用独立的 Vercel 项目、Node.js 22.x 和仓库中的`vercel.json`，不要复用生产项目配置；如需设置模式，仅使用`DATA_MODE=synthetic`。

部署包排除 PostgreSQL adapter、SQL、source maps 和环境文件。上线后检查 CUST-002 的决策流程、三语切换以及写入路径的404。应用不保存问题，但托管平台可能保留访问元数据；不要输入个人资料。只有真实验证后才填写公开 URL。平台限流及费用保护仍由部署者负责。
