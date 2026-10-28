# INCIDENT ZERO · From Code to Cloud. Without the Chaos.

An interactive DevOps and Cloud portfolio with **The Night Shift**: six browser-simulated production incidents, real AWS-backed Hall of Fame, ranked postmortems, achievements and a shareable result card.

**Live site:** https://main.d1fva3n4t20z0j.amplifyapp.com  
**Play:** https://main.d1fva3n4t20z0j.amplifyapp.com/game.html  
**Source:** https://github.com/KashfaMuskan329/incident-zero-aws-portfolio

## How it works

```text
GitHub main → AWS Amplify Hosting → Browser (HTML/CSS/JS)
                                          │
                                          ├── Simulated terminal + local score (always playable)
                                          │
                                          └── HTTPS → API Gateway → AWS Lambda → DynamoDB
```

- **Frontend:** static HTML/CSS/JavaScript; custom layered violet interface, floating illustrated engineer and clickable technical skills. No Node.js required to preview the site.
- **Game:** six fictional DevOps incidents: Nginx 502, disk full, expired TLS, bad env variable, broken CI/CD and IAM AccessDenied. Simulated commands are not executed against real infrastructure.
- **Backend:** Amazon API Gateway HTTP API + Python 3.12 Lambda + DynamoDB, deployed by AWS SAM/CloudFormation. Lambda verifies bounded command histories and calculates submitted scores. Anonymous submissions are *not* cheat-proof.
- **Resilience:** the game and local results continue to work if the AWS API is temporarily unavailable. The live leaderboard shows its actual connection status.

## Published project repositories

- [Job Tracker (Nginx/JS + Express + PostgreSQL)](https://github.com/KashfaMuskan329/3-tier-terraform) — AWS/Terraform deployment is a work in progress; [Terraform source](https://github.com/KashfaMuskan329/3-tier-terraform/tree/main/terraform)
- [Jenkins + Docker 3-tier CI/CD on AWS EC2](https://github.com/KashfaMuskan329/3tier-jenkins-cicd-pipeline)
- [Server Control Room (Netdata + Portainer + Python)](https://github.com/KashfaMuskan329/Server-Control-Room)
- [Incident Zero itself](https://github.com/KashfaMuskan329/incident-zero-aws-portfolio)

Softex internship work is described as high-level case studies. Private employer project repositories are not linked.

## Run locally

Download the repository, open `index.html` and click **PLAY THE MISSION**. The local file preview does not require an AWS account or Python. Global ranking is an optional online enhancement and works on the hosted site when the backend is healthy.

## Important files

| Path | Purpose |
|---|---|
| `index.html` | Portfolio landing page |
| `game.html`, `game.js`, `game.css` | Terminal game + leaderboard UI |
| `app.js`, `styles.css`, `v4.css`, `v5.css`, `v8.css` | Portfolio behaviors and design |
| `config.js` | Public HTTPS API base URL, **not** AWS secrets |
| `aws/template.yaml` | SAM/CloudFormation infrastructure |
| `aws/backend/handler.py` | Python API and score validation |
| `aws/tests/test_handler.py` | Backend unit tests |
| `amplify.yml` | Frontend build and static hosting settings |
| `resume.pdf` | Original-format public CV with phone removed; review employer-domain disclosure |
| `SUBMISSION_TEMPLATE.md` | AWS Student Builder submission draft |

## Evidence, costs, and security

The live Amplify site, SAM deployment and global leaderboard displaying saved scores were checked in October 2026. AWS account-wide actual charges are **not yet independently verified**; don't assert `$0` without AWS Billing evidence. Budget alerts are notifications, not a spending cap. Avoid committing access keys, passwords, private employer infrastructure information, or customer data. The public resume includes employer domain references and should be reviewed with the relevant employer before further promotion. For contest evidence, redact AWS account IDs and secrets from screenshots.

This project was built with AI-assisted coding support and manual review/testing; describe AI assistance accurately if the event's rules request it.
