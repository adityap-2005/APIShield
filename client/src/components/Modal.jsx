/**
 * Modal.jsx
 * A simple centered modal overlay.
 *
 * Usage:
 *   <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Team">
 *     <p>Modal content here</p>
 *   </Modal>
 */

import { useEffect } from "react";

export default function Modal({ isOpen, onClose, title, children, size = "md" }) {
  // Close modal on Escape key press
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClass = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
  }[size] || "max-w-lg";

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal box — stop click propagation so clicking inside doesn't close */}
      <div
        className={`w-full ${sizeClass} bg-gray-900 border border-gray-800 rounded-lg shadow-xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-base font-semibold text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Content */}
        <div className="px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}
