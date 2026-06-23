import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Main({ children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f6f7fb" }}>
      
      {/* Sidebar — sticky on the left */}
      <Sidebar />

      {/* Right column: header on top, content below */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        
        {/* Header — sticky at top of right column */}
        <Header />

        {/* Page content */}
        <main style={{ flex: 1, overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}