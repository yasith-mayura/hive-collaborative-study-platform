import React from "react";
import Modal from "./Modal";
import Button from "./Button";

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Deletion",
  message = "Are you sure you want to delete this item? This action cannot be undone.",
  isLoading = false
}) => {
  const BUTTON_COLORS = {
    danger: { backgroundColor: "#F9DEE8", color: "#6F2F47", border: "1px solid #E07C9C" },
  };

  return (
    <Modal
      activeModal={isOpen}
      onClose={onClose}
      title={title}
      centered
      footerContent={
        <>
          <Button
            text="Cancel"
            className="btn-outline-secondary"
            onClick={onClose}
            disabled={isLoading}
          />
          <Button
            text={isLoading ? "Deleting..." : "Confirm Delete"}
            className="rounded-md"
            style={BUTTON_COLORS.danger}
            onClick={onConfirm}
            isLoading={isLoading}
            disabled={isLoading}
          />
        </>
      }
    >
      <div className="text-sm text-secondary-600">
        {message}
      </div>
    </Modal>
  );
};

export default DeleteConfirmationModal;
