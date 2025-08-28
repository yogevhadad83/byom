import { Message } from '../types';
import { useAuth } from '../store/auth';
import aiIcon from '../../assets/ai.svg';

type Props = {
  userId: string;
  messages: (Message & { meta?: { modelId?: string; sentToAI?: boolean } })[];
  onPublish?: (m: Message & { meta?: { modelId?: string; sentToAI?: boolean } }) => void;
};

export function ChatWindow({ userId, messages, onPublish }: Props) {
  const auth = useAuth();
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
      {messages.map((m, i) => {
        const isMine = m.role === 'user' && m.author === userId;
        const isAssistant = m.role === 'assistant';
        const isOtherUser = m.role === 'user' && m.author !== userId;
        const isEphemeral = Boolean(m.ephemeral);
        const sentToAI = Boolean(m.meta?.sentToAI);
        return (
          <div key={i} className={isMine ? 'text-right' : 'text-left'}>
            <div
              className={`inline-flex items-start gap-3 max-w-2xl ${
                isMine ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`px-4 py-3 rounded-2xl shadow-sm border text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  isMine
                    ? 'bg-blue-600 text-white border-blue-500'
                    : isOtherUser
                    ? 'bg-green-600 text-white border-green-500'
                    : 'bg-white text-gray-900 border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700'
                } ${isEphemeral ? 'opacity-80 ring-1 ring-amber-400/60' : ''}`}
              >
                {m.text}
              </div>
              {isEphemeral && (
                <button
                  className="self-center text-xs px-2 py-1 rounded border border-amber-400 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                  onClick={() => onPublish?.(m)}
                >
                  Show in chat
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
              {isAssistant && (
                <span className="inline-block">
                  {`served by ${
                    ((auth.user?.user_metadata as any)?.full_name ||
                      (auth.user?.user_metadata as any)?.name ||
                      (auth.user?.email ? auth.user.email.split('@')[0] : '') ||
                      'your')
                  }'s AI model`}
                </span>
              )}
              {m.role === 'user' && sentToAI && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/30">
                  <img src={aiIcon} alt="AI" className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
            <div className="text-[10px] mt-0.5 text-gray-400">
              {new Date(m.ts).toLocaleTimeString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
