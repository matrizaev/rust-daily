# Author notes

The controlled adapter separates observed availability from stock checked under the commit lock. Only successful commit consumes stock and allocates an ID; stale observations fail without mutation.
