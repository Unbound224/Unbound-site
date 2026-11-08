# Security and contribution controls

Every repository has a protected main branch and a layered pull-request gate.

## Required controls

* One approving review and code-owner review are required.
* Required status checks include dependency-review and malware-guard, alongside repository build, test and documentation jobs.
* GitHub CodeQL default setup is enabled.
* GitHub secret scanning, push protection and Dependabot security updates are enabled.
* Workflow and code-owner files are themselves code-owner protected.

## Malware guard boundaries

The PR guard blocks added executable artifacts, hidden Unicode or BiDi controls, and common high-risk download/execute or obfuscation patterns. Dependency review blocks disallowed dependency changes. CodeQL analyzes supported code and workflow languages.

No CI system can guarantee detection of every novel malicious payload. The remaining controls are constrained contribution scope, independent review, protected workflow files, dependency review and runtime review.

## Contributor expectations

Use one scoped change per pull request, run documented checks, do not add binary executables, do not weaken CI to make a change pass, and keep credentials out of source control. Each repository includes CONTRIBUTING.md and SECURITY.md.
