"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createLayout } from "@/actions/layouts";

interface CreateLayoutButtonProps {
  buildingId: string;
}

export function CreateLayoutButton({ buildingId }: CreateLayoutButtonProps) {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleCreateLayout = async () => {
    const layoutName = prompt("Enter a name for your new layout:");

    if (!layoutName || layoutName.trim() === "") {
      return;
    }

    setIsCreating(true);

    try {
      const [result, error] = await createLayout({
        buildingId,
        name: layoutName.trim(),
      });

      if (error) {
        alert(`Failed to create layout: ${error.message}`);
        return;
      }

      // Redirect to the editor
      router.push(`/editor/${result.layout.id}`);
    } catch (error) {
      console.error("Error creating layout:", error);
      alert("Failed to create layout. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <button
      onClick={handleCreateLayout}
      disabled={isCreating}
      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white font-medium rounded transition-colors flex items-center space-x-2"
    >
      {isCreating ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Creating...</span>
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <span>Create Layout</span>
        </>
      )}
    </button>
  );
}
