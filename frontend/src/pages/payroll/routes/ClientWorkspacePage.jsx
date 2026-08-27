import "../_kit/styles/theme.css";
import { ConfirmProvider } from "../_kit/components/ConfirmDialog";
import ClientWorkspace from "../pages/ClientWorkspace";

export default function ClientWorkspacePage() {
  return (
    <div className="payroll-scope p-4">
      <ConfirmProvider>
        <ClientWorkspace />
      </ConfirmProvider>
    </div>
  );
}
