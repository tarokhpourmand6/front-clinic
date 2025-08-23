import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(p){ super(p); this.state = { hasError: false, err: null }; }
  static getDerivedStateFromError(err){ return { hasError: true, err }; }
  componentDidCatch(err, info){ console.error("[ErrorBoundary]", err, info); }
  render(){
    if (this.state.hasError) {
      return (
        <div className="p-3 my-3 rounded border border-red-300 bg-red-50 text-right text-sm">
          <div className="font-bold text-red-700">اشکال در این بخش</div>
          <div className="text-red-600">{String(this.state.err?.message || "خطای نامشخص")}</div>
        </div>
      );
    }
    return this.props.children;
  }
}