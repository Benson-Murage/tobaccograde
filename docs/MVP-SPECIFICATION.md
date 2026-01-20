# LeafGrade v1.0 MVP Specification
## Tobacco Grading & Traceability System - Pilot Ready

**Version:** 1.0.0-MVP  
**Last Updated:** 2026-01-20  
**Status:** LOCKED FOR DEVELOPMENT  
**Target Deployment:** 8-10 weeks

---

## 🎯 MVP Objective

Deploy a **pilot-ready tobacco grading system** for:
- **One Company**
- **One Warehouse**  
- **One Season**

Focus: **Stability, Trust, Auditability**

---

## ✅ MVP INCLUDED FEATURES (LOCKED)

### 1. Bale Registration
| Feature | Status | Component |
|---------|--------|-----------|
| QR/Barcode generation | ✅ Implemented | `BaleRegistrationPage.tsx` |
| Farmer association | ✅ Implemented | `BaleRegistrationPage.tsx` |
| Weight entry at registration | ✅ Implemented | Form fields |
| Warehouse/Bay assignment | ✅ Implemented | Form fields |
| Print label with QR | ✅ Implemented | `QRCodeDisplay.tsx` |

### 2. Hardware-First Grading Workflow
| Feature | Status | Component |
|---------|--------|-----------|
| QR/Barcode scanning | ✅ Implemented | `QRScanner.tsx` |
| Bluetooth scale integration | ✅ Implemented | `hardware-devices.ts` |
| Bluetooth moisture meter | ✅ Implemented | `hardware-devices.ts` |
| Manual emergency fallback | ✅ Implemented | `ManualEntryField.tsx` |
| Manual entry audit logging | ✅ Implemented | `HardwareGradingWorkflow.tsx` |
| Device status panel | ✅ Implemented | `DeviceStatusPanel.tsx` |

### 3. Camera Image Capture
| Feature | Status | Component |
|---------|--------|-----------|
| Leaf image capture | ✅ Implemented | `ImageCaptureGuidance.tsx` |
| Lighting/distance guidance | ✅ Implemented | `ImageCaptureGuidance.tsx` |
| Multiple angle capture | ✅ Implemented | Step workflow |
| Image-to-bale linking | ✅ Implemented | Database schema |

### 4. Rule-Based Tobacco Grading
| Feature | Status | Component |
|---------|--------|-----------|
| Leaf position classification | ✅ Implemented | `tobacco-grading.ts` |
| Color classification | ✅ Implemented | `tobacco-grading.ts` |
| Texture/body assessment | ✅ Implemented | `tobacco-grading.ts` |
| Maturity indicators | ✅ Implemented | `tobacco-grading.ts` |
| Defect percentage | ✅ Implemented | `tobacco-grading.ts` |
| Moisture validation | ✅ Implemented | `validateMoisture()` |
| Grade code generation (L1F, C3F) | ✅ Implemented | `generateGradeCode()` |
| Confidence scoring | ✅ Implemented | `grading-engine.ts` |

### 5. Price Calculation
| Feature | Status | Component |
|---------|--------|-----------|
| Grade-to-price mapping | ✅ Implemented | `price_matrices` table |
| Price multipliers | ✅ Implemented | `calculateTobaccoPrice()` |
| Transparent breakdown | ✅ Implemented | `PriceBreakdownCard.tsx` |
| Farmer-visible explanation | ✅ Implemented | Price breakdown UI |

### 6. Audit Trail (Immutable)
| Feature | Status | Component |
|---------|--------|-----------|
| All grading actions logged | ✅ Implemented | `audit_logs` table |
| Device/grader/timestamp capture | ✅ Implemented | Triggers |
| Manual entry flagging | ✅ Implemented | `AuditRiskBadge.tsx` |
| Audit log viewer | ✅ Implemented | `AuditPage.tsx` |
| Price change auditing | ✅ Implemented | `audit_price_changes()` |

### 7. Offline Grading + Sync
| Feature | Status | Component |
|---------|--------|-----------|
| Offline data capture | ✅ Implemented | `offline-sync.ts` |
| Local queue storage | ✅ Implemented | `localStorage` |
| Auto-sync on reconnect | ✅ Implemented | `setupAutoSync()` |
| Sync status indicator | ✅ Implemented | `SyncStatusIndicator.tsx` |
| Conflict detection | ⚠️ Basic | `sync_status` enum |

### 8. Supervisor Approval Flow
| Feature | Status | Component |
|---------|--------|-----------|
| Manual entry approval | ✅ Implemented | `requiresSupervisorApproval()` |
| Out-of-range value approval | ✅ Implemented | Risk scoring |
| Risk-based flagging | ✅ Implemented | `AuditRiskBadge.tsx` |
| Approval workflow UI | 🔄 Needed | Dashboard component |

### 9. Basic Reports
| Feature | Status | Component |
|---------|--------|-----------|
| Daily grading summary | ✅ Defined | `ReportsPage.tsx` |
| Farmer payment report | ✅ Defined | `ReportsPage.tsx` |
| Grader performance report | ✅ Defined | `ReportsPage.tsx` |
| Seasonal summary | ✅ Defined | `ReportsPage.tsx` |
| Dispute resolution log | ✅ Defined | `ReportsPage.tsx` |
| PDF/Excel export | 🔄 Needed | Export functionality |

### 10. Dispute Management
| Feature | Status | Component |
|---------|--------|-----------|
| Dispute submission | ✅ Implemented | `disputes` table |
| Evidence attachment | ✅ Implemented | `evidence_urls` field |
| Resolution workflow | ✅ Implemented | `DisputesPage.tsx` |
| Grade correction | ✅ Implemented | `new_grade_code` field |

---

## ❌ EXPLICITLY OUT OF SCOPE (v1)

| Feature | Reason | Target Version |
|---------|--------|----------------|
| Advanced AI grading | Pilot simplicity | v2.0 |
| Multi-warehouse support | Single site focus | v1.5 |
| Multi-company tenancy | Pilot scope | v2.0 |
| ERP integration | External dependency | v2.0 |
| Mobile money integration | External dependency | v1.5 |
| Advanced analytics dashboards | Post-pilot | v1.5 |
| Blockchain grade proofs | Future roadmap | v3.0 |
| Real-time SMS notifications | Post-pilot | v1.5 |
| Predictive pricing models | Post-pilot | v2.0 |
| Cross-warehouse analytics | Single site | v1.5 |

---

## 👥 MVP USER ROLES (LOCKED)

| Role | Permissions | Scope |
|------|-------------|-------|
| **Grader** | Register bales, capture images, perform grading, enter manual values | Own gradings only |
| **Supervisor** | All grader permissions + approve manual entries, review gradings, resolve disputes, view grader performance | Warehouse-level |
| **Admin** | All supervisor permissions + manage users, configure prices, manage seasons, system settings | Company-level |
| **Auditor** | Read-only access to all data, audit logs, reports | Company-level |

### Permission Matrix

| Action | Grader | Supervisor | Admin | Auditor |
|--------|--------|------------|-------|---------|
| Register bale | ✅ | ✅ | ✅ | ❌ |
| Grade bale | ✅ | ✅ | ✅ | ❌ |
| Manual entry | ✅ | ✅ | ✅ | ❌ |
| Approve manual entry | ❌ | ✅ | ✅ | ❌ |
| View own gradings | ✅ | ✅ | ✅ | ✅ |
| View all gradings | ❌ | ✅ | ✅ | ✅ |
| Edit grading (before approval) | ✅ | ✅ | ✅ | ❌ |
| Lock grading | ❌ | ✅ | ✅ | ❌ |
| Raise dispute | ✅ | ✅ | ✅ | ❌ |
| Resolve dispute | ❌ | ✅ | ✅ | ❌ |
| View audit logs | ❌ | ✅ | ✅ | ✅ |
| Manage prices | ❌ | ❌ | ✅ | ❌ |
| Manage users | ❌ | ❌ | ✅ | ❌ |
| Export reports | ❌ | ✅ | ✅ | ✅ |

---

## 📊 MVP PERFORMANCE TARGETS

### Grading Efficiency
| Metric | Target | Measurement |
|--------|--------|-------------|
| Time per bale (hardware) | ≤ 45 seconds | From scan to submission |
| Time per bale (manual) | ≤ 90 seconds | Including reason entry |
| Image capture | ≤ 15 seconds | 2-3 angles |
| Grade calculation | < 1 second | Server-side |

### Offline Capabilities
| Metric | Target | Notes |
|--------|--------|-------|
| Offline duration | Up to 8 hours | Full shift coverage |
| Local storage capacity | 500 bales | Before sync required |
| Sync time (100 bales) | ≤ 5 minutes | On 3G connection |
| Data loss prevention | 0% | All offline data must sync |

### System Reliability
| Metric | Target | Notes |
|--------|--------|-------|
| Uptime | 99.5% | During grading hours |
| Sync success rate | 99.9% | With retries |
| Data consistency | 100% | No duplicate grades |
| Audit completeness | 100% | Every action logged |

### Hardware Integration
| Metric | Target | Notes |
|--------|--------|-------|
| Bluetooth pairing time | ≤ 10 seconds | Initial connection |
| Reading capture | ≤ 3 seconds | Per device |
| Device battery alert | 15% threshold | Warning shown |
| Fallback activation | ≤ 5 seconds | Manual mode available |

---

## ✔️ ACCEPTANCE CRITERIA

### Pilot-Ready Criteria
- [ ] All MVP features functional in test environment
- [ ] 10 graders can operate simultaneously
- [ ] Offline mode tested for 4+ hours
- [ ] Manual fallback tested and documented
- [ ] Training materials prepared
- [ ] User acceptance testing passed

### Warehouse-Ready Criteria
- [ ] Hardware devices paired and tested on-site
- [ ] Network connectivity verified (or offline mode confirmed)
- [ ] Scale calibration documented
- [ ] Moisture meter calibration documented
- [ ] Emergency procedures documented
- [ ] Supervisor approval workflow tested
- [ ] Print station configured

### Auditor-Acceptable Criteria
- [ ] Complete audit trail for all test gradings
- [ ] Manual entry reasons captured and visible
- [ ] Price calculation breakdown transparent
- [ ] Grade changes tracked with before/after
- [ ] Export to PDF/Excel functional
- [ ] User action attribution complete
- [ ] No data tampering possible

---

## 📋 BUILD CHECKLIST

### Phase 1: Core Grading (Weeks 1-3)
- [x] Database schema complete
- [x] Bale registration page
- [x] QR code generation
- [x] Hardware integration library
- [x] Manual entry with reasons
- [x] Grading engine
- [x] Tobacco-specific grading logic
- [ ] **TODO:** Complete grading submission flow
- [ ] **TODO:** Price calculation on submit

### Phase 2: Workflow & Approval (Weeks 4-5)
- [x] Audit logging triggers
- [x] Risk scoring for manual entries
- [ ] **TODO:** Supervisor approval dashboard
- [ ] **TODO:** Grading lock after approval
- [ ] **TODO:** Dispute submission form
- [ ] **TODO:** Dispute resolution workflow

### Phase 3: Reports & Export (Weeks 6-7)
- [x] Report definitions
- [ ] **TODO:** Daily summary report generation
- [ ] **TODO:** Farmer payment report
- [ ] **TODO:** PDF export
- [ ] **TODO:** Excel export
- [ ] **TODO:** Date range filtering

### Phase 4: Testing & Polish (Weeks 8-10)
- [ ] **TODO:** End-to-end testing
- [ ] **TODO:** Offline stress testing
- [ ] **TODO:** Hardware failure testing
- [ ] **TODO:** Performance optimization
- [ ] **TODO:** Security audit
- [ ] **TODO:** User training documentation

---

## 🧪 TEST CHECKLIST

### Unit Tests
- [ ] Grading engine rules
- [ ] Price calculation
- [ ] Moisture validation
- [ ] Grade code generation
- [ ] Offline queue management

### Integration Tests
- [ ] Bluetooth scale reading
- [ ] Bluetooth moisture meter
- [ ] QR scanner
- [ ] Camera capture
- [ ] Database sync

### End-to-End Tests
- [ ] Complete grading flow (hardware)
- [ ] Complete grading flow (manual)
- [ ] Supervisor approval flow
- [ ] Dispute flow
- [ ] Report generation

### Stress Tests
- [ ] 10 concurrent graders
- [ ] 500 offline bales sync
- [ ] 8-hour offline operation
- [ ] Network interruption recovery

### Security Tests
- [ ] Role-based access control
- [ ] Audit log immutability
- [ ] Session management
- [ ] Data encryption

---

## 🚀 GO-LIVE READINESS CHECKLIST

### Pre-Deployment (1 week before)
- [ ] Production environment configured
- [ ] SSL certificates installed
- [ ] Backup procedures tested
- [ ] Monitoring alerts configured
- [ ] Support contact established

### Deployment Day
- [ ] Database migrations applied
- [ ] Application deployed
- [ ] Health checks passing
- [ ] Admin user created
- [ ] Initial data loaded (prices, farmers)

### Post-Deployment (Week 1)
- [ ] Grader accounts created
- [ ] Hardware devices paired
- [ ] First bales registered
- [ ] First gradings completed
- [ ] Audit logs reviewed
- [ ] Issues triaged and resolved

### Pilot Success Criteria
- [ ] 100 bales graded successfully
- [ ] No data loss incidents
- [ ] Farmer payment reports generated
- [ ] Audit trail complete and accurate
- [ ] User satisfaction > 80%

---

## 📖 TOBACCO TERMINOLOGY GLOSSARY

| Term | Definition |
|------|------------|
| **Bale** | A bound package of tobacco leaves, typically 50-100kg |
| **Primings/Lugs** | Lower leaves on the tobacco plant, first harvested |
| **Cutters** | Middle leaves, primary commercial grade |
| **Leaf** | Upper-middle leaves, high quality |
| **Tips** | Top leaves, smaller but premium |
| **Lemon** | Bright yellow-green color, premium grade |
| **Orange** | Golden-orange cure, good quality |
| **Reddish** | Over-cured appearance, lower grade |
| **Brown** | Dark cure, lowest standard grade |
| **Greenish** | Under-cured, penalty grade |
| **Body** | Thickness/texture of leaf (thin, medium, heavy) |
| **L1F** | Grade code: Lugs, Quality 1, Fine cure |
| **C3F** | Grade code: Cutters, Quality 3, Fine cure |
| **Moisture %** | Water content, must be 10-14% for safe storage |
| **Defect %** | Percentage of leaf area with damage |

---

## 📞 SUPPORT CONTACTS

| Role | Responsibility | Contact |
|------|----------------|---------|
| Project Owner | MVP scope decisions | TBD |
| Tech Lead | Technical issues | TBD |
| Warehouse Manager | On-site operations | TBD |
| Quality Supervisor | Grading standards | TBD |

---

**Document Status:** LOCKED FOR DEVELOPMENT  
**Next Review:** After pilot completion
