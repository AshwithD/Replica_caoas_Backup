import "../_kit/styles/theme.css";
import { ConfirmProvider } from "../_kit/components/ConfirmDialog";
import BatchReview from "../pages/BatchReview";

export default function BatchReviewPage() {
  return (
    <div className="payroll-scope" style={{ height: "100%" }}>
      <ConfirmProvider>
        <BatchReview />
      </ConfirmProvider>
    </div>
  );
}