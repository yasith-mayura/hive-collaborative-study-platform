import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaRegFileAlt } from "react-icons/fa";
import { IoMdDownload } from "react-icons/io";
import Modal from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import {
  deleteResource,
  getDownloadUrl,
  getResourcesBySubject,
  uploadResource,
} from "@/services/resourceService";
import SubjectAIChat from "../components/SubjectAIChat";

const resourceTypeLabels = {
  past_paper: "Past Papers",
  resource_book: "Resource Books",
  note: "Notes",
};

const getErrorMessage = (error, fallbackMessage) => {
  const status = error?.response?.status;

  if (status === 401) return "Session expired. Please login again.";
  if (status === 403) return "You do not have permission to perform this action.";
  if (status === 404) return "Resource or subject was not found.";
  if (status === 413) return "File too large. Maximum size is 50MB.";
  if (status === 500) return "Server error. Please try again.";

  return error?.response?.data?.message || fallbackMessage;
};

const formatDate = (dateValue) => {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
};

const formatFileSize = (sizeInBytes) => {
  const size = Number(sizeInBytes || 0);
  if (!size) return "-";
  const mb = size / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(2)} MB`;
  const kb = size / 1024;
  return `${kb.toFixed(2)} KB`;
};

export default function Resources() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();

  const canManageResources = role === "admin" || role === "superadmin";

  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState(null);
  const [resources, setResources] = useState({
    past_papers: [],
    resource_books: [],
    notes: [],
  });

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [downloadingResourceId, setDownloadingResourceId] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resourceType, setResourceType] = useState("past_paper");
  const [file, setFile] = useState(null);

  const subjectCode = useMemo(() => (subjectId || "").toUpperCase(), [subjectId]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const response = await getResourcesBySubject(subjectCode);
      setSubject(response?.subject || null);
      setResources({
        past_papers: response?.resources?.past_papers || [],
        resource_books: response?.resources?.resource_books || [],
        notes: response?.resources?.notes || [],
      });
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to load resources"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subjectCode) {
      loadResources();
    }
  }, [subjectCode]);

  const resetUploadForm = () => {
    setTitle("");
    setDescription("");
    setResourceType("past_paper");
    setFile(null);
    setUploadProgress(0);
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const isPdf = selectedFile.type === "application/pdf" || selectedFile.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      toast.error("Only PDF files are allowed.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 50MB.");
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!file) {
      toast.error("Please select a PDF file to upload.");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("subjectCode", subjectCode);
      formData.append("resourceType", resourceType);
      formData.append("title", title.trim());
      formData.append("description", description.trim());

      const response = await uploadResource(formData, (progressEvent) => {
        if (!progressEvent.total) return;
        const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentage);
      });

      toast.success("Resource uploaded successfully");
      if (!response?.resource?.isEmbedded) {
        toast.success("AI is processing this document...");
      }

      setShowUploadModal(false);
      resetUploadForm();
      loadResources();
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to upload resource"));
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (resourceId) => {
    if (!resourceId) {
      toast.error("Invalid resource. Please refresh and try again.");
      return;
    }

    try {
      setDownloadingResourceId(resourceId);
      const response = await getDownloadUrl(resourceId);
      if (response?.presignedUrl) {
        // Use an anchor click to avoid popup blockers on async window.open calls.
        const downloadAnchor = document.createElement("a");
        downloadAnchor.href = response.presignedUrl;
        downloadAnchor.target = "_self";
        downloadAnchor.rel = "noopener noreferrer";
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        document.body.removeChild(downloadAnchor);

        setResources((previous) => {
          const incrementCount = (items) =>
            items.map((item) =>
              item.resourceId === resourceId
                ? { ...item, downloadCount: Number(item.downloadCount || 0) + 1 }
                : item
            );

          return {
            past_papers: incrementCount(previous.past_papers),
            resource_books: incrementCount(previous.resource_books),
            notes: incrementCount(previous.notes),
          };
        });
      } else {
        toast.error("Unable to generate download link.");
      }

      // Backend increments count non-blocking. Refresh shortly to sync persisted state.
      setTimeout(() => {
        loadResources();
      }, 800);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to download resource"));
    } finally {
      setDownloadingResourceId("");
    }
  };

  const openDeleteModal = (resource) => {
    setSelectedResource(resource);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedResource?.resourceId) return;

    try {
      setActionLoading(true);
      await deleteResource(selectedResource.resourceId);
      setResources((previous) => ({
        past_papers: previous.past_papers.filter((item) => item.resourceId !== selectedResource.resourceId),
        resource_books: previous.resource_books.filter((item) => item.resourceId !== selectedResource.resourceId),
        notes: previous.notes.filter((item) => item.resourceId !== selectedResource.resourceId),
      }));
      toast.success("Resource deleted successfully");
      setShowDeleteModal(false);
      setSelectedResource(null);
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to delete resource"));
    } finally {
      setActionLoading(false);
    }
  };

  const renderResourceSection = (typeKey, list) => {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{resourceTypeLabels[typeKey]}</h3>

        {list.length === 0 ? (
          <p className="text-gray-500 italic">No resources available in this section.</p>
        ) : (
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {list.map((resource) => (
              <div
                key={resource.resourceId}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FaRegFileAlt className="text-primary-600" />
                      <h4 className="text-base font-semibold text-gray-800 truncate">
                        {resource.title || resource.fileName || "Untitled Resource"}
                      </h4>
                      {resource.isEmbedded ? (
                        <span className="text-xs bg-success-500/10 text-success-500 px-2 py-1 rounded-full font-medium">
                          AI Ready
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium">
                          Processing...
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-3">
                      {resource.description || "No description available."}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600">
                      <p>File: {resource.fileName || "-"}</p>
                      <p>Uploaded: {formatDate(resource.createdAt)}</p>
                      <p>Uploaded By: {resource.uploadedBy || "-"}</p>
                      {canManageResources && <p>Downloads: {resource.downloadCount || 0}</p>}
                      <p>Size: {formatFileSize(resource.fileSize)}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDownload(resource.resourceId)}
                      disabled={downloadingResourceId === resource.resourceId}
                      className="bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md disabled:opacity-50"
                    >
                      {downloadingResourceId === resource.resourceId ? "Loading..." : "Download"}
                    </button>

                    {canManageResources && (
                      <button
                        type="button"
                        onClick={() => openDeleteModal(resource)}
                        className="bg-danger-500 text-white px-3 py-2 text-sm font-medium hover:opacity-90 rounded-md"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white rounded-xl shadow-sm border border-gray-100 pb-10">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 pt-6 pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/resources")}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            aria-label="Go back"
          >
            <FaArrowLeft size={18} className="text-gray-600" />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {subject ? `${subject.subjectCode} - ${subject.subjectName}` : subjectCode}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Level {subject?.level || "-"} | Semester {subject?.semester || "-"}
            </p>
          </div>
        </div>

        {canManageResources && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-primary-900 text-white px-4 py-2 rounded-md hover:bg-slate-800 transition shadow-sm text-sm font-medium"
          >
            + Upload Resource
          </button>
        )}
      </div>

      <div className="px-6 pt-4">
        <p className="text-sm text-gray-600">{subject?.description || "No subject description provided."}</p>
      </div>

      <div className="p-6 space-y-6">
        {renderResourceSection("past_paper", resources.past_papers)}
        {renderResourceSection("resource_book", resources.resource_books)}
        {renderResourceSection("note", resources.notes)}
      </div>

      <Modal
        title="Upload Resource"
        activeModal={showUploadModal}
        onClose={() => {
          if (!uploading) {
            setShowUploadModal(false);
            resetUploadForm();
          }
        }}
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
              placeholder="e.g. 2024 Final Exam Paper"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
              placeholder="Add a short description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Resource Type</label>
            <select
              value={resourceType}
              onChange={(event) => setResourceType(event.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-3 py-2 border"
            >
              <option value="past_paper">Past Paper</option>
              <option value="resource_book">Resource Book</option>
              <option value="note">Note</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">PDF File (Max 50MB)</label>
            <input
              type="file"
              accept=".pdf"
              required
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>

          {uploading && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Uploading... {uploadProgress}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t mt-6">
            <button
              type="button"
              disabled={uploading}
              onClick={() => {
                setShowUploadModal(false);
                resetUploadForm();
              }}
              className="mr-3 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="bg-primary-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 rounded-md disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        title="Delete Resource"
        activeModal={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedResource(null);
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete <span className="font-semibold">{selectedResource?.title || selectedResource?.fileName}</span>?
          </p>
          <div className="flex justify-end pt-4 border-t mt-6">
            <button
              type="button"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedResource(null);
              }}
              className="mr-3 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleDelete}
              className="bg-danger-500 text-white px-4 py-2 text-sm font-medium hover:opacity-90 rounded-md disabled:opacity-50"
            >
              {actionLoading ? "Deleting..." : "Delete Resource"}
            </button>
          </div>
        </div>
      </Modal>

      <SubjectAIChat subjectName={subject?.subjectName || "this subject"} />
    </div>
  );
}