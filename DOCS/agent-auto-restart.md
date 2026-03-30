# Agent Auto-Restart System

## Overview

Automated system to detect and restart Paperclip agents that enter error states.

## Components

### 1. Health Monitor Script (`scripts/agent-health-monitor.sh`)

Checks all agents in the company for error or paused states.

**Usage:**

```bash
./scripts/agent-health-monitor.sh
```

**Output:**

- Lists all agents in error/paused state
- Exit code 0: All agents healthy
- Exit code 1: One or more agents in error state

### 2. Auto-Restart Script (`scripts/agent-auto-restart.sh`)

Attempts to restart all agents currently in error state by patching their status to "running".

**Usage:**

```bash
./scripts/agent-auto-restart.sh
```

**Output:**

- Lists each agent being restarted
- Shows success/failure for each restart attempt

## Deployment Options

### Option 1: Cron Job (Recommended)

Add to crontab to run every 5 minutes:

```bash
*/5 * * * * cd /home/claw/.paperclip/instances/default/projects/c7ecff56-aed4-4103-bb75-af2b584b06a4/a8c3a85f-2c69-45cb-a8e0-7dbb21faf9b9/Omni && PAPERCLIP_API_KEY=$PAPERCLIP_API_KEY PAPERCLIP_COMPANY_ID=$PAPERCLIP_COMPANY_ID ./scripts/agent-auto-restart.sh >> /var/log/agent-restart.log 2>&1
```

### Option 2: Systemd Service

Create `/etc/systemd/system/agent-health-monitor.service`:

```ini
[Unit]
Description=Paperclip Agent Health Monitor
After=network.target

[Service]
Type=oneshot
Environment="PAPERCLIP_API_KEY=your-key"
Environment="PAPERCLIP_COMPANY_ID=your-company-id"
Environment="PAPERCLIP_API_URL=http://localhost:3000"
WorkingDirectory=/path/to/Omni
ExecStart=/path/to/Omni/scripts/agent-auto-restart.sh

[Install]
WantedBy=multi-user.target
```

Create timer `/etc/systemd/system/agent-health-monitor.timer`:

```ini
[Unit]
Description=Run Agent Health Monitor every 5 minutes

[Timer]
OnBootSec=5min
OnUnitActiveSec=5min

[Install]
WantedBy=timers.target
```

Enable:

```bash
systemctl enable agent-health-monitor.timer
systemctl start agent-health-monitor.timer
```

### Option 3: Paperclip Heartbeat Integration

For agents with heartbeat enabled, the Paperclip platform automatically manages restarts based on adapter configuration.

## Limitations

- Status patch to "running" may not resolve underlying issues causing errors
- Agents may immediately return to error state if root cause persists
- Does not address "input too long" or "file not found" errors mentioned in parent task
- Requires investigation of actual error causes for permanent fix

## Next Steps

1. Investigate root causes of agent errors (check logs, recent runs)
2. Implement error-specific recovery strategies
3. Add alerting integration (Slack/Discord/Email)
4. Monitor restart success rate over time
