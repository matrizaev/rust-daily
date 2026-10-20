use crate::{
    Ledger, TransferCommand, TransferReceipt, TransferRejection, TransferRequest,
    TransferRequestError,
};

/// Everything that can stop a transfer before the authoritative boundary.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransferError {
    /// The request itself was not legal to execute.
    Invalid(TransferRequestError),
    /// The request was legal, but current ledger state rejected it.
    Rejected(TransferRejection),
}

impl From<TransferRequestError> for TransferError {
    fn from(error: TransferRequestError) -> Self {
        Self::Invalid(error)
    }
}

impl From<TransferRejection> for TransferError {
    fn from(error: TransferRejection) -> Self {
        Self::Rejected(error)
    }
}

/// Validate the request, prepare it against the ledger, then commit.
///
/// The three phases stay visible on purpose: everything that can fail happens
/// before `commit` is called, and `commit` itself has no `?` to write.
pub fn execute_transfer(
    ledger: &mut Ledger,
    request: TransferRequest,
) -> Result<TransferReceipt, TransferError> {
    let command = TransferCommand::try_from(request)?;
    let prepared = ledger.prepare_transfer(command)?;
    Ok(prepared.commit())
}
