import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui";
import { IconAlertTriangle } from "@tabler/icons-react";

interface Props {
  children: ReactNode;
  /** If true, render an inline fallback instead of a full-screen one */
  inline?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.inline) {
        return (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <IconAlertTriangle className="h-10 w-10 text-destructive mb-3" />
            <h2 className="text-lg font-semibold mb-1">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mb-4 max-w-md">
              {this.state.error?.message ?? "An unexpected error occurred."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try Again
            </Button>
          </div>
        );
      }
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
          <IconAlertTriangle className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            {this.state.error?.message ?? "An unexpected error occurred."}
          </p>
          <Button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.href = "/";
            }}
          >
            Go to Dashboard
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
