import { useState } from "react";

type AddMCFormProps = {
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
};

export default function AddMCForm({ onSubmit, onCancel }: AddMCFormProps) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setIsSubmitting(true);
    try {
      await onSubmit(trimmedName);
      setName("");
    } catch (error) {
      console.error("Add MC error:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="mcName"
          className="block text-sm font-medium text-gray-700"
        >
          MC名
        </label>
        <input
          type="text"
          id="mcName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm 
            focus:border-indigo-500 focus:ring-indigo-500 
            text-gray-900 placeholder-gray-500"
          placeholder="MC名を入力"
          required
        />
      </div>
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSubmitting ? "追加中..." : "追加"}
        </button>
      </div>
    </form>
  );
}
