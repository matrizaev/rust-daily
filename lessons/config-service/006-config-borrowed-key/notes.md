Teaches borrowing-api by selecting the first valid Config from startup candidates.

The important design choice is that first_valid_config takes &[Config] and
returns Option<&Config>. Startup code often wants to inspect env/file/default
candidates without consuming or cloning the candidate list.
