import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

type Props = {
  disabled?: boolean;
  onSend: (text: string) => Promise<void> | void;
};

export const InputBox: React.FC<Props> = ({ disabled, onSend }) => {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const value = text.trim();
    if (!value || disabled || busy) return;
    setBusy(true);
    try {
      setText("");
      await onSend(value);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-3 border-t bg-white">
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 px-3 py-2 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <Button onClick={submit} disabled={disabled || busy || !text.trim()} className="bg-green-600 hover:bg-green-700 text-white rounded-full p-2">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};


