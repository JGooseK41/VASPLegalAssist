import React, { useState, useEffect } from 'react';
import { MessageSquare, ThumbsUp, ThumbsDown, AlertCircle, Send, Edit2, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { commentAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const CommentItem = ({ comment, onVote, onEdit, onDelete, currentUserId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  
  const handleSaveEdit = async () => {
    if (editContent.trim() && editContent !== comment.content) {
      await onEdit(comment.id, editContent);
    }
    setIsEditing(false);
  };
  
  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };
  
  const isOwner = comment.user.id === currentUserId;
  
  return (
    <div className="border-l-2 border-gray-300 pl-4 py-3 bg-white rounded-r-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm text-gray-900">
              {comment.user.name}
            </span>
            <span className="text-xs text-gray-500">
              {comment.user.agency}
            </span>
            {comment.isUpdate && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                <AlertCircle className="w-3 h-3 mr-1" />
                Update
              </span>
            )}
          </div>
          
          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows={3}
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
          )}
          
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => onVote(comment.id, comment.userVote === 1 ? 0 : 1)}
                className={`p-1 rounded hover:bg-gray-100 ${
                  comment.userVote === 1 ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-gray-600">{comment.voteScore}</span>
              <button
                onClick={() => onVote(comment.id, comment.userVote === -1 ? 0 : -1)}
                className={`p-1 rounded hover:bg-gray-100 ${
                  comment.userVote === -1 ? 'text-red-600' : 'text-gray-400'
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
              </button>
            </div>
            
            <span className="text-xs text-gray-500">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
            
            {isOwner && !isEditing && (
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(comment.id)}
                  className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const VaspComments = ({ vaspId, vaspName }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isUpdate, setIsUpdate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isRestricted, setIsRestricted] = useState(false);
  
  useEffect(() => {
    if (isExpanded) {
      loadComments();
    }
  }, [isExpanded, vaspId]);
  
  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await commentAPI.getVaspComments(vaspId);
      
      // Check if the response indicates restricted access
      if (response.restricted) {
        setIsRestricted(true);
        setComments([]);
      } else if (Array.isArray(response)) {
        // Normal response - array of comments
        setComments(response);
        setIsRestricted(false);
      } else if (response.comments) {
        // Response with comments array
        setComments(response.comments);
        setIsRestricted(response.restricted || false);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      setSubmitting(true);
      const comment = await commentAPI.createComment(vaspId, newComment, isUpdate);
      setComments([comment, ...comments]);
      setNewComment('');
      setIsUpdate(false);
      
      // Show points earned notification
      const pointsNotification = document.createElement('div');
      pointsNotification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 z-50 animate-slide-in';
      pointsNotification.innerHTML = `
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div>
          <div class="font-semibold">+1 Point Earned!</div>
          <div class="text-sm opacity-90">Thanks for contributing</div>
        </div>
        <a href="/leaderboard" class="ml-4 text-sm underline hover:no-underline">View Leaderboard</a>
      `;
      document.body.appendChild(pointsNotification);
      
      // Add animation styles if not already present
      if (!document.getElementById('points-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'points-animation-styles';
        style.textContent = `
          @keyframes slide-in {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          .animate-slide-in { animation: slide-in 0.3s ease-out; }
        `;
        document.head.appendChild(style);
      }
      
      // Remove notification after delay
      setTimeout(() => {
        pointsNotification.style.transition = 'all 0.3s ease-out';
        pointsNotification.style.transform = 'translateX(100%)';
        pointsNotification.style.opacity = '0';
        setTimeout(() => pointsNotification.remove(), 300);
      }, 3000);
    } catch (error) {
      console.error('Failed to create comment:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleVote = async (commentId, value) => {
    try {
      const result = await commentAPI.voteComment(commentId, value);
      setComments(comments.map(comment => 
        comment.id === commentId 
          ? { ...comment, voteScore: result.voteScore, userVote: result.userVote }
          : comment
      ));
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };
  
  const handleEdit = async (commentId, content) => {
    try {
      const updatedComment = await commentAPI.updateComment(commentId, content);
      setComments(comments.map(comment => 
        comment.id === commentId ? updatedComment : comment
      ));
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };
  
  const handleDelete = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      await commentAPI.deleteComment(commentId);
      setComments(comments.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };
  
  return (
    <div className="bg-gray-50 p-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left hover:bg-gray-100 p-2 rounded-md transition-colors -m-2"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Community Comments</span>
          {comments.length > 0 && !isExpanded && (
            <span className="text-xs text-gray-500">({comments.length})</span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      
      {isExpanded && (
        <div className="mt-4">
          {/* Check if user is restricted (demo user) */}
          {isRestricted || user?.role === 'DEMO' ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  Comments are not available for demo accounts. Please upgrade to a full account to view and participate in discussions.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* New Comment Form */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isUpdate}
                      onChange={(e) => setIsUpdate(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">This is an update notification</span>
                  </label>
                </div>
                
                <div className="flex gap-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={`Share your experience or updates about ${vaspName}...`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={3}
                  />
                  <button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
          
          {/* Comments List */}
          <div className="max-h-80 overflow-y-auto pr-2 scrollbar-thin">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : comments.length > 0 ? (
              <div className="space-y-2">
                {comments.map(comment => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    onVote={handleVote}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    currentUserId={user?.id}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">
                No comments yet. Be the first to share your experience!
              </p>
            )}
          </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VaspComments;