pub fn get_setting<'a>(settings: &'a [(String, String)], key: &str) -> Option<&'a str> {
    settings
        .iter()
        .find(|(name, _value)| name.as_str() == key)
        .map(|(_name, value)| value.as_str())
}
