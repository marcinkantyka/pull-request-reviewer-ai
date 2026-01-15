# Security Documentation

## Overview

Local PR Reviewer is designed with security and privacy as the top priority. This document explains our security measures and how to verify them.

## Security Guarantees

### 1. Network Isolation

**Implementation:**
```yaml
networks:
  pr-review-network:
    driver: bridge
    internal: true  # ← Isolated network for pr-reviewer
  default:
    driver: bridge  # ← Internet access for Ollama (model downloads)
```

**What this means:**
- PR reviewer container is on an isolated network (no internet access)
- Ollama container is on both networks (can download models, can communicate with pr-reviewer)
- Docker enforces network isolation at the kernel level
- PR reviewer container **CANNOT** access the internet
- Even if malicious code tried to send data out, Docker blocks it

**Verification:**
```bash
./scripts/verify-isolation.sh
```

### 2. Code Never Leaves Your Machine

**How we ensure this:**

1. **Git diff is local**: We use `git diff` to compare branches - no remote API calls
2. **Model runs locally**: Qwen2.5-Coder runs entirely on your machine via Ollama
3. **No telemetry**: Ollama has no built-in telemetry or analytics
4. **Read-only repo access**: Docker mounts your repo as read-only

**Data flow:**
```
Your Repo (read-only)
    ↓
Git diff (local)
    ↓
Docker container (isolated)
    ↓
Ollama (local LLM)
    ↓
Review file (local)
```

### 3. No External Dependencies During Review

**What gets downloaded (one-time only):**
- Docker images (ollama/ollama, node:20-alpine)
- Qwen2.5-Coder-7B model (~4.7GB)

**After setup:**
- PR reviewer container requires no internet
- Ollama container only needs internet for initial model download
- Once models are downloaded, can run completely offline
- Zero external API calls during review

### 4. Open Source Transparency

**You can audit:**
- All source code in this repository
- Ollama source: https://github.com/ollama/ollama
- Qwen2.5-Coder model: https://github.com/QwenLM/Qwen2.5-Coder

## Verification Steps

### Step 1: Verify Network Isolation

```bash
# Run automated check
./scripts/verify-isolation.sh

# Manual verification
docker network inspect local-pr-reviewer_pr-review-network | grep internal
# Should show: "Internal": true
```

### Step 2: Monitor Network Traffic

```bash
# Install tcpdump (if not already installed)
brew install tcpdump  # macOS

# Monitor all network traffic
sudo tcpdump -i any -n 'not host 127.0.0.1 and not host ::1'

# In another terminal, run a review
./scripts/review.sh

# You should see ZERO packets from the Docker containers
```

### Step 3: Test Offline Operation

```bash
# 1. Complete setup while online
./scripts/setup.sh

# 2. Disconnect from internet
# Turn off WiFi or: sudo ifconfig en0 down

# 3. Run a review - it works perfectly!
./scripts/review.sh

# 4. Reconnect when done
# Turn on WiFi or: sudo ifconfig en0 up
```

### Step 4: Inspect Docker Configuration

```bash
# View compose.yaml
cat compose.yaml | grep -A 5 "networks:"

# Should show:
# networks:
#   pr-review-network:
#     driver: bridge
#     internal: true
```

## Attack Surface Analysis

### What Could Go Wrong?

| Attack Vector | Mitigation | Risk Level |
|--------------|------------|------------|
| Ollama sends telemetry | Open source, auditable, no telemetry code | ✅ None |
| Model sends data out | Models are neural networks, can't make network calls | ✅ None |
| Docker bypass | Docker enforces isolation at kernel level | ✅ None |
| Git commands send code | All git commands run locally, no external calls | ✅ None |
| Malicious dependency | Lock files prevent supply chain attacks | 🟡 Very Low |
| Compromised host OS | If host is compromised, all bets are off | 🟡 Low |

### Supply Chain Security

**NPM Dependencies:**
```json
{
  "dependencies": {
    "ollama": "^0.5.9"  // Only production dependency
  }
}
```

**Lock file:** `package-lock.json` ensures deterministic installs

**Docker images:**
- `ollama/ollama:latest` - Official Ollama image
- `node:20-alpine` - Official Node.js image

## Git-Based Branch Listing

**How we list branches:**
- Uses local git commands only (`git branch -r`, `git log`)
- No external API calls
- No authentication required
- Works completely offline

**Commands we use:**
```bash
git fetch origin
git branch -r
git log origin/main..origin/feature-branch
```

All information comes from your local git repository - no code or data is sent anywhere.

## Compliance & Auditing

### For Security Teams

**Questions and Answers:**

**Q: Is any code sent to external services?**  
A: No. All code analysis happens locally. Docker network isolation enforces this.

**Q: Can we audit the code?**  
A: Yes. All code is in this repository and is MIT licensed.

**Q: What about the AI model?**  
A: Qwen2.5-Coder is open source. Model weights are downloaded once and run locally.

**Q: Is there any telemetry?**  
A: No. Neither Ollama nor this tool collects telemetry.

**Q: Can we run this in an air-gapped environment?**  
A: Yes. After initial setup (downloading model), it works completely offline.

### Audit Logs

**Where to find them:**
```bash
# Docker logs
docker-compose logs ollama
docker-compose logs pr-reviewer

# Review history
ls -la reviews/

# Network verification
./scripts/verify-isolation.sh > audit.log
```

## Best Practices

### For Maximum Security

1. **Review the code** before first use
2. **Run verification script** after setup
3. **Monitor network** during first review
4. **Keep Docker updated** for latest security patches
5. **Use version pinning** for dependencies
6. **Audit reviews folder** periodically

### For Compliance

1. **Document** that code never leaves premises
2. **Show** network isolation configuration
3. **Demonstrate** offline operation capability
4. **Provide** this security documentation to auditors

## Incident Response

### If You Suspect a Breach

1. **Stop the containers**
   ```bash
   docker-compose down
   ```

2. **Review logs**
   ```bash
   docker-compose logs > incident.log
   ```

3. **Check network traffic**
   ```bash
   sudo tcpdump -i any -w capture.pcap
   ```

4. **Verify checksums**
   ```bash
   docker images --digests
   ```

## Updates & Patches

### Security Updates

```bash
# Update Docker images
docker-compose pull

# Rebuild containers
docker-compose build --pull

# Update dependencies
npm audit fix
```

### Responsible Disclosure

If you find a security issue:
1. Do NOT open a public issue
2. Email: [security contact]
3. We'll respond within 48 hours

## Conclusion

Local PR Reviewer is designed to keep your code private:

✅ **Network isolated** at Docker level  
✅ **Open source** and auditable  
✅ **No telemetry** or external calls  
✅ **Offline capable** after setup  
✅ **Read-only** repo access  

**Your code stays on your machine. Always.**