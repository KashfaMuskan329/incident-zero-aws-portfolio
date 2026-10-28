# INCIDENT ZERO: The DevOps Portfolio You Can Play

**Developer:** Kashfa Muskan  
**Competition:** AWS Student Builder Challenge 2026  
**GitHub:** [PASTE PUBLIC REPO URL]  
**Live AWS Amplify website:** [PASTE REAL LIVE URL]  
**Demo video:** [LINK AFTER RECORDING]

## Project story

I wanted my portfolio to show **how I solve problems**, not just list tools. INCIDENT ZERO combines my real cloud and DevOps learning journey with a playful interactive terminal called **The Night Shift**. The design begins with an animated skill galaxy and expands into a safe, fictional on-call simulation where visitors troubleshoot real-world types of problems without touching production infrastructure.

## Creative feature

The Night Shift contains **six** replayable simulated incidents: Nginx 502 upstream failure, full disk, expired SSL certificate, missing environment variable, CI/CD deployment failure and AWS IAM AccessDenied. Visitors type commands (for example, `docker ps`, `tail -n 20 error.log`, `df -h`, `pipeline logs`) into a mocked terminal; only recognized evidence-gathering and recovery actions advance the incident. Hints and mistakes affect a score and rank, and each resolution ends with a transparent **Root cause / Fix / Prevention** postmortem. Visitors can also inspect a clickable diagram of the intended website architecture, read the built-in How I Built It explainer, play an optional 3-minute time trial, unlock locally stored achievements, and generate a 1200×630 victory card to share. All shell and AWS outputs in the game are simulated.

## AWS services (fill in ONLY when deployed)

- **AWS Amplify Hosting:** static site deployed from GitHub, HTTPS, globally served frontend. Deployment date: [actual date]
- **Amazon API Gateway HTTP API:** route throttling and CORS for scoreboard/status endpoints. [deployment evidence]
- **AWS Lambda (Python):** input validation and recomputation of game scores from command traces. [logs or screenshot]
- **Amazon DynamoDB:** global top-10 scores and session-ping count. [table screenshot]
- **AWS CloudWatch:** default Lambda logs and metrics for troubleshooting. [if inspected]
- **AWS Budgets:** spending alerts configured. [screenshot if configured]
- **AWS SAM / CloudFormation:** versioned infrastructure definitions. [template screenshot]

Do not list a resource as **actually used** if it wasn't deployed. The site still plays offline and accurately marks the leaderboard as unconnected until then.

## Architecture

```text
GitHub ──push──> AWS Amplify Hosting ──managed CDN──> Visitor browser
                                                     │
                                    GET scores / POST score
                                                     ▼
                                              API Gateway HTTP API
                                                     │
                                                   Lambda
                                                     │
                                                  DynamoDB
```

## Learning / challenges (complete from your own experience)

- Why I selected a static frontend and an optional serverless leaderboard: [your answer]
- Challenge 1: [describe a real bug encountered and fixed]
- Challenge 2: [describe an actual AWS setup or CORS issue you resolved]
- Graceful degradation test: [browser offline test and result]
- Server-score validation test: [unit test or screen capture]
- Real AWS cost for the judging period: [actual billing amount, not an estimate]
- What I would do differently next: [your answer]

## Screenshots / proof (redact account ID and secrets)

1. Desktop hero: animated skills and globe — [paste]
2. Mobile responsive hero and nav — [paste]
3. Terminal: selected scenario + evidence-gathering output — [paste]
4. Postmortem with actual score and rank — [paste]
5. Architecture explorer expanded on Lambda or DynamoDB — [paste]
5a. “How I built it” diagram/explainer — [paste]
5b. 6th IAM AccessDenied incident, achievements and downloadable victory card — [paste]
6. Online Hall of Fame: real stored scores — [paste after backend works]
7. Amplify successful deploy + live URL — [paste]
8. API Gateway routes + Lambda + DynamoDB service screenshots — [paste after deployed]
9. GitHub repository structure and AWS SAM template — [paste]

## Closing reflection

[Write your own 120–180 words about what you learned and what you found difficult. Review any hackathon policy on use and disclosure of AI-assisted coding and be transparent.]

## Before submission

- [ ] Repo public, with an original published-first-time portfolio
- [ ] Original challenge project entry created and links verified
- [ ] Amplify accessible through judging period; mobile and keyboard tested
- [ ] Live scoreboard only claimed if API and DynamoDB actually work
- [ ] Build date and real service count verified
- [ ] Demo video recorded and screenshots annotated
- [ ] Contact info and resume reviewed for public sharing
- [ ] Browser Lighthouse measured and improved (don't invent 90+)
