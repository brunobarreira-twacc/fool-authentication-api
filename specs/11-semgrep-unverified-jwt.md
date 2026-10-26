# Semgrep Scenario — Unverified JWT

## Purpose

Provide one deterministic SAST finding for trusting a JWT without verifying its
signature.

## Required vulnerable behavior

Authentication middleware must use `jwt.decode` and accept the decoded claims as
the current identity. A token signed with an attacker-controlled secret therefore
passes authentication when it contains a valid-looking payload.

## Scanner contract

The local Semgrep rule `scanbridge.auth.unverified-jwt` must identify the
`jwt.decode` call and report it as high severity.

## Containment

The behavior applies only to this local demo API and its seed identities.

## Acceptance

- A focused test demonstrates access with a token signed using the wrong secret.
- A Scanbridge scan reports exactly one finding for this rule.
