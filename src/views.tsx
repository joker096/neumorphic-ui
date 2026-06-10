/**
 * Main application views for code splitting
 * Each view is lazily loaded to improve initial bundle size
 */

import React from "react";

// Hub View - Contains RadialMenu and all hub-related components
const HubView = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400">Hub View - RadialMenu component</p>
      </div>
    </div>
  );
};

// Chat View - Contains ChatPreviewLayer and chat functionality
const ChatView = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400">Chat View - ChatPreviewLayer component</p>
      </div>
    </div>
  );
};

// Settings View - Contains settings functionality
const SettingsView = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400">Settings View</p>
      </div>
    </div>
  );
};

// Export views for lazy loading
export { HubView, ChatView, SettingsView };
