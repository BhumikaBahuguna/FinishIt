/** AppErrorBoundary.jsx — Catches React rendering crashes to prevent the entire UI from going blank */
import { Component } from "react";

export class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      message: ""
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "Unexpected runtime error."
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Application runtime error", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="status-page">
        <div className="error-boundary-card">
          <h1>Something went wrong</h1>
          <p className="data-list-meta">{this.state.message}</p>
          <button type="button" className="btn btn-primary" onClick={this.handleReload}>
            Reload Application
          </button>
        </div>
      </div>
    );
  }
}
