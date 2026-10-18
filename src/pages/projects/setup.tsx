import { useNavigate } from "react-router-dom";
import { SetupWizard } from "@/components/projects";

export default function ProjectSetupPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <SetupWizard
          onComplete={(data) => {
            console.log("Setup complete:", data);
            navigate("/projects");
          }}
        />
      </div>
    </div>
  );
}
