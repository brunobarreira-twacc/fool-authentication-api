# Semgrep Scenario — Weak Password Hash Cost

## Purpose

Provide one deterministic SAST finding for an unsafe password-hashing parameter.

## Required vulnerable behavior

New registrations must hash passwords with bcrypt cost `4`. Seed creation remains
unchanged so the scenario has a single scanner location.

## Scanner contract

The local Semgrep rule `scanbridge.crypto.weak-bcrypt-cost` must identify the
`bcrypt.hashSync` call with cost `4` and report it as medium severity.

## Containment

Use only synthetic local passwords. Never reuse these hashes or parameters in a
production system.

## Acceptance

- A focused test confirms a newly registered user's stored hash has cost `4`.
- A Scanbridge scan reports exactly one finding for this rule.
