use crate::{
    Ledger, TransferCommand, TransferReceipt, TransferRejection, TransferRequest,
    TransferRequestError,
};

// TODO: compose the phases into one application-facing operation.
//
// Add a `TransferError` enum with an `Invalid(TransferRequestError)` variant and
// a `Rejected(TransferRejection)` variant, and implement `From` for both
// phase-specific errors so `?` keeps the phase visible. Then add
// `execute_transfer(&mut Ledger, TransferRequest) -> Result<TransferReceipt, TransferError>`
// whose body performs exactly three steps: validate the request into a
// `TransferCommand`, prepare it against the ledger, and commit the prepared
// transfer. Do not interleave checks with mutation.
