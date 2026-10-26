# Fool Authentication API — Project Organization

Keep the application architecture simple.

Suggested structure:

src/
  routes/
  controllers/
  services/
  repositories/
  models/
  middleware/
  database/

Responsibilities should remain reasonably separated.

## Architecture Principle

Avoid unnecessary abstractions.

Do not introduce:

- microservices
- event buses
- message brokers
- distributed infrastructure
- complex domain-driven-design layers

This application exists to test security scanning and AI remediation, not architecture sophistication.

Security findings should be easy to trace from the scanner result to the corresponding source code.