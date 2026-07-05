# Author Notes

This lesson intentionally teaches `TryFrom<&str>` instead of a custom `new` function. The value object is constructed only after validation, and callers get the standard conversion API.
