# Incident Zero — live AWS portfolio

**Live portfolio:** https://main.d1fva3n4t20z0j.amplifyapp.com
**Playable game:** https://main.d1fva3n4t20z0j.amplifyapp.com/game.html
**GitHub:** https://github.com/KashfaMuskan329/incident-zero-aws-portfolio

Incident Zero is a DevOps portfolio and six-incident educational terminal simulator. Its public leaderboard is powered by **Amplify Hosting, API Gateway HTTP API, Python Lambda and DynamoDB**, deployed with AWS SAM/CloudFormation in us-east-1. The terminal incidents are fictional; the AWS-backed score board is real. It remains playable if AWS API requests fail.

## Verified public project links

- [Job Tracker: Nginx/JavaScript, Node/Express and PostgreSQL](https://github.com/KashfaMuskan329/3-tier-terraform) — AWS/Terraform deployment is still in progress
- [Terraform configuration for three-tier project](https://github.com/KashfaMuskan329/3-tier-terraform/tree/main/terraform)
- [Jenkins/Docker CI/CD on EC2](https://github.com/KashfaMuskan329/3tier-jenkins-cicd-pipeline)
- [Server Control Room](https://github.com/KashfaMuskan329/Server-Control-Room) — Nginx, Netdata, Portainer and Python alerts
- [Incident Zero source](https://github.com/KashfaMuskan329/incident-zero-aws-portfolio)

## Verified vs. pending

- Live Amplify website, SAM stack and online DynamoDB Hall of Fame have been demonstrated.
- AWS Billing total has **not** been independently verified; never assert $0 costs without checking the console.
- Phone number is removed from the public resume; the PDF still includes employer domains. Review with employer before broader distribution.
- Capture current hero/mobile and AWS console evidence, redact account IDs and credentials, and test keyboard navigation before hackathon submission.

---

# INCIDENT ZERO V7 — Kashfa Muskan's playable DevOps portfolio

Original entry for AWS Student Builder Challenge 2026.

**Frontend:** plain HTML, CSS and JavaScript; no Node.js required. Premium pearl-white/lavender portfolio, floating orbital AWS/Azure/Terraform/Jenkins/Docker skills, custom cursor, case studies, resume, contact links.

**Two game modes:**
- **Quick mission:** the existing four-stage multiple-choice 502 debugging mini-game (randomized choices + differentiated rank endings).
- **The Night Shift / advanced mode:** `game.html` contains a real typed-command sandbox, six fictional incidents (502 upstream / disk full / SSL expiry / environment variable / CI pipeline / AWS IAM AccessDenied), hints, recovery and postmortem, an interactive real AWS architecture inspector, light/dark game toggle and global Hall of Fame connection.

**Optional AWS:** AWS Amplify Hosting for static deployment, API Gateway HTTP API for leaderboard routes, Python AWS Lambda for validation and scoring, DynamoDB for leaderboard entries/session pings. Defined in an AWS SAM/CloudFormation template under `aws/`. Uses strict CORS origin, public input validation, best-effort API throttling and limited DynamoDB provisioned capacity. No secrets inside the client.

## Play it now

Double-click `index.html` after extracting the ZIP. Select **PLAY THE MISSION** to open `game.html`; type `help` in the terminal. The game works even without a backend. Scores can be kept locally. Global Hall of Fame becomes functional **only after real AWS deployment**. Do not describe it as deployed before that.

## Repository files

| File | Purpose |
|---|---|
| `index.html`, `styles.css`, `v4.css`, `v5.css`, `app.js` | Responsive portfolio + existing mini-game |
| `game.html`, `game.css`, `game.js` | Advanced interactive incident-response game |
| `config.js`, `status.js`, `site-meta.json` | Optional API configuration and truthful deployment badges |
| `aws/template.yaml` | AWS SAM/CloudFormation API/Lambda/DynamoDB deployment |
| `aws/backend/handler.py` | Python Lambda backend |
| `aws/tests/test_handler.py` | Backend unit tests |
| `amplify.yml` | Static Amplify Hosting build + build timestamp generation |
| `resume.pdf` | Original resume layout preserved; only the phone number removed; review before publishing |
| `og-image.png` | Social preview image |
| `DEPLOY_GUIDE.md` | Step-by-step AWS setup and safety notes |
| `SUBMISSION_TEMPLATE.md` | Competition submission draft |

## What has actually been verified?

- JavaScript syntax checks passed; Python score validation and handler tests passed.
- Headless browser simulation confirmed advanced terminal end-to-end (6 scenarios available, all six completed at 100 points, offline fallback, badges, PNG victory card, optional timer) and clickable architecture inspector. Tests used inline content because local file navigation was blocked by environment policy.
- AWS deployment and real online leaderboard verification **have not been performed**; `apiBaseUrl` is intentionally empty until a valid backend exists.
- Direct repository URLs for personal project cards have not yet been supplied. Unverified repo links are labeled PENDING rather than inventing repository addresses; verify before submission.

**Privacy:** `resume.pdf` retains the original resume design and content except the phone number. It still includes employer domains; review before publishing. Be honest about training projects, AWS usage, simulated data and AI assistance per the official challenge rules.

**Detailed instructions:** read [`DEPLOY_GUIDE.md`](DEPLOY_GUIDE.md).


## V6 night-to-morning update

- Narrative dark-violet hero -> pearl-white below, live *story* clock (not real local time), reduced 8 orbit bubbles to address overlap.
- Game ends in sunrise with real score-dependent rank and root-cause/fix/prevention.
- Terminal portfolio commands: `about`, `skills`, `projects`, `contact`, `resume`, `certs`, and hidden `sudo hire kashfa`. These are **simulation commands**, never actual shell.
- `resume.pdf` is the original resume, with its layout and content preserved except for the phone number. It includes employer domains and project descriptions, so review them before public release. The unedited original resume is **not** included.
- Existing project-specific public repo URLs have not been verified. Do **not** replace pending labels with guessed links. The direct portfolio architecture demo link works.
- `og:image` deliberately remains relative for local preview; **edit it to the actual absolute Amplify URL after deploying**, since external crawlers need an absolute URL.
- The site is not deployed; no backend / cost / deployment badges may be presented as real until verified.

## V7 interactive challenge expansion

- **How I built it** section on `game.html` explains the browser simulator, API Gateway HTTP API, Python Lambda score verifier and DynamoDB. Clearly marked pending until actual AWS deployment.
- **Downloadable victory card:** after completing an incident, choose `SAVE VICTORY CARD PNG` to generate a 1200 × 630 image containing the scenario, score, rank and educational-simulation notice. Upload it manually on LinkedIn; the site cannot post on your behalf.
- **Five local achievements:** First Responder, No Hints Used, All Six Resolved, Speed Run, Perfect Response. Stored locally in the visitor's browser; not server-trusted.
- **Sixth AWS incident:** IAM AccessDenied, showing how to identify the deploy role and restore *scoped read permission* rather than broadening IAM privileges. All actions and AWS account numbers inside the game are fictional.
- **3-minute time trial:** opt-in toggle; it starts a fresh scenario and grants Speed Run for a timely completion. When time runs out, the game continues in practice mode. No server leaderboard claims for timed records.
- **Diagnostic commands:** recognized useful checks, including `docker start api` and other diagnostics, give informative feedback rather than automatically losing points. Server-side transcript verification mirrors this policy. Fictional fix actions still need the correct checkpoint.
- **Project learning notes:** seven project cards have a visible `WHAT I LEARNED` explanation.

### Local verification (V7)

- `AWS_DEFAULT_REGION=us-east-1 python -m unittest discover -s aws/tests -v` → **12 tests passed**.
- `node --check game.js` and `node --check app.js` → passed.
- Browser test with injected local sources (because direct file/localhost navigation is blocked by the testing environment) → all 6 incidents finished with 100/100, including a non-penalized useful diagnostic, 5 badges after a completed time trial, working PNG download, no JavaScript page errors, no horizontal overflow at 390px, and 7 project learning notes.
- Not yet verified in your own Chrome/phone or on deployed AWS, so local preview and live integration testing are still required.
