pub fn reorder_notes(notes: &[String]) -> Vec<String> {
    let mut relevant_notes = Vec::new();

    for note in notes {
        let normalized = note.trim().to_lowercase();
        if normalized.is_empty() {
            continue;
        }

        let is_inventory_note =
            normalized.contains("urgent") || normalized.contains("stock");
        if is_inventory_note {
            relevant_notes.push(normalized);
        }
    }

    relevant_notes
}
