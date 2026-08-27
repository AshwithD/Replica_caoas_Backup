import { useParams } from "react-router-dom";
import "../_kit/styles/theme.css";
import EmployeeWorkspace from "../pages/EmployeeWorkspace";

export default function EmployeeDetailPage() {
  const { id } = useParams();
  return <EmployeeWorkspace employeeId={id} />;
}