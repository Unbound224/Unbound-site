# Drips Wave work plan

The repositories contain scoped issues labeled Stellar Wave. They are organized so contributors can select work without crossing an unnecessary product boundary.

| Area                        | Typical scope                                                                |
| --------------------------- | ---------------------------------------------------------------------------- |
| Soroban contracts           | Invariant tests, event coverage, auth hardening and deployment scripting     |
| SDK and protocol            | Encoders, validation, transport behavior and client tests                    |
| Application and API         | Wallet transaction builders, state reconciliation and frontend accessibility |
| Indexing and operations     | Event recovery, database reconciliation and runtime observability            |
| Documentation and community | Guides, examples, contributor experience and release evidence                |

## Dependency ordering

Contract interfaces and event shapes come first. Indexer and API adapters consume those interfaces next. Frontend and mobile work follows the verified service and contract surface. Cross-repository dependencies belong in the issue before implementation.

## How to choose a task

1. Open a repository's Stellar Wave issue list.
2. Read its acceptance criteria and linked architecture page.
3. Confirm the affected contract or API version.
4. Keep the PR limited to that issue.
5. Let protected checks and code-owner review complete before merge.
