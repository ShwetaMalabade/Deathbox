# Phase 7 — Deployment (Vultr)

## Status
✅ Implemented (deployment package + smoke test ready)

---

## 1) What this phase does

Phase 7 packages the backend for real server deployment:

- Production environment template
- systemd service template
- nginx reverse proxy template
- Deployment-readiness and smoke-test script

This phase focuses on **operational readiness** so your demo can run reliably on Vultr.

---

## 2) Implementations added in this phase

### A) Production env template

Added: `.env.production.example`

Includes:

- `GEMINI_API_KEY`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`
- `FRONTEND_ORIGINS`
- `HOST`
- `PORT`

### B) systemd service template

Added: `deploy/systemd/deathbox.service`

Use this to keep backend running after reboot/crash.

### C) nginx template

Added: `deploy/nginx/deathbox.conf`

Reverse-proxies port 80 -> backend on `127.0.0.1:8000`.

### D) Deployment checks script

Added: `test_phase7_deployment.py`

It does two things:

1. Local artifact checks (required deployment files exist)
2. Optional remote smoke test if `DEPLOY_BASE_URL` is set

---

## 3) Vultr deployment steps (recommended)

## 3.1 Provision server

- Create Vultr Cloud Compute VM (Ubuntu 22.04)
- Open ports 22 and 80 in firewall/security group

## 3.2 Install runtime

```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip nginx
```

## 3.2.1 Export deploy secrets (required)

`deploy.sh` now reads keys from shell environment variables (no hardcoded secrets):

```bash
export DEPLOY_GEMINI_API_KEY="your_real_gemini_key"
export DEPLOY_ELEVENLABS_API_KEY="your_real_elevenlabs_key"
export DEPLOY_ELEVENLABS_VOICE_ID="your_real_voice_id"
export DEPLOY_DOMAIN="your-domain-or-nip-io-host"
```

## 3.3 Copy project to server

```bash
# Example path
/home/ubuntu/deathbox/backend
```

Then run deployment:

```bash
cd /home/ubuntu/deathbox
sudo -E bash deploy.sh
```

## 3.4 Setup backend env + deps

```bash
cd /home/ubuntu/deathbox/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.production.example .env
# edit .env with real keys/origins
```

## 3.5 Configure systemd service

```bash
sudo cp deploy/systemd/deathbox.service /etc/systemd/system/deathbox.service
sudo systemctl daemon-reload
sudo systemctl enable deathbox
sudo systemctl start deathbox
sudo systemctl status deathbox --no-pager
```

## 3.6 Configure nginx

```bash
sudo cp deploy/nginx/deathbox.conf /etc/nginx/sites-available/deathbox
sudo ln -sf /etc/nginx/sites-available/deathbox /etc/nginx/sites-enabled/deathbox
sudo nginx -t
sudo systemctl restart nginx
```

---

## 4) How to test this phase

### A) Local artifact test

```bash
cd /Users/dharmpatel/Desktop/hackhers/Deathbox/backend
source .venv/bin/activate
python test_phase7_deployment.py
```

Expected:

- PASS for all required artifact files
- smoke test skipped if `DEPLOY_BASE_URL` not set

### B) Remote smoke test (after deployment)

```bash
cd /Users/dharmpatel/Desktop/hackhers/Deathbox/backend
source .venv/bin/activate
DEPLOY_BASE_URL=http://<your-vultr-ip> python test_phase7_deployment.py
```

Expected: PASS for

- `GET /`
- `GET /api/health`
- `GET /api/integration-status`
- `GET /api/frontend-contract`

---

## 5) Remaining work after Phase 7

1. Switch Solana from placeholder to real Devnet write (`solana_service.py`)
2. (Optional) Add HTTPS with Certbot on nginx
3. (Optional) Add CI/CD deploy workflow

---

## 6) Summary

Phase 7 now provides a deployment-ready backend package:

- production env template
- Linux service template
- nginx config template
- post-deploy smoke-test tooling

Your team can deploy to Vultr and verify health/contracts quickly using one command.
