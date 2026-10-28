# INCIDENT ZERO / V7 — deployment walkthrough

This version separates two systems. **The complete portfolio and terminal game are already static and work offline.** The public Hall of Fame requires an optional AWS backend that must be deployed in your account.

## Before starting: spending controls

1. In AWS Billing and Cost Management, create a **monthly Cost Budget** with a low threshold you choose (for example, **$2**) and email alerts at 50% and 100%. Review any charges already accrued in the account before setting that amount.
2. Enable AWS Free Tier usage alerts where available, and check Billing → Cost Explorer after deployment. Budgets notify you — they do **not** automatically cap spending or shut down services. Billing data can be delayed.
3. The template uses **DynamoDB provisioned capacity 2 RCU/2 WCU**, **API Gateway default-stage throttling of 2 requests/second with burst 4**, one short-running Python Lambda, and a 90-day TTL for score records. Throttling is best-effort, and costs can still occur. Do not claim the cost is $0 until Billing shows your actual usage.
4. Never store your AWS access keys, Lambda secrets, passwords, or private company information in this GitHub repo or browser config.

## Part A — publish the frontend (no Node.js needed)

1. Create a **public** repository on your daily-use professional GitHub account (recommended name: `incident-zero-aws-portfolio`).
2. In VS Code, open **this V7 folder**. Add the *contents* of this folder to the repo root — `index.html` must be at the root. In an empty remote repository you can also use GitHub's upload-files screen, but `git push` is best for repeatable deployments.
3. In the AWS console, open **AWS Amplify → Create new app → GitHub** and authorize your GitHub account. Select the repo and `main` branch. Review the included `amplify.yml`; it builds static files and generates `site-meta.json` with the latest **build timestamp**.
4. Deploy. Copy the actual Amplify HTTPS domain, for example `https://main.example.amplifyapp.com` (your domain will differ). Test `index.html`, `game.html`, project links, contacts, PDF, desktop and mobile.
5. **Until the backend is deployed,** the UI correctly labels the Hall of Fame as **not connected** and still allows local play. Keep this honest in your submission.

## Part B — deploy the leaderboard backend using AWS CloudShell and SAM

1. Open **AWS CloudShell** in the AWS account/Region where you want the backend. AWS CloudShell includes AWS CLI and SAM CLI; there is no need to install Node.js or configure credentials on your Windows laptop.
2. Clone your **public** project repo in CloudShell; then run the following commands from the cloned repo root:

```bash
sam --version
sam build --template-file aws/template.yaml
sam deploy --guided
```

3. When prompted, set a CloudFormation stack name like `incident-zero-leaderboard`, your desired AWS Region, and the **AllowedOrigin** parameter to the exact deployed Amplify origin, such as `https://main.xxxxx.amplifyapp.com` **without a trailing slash**. Review the IAM role creation prompt and choose to create the roles required by the SAM application, if you approve the permissions.
4. The deploy output provides `HttpApiUrl`. Copy this HTTPS URL. On your computer edit `config.js`:

```js
window.INCIDENT_ZERO_CONFIG = Object.freeze({
  apiBaseUrl: "https://ACTUAL_API_ID.execute-api.ACTUAL_REGION.amazonaws.com"
});
```

5. Commit and push that one change. Amplify should rebuild from GitHub automatically. Open the live `game.html` and check the Hall of Fame indicator changes to **ONLINE** when `/leaderboard` responds.
6. Complete a game, choose a safe public callsign, save a score, and verify that it appears on another device. Validate `/status` and the `SESSION PINGS` value on the homepage.
7. The API CORS policy allows the **one** Amplify domain supplied at deployment. If you switch to a custom domain later, update the `AllowedOrigin` parameter in the SAM stack to match that origin; avoid using wildcard `*` unnecessarily.

## Useful smoke tests

In the browser: `https://YOUR_AMPLIFY_DOMAIN/game.html` → 502 Bad Gateway → type these four commands in sequence:

```text
tail -n 20 error.log
docker ps
fix upstream
curl /health
```

Expected: 4/4 checkpoints, 100/100 score, S rank, and a root-cause/fix/prevention postmortem. Repeat with `hint` and one intentionally wrong command to confirm different scores and ranks.

In CloudShell (optional), with the actual API output replacing placeholder:

```bash
curl -sS 'https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/leaderboard'
curl -sS 'https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/status'
```

**Never use `curl` commands from the game on an actual production system** — they are simulated. `fix upstream`, `fix logs`, `fix env`, `fix certificate` and `fix credentials` are fictional game actions, not real Linux commands.

## Security and integrity notes

- The browser cannot send arbitrary scoring numbers to Lambda: the backend derives scores from a bounded four-step command transcript.
- **This is not cheat-proof:** an anonymous user can fabricate a correct transcript. Treat it as an educational Hall of Fame, not a trusted competition leaderboard.
- Nicknames are limited to ASCII letters, numbers, spaces, underscores, dashes and dots, 2–24 characters. Never ask visitors to submit emails or passwords.
- The frontend uses `textContent` when displaying public nicknames, helping prevent HTML injection. The server has a request size limit and validates all scenario IDs and commands.
- API Gateway uses **account/stage-wide best-effort throttling**, not per-IP fairness; if public abuse becomes a problem, disable public writes or add stronger protection. DynamoDB provisioned throughput offers an extra throughput limit, not a spending guarantee.
- A disconnected, timed-out or rate-limited backend must show **offline**; no fake leaderboard or fake visits. Only local best is saved to this browser's localStorage.
- The `SESSION PINGS` metric counts the visitor browser's best-effort once-per-tab-session POST request, **not unique people** or an authoritative analytics count.
- When capturing AWS screenshots, redact account ID, access keys, session tokens, and any personal or employer secrets.

## Challenge submission steps

1. Attach the GitHub repository URL and Amplify live website URL to the project submission.
2. Capture a laptop hero screenshot, mobile navigation/hero screenshot, at least one terminal command, 6-scenario picker, postmortem, live leaderboard, AWS deployment success view, API Gateway routes, Lambda overview, DynamoDB table overview, and SAM `template.yaml` screenshot. Avoid sensitive account details.
3. Create a 60–90 second walkthrough video showing the site, game, architecture and real AWS deployment.
4. Use the updated `SUBMISSION_TEMPLATE.md`, but replace placeholders with genuine findings, dates, screenshots, build logs and real cost figures. Do not claim a service is deployed or tested if it has not been.
5. Test Lighthouse for mobile and desktop; fix issues before quoting a numeric score. Ask another person to test keyboard-only and phone navigation. Keep the live site available throughout judging.

## Optional teardown / recovery

If you need to stop backend use, you can remove the API URL in `config.js` and push to Amplify (game stays playable). To remove AWS backend resources permanently **after the judging window**, use `sam delete --stack-name incident-zero-leaderboard` with care: this deletes the scoring database too. Do not delete Amplify while the challenge is being judged. Verify resource deletion and remaining costs in Billing.


## V7 publish checks
- Public `resume.pdf` preserves the original format and wording, with only the phone number removed. Employer domains are retained as in the original; review before public release.
- Confirm individual project repositories and replace the `PROJECT REPO · LINK PENDING` labels only with working URLs.
- Once Amplify gives you your **actual** domain, set `meta[property="og:image"]` in `index.html` to `https://YOUR-REAL-AMPLIFY-URL/og-image.png`, then commit/push again.
- Type `about`, `skills`, `projects`, `contact`, `resume`, `certs`, `sudo hire kashfa` in the terminal. All are free exploration commands even for AWS score verification.
- Verify `☀ TODAY'S INCIDENT` and `↝ SURPRISE ME` work. The daily selection uses the visitor's local calendar date, not a backend schedule.

## New V7 game checks

1. At `game.html`, click **HOW I BUILT IT**. Check that it describes proposed/implemented code rather than falsely claiming AWS has already been deployed. Once AWS goes live, verify the leaderboard status really changes to ONLINE.
2. Choose the **AWS IAM ACCESS DENIED** scenario and enter, in order:

```text
aws sts get-caller-identity
aws s3api head-object --bucket demo-assets --key build.json
fix iam
verify iam
```

   Expected: 4/4 checkpoints, 100/100, rank S, and a least-privilege root-cause/fix/prevention postmortem. The bucket and account are fictional; these commands are simulator-only.
3. Click **3-MINUTE CHALLENGE** to start a new incident with a countdown. If the timer expires, practice still works; the Speed Run badge cannot be earned.
4. Complete six different incidents for the **All Six Resolved** badge. Badges are localStorage-only and are not a trusted AWS leaderboard field.
5. After a recovery click **SAVE VICTORY CARD PNG**. Check the downloaded 1200×630 image locally. It can be uploaded manually as a LinkedIn picture; this site does not make posts or create AWS certifications.
6. In the first incident try `docker start api` before following `tail -n 20 error.log`. This safe diagnostic should not subtract points; more serious unsupported actions still affect scoring.
7. Verify `WHAT I LEARNED` lines are visible in all seven project cards on both desktop and phone.
