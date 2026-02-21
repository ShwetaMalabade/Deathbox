# 💀 DeathBox — The Financial Afterlife Kit

> So your family never has to guess what you left behind.

DeathBox is an AI-powered financial afterlife organizer that helps users securely record, structure, and store their financial information while alive — and automatically delivers a clear, guided “Afterlife Package” to their family when needed.

Built for FinTech, AI, and Social Good hackathons, DeathBox ensures families never lose access to critical financial information during times of grief.

---

#  Problem

When someone dies, families often have **no idea**:

- What bank accounts exist  
- Where life insurance policies are stored  
- How to access 401k or employer benefits  
- What debts or subscriptions are active  
- Whether unused PTO or insurance benefits exist  

Families spend months just locating information.  
Meanwhile:
- Life insurance goes unclaimed  
- COBRA deadlines pass  
- Benefits are lost  
- Subscriptions keep charging  

**DeathBox prevents this.**

---

#  Solution

DeathBox allows users to record their financial life through simple voice or text conversations.

The system:
1. Extracts structured financial data using AI  
2. Detects missing benefits and risks  
3. Stores encrypted data securely  
4. Creates an organized “Afterlife Package”  
5. Releases it automatically via a dead-man’s switch  

Families receive:
- Urgent action checklist  
- Benefits & insurance details  
- Debt guidance  
- Subscription cancellation list  
- AI voice walkthrough  

---

#  Key Features

###  Voice-based financial recording
Users talk naturally about finances instead of filling complex forms.

###  AI financial extraction
AI converts messy conversations into structured financial records.

###  Benefits gap detection
Detects missing:
- Beneficiaries  
- Life insurance details  
- Employer benefits  
- PTO payouts  
- COBRA eligibility  

###  Blockchain verification
Stores tamper-proof hash of package for authenticity.

###  Dead Man’s Switch
If user doesn’t check in → package released to designated person.

###  AI voice walkthrough
Family receives guided narration explaining what to do first.

---

#  Tech Stack

**Frontend**
- HTML/CSS/JavaScript or React

**Backend**
- FastAPI / Node.js  
- Secure encrypted storage  
- Check-in timer system  

**AI & APIs**
- Gemini API → data extraction & insights  
- ElevenLabs → speech-to-text + narration  

**Blockchain**
- Solana → hash verification  

**Cloud**
- Vultr / any cloud VM  

---

#  How It Works

## Phase 1: While user is alive
1. User speaks or types financial info  
2. AI extracts structured data  
3. Missing benefits flagged  
4. User confirms details  
5. Data encrypted & stored  
6. Hash stored on blockchain  
7. Check-in timer starts  

## Phase 2: After inactivity/death
1. Check-in not detected  
2. Family receives secure link  
3. Afterlife package unlocked  
4. AI voice guides them  
5. Blockchain verifies authenticity  

---

#  Hackathon Tracks

**Primary:** FinTech  
**Secondary:** Social Good  
**Also fits:** AI Agents / Automation  

---

#  Sponsor Alignment

**ADP**  
Built around payroll & employee benefits organization.

**Gemini API**  
AI extraction, gap detection, and family guidance.

**ElevenLabs**  
Voice input and AI narration.

**Solana**  
Tamper-proof verification layer.

**Vultr**  
Cloud deployment.

---

#  Installation

## Clone repository
git clone https://github.com/yourusername/deathbox.git  
cd deathbox

## Backend setup (Python example)
cd backend  
pip install -r requirements.txt  
uvicorn main:app --reload  

## Frontend
Open index.html  
or run:  
npm install  
npm run dev  

---

#  Environment Variables

Create a .env file:

GEMINI_API_KEY=your_key  
ELEVENLABS_API_KEY=your_key  
SOLANA_RPC=https://api.devnet.solana.com  

---

#  Future Improvements

- Real payroll/benefits integrations  
- Secure document upload  
- Voice cloning for emotional delivery  
- Legal will integration  
- Mobile app  
- Multi-family dashboards  

---

#  Team

Soumya Vajahhala
Shweta Malabade
Dharm Maheshkumar Patel
Herik Patel

---

#  License

MIT License
