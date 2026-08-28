/**
 * pages/payroll/_kit/hooks.js
 *
 * The payroll pages were built against a react-query-style `api/hooks`
 * module that doesn't exist in this project (no @tanstack/react-query is
 * installed here). This file is a small, dependency-free stand-in that
 * exposes the same hook names/shapes ({ data, isLoading, isError, refetch }
 * for queries, { mutateAsync } for mutations) backed by the project's
 * real axios instance and the real payroll DRF endpoints
 * (hrms_backend/payroll/urls.py).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { api, apiPath } from "../api/client";

function useQueryLike(fetcher, deps) {
  const [state, setState] = useState({ data: undefined, isLoading: true, isError: false, error: null });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(() => {
    let cancelled = false;
    setState((s) => ({ ...s, isLoading: true, isError: false, error: null }));
    Promise.resolve(fetcherRef.current())
      .then((data) => {
        if (!cancelled) setState({ data, isLoading: false, isError: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState({ data: undefined, isLoading: false, isError: true, error });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => run(), [run]);

  return { ...state, refetch: run };
}

function unwrap(res) {
  return res.data;
}

// ── Queries ─────────────────────────────────────────────────────────────

export function useBatches(filters = {}) {
  const key = JSON.stringify(filters || {});
  return useQueryLike(
    () =>
      api.get(apiPath("batches/"), { params: filters }).then(unwrap).then((data) => {
        // The backend's PayrollBatchViewSet.get_queryset() currently only
        // filters on `status`/`year` — it silently ignores `?client=`, so
        // a client-scoped request still returns every client's batches.
        // Until that's fixed server-side, enforce the client scope here
        // so ClientWorkspace/BatchList/EmailLogBatches never leak batches
        // (and therefore email-log rows, which are batch-grouped) across
        // clients. No-op when no client filter was requested.
        if (!filters.client) return data;
        const list = Array.isArray(data) ? data : data?.results;
        if (!Array.isArray(list)) return data;
        const filtered = list.filter((b) => String(b.client) === String(filters.client));
        return Array.isArray(data) ? filtered : { ...data, results: filtered };
      }),
    [key]
  );
}

export function useBatch(id) {
  return useQueryLike(
    () => (id ? api.get(apiPath(`batches/${id}/`)).then(unwrap) : Promise.resolve(null)),
    [id]
  );
}

export function useRecords(batchId, params = {}) {
  const key = JSON.stringify(params || {});
  return useQueryLike(
    () =>
      batchId
        ? api.get(apiPath(`batches/${batchId}/records/`), { params }).then(unwrap)
        : Promise.resolve(null),
    [batchId, key]
  );
}

export function useEmployeeRecords(employeeId) {
  return useQueryLike(
    () =>
      employeeId
        ? api.get(apiPath("records/"), { params: { employee: employeeId } }).then(unwrap)
        : Promise.resolve(null),
    [employeeId]
  );
}

export function useSalaryStructureHistory(employeeId) {
  return useQueryLike(
    () =>
      employeeId
        ? api.get(apiPath("salary-structures/"), { params: { employee: employeeId } }).then(unwrap)
        : Promise.resolve(null),
    [employeeId]
  );
}

// Every unapplied (applied_in_record == null) ledger adjustment across all
// four types for one employee — powers the "N pending" note on
// EmployeeWorkspace's ledger chips, so adjustments made while there's no
// open batch (which stay pending until the next upload — see
// _current_open_record in payroll/views.py) are still visible somewhere,
// not just silently queued. None of the four adjustment endpoints support
// filtering by applied status server-side, so it's filtered here instead;
// per-employee adjustment counts are small enough that this is fine.
const ADJUSTMENT_ENDPOINTS = {
  comp_off: "comp-off-adjustments/",
  leave: "leave-adjustments/",
  salary_advance: "salary-advance-adjustments/",
  on_hold: "on-hold-adjustments/",
};

export function usePendingAdjustments(employeeId) {
  return useQueryLike(
    () => {
      if (!employeeId) return Promise.resolve(null);
      return Promise.all(
        Object.entries(ADJUSTMENT_ENDPOINTS).map(([key, endpoint]) =>
          api
            .get(apiPath(endpoint), { params: { employee: employeeId } })
            .then(unwrap)
            .then((data) => {
              const list = Array.isArray(data) ? data : data?.results || [];
              const pending = list.filter((row) => row.applied_in_record == null);
              return [key, pending];
            })
        )
      ).then((entries) => Object.fromEntries(entries));
    },
    [employeeId]
  );
}

// Full (not just pending) ledger adjustment history across all four types
// for one employee, newest first — powers the Adjustment History tab.
// Also fetches this employee's SalaryAdvance EMI plans (salary-advances/),
// since the "advance" section additionally shows plan-level progress
// (amount/tenure, months recovered, disbursed/fully-recovered) above its
// adjustment list — the other three types have no such plan concept.
export function useAdjustmentHistory(employeeId) {
  return useQueryLike(
    () => {
      if (!employeeId) return Promise.resolve(null);
      const adjustments = Promise.all(
        Object.entries(ADJUSTMENT_ENDPOINTS).map(([key, endpoint]) =>
          api
            .get(apiPath(endpoint), { params: { employee: employeeId } })
            .then(unwrap)
            .then((data) => {
              const list = Array.isArray(data) ? data : data?.results || [];
              const sorted = [...list].sort(
                (a, b) => new Date(b.created_at) - new Date(a.created_at)
              );
              return [key, sorted];
            })
        )
      ).then((entries) => Object.fromEntries(entries));

      const plans = api
        .get(apiPath("salary-advances/"), { params: { employee: employeeId } })
        .then(unwrap)
        .then((data) => (Array.isArray(data) ? data : data?.results || []));

      return Promise.all([adjustments, plans]).then(([byType, salaryAdvancePlans]) => ({
        ...byType,
        salary_advance_plans: salaryAdvancePlans,
      }));
    },
    [employeeId]
  );
}

export function useEmailLogs(filters = {}) {
  const key = JSON.stringify(filters || {});
  return useQueryLike(
    () => api.get(apiPath("email-logs/"), { params: filters }).then(unwrap),
    [key]
  );
}

export function useEditHistory(recordId) {
  return useQueryLike(
    () =>
      recordId
        ? api.get(apiPath(`records/${recordId}/edit-history/`)).then(unwrap)
        : Promise.resolve(null),
    [recordId]
  );
}

// Payroll clients — payroll.models.Client (see models.py). One row per
// CA-firm client; payroll is multi-client, so this replaces the old
// single-row Company ("useInternalCompany") the workspace used to depend
// on. useClients() lists all of them; useClient(id) is a single one,
// looked up client-side against the list (no separate detail endpoint
// needed for the small numbers of clients this is expected to hold).
export function useClients() {
  return useQueryLike(() => api.get(apiPath("clients/")).then(unwrap), []);
}

export function useClient(id) {
  const { data: clients, ...rest } = useClients();
  const list = Array.isArray(clients) ? clients : clients?.results || [];
  return { ...rest, data: id ? list.find((c) => String(c.id) === String(id)) : null };
}

export function useOverviewStats() {
  return useQueryLike(() => api.get(apiPath("batches/stats/")).then(unwrap), []);
}

// ── Mutations ───────────────────────────────────────────────────────────

// react-query-style single mutation hook ({ mutate, mutateAsync, isPending,
// error }) — used for individual mutations ported with the newer
// .mutate()/.isPending/.error API shape, e.g. SalaryStructureModal.
export function useMutationLike(fn) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const mutateAsync = useCallback(async (variables) => {
    setIsPending(true);
    setError(null);
    try {
      return await fnRef.current(variables);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, []);

  const mutate = useCallback(
    (variables, { onSuccess, onError } = {}) => {
      mutateAsync(variables).then(onSuccess).catch((err) => onError?.(err));
    },
    [mutateAsync]
  );

  return { mutate, mutateAsync, isPending, error };
}

export function useAppMutations() {
  const uploadBatch = useMutationLike((formData) =>
    api.post(apiPath("batches/upload/"), formData).then(unwrap)
  );
  // Cancelling an in-flight upload is client-side (aborting the request
  // in UploadPayrollModal itself) — no dedicated server endpoint exists,
  // so this is a no-op kept only so the destructured hook doesn't crash.
  const cancelBatch = useMutationLike(() => Promise.resolve());
  const discardBatch = useMutationLike((batchId) =>
    api.post(apiPath(`batches/${batchId}/discard/`)).then(unwrap)
  );
  const markReviewed = useMutationLike((batchId) =>
    api.post(apiPath(`batches/${batchId}/mark-reviewed/`)).then(unwrap)
  );
  const sendEmails = useMutationLike((batchId) =>
    api.post(apiPath(`batches/${batchId}/send-emails/`)).then(unwrap)
  );
  const updateRecord = useMutationLike(({ id, ...fields }) =>
    api.patch(apiPath(`records/${id}/`), fields).then(unwrap)
  );
  const resendEmail = useMutationLike((recordId) =>
    api.post(apiPath(`records/${recordId}/resend/`)).then(unwrap)
  );

  // Client CRUD — payroll.models.Client. saveClient creates when no id is
  // present, patches otherwise (mirrors the old single-row "me" pattern's
  // create-or-update behaviour, just per-row now).
  const saveClient = useMutationLike(({ id, formData }) =>
    (id ? api.patch(apiPath(`clients/${id}/`), formData) : api.post(apiPath("clients/"), formData)).then(unwrap)
  );

  // Single Employee create/edit — payroll.models.Employee, via EmployeeViewSet's
  // standard CRUD (separate from the bulk import action below, for adding
  // or correcting one employee at a time).
  const saveEmployee = useMutationLike(({ id, data }) =>
    (id ? api.patch(apiPath(`employees/${id}/`), data) : api.post(apiPath("employees/"), data)).then(unwrap)
  );

  // Bulk employee-master import for one client — see
  // excel_parser.parse_employee_master_excel / EmployeeViewSet.import_excel.
  // Separate from mutateUploadBatch: this populates/updates the Employee
  // rows themselves, not a month's payslip figures.
  const importEmployees = useMutationLike((formData) =>
    api.post(apiPath("employees/import/"), formData).then(unwrap)
  );

  return {
    mutateUploadBatch: uploadBatch,
    mutateCancelBatch: cancelBatch,
    mutateDiscardBatch: discardBatch,
    mutateMarkReviewed: markReviewed,
    mutateSendEmails: sendEmails,
    mutateUpdateRecord: updateRecord,
    mutateResendEmail: resendEmail,
    mutateSaveClient: saveClient,
    mutateSaveEmployee: saveEmployee,
    mutateImportEmployees: importEmployees,
    // Creates a new EmployeeSalaryStructure row for an employee (versioned
    // history — see payroll/models.py get_latest_salary_structure()).
    // Shaped as { mutate, isPending, error } to match how
    // SalaryStructureModal.jsx calls it: .mutate({ id, data }, { onSuccess }).
    mutateUpdateSalaryStructure: useMutationLike(({ id, data }) =>
      api.post(apiPath("salary-structures/"), { employee: id, ...data }).then(unwrap)
    ),
  };
}