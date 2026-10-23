# Author notes

The response mapper runs after application success/failure and has no transaction handle. HTTP mapping reports commit uncertainty distinctly; simulated delivery failure does not roll back or replay the reservation. In-memory tests do not establish restart persistence. Contrast this uncoupled HTTP path with bounded egress: preflight complete output acceptance before commit, then enqueue once; enqueue is not delivery.
