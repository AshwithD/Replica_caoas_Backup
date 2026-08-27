import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { PuffLoader } from "react-spinners";

const PayrollWorkspacePage = lazy(() => import("./routes/PayrollWorkspacePage"));
const ClientWorkspacePage  = lazy(() => import("./routes/ClientWorkspacePage"));
const BatchReviewPage      = lazy(() => import("./routes/BatchReviewPage"));
const FirmDetailsPage      = lazy(() => import("./routes/FirmDetailsPage"));
const EmployeesListPage    = lazy(() => import("./routes/EmployeesListPage"));
const EmployeeDetailPage   = lazy(() => import("./routes/EmployeeDetailPage"));
const EmailLogsPage        = lazy(() => import("./routes/EmailLogsPage"));

const PageLoader = () => (
  <div style={{ display: "flex", justifyContent: "center", marginTop: 80 }}>
    <PuffLoader color="#001F5B" size={48} />
  </div>
);

/**
 * pages/payroll/PayrollRoutes.jsx
 *
 * Mounts every payroll sub-page internally, so App.js only needs one line:
 *   <Route path="/payroll/*" element={<PrivateRoute ...><PayrollRoutes /></PrivateRoute>} />
 * Paths here are RELATIVE to that mount point (no leading "/payroll"),
 * since this is itself nested under "/payroll/*" in the parent router.
 */
export default function PayrollRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route index element={<PayrollWorkspacePage />} />
        <Route path="clients/:id" element={<ClientWorkspacePage />} />
        <Route path="batches/:id" element={<BatchReviewPage />} />
        <Route path="firm-details" element={<FirmDetailsPage />} />
        <Route path="employees" element={<EmployeesListPage />} />
        <Route path="employees/:id" element={<EmployeeDetailPage />} />
        <Route path="email-logs/:batchId" element={<EmailLogsPage />} />
      </Routes>
    </Suspense>
  );
}