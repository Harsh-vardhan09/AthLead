import React, { Component } from "react";

import Home from "./Home";
import Dashboard from "./Dashboard";
import Events from "./Events";
import Signup from "./Signup";
import Login from "./Login";
import Announcement from "./Announcement";
import EventSignup from "./EventSignup";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", textAlign: "center", fontFamily: "sans-serif" }}>
          <h2>Something went wrong.</h2>
          <p>We're sorry, an unexpected error occurred.</p>
          {process.env.NODE_ENV === "development" && (
            <pre style={{ color: "red", whiteSpace: "pre-wrap" }}>
              {this.state.error && this.state.error.toString()}
              {this.state.errorInfo && <>{this.state.errorInfo.componentStack}</>}
            </pre>
          )}
          <button onClick={this.resetErrorBoundary} style={{ padding: "10px 20px", cursor: "pointer" }}>
            Retry
          </button>
          <button onClick={() => window.location.reload()} style={{ padding: "10px 20px", cursor: "pointer", marginLeft: "10px" }}>
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const wrappedPages = (ComponentClass) => {
  return (props) => (
    <ErrorBoundary>
      <ComponentClass {...props} />
    </ErrorBoundary>
  );
};

export { 
  wrappedPages(Home) as Home, 
  wrappedPages(Dashboard) as Dashboard, 
  wrappedPages(Announcement) as Announcement, 
  wrappedPages(Events) as Events, 
  wrappedPages(Signup) as Signup, 
  wrappedPages(Login) as Login, 
  wrappedPages(EventSignup) as EventSignup, 
  ErrorBoundary 
};