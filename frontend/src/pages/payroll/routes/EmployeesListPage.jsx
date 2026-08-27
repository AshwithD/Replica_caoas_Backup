import { useNavigate } from "react-router-dom";
import "../_kit/styles/theme.css";
import EmployeesList from "../pages/EmployeesList";

export default function EmployeesListPage() {
  const navigate = useNavigate();
  return <EmployeesList onOpenEmployee={(id) => navigate(`/payroll/employees/${id}`)} />;
}
