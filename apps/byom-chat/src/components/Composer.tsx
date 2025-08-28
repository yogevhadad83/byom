import { useState } from 'react';
import { ByomWidget } from '@byom/sdk';
import { useAuth } from '../store/auth';
import type { Message } from '../types';
import logo from '../../assets/logo.png';

type Props = {
  userId: string;
  conversationId: string;
  onSend: (t: string) => void;
  getSnapshot: () => Message[];
  onAssistantMessage: (msg: { text: string; meta?: { modelId?: string } }) => void;
  onUserPrompt: (text: string) => void;
};

export function Composer({
  userId,
  conversationId,
  onSend,
  getSnapshot,
  onAssistantMessage,
  onUserPrompt,
}: Props) {
  const [text, setText] = useState('');
  const auth = useAuth();
  return (
    <div className="p-4 flex gap-2 bg-gray-800">
      <div className="relative flex-1">
        <input
          className="w-full p-2 bg-gray-700 text-white rounded pr-28"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const t = text.trim();
              if (t) {
                onSend(t);
                setText('');
              }
            }
          }}
          placeholder="Type a message"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
          <div
            className={auth.session ? '' : 'opacity-60 pointer-events-none cursor-not-allowed'}
            title={auth.session ? 'Send to AI' : 'Log in to use your model'}
          >
            <ByomWidget
              userId={userId}
              conversationId={conversationId}
              getSnapshot={getSnapshot}
              getPrompt={() => text}
              onAssistantMessage={onAssistantMessage}
              onUserPrompt={onUserPrompt}
              buttonLogoSrc={logo}
              buttonAriaLabel={auth.session ? 'BYOM' : 'Log in to use your model'}
            />
          </div>
        </div>
      </div>
      <button
        className="px-3 py-2 bg-blue-600 text-white rounded"
        onClick={() => {
          if (text.trim()) {
            onSend(text);
            setText('');
          }
        }}
      >
        Send
      </button>
    </div>
  );
}
