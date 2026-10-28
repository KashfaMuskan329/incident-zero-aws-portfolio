# AWS Student Builder Challenge — Incident Zero

**Project:** Incident Zero — From Code to Cloud. Without the Chaos.  
**Creator:** Kashfa Muskan  
**Live portfolio:** https://main.d1fva3n4t20z0j.amplifyapp.com  
**Playable game:** https://main.d1fva3n4t20z0j.amplifyapp.com/game.html  
**GitHub:** https://github.com/KashfaMuskan329/incident-zero-aws-portfolio

## Why I built it

I wanted my DevOps portfolio to demonstrate how I think when infrastructure fails, not just list technologies. I built an interactive portfolio around the moment every on-call engineer recognizes: a 3 AM production alert.

## Creative feature — The Night Shift

Visitors become the incident responder in six fictional scenarios: Nginx 502 upstream failures, disk exhaustion, expired TLS, missing environment configuration, failing CI/CD pipelines and AWS IAM AccessDenied. They type commands in a simulated terminal, read clues, recover systems and unlock a root-cause/fix/prevention postmortem. A time trial, achievement badges and downloadable victory card make the game replayable. All commands and systems in the incidents are simulations — no production server is affected.

## What runs on real AWS

The public portfolio is hosted over HTTPS using **AWS Amplify Hosting** connected to GitHub. The real Hall of Fame uses an **Amazon API Gateway HTTP API**, **AWS Lambda (Python 3.12)** and **Amazon DynamoDB**, deployed using **AWS SAM and CloudFormation** in us-east-1. The API validates player callsigns and bounded game transcripts; Lambda recalculates the score rather than trusting a browser-supplied score. An anonymous leaderboard is not fully cheat-proof. The experience degrades gracefully: if the backend becomes unavailable, the game and local results keep working.

## My engineering decisions

I used a lightweight static frontend without a continuously running server, limited API throughput, configured a specific browser CORS origin, avoided frontend secrets and kept gameplay independent of the online service. AWS usage and actual costs will be reported from Billing rather than estimated as zero.

## Challenges and learning

1. **CloudShell verification issue:** AWS CloudShell could not create an environment while my AWS account verification was processing. I switched to locally installed AWS CLI and SAM CLI.
2. **Frontend/API integration:** I tested the `/leaderboard` endpoint, confirmed its successful JSON response and allowed-origin CORS header, and committed the deployed API URL to the public frontend config.
3. **Reliable UX:** I kept the simulated terminal operational when the AWS backend is offline, so visitors can always finish an incident.
4. **Honest documentation:** The portfolio distinguishes simulated commands and graphics from deployed AWS infrastructure and real leaderboard data.

## Screenshots to attach to Your Project

- **01 · Portfolio hero:** Illustrated engineer and orbiting AWS/Azure/DevOps skills on the LIVE website. *(Capture current desktop screenshot.)*
- **02 · The Night Shift:** Browser terminal showing one incident and a typed diagnostic command. *(Capture live game.)*
- **03 · Resolution/postmortem:** Root cause, fix, prevention and scored result. *(Capture live game completion.)*
- **04 · Global Hall of Fame:** Saved player scores and ONLINE indicator. *(Evidence already captured; update if desired.)*
- **05 · AWS deployment proof:** Amplify main branch **Deployed** view and website URL. *(Capture Console, redact identifying information.)*
- **06 · Backend proof:** CloudFormation stack success, Lambda function, API Gateway HTTP API routes and DynamoDB leaderboard table. *(Capture console screenshots, redact account identifiers.)*
- **07 · Architecture:** GitHub → Amplify → Browser; Browser → API Gateway → Lambda → DynamoDB; local fallback on failure. *(Use architecture image from submission assets.)*

**Real AWS cost:** [Insert amount and as-of date copied from AWS Billing; do not invent.]  
**Deployment region:** us-east-1  
**AI assistance:** Used for implementation support; adapted, reviewed and tested by the creator. Adjust wording to reflect actual process and challenge rules.

## Final verification

Confirm that every screenshot matches the current live website, links are correct, public resume/employer content is approved, mobile navigation and terminal are usable, AWS Budget alerts are configured, and the public site stays accessible through judging.
