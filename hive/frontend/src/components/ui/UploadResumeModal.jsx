// components/modals/UploadResumeModal.js

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import Fileinput from "@/components/ui/Fileinput";
import Notification from "@/components/ui/Notification";

const UploadResumeModal = ({ open, onClose, onFileUpload }) => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!selectedFile) {
      Notification.error("Please select a file to upload.");
      return;
    }

    // Custom callback
    onFileUpload(selectedFile);
    Notification.success("File uploaded successfully!");
    onClose();
  };

  return (
    <Modal
      activeModal={open}
      onClose={onClose}
      title="Upload Resume"
      themeClass="bg-white"
      className="max-w-md"
      centered
    >
      <div className="space-y-4">
        <Fileinput
          label="Select Resume (PDF/DOC)"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx"
        />
        <div className="text-right">
          <button className="btn btn-outline-secondary mr-2" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleUpload}>
            Upload
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default UploadResumeModal;
