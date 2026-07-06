// TODO: Define Host struct with private String field.

impl Host {
    pub fn new_unchecked(val: String) -> Self {
        Self(val)
    }

    // TODO: Expose as_str method.
}
