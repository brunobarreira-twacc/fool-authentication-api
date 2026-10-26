# Fool Authentication API — Product Context

## Objective

Build a small intentionally insecure REST API that will act as a test target for an AI-assisted security remediation POC.

The intended workflow is:

OWASP ZAP
→ detect security findings
→ export findings
→ send findings and source-code context to an LLM agent
→ agent proposes or applies remediation
→ OWASP ZAP scans the application again
→ verify whether the finding was resolved

The API itself is not the product being evaluated.

The main purpose of the application is to provide a predictable environment where security vulnerabilities can be detected, fixed by an AI agent, and validated again.

## Scope

The application manages users and authentication.

It must support:

- User registration
- User authentication
- JWT-based authorization
- User profile retrieval
- User profile update
- User listing
- User lookup by ID
- User deletion
- Health check

The application must be simple enough that security findings can easily be mapped back to source code.