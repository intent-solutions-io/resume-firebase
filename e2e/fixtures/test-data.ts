/**
 * Test Data Fixtures for Operation Hired E2E Tests
 */

export const URLS = {
  BASE: process.env.BASE_URL || 'https://resume-gen-intent-dev.web.app',
  WORKER: process.env.WORKER_URL || 'https://resume-worker-dev-96171099570.us-central1.run.app',
};

export const TEST_CANDIDATE = {
  name: `E2E Test Veteran ${Date.now()}`,
  email: `e2e-${Date.now()}@test.operationhired.com`,
  phone: '(555) 123-4567',
  city: 'San Diego',
  state: 'CA',
  branch: 'Marines',
  rank: 'E-5 (Sergeant)',
  mos: '0311',
};

export const EXISTING_CANDIDATE_ID = 'QAvbinqoikKY3jYOWLqn';

export const TARGET_JOB_DESCRIPTION = `
Operations Manager - Defense Contractor

Company: Leading defense technology company
Location: Remote / Hybrid

About the Role:
We are seeking an experienced Operations Manager to lead our logistics and supply chain operations. The ideal candidate will have military experience and a strong background in team leadership.

Requirements:
- 5+ years operations management experience
- Active security clearance (Secret or higher preferred)
- Team leadership experience managing 10+ direct reports
- Budget management experience ($1M+ annually)
- Process improvement methodologies (Six Sigma, Lean)
- Excellent written and verbal communication skills
- Project management experience (PMP certification a plus)
- Military experience strongly preferred

Required Skills:
- Logistics and supply chain management
- Inventory management and resource allocation
- Risk management and compliance
- Training program development
- Microsoft Office Suite (Excel, Word, PowerPoint)
- Data analysis and reporting
- Vendor management
- Quality assurance

Benefits:
- Competitive salary
- Health, dental, vision insurance
- 401(k) with company match
- Professional development opportunities
`;

export const VALIDATION_THRESHOLDS = {
  MIN_ATS_SCORE: 85,
  MIN_KEYWORD_COVERAGE: 80,
  MAX_BANNED_PHRASES: 0,
  MIN_WORD_COUNT: 500,
  MAX_WORD_COUNT: 1000,
};

// Sample DD-214 text for testing document upload
export const SAMPLE_DD214_TEXT = `
CERTIFICATE OF RELEASE OR DISCHARGE FROM ACTIVE DUTY

1. NAME (Last, First, Middle): DOE, JOHN MICHAEL
2. DEPARTMENT, COMPONENT AND BRANCH: UNITED STATES MARINE CORPS
3. SOCIAL SECURITY NUMBER: XXX-XX-XXXX
4. GRADE, RATE OR RANK: SERGEANT (E-5)
5. DATE OF BIRTH: 15 MAR 1990
6. RESERVE OBLIGATION TERMINATION DATE: N/A

7. PLACE OF ENTRY INTO ACTIVE DUTY: SAN DIEGO, CA

8. HOME OF RECORD AT TIME OF ENTRY:
   a. Address: 123 MAIN STREET
   b. City: SAN DIEGO
   c. State: CA
   d. Zip Code: 92101

9. COMMAND TO WHICH TRANSFERRED: NONE

10. SGLI COVERAGE AMOUNT: $400,000

11. PRIMARY SPECIALTY: 0311 RIFLEMAN (48 MONTHS)
    SECONDARY SPECIALTY: 0369 INFANTRY UNIT LEADER

12. RECORD OF SERVICE:
    a. Date Entered Active Duty: 15 JUN 2018
    b. Separation Date: 14 JUN 2022
    c. Net Active Service: 4 YEARS 0 MONTHS 0 DAYS
    d. Total Prior Active Service: NONE
    e. Total Prior Inactive Service: NONE
    f. Foreign Service: 18 MONTHS (DEPLOYMENT: OKINAWA, JAPAN; AFRICA)

13. DECORATIONS, MEDALS, BADGES, CITATIONS AND CAMPAIGN RIBBONS AWARDED:
    - GOOD CONDUCT MEDAL (2)
    - NATIONAL DEFENSE SERVICE MEDAL
    - GLOBAL WAR ON TERRORISM SERVICE MEDAL
    - SEA SERVICE DEPLOYMENT RIBBON (2)
    - MARINE CORPS RIFLE EXPERT BADGE (3RD AWARD)
    - MARINE CORPS PISTOL SHARPSHOOTER BADGE

14. MILITARY EDUCATION:
    - MARINE COMBAT TRAINING (MCT) - 29 DAYS
    - SCHOOL OF INFANTRY (SOI) - 59 DAYS
    - LANCE CORPORAL LEADERSHIP SEMINAR - 5 DAYS
    - CORPORAL LEADERSHIP COURSE - 10 DAYS
    - SERGEANT COURSE - 15 DAYS
    - COMBAT LIFESAVER COURSE - 40 HOURS

15. MEMBER CONTRIBUTED TO POST-9/11 GI BILL: YES - 100% ELIGIBILITY

18. REMARKS:
    MEMBER PERFORMED DUTIES AS RIFLE SQUAD LEADER, RESPONSIBLE FOR
    TRAINING AND TACTICAL EMPLOYMENT OF 13 MARINES. LED OVER 50
    COMBAT PATROLS DURING DEPLOYMENT. MAINTAINED ACCOUNTABILITY FOR
    OVER $2.5M IN WEAPONS AND EQUIPMENT WITH ZERO LOSSES. ACHIEVED
    98% OPERATIONAL READINESS FOR ALL ASSIGNED VEHICLES AND GEAR.

24. CHARACTER OF SERVICE: HONORABLE

27. REENTRY CODE: RE-1

28. NARRATIVE REASON FOR SEPARATION: COMPLETION OF REQUIRED ACTIVE SERVICE
`;
