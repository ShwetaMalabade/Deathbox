#!/bin/bash
set -e

echo "============================================"
echo "  DeathBox — Full Server Deployment Script"
echo "============================================"
echo ""

# ── Required deployment secrets/config ───────────
DEPLOY_DOMAIN="${DEPLOY_DOMAIN:-deathbox.108.61.157.223.nip.io}"

if [ -z "${DEPLOY_GEMINI_API_KEY:-}" ]; then
    echo "ERROR: DEPLOY_GEMINI_API_KEY is not set."
    echo "Set it before running deploy.sh."
    exit 1
fi

if [ -z "${DEPLOY_ELEVENLABS_API_KEY:-}" ]; then
    echo "ERROR: DEPLOY_ELEVENLABS_API_KEY is not set."
    echo "Set it before running deploy.sh."
    exit 1
fi

if [ -z "${DEPLOY_ELEVENLABS_VOICE_ID:-}" ]; then
    echo "ERROR: DEPLOY_ELEVENLABS_VOICE_ID is not set."
    echo "Set it before running deploy.sh."
    exit 1
fi

# ── 1. System packages ──────────────────────────
echo "[1/9] Installing system packages..."
apt-get update -qq
apt-get install -y -qq nginx certbot python3-certbot-nginx python3-venv python3-pip git curl > /dev/null 2>&1
echo "  ✓ System packages installed"

# ── 2. Install Node.js 20 ───────────────────────
echo "[2/9] Installing Node.js 20..."
if ! command -v node &> /dev/null || [[ $(node -v | cut -d. -f1 | tr -d v) -lt 18 ]]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
    apt-get install -y -qq nodejs > /dev/null 2>&1
fi
echo "  ✓ Node.js $(node -v) installed"

# ── 3. Clone / update repo ──────────────────────
echo "[3/9] Setting up application code..."
mkdir -p /var/www
if [ -d "/var/www/deathbox/.git" ]; then
    echo "  Repo exists, pulling latest..."
    cd /var/www/deathbox
    git fetch origin
    git reset --hard origin/main
else
    echo "  Cloning fresh..."
    rm -rf /var/www/deathbox
    git clone https://github.com/ShwetaMalabade/Deathbox.git /var/www/deathbox
fi
echo "  ✓ Code ready at /var/www/deathbox"

# ── 4. Backend setup ────────────────────────────
echo "[4/9] Setting up backend..."
cd /var/www/deathbox/backend

python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q

cat > .env << ENVEOF
GEMINI_API_KEY=${DEPLOY_GEMINI_API_KEY}
ELEVENLABS_API_KEY=${DEPLOY_ELEVENLABS_API_KEY}
ELEVENLABS_VOICE_ID=${DEPLOY_ELEVENLABS_VOICE_ID}
FRONTEND_ORIGINS=https://${DEPLOY_DOMAIN}
HOST=0.0.0.0
PORT=8000
ENVEOF

deactivate
echo "  ✓ Backend configured"

# ── 5. Frontend setup ───────────────────────────
echo "[5/9] Setting up frontend (this takes a few minutes)..."
cd /var/www/deathbox/frontend

cat > .env.local << ENVEOF
NEXT_PUBLIC_BACKEND_URL=https://${DEPLOY_DOMAIN}
NEXT_PUBLIC_ELEVENLABS_API_KEY=${DEPLOY_ELEVENLABS_API_KEY}
ENVEOF

npm install --legacy-peer-deps 2>&1 | tail -1
npm run build 2>&1 | tail -3
echo "  ✓ Frontend built"

# ── 6. Systemd services ─────────────────────────
echo "[6/9] Creating systemd services..."

cat > /etc/systemd/system/deathbox-backend.service << 'SVCEOF'
[Unit]
Description=DeathBox Backend (FastAPI)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/deathbox/backend
ExecStart=/var/www/deathbox/backend/.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=5
Environment=PATH=/var/www/deathbox/backend/.venv/bin:/usr/bin:/bin

[Install]
WantedBy=multi-user.target
SVCEOF

cat > /etc/systemd/system/deathbox-frontend.service << 'SVCEOF'
[Unit]
Description=DeathBox Frontend (Next.js)
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/deathbox/frontend
ExecStart=/usr/bin/npm run start -- --port 3000
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
SVCEOF

systemctl daemon-reload
systemctl enable deathbox-backend deathbox-frontend
systemctl restart deathbox-backend
systemctl restart deathbox-frontend
sleep 3
echo "  ✓ Services created and started"

# ── 7. Nginx config ─────────────────────────────
echo "[7/9] Configuring Nginx..."

cat > /etc/nginx/sites-available/deathbox << 'NGXEOF'
server {
    listen 80;
    server_name __DEPLOY_DOMAIN__;

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
        client_max_body_size 25M;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGXEOF

sed -i "s/__DEPLOY_DOMAIN__/${DEPLOY_DOMAIN}/g" /etc/nginx/sites-available/deathbox

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/deathbox /etc/nginx/sites-enabled/deathbox
nginx -t
systemctl restart nginx
echo "  ✓ Nginx configured"

# ── 8. Firewall ─────────────────────────────────
echo "[8/9] Configuring firewall..."
ufw allow OpenSSH > /dev/null 2>&1
ufw allow 'Nginx Full' > /dev/null 2>&1
echo "y" | ufw enable > /dev/null 2>&1
echo "  ✓ Firewall configured"

# ── 9. HTTPS with Certbot ───────────────────────
echo "[9/9] Setting up HTTPS..."
certbot --nginx -d "${DEPLOY_DOMAIN}" --non-interactive --agree-tos --register-unsafely-without-email || {
    echo "  ⚠ Certbot failed (nip.io rate-limit or DNS issue)."
    echo "    The site will work on HTTP for now."
    echo "    Retry later: certbot --nginx -d ${DEPLOY_DOMAIN}"
}
echo "  ✓ HTTPS setup attempted"

# ── Verify ──────────────────────────────────────
echo ""
echo "============================================"
echo "  Deployment Complete! Verifying..."
echo "============================================"
echo ""

sleep 2

echo "Backend status:"
systemctl is-active deathbox-backend && echo "  ✓ Backend is running" || echo "  ✗ Backend failed"
echo ""

echo "Frontend status:"
systemctl is-active deathbox-frontend && echo "  ✓ Frontend is running" || echo "  ✗ Frontend failed"
echo ""

echo "Backend health check:"
curl -s http://127.0.0.1:8000/api/health 2>/dev/null && echo "" || echo "  ✗ Backend not responding yet (may need a moment)"
echo ""

echo "============================================"
echo "  Your site should be live at:"
echo "  https://${DEPLOY_DOMAIN}"
echo ""
echo "  If HTTPS failed, use HTTP temporarily:"
echo "  http://${DEPLOY_DOMAIN}"
echo "============================================"
