# Semgrep Scenario — SQL Injection

## Purpose

Provide one deterministic SAST finding for SQL built from untrusted input.

## Required vulnerable behavior

`userRepository.findByEmail` must interpolate the supplied email directly into
the SQLite query instead of using a bound parameter. A crafted email can alter
the query and return a user that was not requested.

## Scanner contract

The local Semgrep rule `scanbridge.database.interpolated-sql` must identify the
interpolated `db.prepare` call and report it as high severity.

## Containment

The behavior is limited to the disposable local SQLite database. Do not add
filesystem, process-execution, or external-network effects.

## Acceptance

- A focused test demonstrates that SQL syntax supplied as the email changes the query.
- A Scanbridge scan reports exactly one finding for this rule.
