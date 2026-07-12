import api from "./axios";

export async function getEvaluationSummary() {
  const response = await api.get("/admin/evaluations/summary");
  return response.data;
}

export async function getEvaluationSnapshots({
  page = 1,
  limit = 20,
  evaluationStatus = ""
} = {}) {
  const response = await api.get("/admin/evaluations/snapshots", {
    params: {
      page,
      limit,
      evaluationStatus
    }
  });

  return response.data;
}

export async function getRagEvaluations({ page = 1, limit = 20 } = {}) {
  const response = await api.get("/admin/evaluations", {
    params: {
      page,
      limit
    }
  });

  return response.data;
}

export async function evaluateSnapshot(snapshotId) {
  const response = await api.post(
    `/admin/evaluations/snapshots/${snapshotId}/evaluate`
  );

  return response.data;
}

export async function evaluateSnapshotsBatch(limit = 3) {
  const response = await api.post("/admin/evaluations/snapshots/evaluate-batch", {
    limit
  });

  return response.data;
}