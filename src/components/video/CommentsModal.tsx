import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';

interface Comment {
  id: string;
  name: string;
  text: string;
  date: string;
}

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  comments: Comment[];
  onAddComment: (text: string) => void;
  videoTitle: string;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({
  isOpen,
  onClose,
  comments,
  onAddComment,
  videoTitle,
}) => {
  const { user } = useAuth();
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddComment(text.trim());
    setText('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Comments (${comments.length})`}
      maxWidth="md"
    >
      <div className="space-y-5">
        <p className="text-xs text-zinc-400 line-clamp-1 border-b border-white/10 pb-3">
          Discussion for: <span className="text-white font-bold">{videoTitle}</span>
        </p>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800 text-white font-bold text-sm flex items-center justify-center shrink-0 border border-white/10">
            {user ? user.name[0].toUpperCase() : <i className="fa-solid fa-user text-xs" />}
          </div>
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={user ? 'Write a comment...' : 'Please sign in to write a comment...'}
              disabled={!user}
              className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[var(--accent-red)] transition-all"
            />
            <Button size="sm" type="submit" disabled={!user || !text.trim()}>
              Post
            </Button>
          </div>
        </form>

        {/* Comments List */}
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {comments.length === 0 ? (
            <div className="p-8 text-center bg-black/30 rounded-2xl border border-white/5 space-y-1">
              <i className="fa-regular fa-comment-dots text-2xl text-zinc-500 mb-1" />
              <p className="text-xs font-bold text-zinc-300">No comments yet</p>
              <p className="text-[11px] text-zinc-500">Be the first to share your thoughts!</p>
            </div>
          ) : (
            comments.map((comment, idx) => (
              <div
                key={`${comment.id}-${idx}`}
                className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/5 text-xs"
              >
                <div className="w-8 h-8 rounded-full bg-red-950 text-red-200 font-bold flex items-center justify-center shrink-0 border border-red-800/40">
                  {comment.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white truncate">{comment.name}</span>
                    <span className="text-[10px] text-zinc-500 shrink-0">{comment.date}</span>
                  </div>
                  <p className="text-zinc-300 mt-1 leading-relaxed break-words">{comment.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
