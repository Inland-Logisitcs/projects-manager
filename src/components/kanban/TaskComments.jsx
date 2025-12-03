import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Icon from '../common/Icon';
import UserAvatar from '../common/UserAvatar';
import { addComment, deleteComment } from '../../services/taskService';
import '../../styles/TaskComments.css';

const TaskComments = ({ taskId, comments = [], onCommentAdded, onCommentDeleted }) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [newComment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const result = await addComment(taskId, {
      text: newComment.trim(),
      userId: user.uid
    });

    if (result.success) {
      setNewComment('');
      if (onCommentAdded) onCommentAdded(result.comment);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (commentId) => {
    const result = await deleteComment(taskId, commentId);
    if (result.success && onCommentDeleted) {
      onCommentDeleted(commentId);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatCommentDate = (date) => {
    if (!date) return '';

    const commentDate = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diffMs = now - commentDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `hace ${diffMins}m`;
    if (diffHours < 24) return `hace ${diffHours}h`;
    if (diffDays === 1) return 'ayer';
    if (diffDays < 7) return `hace ${diffDays}d`;

    return commentDate.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: commentDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  // Ordenar comentarios por fecha (más reciente primero)
  const sortedComments = [...comments].sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
    return dateB - dateA;
  });

  return (
    <div className="task-comments">
      {/* Form para nuevo comentario */}
      <form onSubmit={handleSubmit} className="comment-form">
        <div className="comment-input-wrapper">
          <UserAvatar userId={user.uid} size={32} />
          <textarea
            ref={textareaRef}
            className="comment-textarea"
            placeholder="Escribe un comentario..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isSubmitting}
          />
        </div>
        {newComment.trim() && (
          <div className="comment-actions flex justify-end gap-sm mt-sm">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setNewComment('')}
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enviando...' : 'Comentar'}
            </button>
          </div>
        )}
      </form>

      {/* Lista de comentarios */}
      {sortedComments.length > 0 && (
        <div className="comments-list">
          {sortedComments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <UserAvatar userId={comment.userId} size={28} />
                <div className="comment-meta">
                  <div className="flex items-center gap-xs">
                    <UserAvatar userId={comment.userId} size={0} showName={true} />
                    <span className="comment-date text-tertiary">
                      • {formatCommentDate(comment.createdAt)}
                    </span>
                  </div>
                </div>
                {comment.userId === user.uid && (
                  <button
                    className="btn btn-icon btn-sm comment-delete-btn"
                    onClick={() => handleDelete(comment.id)}
                    title="Eliminar comentario"
                  >
                    <Icon name="trash" size={14} />
                  </button>
                )}
              </div>
              <div className="comment-body">
                <p className="comment-text">{comment.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskComments;
