import React, { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Notification from "@/components/ui/Notification";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";
import {
  assignBatchLevel,
  getBatchLevelBatches,
  getBatchLevels,
  removeBatchLevel,
} from "@/services";

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
};

const getErrorMessage = (error, fallback) => {
  const status = error?.response?.status;

  if (status === 401) return "Session expired. Please login again.";
  if (status === 403) return "You do not have permission.";
  if (status === 500) return "Server error. Please try again.";

  return error?.response?.data?.message || fallback;
};

export default function BatchLevelAssignment() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [batches, setBatches] = useState([]);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [conflicts, setConflicts] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const assignmentByLevel = useMemo(() => {
    const map = new Map();
    assignments.forEach((entry) => {
      map.set(Number(entry.level), entry);
    });
    return map;
  }, [assignments]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignmentsResponse, batchesResponse] = await Promise.all([
        getBatchLevels(),
        getBatchLevelBatches(),
      ]);
      setAssignments(Array.isArray(assignmentsResponse) ? assignmentsResponse : []);
      setBatches(Array.isArray(batchesResponse) ? batchesResponse : []);
    } catch (error) {
      Notification.error(getErrorMessage(error, "Failed to load batch assignments."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAssignModal = (level) => {
    const existing = assignmentByLevel.get(level);
    setSelectedLevel(level);
    setSelectedBatch(existing?.batch || "");
    setConflicts([]);
    setIsAssignModalOpen(true);
  };

  const closeAssignModal = () => {
    setIsAssignModalOpen(false);
    setSelectedLevel(null);
    setSelectedBatch("");
    setConflicts([]);
  };

  const submitAssignment = async (confirmReplace = false) => {
    if (!selectedBatch || !selectedLevel) {
      Notification.error("Please select a batch.");
      return;
    }

    try {
      setSaving(true);
      const response = await assignBatchLevel({
        batch: selectedBatch,
        level: selectedLevel,
        confirmReplace,
      });

      Notification.success(response?.message || "Batch assignment updated successfully");
      closeAssignModal();
      loadData();
    } catch (error) {
      if (error?.response?.status === 409 && error?.response?.data?.requiresConfirmation) {
        setConflicts(error?.response?.data?.conflicts || []);
        return;
      }

      Notification.error(getErrorMessage(error, "Failed to assign batch."));
    } finally {
      setSaving(false);
    }
  };

  const unassignBatch = (batch, level) => {
    setDeleteTarget({ batch, level });
    setIsDeleteModalOpen(true);
  };

  const confirmUnassign = async () => {
    if (!deleteTarget) return;
    const { batch, level } = deleteTarget;

    try {
      setSaving(true);
      await removeBatchLevel(batch);
      Notification.success(`Batch ${batch} removed from Level ${level}`);
      loadData();
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      Notification.error(getErrorMessage(error, "Failed to remove assignment."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-secondary-800">Batch Level Assignment</h1>
        <p className="text-sm text-secondary-500 mt-1">
          Assign current academic level to each student batch. Only one batch can be assigned per level.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 table-fixed">
              <thead>
                <tr>
                  <th className="table-th">Level</th>
                  <th className="table-th">Batch Assigned</th>
                  <th className="table-th">Assigned Date</th>
                  <th className="table-th">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {[1, 2, 3, 4].map((level) => {
                  const assignment = assignmentByLevel.get(level);

                  return (
                    <tr key={level} className="hover:bg-gray-50">
                      <td className="table-td font-medium">{level}</td>
                      <td className="table-td">
                        {assignment?.batch ? (
                          <span className="text-secondary-800">Batch {assignment.batch}</span>
                        ) : (
                          <span className="text-secondary-400">Not assigned</span>
                        )}
                      </td>
                      <td className="table-td">{formatDate(assignment?.assignedAt)}</td>
                      <td className="table-td">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => openAssignModal(level)}
                          >
                            {assignment?.batch ? "Change" : "Assign"}
                          </button>
                          {assignment?.batch && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              disabled={saving}
                              onClick={() => unassignBatch(assignment.batch, level)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        activeModal={isAssignModalOpen}
        onClose={closeAssignModal}
        title={`Assign Batch to Level ${selectedLevel || ""}`}
        centered
        footerContent={
          <>
            <Button text="Cancel" className="btn-outline-secondary" onClick={closeAssignModal} />
            {conflicts.length > 0 ? (
              <Button
                text="Confirm Assignment"
                className="btn-primary"
                onClick={() => submitAssignment(true)}
                isLoading={saving}
                disabled={saving}
              />
            ) : (
              <Button
                text="Assign"
                className="btn-primary"
                onClick={() => submitAssignment(false)}
                isLoading={saving}
                disabled={saving}
              />
            )}
          </>
        }
      >
        <div className="space-y-4">
          <div className="fromGroup">
            <label className="form-label">Batch</label>
            <select
              className="form-control"
              value={selectedBatch}
              onChange={(event) => {
                setSelectedBatch(event.target.value);
                setConflicts([]);
              }}
            >
              <option value="">Select Batch</option>
              {batches.map((batch) => (
                <option key={batch} value={batch}>
                  Batch {batch}
                </option>
              ))}
            </select>
          </div>

          {conflicts.length > 0 && (
            <div className="border border-warning-200 bg-warning-50 rounded-md p-3 space-y-2">
              {conflicts.map((conflict) => (
                <p key={conflict.type} className="text-sm text-warning-800">
                  {conflict.message}
                </p>
              ))}
            </div>
          )}
        </div>
      </Modal>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmUnassign}
        isLoading={saving}
        title="Remove Batch Assignment"
        message={deleteTarget ? `Are you sure you want to remove Batch ${deleteTarget.batch} from Level ${deleteTarget.level}? This will detach the batch from the given academic level.` : ""}
      />
    </div>
  );
}
