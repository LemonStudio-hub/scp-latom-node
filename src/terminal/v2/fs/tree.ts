/**
 * Default SCP-themed filesystem tree.
 *
 * Content mirrors the legacy `filesystem/default-tree.ts` one-for-one so
 * that existing command behavior and tests stay valid. The tree is
 * constructed fresh on each call so callers may mutate freely.
 */

import { file, dir } from './node'
import type { FSNode } from '../types'

const ASCII_ART = `
 ███████╗ ██████╗██████╗     ███████╗██╗   ██╗██████╗
 ██╔════╝██╔════╝██╔══██╗    ██╔════╝██║   ██║██╔══██╗
 ███████╗██║     ██████╔╝    █████╗  ██║   ██║██████╔╝
 ╚════██║██║     ██╔═══╝     ██╔══╝  ╚██╗ ██╔╝██╔═══╝
 ███████║╚██████╗██║         ███████╗ ╚████╔╝ ██║
 ╚══════╝ ╚═════╝╚═╝         ╚══════╝  ╚═══╝  ╚═╝
`

export function createDefaultTree(): FSNode {
  return dir('/', [
    dir('etc', [
      file('hostname', 'LATOM-7\n'),
      file(
        'motd',
        `${ASCII_ART}
  ╔══════════════════════════════════════════════════════════════╗
  ║  LATOM NODE DOCUMENTATION TERMINAL v7.2.1                   ║
  ║  Secure. Contain. Protect.                                  ║
  ║                                                              ║
  ║  Authorized personnel only. All activity is monitored.       ║
  ║  Unauthorized access will result in immediate termination.   ║
  ╚══════════════════════════════════════════════════════════════╝
`,
      ),
      file(
        'passwd',
        'root:x:0:0:root:/root:/bin/bash\nresearcher:x:1000:1000:Dr. Researcher:/home/researcher:/bin/bash\nagent:x:1001:1001:Field Agent:/home/agent:/bin/bash\n',
      ),
      file('issue', 'SCP Foundation - Latom Node\nKernel \\r on an \\m\n\nACCESS LEVEL: 4\n'),
    ]),
    dir('scp', [
      file(
        'scp-173.txt',
        `Item #: SCP-173

Object Class: Euclid

Special Containment Procedures: Item SCP-173 is to be kept in a locked container at all times.
When personnel must enter the container, no fewer than three (3) individuals may enter at any
time and the door is to be relocked behind them. At all times, two (2) persons must maintain
direct eye contact with SCP-173 until all personnel have vacated and relocked the container.

Description: SCP-173 is a concrete sculpture of unknown origin, standing approximately 2 meters
tall. The sculpture is constructed from concrete and rebar with traces of Krylon brand spray
paint. SCP-173 is animate and extremely hostile. The object cannot move while within a direct
line of sight of any observer. Line of sight must not be broken at any time with SCP-173.
Refer to document SCP-173-FR for field reports.
`,
      ),
      file(
        'scp-049.txt',
        `Item #: SCP-049

Object Class: Euclid

Special Containment Procedures: SCP-049 is contained within a Standard Secure Humanoid
Containment Cell at Site-19. SCP-049 must be sedated before any transportation and
must be under constant observation by two (2) armed guards.

Description: SCP-049 is a humanoid entity roughly 1.9 meters in height which bears the
outward appearance of a medieval plague doctor. While SCP-049 is generally cooperative
with Foundation staff, it can become extremely hostile when it perceives the presence of
what it refers to as "the Pestilence".
`,
      ),
      file(
        'scp-096.txt',
        `Item #: SCP-096

Object Class: Euclid

Special Containment Procedures: SCP-096 is to be contained in a sealed, airtight steel cube
measuring 5 meters on each side. Under no circumstances may any visual recording devices or
photographs be allowed inside the cell. Personnel interacting with SCP-096 must undergo
extensive psychological screening.

Description: SCP-096 is an emaciated, pale-skinned humanoid standing approximately 2.38
meters tall. Its arms are grossly disproportionate to its body, measuring approximately 1.5
meters each. SCP-096's jaw can open to four (4) times the normal human maximum.
`,
      ),
      file(
        'scp-682.txt',
        `Item #: SCP-682

Object Class: Keter

Special Containment Procedures: SCP-682 must be destroyed as soon as possible. At this time,
no means available to SCP's team are capable of destroying SCP-682. SCP-682 is to be contained
in a 5m x 5m x 5m container with 25cm reinforced acid-resistant steel plate at all times.

Description: SCP-682 is a large, vaguely reptilian creature of unknown origin. It appears to
be extremely intelligent, and was observed to engage in complex communication with SCP-079
during their limited time of exposure. SCP-682 has shown an ability to regrow limbs and
adapt to virtually any damage inflicted upon it.
`,
      ),
      file(
        'scp-999.txt',
        `Item #: SCP-999

Object Class: Thaumiel

Special Containment Procedures: SCP-999 is to be contained in a standard Safe-class
containment locker at Site-██. Personnel are encouraged to interact with SCP-999 on a
regular basis to improve morale. Requests for interaction with SCP-999 are to be approved
by the site director.

Description: SCP-999 is a large, amorphous, gelatinous mass of translucent orange slime,
weighing approximately 54 kg. SCP-999's dimensions are known to change, but it most
commonly assumes the shape of a large dog. SCP-999 appears to be sentient and has a
friendly, playful disposition.
`,
      ),
      file(
        'scp-087.txt',
        `Item #: SCP-087

Object Class: Euclid

Special Containment Procedures: The door leading to SCP-087 is to be secured with a
padlocked cover and surveillance camera. No personnel are to enter SCP-087 without prior
authorization from Level 4 personnel.

Description: SCP-087 is a staircase that appears to descend at a 38-degree angle. The
staircase consists of approximately 13 flights, each containing 13 steps. At each
landing, a faint crying sound can be heard from below. The source of the sound has
not been determined. Exploration attempts have failed to reach the bottom.
`,
      ),
      file(
        'scp-914.txt',
        `Item #: SCP-914

Object Class: Safe

Special Containment Procedures: SCP-914 is to be kept in a secured research bay at
Site-19. Only personnel with Level 3 clearance or higher may operate SCP-914.
All items processed through SCP-914 must be logged in Experiment Log 914.

Description: SCP-914 is a large clockwork device consisting of a main body, an
intake booth, an output booth, and a large knob with settings labeled "Rough",
"Coarse", "1:1", "Fine", and "Very Fine". When an object is placed in the intake
booth and the key is wound, the object is processed according to the knob setting.
`,
      ),
      file(
        'scp-035.txt',
        `Item #: SCP-035

Object Class: Keter

Special Containment Procedures: SCP-035 is to be contained in a sealed glass
container in a secure containment chamber at Site-19. The container must be
hermetically sealed and surrounded by a minimum of 2 cm of lead lining.
Personnel must wear full hazmat gear when entering the containment chamber.

Description: SCP-035 appears to be a white porcelain comedy mask, though at
times it will change to tragedy. The mask is capable of speech and displays
a high level of intelligence. SCP-035 has demonstrated the ability to
psychically influence individuals within a 5-meter radius.
`,
      ),
      file(
        'scp-106.txt',
        `Item #: SCP-106

Object Class: Keter

Special Containment Procedures: SCP-106 is to be contained in a sealed container
consisting of twenty-five (25) layers of lead-lined steel, each separated by
no less than 36 cm of open space. The container is to be suspended in a
fluid-filled chamber by no less than thirty (30) hydraulic clamps.

Description: SCP-106 appears to be an elderly humanoid, with a general appearance
of advanced decomposition. SCP-106 is capable of passing through solid matter,
leaving behind a large amount of corrosive substance. SCP-106 will attempt to
lure prey into its "pocket dimension" for later retrieval.
`,
      ),
      file(
        'scp-131.txt',
        `Item #: SCP-131

Object Class: Safe

Special Containment Procedures: SCP-131-A and SCP-131-B are to be housed in a
standard Safe-class containment locker at Site-19. Personnel are permitted to
interact with SCP-131 instances during designated hours. Both instances must be
kept together at all times.

Description: SCP-131-A and SCP-131-B are a pair of small, teardrop-shaped
creatures approximately 30 cm in height. Each instance has a single large
eye and is capable of rapid locomotion. The instances are extremely friendly
and have been observed to follow personnel around the facility.
`,
      ),
    ]),
    dir('documents', [
      file(
        'protocol-omega.txt',
        `CLASSIFICATION: TOP SECRET
DOCUMENT ID: FO-PROTOCOL-OMEGA-7

PROTOCOL OMEGA-7: CONTAINMENT BREACH RESPONSE

In the event of a catastrophic containment breach at any Foundation site, the following
protocol is to be enacted immediately:

1. All non-essential personnel are to evacuate to designated safe zones.
2. MTF Epsilon-11 ("Nine-Tailed Fox") is to be deployed for re-containment operations.
3. Site director may authorize the use of lethal force against hostile entities.
4. Amnestic distribution to civilian witnesses is to begin within 6 hours.
5. Cover story GAMMA-5 ("Need to Know") is to be distributed to media outlets.

Failure to comply with this protocol is grounds for immediate reassignment to Keter
duty. The Foundation's existence must be preserved at all costs.

Secure. Contain. Protect.
`,
      ),
      file(
        'site-directive.txt',
        `CLASSIFICATION: CONFIDENTIAL
DOCUMENT ID: FO-SITE-LATOM-7

SITE DIRECTIVE — LATOM NODE

This node serves as a regional documentation and archival center for anomalous objects
under Foundation jurisdiction. All personnel assigned to this node are subject to the
following directives:

1. Maintain operational security at all times.
2. Report any anomalous activity to the site director within 30 minutes.
3. Unauthorized access to restricted files will result in disciplinary action.
4. Regular psychological evaluations are mandatory for all Level 3+ personnel.
5. Emergency evacuation procedures are posted in all common areas.

Node Status: ACTIVE
Security Level: LEVEL 4
Assigned MTF: Sigma-7 ("Samsara")
`,
      ),
      file(
        'incident-report-2024-03.txt',
        `CLASSIFICATION: RESTRICTED
DOCUMENT ID: IR-2024-0312-LATOM

INCIDENT REPORT — MARCH 2024

Date: 2024-03-12
Location: Site-19, Wing C
Reporting Officer: Dr. ████████

Summary: During routine inspection of SCP-████'s containment cell, a minor breach
was detected in the secondary seal. The breach was contained within 12 minutes.
No casualties reported. SCP-████ remained cooperative throughout the incident.

Root Cause: Corrosion of the containment seal due to prolonged exposure to anomalous
effluvium. Maintenance schedule has been updated to quarterly inspections.

Action Items:
- Replace all secondary seals in Wing C (Due: 2024-04-01)
- Review containment procedures for similar entities
- Update emergency response protocols
`,
      ),
    ]),
    dir('logs', [
      file(
        'access.log',
        `[2024-03-15 08:12:33] LOGIN  researcher@LATOM-7 session=a7f3b2c1 ip=10.0.4.22
[2024-03-15 08:14:01] ACCESS /scp/scp-173.txt user=researcher level=2
[2024-03-15 08:15:44] ACCESS /documents/protocol-omega.txt user=researcher level=4
[2024-03-15 09:30:12] LOGIN  agent@LATOM-7 session=d4e5f6a7 ip=10.0.4.55
[2024-03-15 09:31:00] ACCESS /scp/scp-682.txt user=agent level=3
[2024-03-15 10:05:22] ALERT  Failed login attempt from ip=10.0.9.99
[2024-03-15 10:05:23] ALERT  Failed login attempt from ip=10.0.9.99
[2024-03-15 10:05:24] ALERT  Failed login attempt from ip=10.0.9.99
[2024-03-15 10:05:25] BLOCK  ip=10.0.9.99 blocked after 3 failed attempts
[2024-03-15 11:20:00] LOGOUT researcher@LATOM-7 session=a7f3b2c1
[2024-03-15 12:00:00] SYSTEM Routine backup completed successfully
[2024-03-15 14:30:15] LOGIN  researcher@LATOM-7 session=b8c9d0e1 ip=10.0.4.22
`,
      ),
      file(
        'system.log',
        `[2024-03-15 00:00:00] SYSTEM Daily integrity check started
[2024-03-15 00:02:34] SYSTEM Integrity check PASSED — all checksums valid
[2024-03-15 04:00:00] SYSTEM Backup rotation: daily → weekly (7d retention)
[2024-03-15 06:00:00] SYSTEM Network diagnostics: all nodes responding
[2024-03-15 06:00:01] SYSTEM LATOM-7 status: ONLINE — uptime 847d 14h 22m
[2024-03-15 08:00:00] SYSTEM Shift change: Night → Day crew
[2024-03-15 12:00:00] SYSTEM Containment check: all SCPs accounted for
[2024-03-15 16:00:00] SYSTEM Shift change: Day → Evening crew
[2024-03-15 20:00:00] SYSTEM Shift change: Evening → Night crew
`,
      ),
    ]),
    dir('home', [
      dir('researcher', [
        file(
          'notes.txt',
          `Personal Research Notes — Dr. Researcher
==========================================

2024-03-10: Completed review of SCP-173 field reports. The entity's movement
pattern appears to be non-random. Further analysis required.

2024-03-12: Requested access to SCP-████ files. Waiting for Level 5 approval.

2024-03-14: New containment procedures for SCP-087 seem effective. The sound
from below has decreased in intensity by approximately 30%.

TODO:
- Finish quarterly containment review
- Submit psychological evaluation (due: 2024-03-31)
- Update personal research database
`,
        ),
        file(
          '.bashrc',
          `# SCP Foundation — Researcher Terminal Configuration
export PS1='\\u@\\h:\\w\\$ '
export EDITOR=vim
export PATH=$PATH:/opt/scf/bin
alias ll='ls -la'
alias cls='clear'
alias containment='cat /documents/protocol-omega.txt'
`,
        ),
        dir('projects', [
          file(
            'containment-review.md',
            `# Containment Review — Q1 2024
## Status: IN PROGRESS

### Reviewed:
- [x] SCP-173 — Containment procedures adequate
- [x] SCP-049 — Sedation protocol updated
- [ ] SCP-096 — Pending psychological eval
- [ ] SCP-682 — Requires MTF oversight

### Notes:
All Safe-class objects passed inspection.
Euclid-class reviews require Level 3+ authorization.
Keter-class reviews deferred to site director.
`,
          ),
          file(
            'research-log.txt',
            `Research Log — Dr. Researcher
==============================
2024-02-28: Began cross-referencing SCP-087 exploration logs
2024-03-05: Identified pattern in SCP-173 movement timestamps
2024-03-08: Submitted request for SCP-████ interview
2024-03-12: Received Level 5 approval — proceeding next week
2024-03-15: Compiled containment effectiveness report
`,
          ),
        ]),
      ]),
      dir('agent', [
        file(
          'mission-brief.txt',
          `FIELD AGENT MISSION BRIEF
=========================
Classification: RESTRICTED
Agent: ████████ (Callsign: ECHO-7)
Assignment: LATOM-7 External Security

Objective: Monitor civilian activity within 5km radius
of Site-19. Report any potential breaches to site director.

Rules of Engagement:
- Do NOT engage anomalies without MTF backup
- Amnestic kits must be carried at all times
- Check in every 6 hours via secure channel

Status: ACTIVE
`,
        ),
        file(
          '.bashrc',
          `# SCP Foundation — Field Agent Terminal Configuration
export PS1='\\u@\\h:\\w\\$ '
export EDITOR=nano
alias quick='cat /documents/protocol-omega.txt'
`,
        ),
      ]),
    ]),
    dir('proc', [
      file('uptime', '847d 14h 22m 05s\n'),
      file(
        'cpuinfo',
        'Foundation Neural Core v3.1\nCores: 8\nFrequency: 3.2 GHz\nArchitecture: x86_64\n',
      ),
      file(
        'meminfo',
        'MemTotal: 524288 kB\nMemFree: 393216 kB\nMemAvailable: 409600 kB\nBuffers: 16384 kB\nCached: 65536 kB\n',
      ),
      file(
        'version',
        'SCF-Linux version 6.1.0-scf (foundation@build-node) (gcc version 12.2.0) #1 SMP Foundation x86_64\n',
      ),
      file(
        'status',
        'Name: LATOM-7\nState: S (running)\nPid: 1\nPPid: 0\nThreads: 64\nVmRSS: 131072 kB\n',
      ),
    ]),
    dir('tmp', []),
    dir('mnt', [
      dir('archive', [
        file(
          'readme.txt',
          `ARCHIVE MOUNT POINT
===================
This directory contains archived documents from
decommissioned Foundation sites. Access requires
Level 4+ authorization.

Last synced: 2024-03-01
Status: READ-ONLY
`,
        ),
      ]),
    ]),
    dir('opt', [
      dir('scf', [
        dir('bin', [
          file('scf-version', 'SCP Foundation Terminal v7.2.1\nBuild: 2024-03-15\nNode: LATOM-7\n'),
        ]),
      ]),
    ]),
    dir('var', [
      dir('log', [
        file(
          'lastlog',
          'researcher  pts/0  10.0.4.22  Fri Mar 15 14:30:15 +0000 2024\nagent      pts/1  10.0.4.55  Fri Mar 15 09:30:12 +0000 2024\n',
        ),
      ]),
    ]),
  ])
}
