pub fn get_setting(settings: &[(String, String)], key: String) -> Option<String> {
    settings
        .iter()
        .find(|(name, _value)| *name == key)
        .map(|(_name, value)| value.clone())
}
