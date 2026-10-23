# Author notes

SQLx decoding and domain validation stay at the persistence boundary. Decode failures, invalid IDs, negative quantities, and values outside the domain range all become InvalidStoredData.
