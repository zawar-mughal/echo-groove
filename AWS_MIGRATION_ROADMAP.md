# AWS Migration Roadmap

**Timeline**: 1-2 months after Echo prototype is validated
**Goal**: Migrate all studio projects (Echo, Everlink, TAP) to AWS managed via Flight Control
**Platform**: Single AWS bill, Flight Control FREE tier

---

## Why Migrate?

### Current State (Phase 1)
- **Echo**: Supabase ($25/mo) + Fly.io ($0 free tier)
- **Everlink & TAP**: Not built yet
- **Total Cost**: ~$25/month

### Target State (Phase 2)
- **All 3 projects**: AWS infrastructure via Flight Control FREE tier
- **Database**: Single shared RDS PostgreSQL (or per-project schemas)
- **Compute**: Lambda + ECS across all projects
- **Auth**: AWS Cognito (shared user pool)
- **Storage**: S3 buckets
- **Total Cost**: ~$80-150/month for all 3 projects
- **Benefits**: Single bill, Reserved Instances savings, unified infrastructure

---

## Migration Phases

### Phase 2A: Infrastructure Setup (Week 1-2)

**Goal**: Set up AWS infrastructure and Flight Control

**Tasks**:
1. **Create AWS Account** (if not exists)
   - Enable billing alerts
   - Set up IAM users and policies
   - Configure MFA for root account

2. **Connect Flight Control to AWS**
   - Sign up for Flight Control: https://www.flightcontrol.dev/
   - Use FREE tier (1 user, unlimited projects)
   - Connect AWS account via IAM role
   - Verify connection and permissions

3. **Set Up RDS PostgreSQL**
   - Choose instance: `db.t3.micro` for prototyping, `db.t3.medium` for production
   - Enable automated backups (7-day retention)
   - Configure Multi-AZ for high availability (production only)
   - Purchase 1-year Reserved Instance (50% savings)
   - Estimated cost: $30-50/month

4. **Set Up AWS Cognito**
   - Create user pool for authentication
   - Configure email/password + OAuth providers
   - Set password policies and MFA options
   - Estimated cost: $0-5/month (<10K MAU)

5. **Set Up S3 Buckets**
   - Create buckets per project or shared
   - Configure CORS for frontend access
   - Set up lifecycle policies for cost optimization
   - Enable versioning for critical data
   - Estimated cost: $5-10/month

6. **Set Up Networking**
   - VPC configuration
   - Security groups
   - Load balancers (shared across projects)

---

### Phase 2B: Migrate Echo from Supabase (Week 2-3)

**Goal**: Move Echo database and auth to AWS

#### Step 1: Database Migration

```bash
# 1. Export Supabase database
pg_dump -h db.jmrzmlrdyrpipqikedfk.supabase.co \
  -U postgres \
  -d postgres \
  --clean --if-exists \
  --no-owner --no-privileges \
  > echo_database_backup.sql

# 2. Import to AWS RDS
psql -h your-rds-endpoint.rds.amazonaws.com \
  -U postgres \
  -d echo_production \
  < echo_database_backup.sql

# 3. Verify data integrity
# Compare row counts, run test queries

# 4. Update sequences (if needed)
SELECT setval('your_sequence_name', (SELECT MAX(id) FROM your_table));
```

#### Step 2: Auth Migration (Supabase Auth → Cognito)

**Options**:
- **Option A**: Require users to re-register (simplest, acceptable for prototype)
- **Option B**: Migrate user accounts:
  ```
  1. Export users from Supabase
  2. Import to Cognito via CSV or API
  3. Send password reset emails to all users
  4. Update frontend auth logic
  ```

#### Step 3: Update Echo Frontend

```typescript
// Replace Supabase client with AWS SDK
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { RDSDataClient } from "@aws-sdk/client-rds-data";

// Update environment variables
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxx
VITE_COGNITO_CLIENT_ID=xxxxx
VITE_RDS_DATABASE_NAME=echo_production
```

#### Step 4: Storage Migration (Supabase Storage → S3)

```bash
# Download all files from Supabase Storage
supabase storage download --recursive

# Upload to S3
aws s3 sync ./storage s3://echo-storage-bucket/

# Update file URLs in database
UPDATE submissions
SET cover_art = REPLACE(cover_art, 'supabase.co/storage', 's3.amazonaws.com/echo-storage-bucket');
```

---

### Phase 2C: Migrate Upload Service to Lambda (Week 3)

**Goal**: Convert Fly.io Express app to AWS Lambda via Flight Control

#### Architecture Change

**Before (Fly.io)**:
```
Frontend → Fly.io Express Server → Audius SDK → Audius
```

**After (AWS Lambda)**:
```
Frontend → API Gateway → Lambda → Audius SDK → Audius
```

#### Flight Control Configuration

Create `flightcontrol-echo.json` in project root:

```json
{
  "$schema": "https://app.flightcontrol.dev/schema.json",
  "environments": [
    {
      "id": "production",
      "name": "Production",
      "region": "us-east-1",
      "source": {
        "branch": "main"
      },
      "services": [
        {
          "id": "echo-upload-lambda",
          "name": "Echo Upload Service",
          "type": "lambda",
          "runtime": "nodejs18",
          "handler": "index.handler",
          "buildCommand": "npm install --production",
          "envVariables": {
            "AUDIUS_API_KEY": {
              "fromParameterStore": "/echo/audius/api-key"
            },
            "AUDIUS_API_SECRET": {
              "fromParameterStore": "/echo/audius/api-secret"
            }
          },
          "timeout": 300,
          "memory": 512
        }
      ]
    }
  ]
}
```

#### Convert Express to Lambda Handler

Create `upload-service/lambda.js`:

```javascript
const { sdk } = require('@audius/sdk');
const busboy = require('busboy'); // For parsing multipart form data

exports.handler = async (event) => {
  // Parse form data from API Gateway event
  const contentType = event.headers['content-type'];
  const body = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');

  // Extract files and fields (use busboy or similar)
  const { audioFile, coverArtFile, userId, title, genre, description, mood, tags } = parseFormData(body, contentType);

  // Initialize Audius SDK
  const audiusSdk = sdk({
    apiKey: process.env.AUDIUS_API_KEY,
    apiSecret: process.env.AUDIUS_API_SECRET,
    appName: 'Echo Groove Battle'
  });

  // Upload to Audius
  const result = await audiusSdk.tracks.uploadTrack({
    userId,
    trackFile: audioFile,
    coverArtFile,
    metadata: { title, genre, description, mood, tags }
  });

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      trackId: result.trackId
    })
  };
};
```

#### Deploy via Flight Control

```bash
# 1. Commit flightcontrol config
git add flightcontrol-echo.json
git commit -m "Add Flight Control configuration for Echo"

# 2. Push to GitHub
git push origin main

# 3. Flight Control auto-deploys on push
# Monitor at https://app.flightcontrol.dev/

# 4. Update frontend URL
VITE_UPLOAD_SERVICE_URL=https://xxx.execute-api.us-east-1.amazonaws.com/upload
```

---

### Phase 2D: Build Everlink & TAP Directly on AWS (Week 4-6)

**Goal**: Start new projects with AWS from day 1 (no Supabase migration needed)

**Benefits**:
- No migration pain for new projects
- Consistent infrastructure across all projects
- Shared resources reduce costs

**Flight Control Config for Each Project**:

```json
// flightcontrol-everlink.json
{
  "environments": [
    {
      "services": [
        {
          "type": "ecs-fargate",
          "name": "Everlink API",
          "image": "node:18",
          "envVariables": { ... }
        }
      ]
    }
  ]
}

// flightcontrol-tap.json
{
  "environments": [
    {
      "services": [
        {
          "type": "lambda",
          "name": "TAP Worker",
          ...
        }
      ]
    }
  ]
}
```

---

## Cost Optimization Strategies

### Immediate Savings (20-30%)
1. **Right-size RDS instances** - Start with `db.t3.micro`, scale up as needed
2. **Use Lambda for bursty traffic** - Only pay when invoked
3. **Enable S3 Intelligent-Tiering** - Auto-moves old data to cheaper storage
4. **Shared resources** - One load balancer, one VPC across all projects

### Medium-term Savings (50-70%)
1. **1-year Reserved Instances** for RDS (~50% off)
2. **3-year Reserved Instances** for predictable baseline load (~70% off)
3. **Spot Instances** for fault-tolerant workloads
4. **CloudFront CDN** to reduce data transfer costs
5. **Compress and cache** API responses

### Advanced Optimization
1. **AWS Savings Plans** (more flexible than RIs)
2. **Graviton2 instances** (ARM, 30% cheaper than x86)
3. **Aurora Serverless** for unpredictable database traffic
4. **Lambda Provisioned Concurrency** for critical paths (eliminates cold starts)

---

## Estimated Monthly Costs

### Phase 1 (Current)
- Supabase Pro: $25
- Fly.io: $0 (free tier)
- **Total: $25/month**

### Phase 2 (All Projects on AWS)

| Service | Cost |
|---------|------|
| RDS PostgreSQL (db.t3.medium, 1-yr RI) | $30-40 |
| Lambda (10K invocations/month) | $2-5 |
| Cognito (5K MAU) | $0-5 |
| S3 Storage (100 GB) | $2-5 |
| Data Transfer | $10-20 |
| Load Balancer | $16 |
| CloudFront CDN | $5-10 |
| Route53 DNS | $2 |
| **Flight Control Platform** | **$0** (free tier) |
| **Total** | **$80-150/month** |

**Per-project cost**: $25-50/month (3 projects)

### Breakeven Analysis
- Below 3 projects: Supabase cheaper
- 3+ projects: AWS + Flight Control cheaper
- At 5+ projects: AWS significantly cheaper

---

## Pre-Migration Checklist

Before starting migration, ensure you have:

- [ ] AWS account with billing alerts configured
- [ ] Flight Control account created (free tier)
- [ ] All Supabase data backed up
- [ ] Database schema documented
- [ ] API endpoints documented
- [ ] User authentication flows mapped
- [ ] Storage file inventory
- [ ] Frontend environment variables documented
- [ ] Testing plan for each migrated service
- [ ] Rollback plan if migration fails

---

## Testing Strategy

### Phase 1: Parallel Running
- Keep Supabase running
- Deploy to AWS in parallel
- Test AWS services thoroughly
- Compare results

### Phase 2: Gradual Cutover
- Migrate read-only traffic first
- Monitor for 24-48 hours
- Migrate write traffic
- Monitor for 1 week

### Phase 3: Full Migration
- Update DNS/routing to AWS
- Keep Supabase as backup for 2 weeks
- Decommission Supabase after validation

---

## Rollback Plan

If migration fails:

1. **Immediate rollback** (< 1 hour):
   - Revert DNS/routing to Supabase
   - All traffic back to old infrastructure

2. **Data rollback** (< 4 hours):
   - Restore latest Supabase backup
   - Sync any new data from AWS

3. **Communication**:
   - Notify users of maintenance window
   - Update status page

---

## Support Resources

### AWS Documentation
- RDS: https://docs.aws.amazon.com/rds/
- Lambda: https://docs.aws.amazon.com/lambda/
- Cognito: https://docs.aws.amazon.com/cognito/
- S3: https://docs.aws.amazon.com/s3/

### Flight Control
- Docs: https://www.flightcontrol.dev/docs
- Support: support@flightcontrol.dev
- Community: Discord server

### Migration Tools
- AWS Database Migration Service: https://aws.amazon.com/dms/
- pg_dump documentation: https://www.postgresql.org/docs/current/app-pgdump.html

---

## Post-Migration Tasks

After successful migration:

- [ ] Set up CloudWatch dashboards for monitoring
- [ ] Configure billing alerts at $100, $200 thresholds
- [ ] Enable AWS Cost Explorer
- [ ] Set up log aggregation (CloudWatch Logs)
- [ ] Configure automated backups (RDS, S3)
- [ ] Review and optimize security groups
- [ ] Set up AWS GuardDuty for threat detection
- [ ] Document new architecture for team
- [ ] Update CI/CD pipelines
- [ ] Decommission Supabase account

---

## Timeline Summary

| Week | Focus | Key Deliverables |
|------|-------|------------------|
| 1-2 | AWS Setup | RDS, Cognito, S3 configured |
| 2-3 | Echo Migration | Database, auth, storage migrated |
| 3 | Upload Service | Lambda deployed via Flight Control |
| 4-6 | New Projects | Everlink & TAP built on AWS |

**Total Duration**: 1-2 months
**Estimated Cost**: $80-150/month for all 3 projects
**Platform Fee**: $0 (Flight Control free tier)

---

## Next Steps

1. **Complete Echo prototype on Fly.io**
2. **Validate product-market fit**
3. **When ready to scale** (1-2 months), return to this roadmap
4. **Start with Phase 2A** (Infrastructure Setup)

Questions? Review this roadmap or consult AWS/Flight Control documentation.
