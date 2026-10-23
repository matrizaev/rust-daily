# Author notes

For statement failures, explicitly await rollback; map the original Database or InvalidStoredData error only after rollback succeeds. If rollback cannot be confirmed, or COMMIT fails, return CommitOutcomeUnknown. Do not infer rollback or retry; later response delivery remains outside the transaction.
