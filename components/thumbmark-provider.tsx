"use client";

import { ThumbmarkProvider } from "@thumbmarkjs/react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export function InvitationThumbmarkProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ThumbmarkProvider
      options={{ logging: false, stabilize: ["private", "iframe"] }}
    >
      {children}
      <ToastContainer
        position="top-center"
        autoClose={2000}
        closeOnClick
        pauseOnFocusLoss
        theme="colored"
      />
    </ThumbmarkProvider>
  );
}
