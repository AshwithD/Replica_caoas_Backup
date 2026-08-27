import "../_kit/styles/theme.css";
import { ConfirmProvider } from "../_kit/components/ConfirmDialog";
import PayrollWorkspace from "../pages/PayrollWorkspace";

export default function PayrollWorkspacePage() {
  return (
    <div className="payroll-scope">
      <ConfirmProvider>
        <PayrollWorkspace />
      </ConfirmProvider>
    </div>
  );
}
