"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: "#242B26",
          color: "#EDEFE9",
          fontFamily: "var(--font-body)",
          fontSize: "0.875rem",
          borderRadius: "6px",
          padding: "10px 14px",
        },
        success: { iconTheme: { primary: "#1BB79D", secondary: "#242B26" } },
        error: { iconTheme: { primary: "#C0432E", secondary: "#242B26" } },
      }}
    />
  );
}
