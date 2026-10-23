# Author notes

The repository owns the SQLite transaction. A conditional update is commit-time authority; reservation insertion and stock decrement share one transaction, and no response or receipt is returned before commit.
