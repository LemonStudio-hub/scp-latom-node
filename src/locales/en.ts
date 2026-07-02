export default {
  site: {
    title: 'SCP Foundation Latom Node',
    tagline: 'Secure. Contain. Protect.',
  },
  nav: {
    home: 'Home',
    catalog: 'SCP Catalog',
    documents: 'Documents',
    about: 'About',
    dashboard: 'Dashboard',
    proposals: 'Proposals',
    activity: 'Activity',
    terminal: 'Terminal',
  },
  header: {
    searchPlaceholder: 'Search',
    searchTitle: 'Search (Ctrl+K)',
    lightMode: 'Light mode',
    darkMode: 'Dark mode',
    langSwitch: '中文',
  },
  sidebar: {
    node: 'NODE',
    nodeValue: 'LATOM-7',
    status: 'STATUS',
    active: 'ACTIVE',
    clearance: 'CLEARANCE',
    level4: 'LEVEL 4',
    collapse: 'Collapse sidebar',
    expand: 'Expand sidebar',
  },
  footer: {
    brand: 'SCP Foundation',
    system: 'Latom Node Documentation System',
  },
  hero: {
    badge: 'LATOM NODE — DOCUMENTATION TERMINAL v7.2.1',
    titleLine: 'SCP Foundation',
    titleAccent: 'Latom Node',
    description:
      'A comprehensive documentation and archival system for anomalous objects, entities, and phenomena under Foundation jurisdiction. Access restricted to authorized personnel with Level 2 clearance or above.',
    browseCatalog: 'Browse Catalog',
    learnMore: 'Learn More',
  },
  stats: {
    totalEntries: 'Total Entries',
    safe: 'Safe',
    euclid: 'Euclid',
    keter: 'Keter',
    documents: 'Documents',
    personnel: 'Personnel',
  },
  recent: {
    title: 'Recent Entries',
    viewAll: 'View all',
  },
  catalog: {
    title: 'SCP Catalog',
    description:
      'Browse all documented anomalous objects and entities under Foundation jurisdiction.',
    searchPlaceholder: 'Search entries...',
    entriesFound: '{count} entries found',
    empty: 'No entries match your search criteria.',
    protocol: {
      title: 'Operation Protocol',
      auto: 'AUTO-OP',
      manual: 'MANUAL-OP',
      autoDesc:
        'System automatically recommends random SCP entries based on your language setting. Timer-controlled rotation.',
      manualDesc:
        'Full user control — browse and select entries independently with search and filters.',
      autoActive: 'AUTO-ROTATION ACTIVE',
      autoPaused: 'ROTATION PAUSED',
      nextEntry: 'NEXT ROTATION',
      timerLabel: 'TIMER',
      pause: 'Pause',
      resume: 'Resume',
      shuffle: 'Shuffle Now',
      recommended: 'Recommended for You',
      intervalLabel: 'Interval',
      intervalUnit: 'sec',
      scannerActive: 'SCANNER ACTIVE',
      scannerPaused: 'SCANNER IDLE',
      entriesLoaded: '{count} entries loaded',
    },
  },
  backToTop: 'Back to top',
  entry: {
    back: 'Back to Catalog',
    author: 'Author:',
    date: 'Date:',
    objectClass: 'Object Class',
    containment: 'Special Containment Procedures',
    description: 'Description',
    addenda: 'Addenda',
    notFound: 'Entry Not Found',
    notFoundDesc: 'The requested SCP entry does not exist in the Latom Node database.',
    returnToCatalog: 'Return to Catalog',
    download: 'Download article',
    downloading: 'Downloading…',
    report: 'Report Issue',
    reportType: 'Report Type',
    reportTypes: {
      content_error: 'Content Error',
      display_issue: 'Display Issue',
      special_handling: 'Special Handling',
      other: 'Other',
    },
    reportDescription: 'Description',
    reportPlaceholder: 'Describe the issue you found (10-2000 characters)…',
    reportSubmit: 'Submit Report',
    reportSubmitting: 'Submitting…',
    reportSuccess: 'Report submitted successfully. Thank you for your feedback.',
    reportSlots: '{remaining} of {max} report slots remaining for this entry',
  },
  documents: {
    title: 'Documents',
    description:
      'Foundation protocols, research papers, incident reports, and executive directives.',
    hero: {
      badge: '{count} DOCUMENTS // RESTRICTED → TOP SECRET',
    },
    all: 'All',
    read: 'Read Document →',
    count: '{count} documents',
    sortBy: 'Sort by',
    sort: {
      date: 'Date',
      classification: 'Classification',
      type: 'Type',
    },
    filter: {
      classification: 'Classification',
    },
    types: {
      protocol: 'Protocol',
      research: 'Research',
      incident: 'Incident',
      directive: 'Directive',
    },
    meta: {
      author: 'Author',
      lastUpdated: 'Last Updated',
      node: 'Node',
      classification: 'Classification',
    },
    footer: {
      disclaimer:
        'All documents are property of the SCP Foundation. Unauthorized distribution is prohibited under Foundation Directive 101-B.',
    },
  },
  docs: {
    'doc-user-manual': {
      title: 'Latom Node User Manual',
      summary:
        'Comprehensive guide for navigating and utilizing the Latom Node documentation terminal.',
      content: `# Latom Node User Manual

## 1. Overview

The Latom Node Documentation Terminal (Node LATOM-7) is a secure archival and retrieval system operated by the SCP Foundation. This terminal provides authorized personnel with access to SCP entries, Foundation documents, and operational tools.

> All access is logged. Unauthorized use will result in disciplinary action.

## 2. Getting Started

### 2.1 Registration

To create a Foundation account:

- Click **Register** on the login page
- Choose a unique **work codename** (3-32 characters, letters, numbers, underscores)
- Set a secure **login key** (minimum 8 characters)
- Confirm your login key and submit

### 2.2 Authentication

Log in using your codename and login key. Your session will persist until you explicitly log out or your token expires. All actions are recorded under your personnel profile.

## 3. Navigation

The terminal interface consists of three main areas:

- **Header** — Search bar, language toggle (EN/CN), theme switch, and personal terminal
- **Sidebar** — Primary navigation links to all sections
- **Content Area** — Active page content with contextual controls

### 3.1 Available Sections

- **Dashboard** — Homepage with system statistics and recent entries
- **SCP Catalog** — Browse all documented anomalous objects and entities
- **Documents** — Foundation protocols, research papers, and incident reports
- **Proposals** — Submit and vote on operational proposals
- **Activity** — View your browsing history and bookmarked entries
- **About** — Foundation information and object classification reference

## 4. SCP Catalog

### 4.1 Browsing Entries

The catalog displays all indexed SCP entries. Each entry card shows:

- **SCP Number** — Unique identifier (e.g., SCP-173)
- **Object Class** — Containment classification (Safe, Euclid, Keter, Thaumiel, Apollyon, Neutralized)
- **Name** — Designated name of the anomalous object

### 4.2 Filtering and Search

- Use the **search bar** to find entries by number or name
- Click **object class buttons** to filter by containment classification
- Switch between **EN** (English SCP Wiki) and **CN** (Chinese SCP Foundation) databases

### 4.3 Entry Details

Each entry page contains:

- **Special Containment Procedures** — Current containment requirements
- **Description** — Physical and behavioral characteristics
- **Addenda** — Supplementary research notes and incident logs

Use the **Bookmark** button to save entries to your personal collection.

## 5. Documents

Foundation documents are organized by type:

- **Protocol** — Standard operating procedures and containment guidelines
- **Research** — Scientific papers and experimental findings
- **Incident** — Breach reports and post-incident analyses
- **Directive** — Executive orders and policy changes

Each document has a **classification level** indicating its sensitivity:

- Unclassified — Publicly available information
- Restricted — Limited to assigned personnel
- Confidential — Requires need-to-know basis
- Secret — Senior staff only
- Top Secret — O5 Council authorization required

## 6. Proposals

### 6.1 Submitting Proposals

Personnel may submit operational proposals for Foundation review:

- Navigate to **Proposals** and click **Submit Proposal**
- Select a category: Protocol, Research, Containment, or General
- Provide a descriptive title (5-200 characters)
- Detail your proposal using the provided template
- Daily limit: 2 proposals per personnel

### 6.2 Voting

All personnel may vote on open proposals:

- **For** — Approve the proposal
- **Against** — Oppose the proposal
- **Abstain** — Decline to vote

Votes are **immutable** once cast. Proposals are reviewed by senior staff based on community input.

## 7. Activity

### 7.1 Browsing History

Your recent viewing history is automatically recorded. Use the **Clear All** option to reset your history. History is limited to 500 entries per personnel.

### 7.2 Bookmarks

Save SCP entries for quick reference:

- Click the **bookmark icon** on any entry page
- Access all bookmarks from the **Activity** section
- Remove bookmarks individually as needed

## 8. Personal Terminal

Access your terminal from the sidebar footer or header menu:

- **View** your codename, role, clearance level, and join date
- **Edit** your codename (must remain unique)
- **Change** your login key (requires current key verification)
- **Log out** to end your session

## 9. Search

The global search function (Ctrl+K or click the search icon) searches across:

- SCP entry numbers and names
- Document titles and content

Results are categorized by type (SCP or Document) for quick navigation.

## 10. Interface Controls

### 10.1 Theme

Toggle between **dark mode** and **light mode** using the sun/moon icon in the header. Your preference is saved locally.

### 10.2 Language

Switch between **English** and **Chinese** using the language toggle. All interface text and content labels update accordingly. Your language preference is persisted.

### 10.3 Sidebar

The sidebar can be **collapsed** using the arrow button at the bottom for a wider content area. Navigation remains accessible via the collapsed icon labels.

## 11. Security Notice

- Never share your login key with other personnel
- Report suspicious terminal activity to your site administrator
- All access attempts, including failed authentications, are logged
- Classified information must not be transmitted outside secure channels

## 12. Technical Support

For terminal malfunctions or access issues, contact your site IT department or submit a report through the Foundation's internal ticketing system.

> Document Classification: **Restricted**
> Last Updated: 2026-06-27
> Node: LATOM-7 | Version: 7.2.1`,
    },
    'doc-anomalous-materials': {
      title: 'Anomalous Materials Handling',
      summary:
        'Standard research procedures for handling and analyzing anomalous materials in laboratory settings.',
      content: `# Anomalous Materials Handling

## Safety Protocols

All personnel working with anomalous materials must adhere to the following safety protocols:

- Wear appropriate PPE at all times
- Never handle materials without Level 2+ clearance
- Report any unusual reactions immediately
- Follow decontamination procedures after each session

## Laboratory Procedures

### Preparation

Ensure all equipment is calibrated and sanitized. Verify containment field generators are operational before opening any sample containers.

### Analysis

Use only approved analytical instruments. Record all observations in real-time. Any deviation from expected behavior must be documented and reported to the supervising researcher.

### Storage

Anomalous materials must be returned to their designated containment units within 30 minutes of analysis completion. Never leave materials unattended outside containment.

> Document Classification: **Confidential**`,
    },
    'doc-site-breach-report': {
      title: 'Site-19 Breach Report',
      summary: 'Post-incident analysis of the containment breach at Site-19, Sector-4.',
      content: `# Site-19 Breach Report — Sector-4

## Incident Summary

On 2026-01-18 at approximately 03:47 UTC, a containment breach occurred in Sector-4 of Site-19. The breach involved SCP-████ and resulted in a temporary loss of containment for approximately 12 minutes.

## Timeline

- **03:47** — Automated alarms triggered in Sector-4
- **03:49** — Security teams dispatched to Sector-4
- **03:52** — Perimeter lockdown initiated
- **03:59** — SCP-████ re-contained by MTF Epsilon-11
- **04:01** — All-clear signal issued

## Root Cause

Investigation determined the breach was caused by a failure in the backup power system, which temporarily disrupted the containment field generators. The primary power system had been undergoing scheduled maintenance.

## Recommendations

- Upgrade backup power systems in all Keter-level containment sectors
- Implement redundant containment field generators
- Revise maintenance scheduling to ensure overlap coverage

> Document Classification: **Secret**`,
    },
    'doc-o5-directive-7': {
      title: 'O5 Directive — Protocol Zeta-9',
      summary:
        'Executive directive regarding the activation of Protocol Zeta-9 for XK-class scenarios.',
      content: `# O5 DIRECTIVE — PROTOCOL ZETA-9

## Classification: TOP SECRET — O5 EYES ONLY

## Preamble

This directive establishes the procedures and authorization chain for the activation of Protocol Zeta-9 in the event of an XK-class end-of-the-world scenario.

## Section 1: Activation Authority

Protocol Zeta-9 may only be activated by a unanimous vote of the O5 Council. No single member, regardless of circumstance, may authorize activation independently.

## Section 2: Activation Criteria

The following conditions must be met before activation:

- Confirmed XK-class scenario in progress
- All conventional containment measures exhausted
- Estimated time to total breach: less than 6 hours
- At least 3 O5 Council members available for vote

## Section 3: Execution

Upon activation, the following steps will be executed in sequence:

- Global amnestic distribution via Protocol ALPHA-13
- Activation of all Thaumiel-class assets
- Mobilization of all available Mobile Task Forces
- Implementation of narrative restructuring protocols

## Section 4: Post-Event

Following successful execution, all personnel involved will undergo Class-A amnestic treatment. This directive and all related documentation will be reclassified.

> Document Classification: **Top Secret**`,
    },
    'doc-containment-procedures-guide': {
      title: 'Containment Procedures Guide',
      summary:
        'Standard template and guidelines for authoring, reviewing, and maintaining containment procedures for anomalous objects.',
      content: `# Containment Procedures Guide

## 1. Purpose

This document establishes the standard format, review process, and maintenance requirements for all Foundation containment procedures. Adherence to these guidelines ensures consistency, clarity, and operational reliability across all Foundation sites.

> Containment procedures are the first line of defense. A poorly written procedure can be as dangerous as no procedure at all.

## 2. Procedure Format

### 2.1 Required Sections

Every containment procedure document must include:

- **Item Number** — SCP designation or internal reference number
- **Object Class** — Current containment classification (Safe, Euclid, Keter, Thaumiel, Apollyon, Neutralized)
- **Special Containment Procedures** — Detailed containment requirements
- **Description** — Summary of the anomalous properties
- **Revision History** — Log of all changes with dates and authorizing personnel

### 2.2 Writing Standards

- Use **imperative mood** for all containment instructions ("Place the object in...", not "The object should be placed in...")
- Specify **exact measurements**, temperatures, and temporal intervals
- Include **failure protocols** — what to do if primary containment fails
- Reference **MTF assignments** for objects requiring active containment
- Note all **interaction restrictions** between co-contained objects

## 3. Classification Guidelines

### 3.1 Safe

Objects that can be reliably contained with standard storage. Procedures should focus on:

- Storage environment specifications
- Access authorization requirements
- Routine inspection schedules

### 3.2 Euclid

Objects requiring active monitoring and specialized containment. Procedures must additionally include:

- Behavioral monitoring protocols
- Environmental trigger avoidance
- Personnel interaction limits
- Escalation response procedures

### 3.3 Keter

Objects that are difficult to contain or pose severe breach risk. Procedures must additionally include:

- Multi-layered containment architecture
- Redundant fail-safe systems
- Dedicated MTF assignment
- Omega-level contingency plans
- Continuous monitoring requirements

## 4. Review Process

All containment procedures undergo a three-stage review:

- **Technical Review** — Verified by containment engineering staff for feasibility
- **Safety Review** — Assessed by the Safety Committee for personnel risk
- **Senior Approval** — Authorized by the Site Director or above

Procedure revisions follow the same review process. Emergency provisional procedures may be issued by Level 4+ personnel but must undergo full review within 72 hours.

## 5. Maintenance

- All procedures must be reviewed **annually** at minimum
- Any breach event requires an **immediate procedure audit**
- Keter-class procedures are reviewed **quarterly**
- Outdated procedures are archived, never deleted

> Document Classification: **Restricted**
> Last Updated: 2026-04-10
> Node: LATOM-7 | Version: 7.2.1`,
    },
    'doc-ethics-committee-guidelines': {
      title: 'Ethics Committee Guidelines',
      summary:
        'Guidelines governing human-subject experimentation, D-Class personnel protocols, and ethical boundaries in anomalous research.',
      content: `# Ethics Committee Guidelines

## 1. Mandate

The Ethics Committee is an independent body within the SCP Foundation responsible for overseeing the moral and ethical conduct of all Foundation operations. The Committee has the authority to veto, modify, or suspend any procedure deemed unnecessarily harmful.

> The Foundation's mission does not exempt it from ethical responsibility.

## 2. Human-Subject Experimentation

### 2.1 General Principles

- All experimentation involving human subjects must be approved by the Ethics Committee prior to commencement
- The principle of **proportional risk** applies — the potential knowledge gained must justify the risk to the subject
- Subjects must be informed of the nature of the experiment to the maximum extent possible without compromising security
- All subjects have the right to withdraw at any stage, except when withdrawal itself poses a containment risk

### 2.2 D-Class Personnel

D-Class personnel are individuals sentenced to death or life imprisonment who have been conscripted into Foundation service. The following guidelines apply:

- D-Class personnel are **not** expendable test subjects — their lives have value
- Experiments must have a **reasonable expectation** of producing useful data
- Lethal experiments require **O5-level authorization** and must be justified by extraordinary circumstances
- D-Class personnel must receive adequate medical care, nutrition, and living conditions
- Monthly psychological evaluations are mandatory for all D-Class assigned to active research programs

## 3. Animal Experimentation

- Animal experimentation follows the same proportional risk principles
- Anomalous animals require specialized ethical consideration due to potential sapience
- All animal experimentation must be documented and reviewed quarterly

## 4. Amnestic Use

### 4.1 Authorization Levels

- **Class-A amnestics** (targeted memory erasure): Requires Level 3 authorization
- **Class-B amnestics** (general confusion induction): Requires Level 4 authorization
- **Class-C amnestics** (temporary disorientation): Requires Level 2 authorization
- **Class-W amnestics** (total identity reset): Requires O5 Council authorization

### 4.2 Restrictions

- Amnestics may not be used to cover up Foundation negligence or misconduct
- All amnestic administration must be logged in the Ethics Committee database
- Subjects must be monitored for 72 hours post-administration for adverse effects

## 5. Complaints and Appeals

Any Foundation personnel may file an ethics complaint through the secure internal channel. Complaints are reviewed within 14 business days. Complainants are protected from retaliation under Foundation Directive 42-A.

> Document Classification: **Confidential**
> Last Updated: 2026-02-28
> Node: LATOM-7 | Version: 7.2.1`,
    },
    'doc-cognitohazard-response': {
      title: 'Cognitohazard Response Report',
      summary:
        'Incident report detailing a cognitohazard containment failure at Site-64 and the emergency response protocols enacted.',
      content: `# Cognitohazard Response Report — Site-64

## Classification: TOP SECRET — LEVEL 5 REQUIRED

## Incident Summary

On 2025-12-03 at 14:22 UTC, a cognitohazardous anomaly designated SCP-████ breached its informational containment at Site-64. The breach resulted in exposure of 23 personnel before emergency protocols could be enacted. This report documents the incident timeline, response actions, and corrective measures.

## Background

SCP-████ is a memetic construct capable of propagating through written text. Standard containment involves air-gapped information storage, physical-only document access, and mandatory cognitive screening for all personnel assigned to the project.

## Timeline

- **14:22** — Anomaly detected in Sector-7 document repository during routine audit
- **14:23** — Automated cognitive screening alerts triggered for 3 personnel
- **14:24** — Site-64 Director initiates LOCKDOWN PROTOCOL SIGMA-7
- **14:25** — All Sector-7 personnel isolated; cognitive hazard teams deployed
- **14:31** — Total of 23 confirmed exposures identified through screening
- **14:45** — Amnestic treatment protocol initiated for all affected personnel
- **15:30** — All affected personnel treated and cleared through secondary screening
- **16:00** — Containment re-established; Sector-7 cleared for limited operations

## Root Cause Analysis

Investigation determined the breach originated from a corrupted data transfer during a routine system migration. The anomaly exploited a gap in the air-gap protocol when a technician connected a temporary diagnostic device to the primary repository without proper authorization.

## Casualties

- **Fatalities:** 0
- **Permanent cognitive impairment:** 2 (Personnel D-8842, D-9103)
- **Temporary exposure effects:** 21 (all resolved with amnestic treatment)

## Corrective Actions

- All air-gap protocols upgraded to include physical port disabling on all repository terminals
- Mandatory two-person verification for any hardware connection to classified systems
- Enhanced cognitive screening frequency for all Site-64 personnel (monthly → weekly)
- Additional MTF Psi-7 ("Home Improvement") assets assigned to Site-64 security

## Lessons Learned

> The most dangerous breaches are not physical — they are informational. A locked door means nothing if the knowledge behind it can walk out through a human mind.

> Document Classification: **Top Secret**
> Last Updated: 2025-12-05
> Node: LATOM-7 | Version: 7.2.1`,
    },
    'doc-mtf-deployment-records': {
      title: 'MTF Deployment Records — Q3 2025',
      summary:
        'Operational summary of Mobile Task Force deployments, mission outcomes, and casualty reports for the third quarter of 2025.',
      content: `# Mobile Task Force Deployment Records

## Q3 2025 — Operational Summary

## Classification: SECRET — LEVEL 4 REQUIRED

## Overview

This document provides a summary of all Mobile Task Force deployments during the third quarter of 2025 (July–September). A total of 47 deployments were authorized across 12 active MTFs.

## Deployment Statistics

| Metric | Value |
|--------|-------|
| Total Deployments | 47 |
| Successful Missions | 42 (89.4%) |
| Partial Success | 3 (6.4%) |
| Failed Missions | 2 (4.2%) |
| Personnel Deployed | 312 |
| Casualties (KIA) | 4 |
| Casualties (WIA) | 17 |

## Notable Deployments

### MTF Epsilon-11 ("Nine-Tailed Fox")

**Mission:** Re-containment of SCP-████ at Site-19, Sector-4
**Date:** 2025-07-14
**Outcome:** Success

Epsilon-11 successfully re-contained SCP-████ within 12 minutes of breach notification. Zero casualties. Recommended for commendation.

### MTF Alpha-1 ("Red Right Hand")

**Mission:** Secure and transport SCP-████ from Site-64 to Site-01
**Date:** 2025-08-03
**Outcome:** Success

High-security transport completed without incident. Route counter-surveillance confirmed no external tracking.

### MTF Zeta-9 ("Mole Rats")

**Mission:** Exploration and mapping of SCP-████ subterranean structure
**Date:** 2025-08-21
**Outcome:** Partial Success

Exploration team encountered unexpected spatial anomalies. 3 of 8 team members required extraction. Mapping 67% complete. Further exploration pending revised safety protocols.

### MTF Psi-7 ("Home Improvement")

**Mission:** Site-64 cognitohazard response and containment restoration
**Date:** 2025-12-03
**Outcome:** Success (see Incident Report doc-cognitohazard-response)

## Casualty Report

| MTF | Operation | KIA | WIA | Status |
|-----|-----------|-----|-----|--------|
| Epsilon-11 | Site-19 breach | 0 | 2 | Recovered |
| Zeta-9 | Subterranean exploration | 1 | 4 | Under review |
| Nu-7 ("Hammer Down") | Site-██ perimeter defense | 2 | 8 | Posthumous commendation |
| Mu-3 ("Extra Eyes") | Surveillance operation | 1 | 3 | Under investigation |

## Recommendations

- Increase Zeta-9 team size for subterranean operations from 8 to 12
- Upgrade Nu-7 heavy equipment allocation for perimeter defense scenarios
- Review Mu-3 surveillance protocols following the loss of Operative ████████

> Document Classification: **Secret**
> Last Updated: 2025-10-01
> Node: LATOM-7 | Version: 7.2.1`,
    },
  },
  about: {
    title: 'About the Foundation',
    description: 'Understanding the SCP Foundation and the Latom Node documentation system.',
    hero: {
      badge: 'LEVEL 4 // NODE LATOM-7 // CLASSIFIED',
    },
    foundation: {
      title: 'The SCP Foundation',
      p1: 'The SCP Foundation is a clandestine organization operating under the authority of the United Nations and various world governments. Its mission is to secure, contain, and protect anomalous objects, entities, and phenomena that pose a threat to normalcy and human civilization.',
      p2: 'Founded in the early 19th century following a series of unexplained events that threatened global stability, the Foundation has grown into a vast global network of secure facilities, cutting-edge research laboratories, and elite mobile task forces. Operating from over 300 sites worldwide, the Foundation employs tens of thousands of personnel — from field agents and researchers to containment specialists and administrative staff.',
      p3: 'The Foundation operates under three core principles: Secure — locate and acquire anomalous objects before they fall into civilian or hostile hands; Contain — develop and maintain reliable containment procedures to prevent manifestation, migration, or adverse effects; Protect — shield the civilian population from anomalous threats and preserve the normalcy of everyday life. These principles guide every decision, from the allocation of D-Class personnel to the authorization of Omega-class end-of-the-world scenarios.',
    },
    latomNode: {
      title: 'The Latom Node',
      p1: "The Latom Node is a documentation terminal within the Foundation's decentralized information network. It serves as a comprehensive archival and retrieval system for SCP entries, containment procedures, research documents, incident reports, and operational protocols.",
      p2: 'Designated as Node LATOM-7, this terminal operates under Level 4 clearance and maintains continuous synchronization with the central Foundation database via encrypted quantum-entangled communication channels. Data integrity is verified through multi-layered cryptographic checksums updated every synchronization cycle.',
      p3: 'The node employs a triple-redundant storage architecture ensuring zero data loss even under catastrophic breach conditions. All document access is logged, timestamped, and cross-referenced with personnel clearance records. Anomalous data patterns are automatically flagged for review by the Department of Analytics.',
    },
    classification: {
      title: 'Object Classification System',
      desc: 'The Foundation classifies all anomalous objects based on the difficulty of their containment and the severity of a potential breach. This system is not a measure of threat level — a Safe-class object can be just as lethal as a Keter-class one if mishandled.',
      safe: {
        name: 'Safe',
        desc: 'Objects that are easily and safely contained. Minimal risk when proper procedures are followed. These objects can be reliably secured in standard storage with minimal resource expenditure.',
        level: 'Containment Difficulty: Low',
      },
      euclid: {
        name: 'Euclid',
        desc: 'Objects requiring more extensive containment procedures. Behavior is not fully understood or predictable. These objects demand dedicated containment protocols and regular monitoring to prevent unexpected manifestation or migration.',
        level: 'Containment Difficulty: Moderate',
      },
      keter: {
        name: 'Keter',
        desc: 'Objects that are exceedingly difficult to contain consistently or pose significant threat if breached. These objects require extraordinary resource expenditure, specialized facilities, and often involve high-risk procedures to maintain containment.',
        level: 'Containment Difficulty: High',
      },
      thaumiel: {
        name: 'Thaumiel',
        desc: "Objects used by the Foundation to contain or counteract other anomalous entities or phenomena. These objects are exceptionally rare and represent some of the Foundation's most closely guarded secrets.",
        level: 'Containment Difficulty: N/A (Foundation-Utilized)',
      },
      apollyon: {
        name: 'Apollyon',
        desc: 'Objects that cannot be contained, are expected to breach imminently, and pose an existential or catastrophic threat to humanity or reality itself. Designation is reserved for scenarios where all standard containment has failed or is impossible.',
        level: 'Containment Difficulty: Impossible',
      },
      neutralized: {
        name: 'Neutralized',
        desc: 'Objects that are no longer anomalous, have been destroyed, or have lost their anomalous properties. These objects are retained for archival purposes and may be studied to develop improved containment methodologies.',
        level: 'Containment Difficulty: N/A (Decommissioned)',
      },
    },
    spectrum: {
      title: 'Containment Spectrum',
      desc: 'The classification spectrum represents the escalating complexity of containment procedures required for each object class.',
      from: 'Easily Contained',
      to: 'Uncontainable',
    },
    security: {
      title: 'Security Protocols',
      desc: 'The Foundation employs a multi-layered security architecture to protect classified information and operational integrity.',
      item1Title: 'Clearance Levels',
      item1Desc:
        'Personnel are assigned clearance levels from Level 0 (General) to Level 5 (O5 Command). Each level grants access to progressively sensitive information. Level 4 personnel, such as those operating this node, have access to most SCP documentation and operational data.',
      item2Title: 'Document Classification',
      item2Desc:
        'All Foundation documents are classified as Unrestricted, Restricted, Confidential, Secret, or Top Secret. Classification determines who may access, copy, or distribute the document. Unauthorized access attempts are automatically logged and reported to Internal Security.',
      item3Title: 'Amnestic Protocols',
      item3Desc:
        'In the event of information leaks or civilian exposure, the Foundation deploys targeted amnestic treatments to preserve operational security. Class-A amnestics erase specific memories; Class-B amnestics cause general confusion; Class-C amnestics induce temporary disorientation.',
    },
    structure: {
      title: 'Foundation Structure',
      desc: 'The Foundation operates through a hierarchical organizational structure designed for maximum operational efficiency and information compartmentalization.',
      item1Title: 'O5 Council',
      item1Desc:
        'The Overseer Council consists of thirteen individuals with the highest authority within the Foundation. They operate with full autonomy, answering to no government or organization. Their identities are classified even from most Foundation personnel.',
      item2Title: 'Ethics Committee',
      item2Desc:
        'An independent body responsible for overseeing the moral and ethical conduct of Foundation operations. The Committee has the authority to veto containment procedures deemed unnecessarily cruel or dangerous to personnel.',
      item3Title: 'Mobile Task Forces',
      item3Desc:
        'Specialized teams deployed to handle specific types of anomalous threats. Each MTF is composed of personnel selected for relevant expertise, from combat operatives to field researchers. Over 100 active MTFs operate worldwide.',
      item4Title: 'Site Directors',
      item4Desc:
        'Each Foundation facility is managed by a Site Director with full operational authority over their assigned location. Site Directors report directly to the O5 Council and are responsible for containment, research, and personnel management.',
    },
    system: {
      title: 'System Information',
      terminal: 'Terminal',
      version: 'Version',
      clearance: 'Clearance',
      status: 'Status',
      lastSync: 'Last Sync',
      operational: 'Operational',
      protocol: 'Protocol',
      protocolValue: 'AUTO-OPERATION',
      uptime: 'Uptime',
      uptimeValue: '99.97%',
      encryption: 'Encryption',
      encryptionValue: 'AES-256-GCM',
    },
    footer: {
      disclaimer:
        'The SCP Foundation is a fictional organization from the collaborative writing project at scpwiki.com. This documentation system is a fan-created thematic interface. All SCP content is licensed under CC BY-SA 3.0.',
    },
  },
  terminal: {
    status: 'CONNECTED',
    maximize: 'Maximize',
    minimize: 'Restore',
    statNode: 'NODE',
    statUser: 'USER',
    statStatus: 'STATUS',
    chromeSecure: 'SECURE',
    statusConnected: 'CONNECTED',
    statusSecure: 'ENCRYPTED',
    hintHelp: 'commands',
    hintHistory: 'history',
    hintTab: 'complete',
    hintClear: 'clear',
    confirmTitle: 'Launch Terminal?',
    confirmDesc:
      'You are about to access the LATOM-7 secure terminal. All activity is monitored and logged for security purposes.',
    confirmLaunch: 'Launch',
    confirmBack: 'Go Back',
    exitTerminal: 'Exit',
  },
  experimental: {
    title: 'Experimental Features',
    desc: 'Enable experimental features that are still in development. These may be unstable or change without notice.',
    terminal: 'Terminal',
    terminalDesc:
      'Interactive documentation terminal with SCP-themed virtual filesystem and 50+ commands.',
  },
  notFound: {
    accessDenied: 'ACCESS DENIED',
    title: 'Document Not Found',
    description:
      'The requested file does not exist in the Latom Node database, or you lack the necessary clearance to access it. All access attempts have been logged.',
    errorCode: 'ERROR CODE',
    errValue: 'ERR-404-RESOURCE',
    terminal: 'TERMINAL',
    timestamp: 'TIMESTAMP',
    returnBtn: 'Return to Main Terminal',
  },
  search: {
    placeholder: 'Search SCP entries, documents...',
    results: '{count} results',
    scp: 'SCP',
    doc: 'DOC',
    empty: 'No results found for "{query}"',
  },
  classes: {
    Safe: 'Safe',
    Euclid: 'Euclid',
    Keter: 'Keter',
    Thaumiel: 'Thaumiel',
    Apollyon: 'Apollyon',
    Neutralized: 'Neutralized',
  },
  classification: {
    Unclassified: 'Unclassified',
    Restricted: 'Restricted',
    Confidential: 'Confidential',
    Secret: 'Secret',
    'Top Secret': 'Top Secret',
  },
  auth: {
    loginTitle: 'Access Terminal',
    loginSubtitle: 'Enter your work codename and login key',
    registerTitle: 'Personnel Registration',
    registerSubtitle: 'Create your Foundation credentials',
    codename: 'Work Codename',
    codenamePlaceholder: 'e.g. agent_alpha',
    codenameHint: '3-32 characters, letters, numbers, underscores',
    password: 'Login Key',
    passwordPlaceholder: 'Enter your login key',
    confirmPassword: 'Confirm Login Key',
    confirmPasswordPlaceholder: 'Re-enter your login key',
    loginBtn: 'Authenticate',
    registerBtn: 'Register',
    noAccount: 'No account?',
    hasAccount: 'Already registered?',
    registerLink: 'Register here',
    loginLink: 'Sign in',
    profile: 'Personal Terminal',
    profileDesc: 'View and manage your Foundation credentials.',
    role: 'Role',
    clearance: 'Clearance',
    joinedAt: 'Joined',
    editCodename: 'Work Codename',
    changePassword: 'Login Key',
    currentPassword: 'Current Key',
    newPassword: 'New Key',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    logout: 'Logout',
    codenameUpdated: 'Codename updated successfully.',
    passwordUpdated: 'Login key updated successfully.',
    loginSuccess: 'Authentication successful.',
    registerSuccess: 'Registration complete. Welcome to the Foundation.',
    errors: {
      codenameFormat: 'Codename must be 3-32 characters: letters, numbers, or underscores.',
      passwordLength: 'Login key must be at least 8 characters.',
      passwordMismatch: 'Login keys do not match.',
    },
  },
  proposals: {
    title: 'Proposals',
    description: 'Submit and vote on Foundation operational proposals.',
    submit: 'Submit Proposal',
    submitDesc: 'Create a new proposal for Foundation review.',
    templateTitle: 'Proposal Template',
    template:
      '## Objective\n\n[Describe the objective of this proposal]\n\n## Justification\n\n[Explain why this proposal is necessary]\n\n## Implementation\n\n[Detail the proposed implementation steps]\n\n## Expected Outcome\n\n[Describe the expected results]',
    titleLabel: 'Title',
    titlePlaceholder: 'Brief proposal title (5-200 characters)',
    contentLabel: 'Content',
    contentPlaceholder: 'Use the template above to structure your proposal...',
    categoryLabel: 'Category',
    categories: {
      protocol: 'Protocol',
      research: 'Research',
      containment: 'Containment',
      general: 'General',
    },
    dailyLimit: 'Daily limit: {max} proposals per day ({used} used today)',
    dailyLimitReached: 'You have reached the daily proposal limit ({max} per day).',
    vote: {
      for: 'For',
      against: 'Against',
      abstain: 'Abstain',
      cast: 'Cast Vote',
      alreadyVoted: 'You have already voted on this proposal.',
      immutable: 'Votes cannot be changed once cast.',
      success: 'Vote recorded successfully.',
    },
    status: {
      open: 'Open',
      approved: 'Approved',
      rejected: 'Rejected',
    },
    votes: '{for} for · {against} against · {abstain} abstain',
    by: 'by {author}',
    empty: 'No proposals found.',
    createSuccess: 'Proposal submitted successfully.',
    back: 'Back to Proposals',
    view: 'View Details',
  },
  activity: {
    title: 'Activity',
    bookmarksTab: 'Bookmarks',
    historyTab: 'History',
    retry: 'Retry',
  },
  history: {
    title: 'Browsing History',
    empty: 'No browsing history yet.',
    clearAll: 'Clear All',
    confirmClear: 'Are you sure you want to clear all browsing history?',
    delete: 'Remove from history',
    visited: 'Visited',
    entries: '{count} entries',
    all: 'All',
    yes: 'Yes',
    no: 'No',
  },
  bookmarks: {
    title: 'Bookmarked Entries',
    description: 'Your saved SCP entries collection.',
    empty: 'No bookmarks yet.',
    emptyHint: 'Browse entries and bookmark your favorites.',
    add: 'Bookmark this entry',
    remove: 'Remove bookmark',
    count: '{count} bookmark(s)',
  },
  errors: {
    'ERR-NETWORK': 'Network error. Check your connection and try again.',
    'ERR-TIMEOUT': 'Request timed out. Please try again.',
    'ERR-OFFLINE': 'You appear to be offline.',
    'ERR-400-REQUEST': 'Invalid request. Please check your input.',
    'ERR-401-CLEARANCE': 'Insufficient clearance. Authentication required.',
    'ERR-403-ACCESS': 'Access denied. You lack the required authorization.',
    'ERR-404-RESOURCE': 'Resource not found.',
    'ERR-409-CONFLICT': 'Conflict. The resource has been modified.',
    'ERR-429-THROTTLE': 'Too many requests. Please wait before trying again.',
    'ERR-500-SYSTEM': 'System error. The server encountered an internal failure.',
    'ERR-503-MAINTENANCE': 'System under maintenance. Please try again later.',
    'ERR-AUTH-EXPIRED': 'Session expired. Please authenticate again.',
    'ERR-AUTH-INVALID': 'Invalid credentials. Access denied.',
    'ERR-AUTH-REQUIRED': 'Authentication required to access this resource.',
    'ERR-UNKNOWN': 'An unknown error has occurred.',
    'ERR-RENDER-FAULT': 'A rendering error has occurred.',
    'ERR-CHUNK-LOAD': 'Failed to load application resources.',
    retry: 'Retry',
  },
  ai: {
    title: 'AI Assistant',
    newConversation: 'New Conversation',
    send: 'Send',
    placeholder: 'Type your message...',
    deleteConfirm: 'Delete this conversation?',
    noConversations: 'No conversations yet. Start a new one!',
    thinking: 'Thinking...',
    conversations: 'Conversations',
    regenerate: 'Regenerate',
  },
}
