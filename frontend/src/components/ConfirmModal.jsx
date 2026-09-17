function ConfirmModal({
  isOpen,
  title = "Are you sure?",
  message = "Please confirm this action.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="confirmModalOverlay">
      <div className="confirmModalCard">

        <div className={`confirmModalIcon ${type}`}>
          {type === "danger"
            ? "!"
            : type === "warning"
            ? "⚠"
            : "✓"}
        </div>

        <h2>{title}</h2>

        <p>{message}</p>

        <div className="confirmModalActions">
          <button
            type="button"
            className="confirmModalCancel"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={`confirmModalConfirm ${type}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Please wait..." : confirmText}
          </button>
        </div>

      </div>
    </div>
  );
}

export default ConfirmModal;