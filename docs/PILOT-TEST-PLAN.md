# LeafGrade v1.0 Pilot Test Plan

## Pilot Deployment Documentation
**Version:** 1.0.0  
**Target:** Single Tobacco Warehouse Pilot  
**Duration:** 4-6 weeks

---

## 1. Pilot Environment Setup

### 1.1 Scope Definition
| Parameter | Specification |
|-----------|--------------|
| Companies | 1 tobacco company |
| Warehouses | 1 warehouse location |
| Graders | 3-5 certified graders |
| Supervisors | 1 quality supervisor |
| Season Batches | 1 active season (sample data acceptable) |

### 1.2 Hardware Requirements
| Device | Quantity | Specification |
|--------|----------|--------------|
| Bluetooth Scale | 1 minimum (2 recommended) | 0-100kg, ±0.1kg accuracy |
| Bluetooth Moisture Meter | 1 minimum (2 recommended) | 8-25% range, ±0.5% accuracy |
| Tablets/Phones | 1 per grader | Android 10+ / iOS 14+, Camera 8MP+ |
| Backup Devices | Optional | Same specs as primary |
| WiFi Router | 1 | 2.4GHz/5GHz dual-band |

### 1.3 Pre-Pilot Checklist
- [ ] Database seeded with test farmers (minimum 10)
- [ ] Price matrix configured for current season
- [ ] Grading rules published and active
- [ ] User accounts created (graders, supervisor, admin)
- [ ] Bluetooth devices paired and tested
- [ ] Offline mode verified (72-hour capability)
- [ ] Backup procedures documented

---

## 2. Mandatory Test Scenarios

### Scenario A: Normal Operation
**Objective:** Validate standard hardware-first workflow

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| A1 | Scan bale QR code | Bale info displayed correctly | |
| A2 | Capture weight from Bluetooth scale | Weight appears within 3 seconds | |
| A3 | Capture moisture from meter | Moisture reading displayed | |
| A4 | Capture leaf image | AI analysis begins | |
| A5 | Review AI suggestions | All attributes shown with confidence | |
| A6 | Accept/modify/reject AI | Decisions recorded | |
| A7 | Confirm grade | Grade calculated correctly | |
| A8 | Submit grading | Saved to database, audit logged | |

**Target Metrics:**
- Grading time: ≤ 45 seconds per bale
- Hardware read success: ≥ 98%
- Data sync: Immediate when online

---

### Scenario B: Offline Mode
**Objective:** Validate 72-hour offline capability

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| B1 | Disable WiFi/network | "Offline Mode" indicator shown | |
| B2 | Grade 10 bales offline | All gradings saved locally | |
| B3 | Verify local storage | Queue shows 10 pending items | |
| B4 | Wait 4+ hours | No data loss | |
| B5 | Restore connection | Auto-sync begins | |
| B6 | Verify sync completion | All 10 records synced | |
| B7 | Check audit logs | Offline gradings clearly marked | |

**Target Metrics:**
- Offline duration: ≥ 72 hours without data loss
- Sync success rate: ≥ 99%
- Conflict resolution: Manual conflicts < 1%

---

### Scenario C: Hardware Failure
**Objective:** Validate emergency manual fallback

#### C1: Scale Failure
| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| C1.1 | Disconnect Bluetooth scale | "Device Unavailable" warning | |
| C1.2 | Click "Manual Entry" | Reason selection appears | |
| C1.3 | Select reason: "Device Unavailable" | Reason recorded | |
| C1.4 | Enter weight manually | Field accepts value, ⚠ icon shown | |
| C1.5 | Complete grading | Higher risk score assigned | |
| C1.6 | Check supervisor dashboard | Manual entry flagged for review | |

#### C2: Moisture Meter Failure
| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| C2.1 | Disconnect moisture meter | "Device Unavailable" warning | |
| C2.2 | Click "Manual Entry" | Reason selection appears | |
| C2.3 | Enter moisture manually | Field accepts value | |
| C2.4 | Complete grading | Audit trail includes manual flag | |

#### C3: Camera Unavailable
| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| C3.1 | Deny camera permission | "Camera unavailable" message | |
| C3.2 | Proceed without AI | Manual grading mode activates | |
| C3.3 | Select all attributes manually | All fields functional | |

---

### Scenario D: Abuse Prevention
**Objective:** Validate anti-fraud controls

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| D1 | Same grader uses manual 5x in row | Alert triggered for supervisor | |
| D2 | Enter out-of-range weight (150kg) | Validation error shown | |
| D3 | Enter out-of-range moisture (35%) | Validation error or warning | |
| D4 | Supervisor reviews flagged entries | All manual entries visible | |
| D5 | Supervisor approves valid entry | Entry locked, audit updated | |
| D6 | Supervisor rejects invalid entry | Grading returned for correction | |

---

### Scenario E: Audit Replay
**Objective:** Validate complete traceability

| Step | Action | Expected Result | Pass/Fail |
|------|--------|----------------|-----------|
| E1 | Select completed bale | Full grading history displayed | |
| E2 | View hardware readings | Device ID, timestamp shown | |
| E3 | View manual entries | Reason, grader, approver shown | |
| E4 | View AI decisions | Accept/modify/reject recorded | |
| E5 | View price calculation | Breakdown matches grade | |
| E6 | Export audit report | PDF with complete trail | |

---

## 3. User Acceptance Testing (UAT)

### 3.1 Grader UAT Checklist
| Criteria | Score (1-5) | Notes |
|----------|-------------|-------|
| Device pairing ease | | |
| QR scanning speed | | |
| Hardware reading reliability | | |
| Emergency manual mode clarity | | |
| AI suggestion helpfulness | | |
| Grade confirmation speed | | |
| Offline mode awareness | | |
| Overall satisfaction | | |

### 3.2 Supervisor UAT Checklist
| Criteria | Score (1-5) | Notes |
|----------|-------------|-------|
| Dashboard visibility | | |
| Manual entry alerts | | |
| Approval workflow ease | | |
| Risk score accuracy | | |
| Grader analytics usefulness | | |
| Dispute handling | | |
| Overall confidence | | |

### 3.3 Auditor UAT Checklist
| Criteria | Score (1-5) | Notes |
|----------|-------------|-------|
| Data completeness | | |
| Audit trail clarity | | |
| Report export quality | | |
| Device vs manual distinction | | |
| Immutability confidence | | |
| Timestamp accuracy | | |
| Overall audit readiness | | |

---

## 4. Performance Metrics

### 4.1 Key Performance Indicators
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Avg grading time per bale | ≤ 45 sec | | |
| Hardware input rate | ≥ 95% | | |
| Manual entry rate | ≤ 5% | | |
| Offline survival | ≥ 72 hours | | |
| Sync success rate | ≥ 99% | | |
| Device uptime | ≥ 98% | | |
| AI acceptance rate | ≥ 70% | | |
| Supervisor response time | ≤ 15 min | | |

### 4.2 Daily Monitoring Template
```
Date: ___________
Shift: Morning / Afternoon

Total bales graded: _____
Hardware readings: _____
Manual entries: _____ (reasons: ___________)
Offline periods: _____ (duration: ___________)
Sync issues: _____
Device failures: _____
Supervisor approvals: _____

Issues encountered:
1. ________________________________
2. ________________________________

Grader feedback:
________________________________
```

---

## 5. Issue Tracking

### 5.1 Priority Levels
| Priority | Definition | Response Time | Examples |
|----------|-----------|---------------|----------|
| **Critical** | Blocks grading | < 1 hour | App crash, data loss |
| **High** | Audit risk | < 4 hours | Missing logs, sync failure |
| **Medium** | Degraded experience | < 24 hours | Slow performance, UI bugs |
| **Low** | Minor inconvenience | Next release | Cosmetic issues |

### 5.2 Issue Template
```
Issue ID: ___________
Priority: Critical / High / Medium / Low
Reported by: ___________
Date/Time: ___________

Description:
________________________________

Steps to reproduce:
1. ________________________________
2. ________________________________
3. ________________________________

Expected behavior:
________________________________

Actual behavior:
________________________________

Device/Browser:
________________________________

Screenshots attached: Yes / No

Fix recommendation:
________________________________

Retest plan:
________________________________
```

---

## 6. Go/No-Go Decision Framework

### 6.1 Success Criteria
| Criterion | Threshold | Result | Go? |
|-----------|-----------|--------|-----|
| Hardware input rate | ≥ 95% | | |
| Manual entries justified | 100% | | |
| No missing audit trails | 0 gaps | | |
| Supervisors approve system | Yes | | |
| Auditors accept logs | No objections | | |
| Critical bugs resolved | 0 open | | |
| Grader satisfaction | ≥ 4/5 | | |
| Offline resilience proven | Yes | | |

### 6.2 Decision Matrix
| Scenario | Decision |
|----------|----------|
| All criteria met | **GO** - Proceed to production |
| 1-2 High issues open | **CONDITIONAL GO** - Fix within 1 week |
| Any Critical issue open | **NO GO** - Resolve before proceed |
| Auditor objections | **NO GO** - Address concerns |
| < 90% hardware rate | **NO GO** - Investigate workflow |

### 6.3 Sign-Off Template
```
PILOT COMPLETION SIGN-OFF

Project: LeafGrade v1.0 Pilot
Location: ___________
Dates: ___________ to ___________

SUMMARY:
- Total bales graded: _____
- Hardware rate achieved: _____%
- Manual entry rate: _____%
- Critical issues: _____
- Open issues: _____

DECISION: GO / CONDITIONAL GO / NO GO

Reasons:
________________________________
________________________________

Conditions (if applicable):
________________________________

Signed:

Pilot Manager: _______________ Date: ___________
Supervisor: _______________ Date: ___________
Auditor: _______________ Date: ___________
IT Lead: _______________ Date: ___________
```

---

## 7. Sample Pilot Data

### 7.1 Test Farmers
```sql
-- Sample farmer data for pilot
INSERT INTO farmers (farmer_code, full_name, phone, farm_location) VALUES
('FRM-001', 'Peter Nyambi', '+260971234567', 'Chipata District'),
('FRM-002', 'Grace Mwanza', '+260972345678', 'Choma District'),
('FRM-003', 'John Tembo', '+260973456789', 'Kasama District'),
('FRM-004', 'Mary Banda', '+260974567890', 'Mongu District'),
('FRM-005', 'James Mulenga', '+260975678901', 'Ndola District');
```

### 7.2 Test Bales
```sql
-- Sample bale data for pilot (10 bales per farmer)
-- Generate with sequential bale codes: BL-2024-00001 through BL-2024-00050
```

### 7.3 Price Matrix
| Grade | Position | Color | Base Price (USD/kg) |
|-------|----------|-------|---------------------|
| L1F | Lemon | Deep Orange | 5.20 |
| L1K | Lemon | Orange | 4.80 |
| L2F | Orange | Deep Orange | 4.50 |
| L2K | Orange | Orange | 4.20 |
| C1F | Cutters | Light Mahogany | 3.80 |
| C2K | Cutters | Mahogany | 3.40 |
| X1L | Lugs | Light | 3.00 |
| X2L | Lugs | Standard | 2.60 |

---

## Appendix A: Emergency Procedures

### Device Failure Protocol
1. Announce "Emergency Manual Mode" to supervisor
2. Document device issue in shift log
3. Continue grading with manual entry
4. Report all manual gradings at shift end
5. Supervisor reviews and approves before lock

### Network Outage Protocol
1. System automatically enters offline mode
2. Continue normal operations
3. Monitor pending queue count
4. When restored, verify sync completion
5. Report any sync failures immediately

### Data Recovery Protocol
1. Check local browser storage
2. Verify server-side backups
3. Contact IT support if data missing
4. Document incident for audit trail
