import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error("React Error Boundary caught an error:", error);
      console.error("Component error information:", errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <div>
            <h1>Something went wrong</h1>

            <p>
              We encountered an unexpected error. Please try again or reload
              the page.
            </p>

            <button onClick={this.handleRetry}>Try Again</button>

            <button onClick={this.handleReload}>Reload Page</button>

            {import.meta.env.DEV && this.state.error && (
              <pre
                style={{
                  marginTop: "20px",
                  textAlign: "left",
                  whiteSpace: "pre-wrap",
                }}
              >
                {this.state.error.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;