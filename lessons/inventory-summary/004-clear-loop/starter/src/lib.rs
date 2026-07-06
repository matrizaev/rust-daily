pub fn reorder_notes(notes: &[String]) -> Vec<String> {
    notes
        .iter()
        .filter(|note| !note.trim().is_empty())
        .map(|note| note.trim().to_lowercase())
        .filter(|note| note.contains("urgent") || note.contains("stock"))
        .collect()
}
