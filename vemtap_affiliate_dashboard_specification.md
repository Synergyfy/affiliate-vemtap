# VEMTAP AFFILIATE & MANAGER DASHBOARD (FULL SPECIFICATION)

This document explains exactly how the Affiliate Dashboard should work, including the Manager system.
Write this in simple, clear logic so developers can build without confusion.

---

# 1. OVERVIEW

The dashboard has two user types:

1. Affiliate (brings businesses)
2. Manager (recruits and manages affiliates)

Both use the same dashboard, but with different tabs and permissions.

---

# 2. CORE BUSINESS LOGIC

## Subscription Plans

- Silver = ₦5,000/month
- Gold = ₦9,500/month
- Platinum = ₦18,000/month

---

## Earnings Model

### Affiliate

- Earns 20% of subscription monthly
- Only for:
  - First 3 months (default)
  - OR 12 months (if Manager unlocks milestone)

### Manager

- Earns 10% of affiliate earnings
- Same duration as affiliate

---

## Example (Monthly)

| Plan | Affiliate | Manager |
|------|----------|--------|
| Silver | ₦1,000 | ₦100 |
| Gold | ₦1,900 | ₦190 |
| Platinum | ₦3,600 | ₦360 |

---

## Important Rules

1. Earnings only apply to ACTIVE subscriptions
2. If business stops → earnings stop
3. No lifetime earning
4. Default duration = 3 months
5. Unlock = 12 months

---

# 3. MANAGER MILESTONE SYSTEM

## Target (within 90 days)

- 30 Active Affiliates
- 100 Businesses Closed

## Reward

- Earnings extend from 3 months → 12 months
- Applies to:
  - Existing businesses in that cycle
  - New businesses

## Bonus

- ₦5,000 (affiliate target)
- ₦10,000 (business target)

---

# 4. DASHBOARD STRUCTURE

---

# SECTION A: TOP SUMMARY (ALL USERS)

Show as cards:

- Monthly Earnings
- Total Earnings
- Active Businesses
- Active Affiliates (only for manager)

---

# SECTION B: EARNINGS BREAKDOWN

Table:

Columns:

- Business Name
- Plan
- Status (Active / Inactive)
- Month Count (e.g. Month 2/3 or 5/12)
- Affiliate Earnings
- Manager Earnings

---

# SECTION C: ACTIVE BUSINESS TRACKER

Show:

- Total Active Businesses
- New This Week
- Lost (Inactive)

---

# SECTION D: AFFILIATE TAB

Visible to both:

- Affiliate sees only self
- Manager sees all affiliates

Columns:

- Affiliate Name
- Businesses Brought
- Active Businesses
- Status (Active / Weak / Inactive)

---

# SECTION E: MANAGER TAB (ONLY FOR MANAGER)

---

## 1. Progress to Milestone

Show progress bars:

- Affiliates: e.g. 18 / 30
- Businesses: e.g. 72 / 100

---

## 2. Status

- “3-Month Mode”
- OR “12-Month Mode Unlocked”

---

## 3. Bonus Tracker

- Show ₦5,000 when affiliate target reached
- Show ₦10,000 when business target reached

---

# SECTION F: EARNINGS FORECAST

Show estimate:

- Based on active businesses

Formula:

Monthly Earnings =
Active Businesses × Average Manager Earnings per Business

---

# SECTION G: DAILY ACTION PANEL

Show tasks:

- Recruit new affiliates
- Follow up businesses
- Activate inactive affiliates

---

# SECTION H: ALERT SYSTEM

Show notifications:

- “You are 10 businesses away from milestone”
- “15 businesses inactive”

---

# 5. CALCULATION LOGIC

---

## Affiliate Earnings

Monthly:

Affiliate Earnings = Plan Price × 20%

---

## Manager Earnings

Manager Earnings = Affiliate Earnings × 10%

---

## Duration Logic

IF manager NOT unlocked:
- Max = 3 months

IF manager unlocked:
- Max = 12 months

---

## Active Check

IF subscription active:
- Pay earnings

IF inactive:
- Stop earnings immediately

---

# 6. DATABASE STRUCTURE (SIMPLE)

Tables:

1. Users
2. Affiliates
3. Managers
4. Businesses
5. Subscriptions
6. Earnings
7. Milestones

---

## Key Fields

### Business
- id
- plan
- affiliate_id
- manager_id
- status
- start_date

### Earnings
- business_id
- month_number
- affiliate_amount
- manager_amount

---

# 7. FINAL BEHAVIOR RULES

- Earnings update monthly
- Dashboard updates in real-time
- All calculations automatic
- No manual adjustments

---

# END

