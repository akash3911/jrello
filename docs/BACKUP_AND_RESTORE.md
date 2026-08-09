# Jrello — Backup and Disaster Recovery Runbook

This document outlines the backup, retention, and disaster recovery procedures for Jrello's PostgreSQL database and application state.

---

## 1. Backup Strategy Overview

| Tier | Method | Frequency | Retention | Target Location |
| :--- | :--- | :--- | :--- | :--- |
| **Point-in-Time (PITR)** | PostgreSQL WAL Archiving | Continuous (every 60s) | 7 days | Encrypted S3 / Cloud Storage |
| **Full Logical Snapshot** | `pg_dump -Fc` compressed | Daily (02:00 UTC) | 30 days | Geo-replicated Storage |
| **Pre-Migration Snapshot**| `pg_dump` | On every `prisma migrate` | 90 days | Release Artifacts |

---

## 2. Automated Daily Snapshot Drill

### Taking a Logical Backup

```bash
# Set credentials
export PGHOST=localhost
export PGPORT=5432
export PGUSER=jrello
export PGDATABASE=jrello
export PGPASSWORD=jrellopassword

# Create timestamped custom-format compressed backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="jrello_backup_${TIMESTAMP}.dump"

pg_dump -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -Fc -f "$BACKUP_FILE"

echo "Backup completed: $BACKUP_FILE"
```

---

## 3. Disaster Recovery / Restore Procedure

### Step 1: Prepare Clean Target Database
```bash
# Terminate existing connections
psql -h $PGHOST -U $PGUSER -d postgres -c "
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'jrello';
"

# Drop and recreate schema
psql -h $PGHOST -U $PGUSER -d postgres -c "DROP DATABASE IF EXISTS jrello;"
psql -h $PGHOST -U $PGUSER -d postgres -c "CREATE DATABASE jrello;"
```

### Step 2: Restore from Dump File
```bash
pg_restore -h $PGHOST -p $PGPORT -U $PGUSER -d jrello --clean --if-exists --no-owner "$BACKUP_FILE"
```

### Step 3: Verify Integrity & Consistency
```bash
# Verify health endpoint
curl http://localhost:3000/api/health
```

---

## 4. Disaster Recovery Drill Schedule

- **Frequency:** Quarterly disaster recovery simulation in a staging environment.
- **RTO (Recovery Time Objective):** < 15 minutes.
- **RPO (Recovery Point Objective):** < 5 minutes.
