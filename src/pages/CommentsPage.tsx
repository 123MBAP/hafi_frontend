import { useAuth } from "@/context/AuthContext";
import { useDarkMode } from "@/context/DarkMode";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useEffect, useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaPaperPlane, FaReply, FaThumbsDown, FaThumbsUp } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { MessageCircle, Heart, Send } from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

interface Reply {
  id: number;
  sender_name: string;
  text: string;
  timestamp: string;
  likes?: number;
}

interface Comment {
  id: number;
  sender_name: string;
  text: string;
  timestamp: string;
  likes: number;
  showReplyInput: boolean;
  replies: Reply[];
  isEditing?: boolean;
  menuOpen?: boolean;
  parent_id: string | null;
  replyCount?: number;
}

interface ProfileImage {
  providerId: string;
  role: "customer";
  image_url: string;
}

const mockUser = {
  sender: "You",
};

export default function CommentBox() {
  const { darkMode } = useDarkMode();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  const [chatComments, setChatComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [commentInput, setCommentInput] = useState("");
  const [replyInputs, setReplyInputs] = useState<{ [index: number]: string }>({});
  const [replyMenu, setReplyMenu] = useState<{ [key: string]: boolean }>({});
  const [editingReply, setEditingReply] = useState<{ [key: string]: boolean }>({});
  const [editingReplyText, setEditingReplyText] = useState<{ [key: string]: string }>({});
  const [profileImagesMap, setProfileImagesMap] = useState<{ [providerId: string]: string }>({});
  const yourJWTToken = localStorage.getItem('token');

  useEffect(() => {
    fetchComments();
    const fetchProfileImages = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/profile-images`);
        const data: ProfileImage[] = await res.json();

        const map: { [key: string]: string } = {};
        data.forEach((p) => {
          map[p.providerId] = p.image_url;
        });

        map[mockUser.sender] = `${API_BASE}/icons/you.png`;
        setProfileImagesMap(map);
      } catch (err) {
        console.error("Failed to load profile images", err);
      } finally {
        setLoadingProfiles(false);
      }
    };

    fetchProfileImages();
  }, []);

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`${API_BASE}/api/comments?postId=123`);
      const data: Comment[] = await res.json();

      const structured = data.map((comment: Comment) => ({
        ...comment,
        sender: comment.sender_name,
        showReplyInput: false,
        replies: [],
        replyCount: comment.replyCount || 0
      }));

      setChatComments(structured);
    } catch (error) {
      console.error("Failed to load comments", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSend = async () => {
    if (!commentInput.trim()) return;

    if (!isLoggedIn) {
      navigate('/login', {
        state: {
          from: location.pathname + location.search,
          message: 'Please log in to post a comment'
        }
      });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${yourJWTToken}`,
        },
        body: JSON.stringify({
          postId: 123,
          text: commentInput.trim(),
          parentId: null,
        }),
      });

      const newComment = await res.json();

      setChatComments((prev) => [
        ...prev,
        {
          id: newComment.id,
          sender_name: newComment.sender,
          text: newComment.text,
          timestamp: newComment.timestamp,
          likes: newComment.likes || 0,
          showReplyInput: false,
          replies: [],
          parent_id: null,
        },
      ]);

      setCommentInput('');
    } catch (err) {
      console.error('Failed to send comment', err);
    }
  };

  const toggleReplyInput = (index: number) => {
    setChatComments((prev) =>
      prev.map((c, i) =>
        i === index ? { ...c, showReplyInput: !c.showReplyInput } : c
      )
    );
  };

  const handleReplySend = async (index: number) => {
    const replyText = replyInputs[index]?.trim();
    if (!replyText) return;

    if (!isLoggedIn) {
      navigate('/login', {
        state: {
          from: location.pathname + location.search,
          message: 'Please log in to post a reply'
        }
      });
      return;
    }

    try {
      const parentComment = chatComments[index];
      const res = await fetch(`${API_BASE}/api/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${yourJWTToken}`,
        },
        body: JSON.stringify({
          postId: 123,
          text: replyText,
          parentId: parentComment.id,
        }),
      });

      const newReply = await res.json();

      setChatComments((prev) =>
        prev.map((comment, i) =>
          i === index
            ? {
                ...comment,
                replies: [
                  ...comment.replies,
                  {
                    id: newReply.id,
                    sender_name: newReply.sender,
                    text: newReply.text,
                    timestamp: newReply.timestamp,
                  },
                ],
                showReplyInput: false,
              }
            : comment
        )
      );

      setReplyInputs((prev) => ({ ...prev, [index]: '' }));
    } catch (err) {
      console.error('Failed to send reply', err);
    }
  };

  const handleReplyLike = async (commentIndex: number, replyIndex: number, increment: boolean) => {
    const reply = chatComments[commentIndex].replies[replyIndex];

    try {
      const res = await fetch(`${API_BASE}/api/comments/${reply.id}/like`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: increment ? 'like' : 'unlike',
        }),
      });

      const updated = await res.json();

      setChatComments(prev =>
        prev.map((comment, ci) =>
          ci === commentIndex
            ? {
                ...comment,
                replies: comment.replies.map((r, ri) =>
                  ri === replyIndex ? { ...r, likes: updated.likes } : r
                ),
              }
            : comment
        )
      );
    } catch (err) {
      console.error('Like failed', err);
    }
  };

  const handleEditComment = async (index: number, newText: string) => {
    try {
      const comment = chatComments[index];
      const res = await fetch(`${API_BASE}/api/comments/${comment.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${yourJWTToken}`,
        },
        body: JSON.stringify({ text: newText }),
      });

      const updated = await res.json();
      setChatComments((prev) =>
        prev.map((c, i) =>
          i === index ? { ...c, text: updated.text, isEditing: false } : c
        )
      );
    } catch (err) {
      console.error('Failed to edit comment', err);
    }
  };

  const handleDeleteComment = async (index: number) => {
    const comment = chatComments[index];
    try {
      await fetch(`${API_BASE}/api/comments/${comment.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${yourJWTToken}`,
        },
      });

      setChatComments((prev) => prev.filter((_, i) => i !== index));
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const handleEditReply = async (commentIndex: number, replyIndex: number, newText: string) => {
    const reply = chatComments[commentIndex].replies[replyIndex];

    try {
      const res = await fetch(`${API_BASE}/api/comments/${reply.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${yourJWTToken}`,
        },
        body: JSON.stringify({ text: newText }),
      });

      const updated = await res.json();

      setChatComments((prev) =>
        prev.map((c, ci) =>
          ci === commentIndex
            ? {
                ...c,
                replies: c.replies.map((r, ri) =>
                  ri === replyIndex ? { ...r, text: updated.text } : r
                ),
              }
            : c
        )
      );

      setEditingReply((prev) => ({ ...prev, [`${commentIndex}-${replyIndex}`]: false }));
    } catch (err) {
      console.error('Failed to edit reply', err);
    }
  };

  const handleDeleteReply = async (commentIndex: number, replyIndex: number) => {
    const reply = chatComments[commentIndex].replies[replyIndex];
    try {
      await fetch(`${API_BASE}/api/comments/${reply.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${yourJWTToken}` },
      });

      setChatComments((prev) =>
        prev.map((comment, ci) =>
          ci === commentIndex
            ? {
                ...comment,
                replies: comment.replies.filter((_, ri) => ri !== replyIndex),
              }
            : comment
        )
      );
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const loadReplies = async (index: number) => {
    const comment = chatComments[index];
    try {
      const res = await fetch(`${API_BASE}/api/comments/${comment.id}/replies`);
      const replies = await res.json();

      setChatComments(prev =>
        prev.map((c, i) =>
          i === index ? { ...c, replies } : c
        )
      );
    } catch (error) {
      console.error("Failed to load replies", error);
    }
  };

  const toggleLike = async (index: number, increment: boolean) => {
    const comment = chatComments[index];
    try {
      const res = await fetch(`${API_BASE}/api/comments/${comment.id}/like`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: increment ? 'like' : 'unlike',
        }),
      });

      const updated = await res.json();
      setChatComments((prev) =>
        prev.map((c, i) =>
          i === index ? { ...c, likes: updated.likes } : c
        )
      );
    } catch (err) {
      console.error('Like failed', err);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const isLoading = loadingComments || loadingProfiles;

  return (
    <div className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'} w-full`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-500" />
            <h1 className="text-lg font-bold tracking-tighter uppercase text-gray-900 dark:text-white">
              Customer Feedback
            </h1>
          </div>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
            {chatComments.length} comments • Share your thoughts
          </p>
        </div>

        {/* Comments List */}
        <div className="space-y-3 mb-6">
          {isLoading ? (
            <div className="py-12">
              <LoadingSpinner size="md" variant="dots" />
            </div>
          ) : chatComments.length === 0 ? (
            <div className={`text-center py-12 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No comments yet. Be the first to share your feedback!
            </div>
          ) : (
            chatComments.map((c, index) => (
              <div
                key={index}
                className={`p-4 border-0 shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
                style={{ borderRadius: '2px' }}
              >
                <div className="flex gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <img
                      src={
                        profileImagesMap[c.sender_name]?.replace(/\\/g, "/") ||
                        `${API_BASE}/icons/profile.png`
                      }
                      className="w-10 h-10 object-cover"
                      style={{ borderRadius: '2px' }}
                      alt={c.sender_name}
                      onError={(e) => {
                        e.currentTarget.src = `${API_BASE}/icons/profile.png`;
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          @{c.sender_name}
                        </span>
                        <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {formatTime(c.timestamp)}
                        </span>
                      </div>
                      <div className="relative">
                        <button
                          onClick={() =>
                            setChatComments((prev) =>
                              prev.map((cm, i) =>
                                i === index ? { ...cm, menuOpen: !cm.menuOpen } : cm
                              )
                            )
                          }
                          className={`p-1 transition-colors ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          <BsThreeDotsVertical className="w-4 h-4" />
                        </button>
                        {c.menuOpen && (
                          <div
                            className={`absolute right-0 mt-1 shadow-sm border-0 z-10 w-24 overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
                            style={{ borderRadius: '2px' }}
                          >
                            <button
                              className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${darkMode ? 'hover:bg-gray-600 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}
                              onClick={() =>
                                setChatComments((prev) =>
                                  prev.map((cm, i) =>
                                    i === index
                                      ? { ...cm, isEditing: true, menuOpen: false }
                                      : cm
                                  )
                                )
                              }
                            >
                              Edit
                            </button>
                            <button
                              className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${darkMode ? 'hover:bg-gray-600 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}
                              onClick={() => handleDeleteComment(index)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {c.isEditing ? (
                      <div className="flex gap-2 mt-2">
                        <input
                          className={`flex-1 px-3 py-1.5 text-sm border-0 ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} focus:ring-1 focus:ring-emerald-500`}
                          style={{ borderRadius: '2px' }}
                          value={c.text}
                          onChange={(e) => {
                            const updatedText = e.target.value;
                            setChatComments((prev) =>
                              prev.map((cm, i) =>
                                i === index ? { ...cm, text: updatedText } : cm
                              )
                            );
                          }}
                        />
                        <button
                          onClick={() => handleEditComment(index, c.text)}
                          className="px-3 py-1.5 text-xs font-medium bg-emerald-500 text-white transition-colors hover:bg-emerald-600"
                          style={{ borderRadius: '2px' }}
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {c.text}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-4 mt-3">
                      <button
                        onClick={() => toggleLike(index, true)}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${
                          darkMode ? 'text-gray-400 hover:text-emerald-400' : 'text-gray-500 hover:text-emerald-600'
                        }`}
                      >
                        <FaThumbsUp className="w-3.5 h-3.5" />
                        <span>{c.likes}</span>
                      </button>
                      <button
                        onClick={() => toggleReplyInput(index)}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${
                          darkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-500 hover:text-blue-600'
                        }`}
                      >
                        <FaReply className="w-3.5 h-3.5" />
                        Reply
                      </button>
                    </div>

                    {/* Reply Input */}
                    {c.showReplyInput && (
                      <div className="mt-3 flex gap-2">
                        <input
                          type="text"
                          value={replyInputs[index] || ""}
                          onChange={(e) =>
                            setReplyInputs((prev) => ({
                              ...prev,
                              [index]: e.target.value,
                            }))
                          }
                          placeholder="Write a reply..."
                          className={`flex-1 px-3 py-1.5 text-sm border-0 ${darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-900 placeholder-gray-500'} focus:ring-1 focus:ring-emerald-500`}
                          style={{ borderRadius: '2px' }}
                          onKeyPress={(e) => e.key === 'Enter' && handleReplySend(index)}
                        />
                        <button
                          onClick={() => handleReplySend(index)}
                          className="p-1.5 bg-emerald-500 text-white transition-colors hover:bg-emerald-600"
                          style={{ borderRadius: '2px' }}
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Replies Section */}
                    {c.replies.length > 0 && (
                      <div className="mt-3 pl-4 space-y-2">
                        {c.replies.map((reply, replyIndex) => (
                          <div
                            key={replyIndex}
                            className={`p-3 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}
                            style={{ borderRadius: '2px' }}
                          >
                            <div className="flex gap-2">
                              <img
                                src={
                                  profileImagesMap[reply.sender_name]?.replace(/\\/g, "/") ||
                                  `${API_BASE}/icons/profile.png`
                                }
                                className="w-6 h-6 object-cover"
                                style={{ borderRadius: '2px' }}
                                alt=""
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                      @{reply.sender_name}
                                    </span>
                                    <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                      {formatTime(reply.timestamp)}
                                    </span>
                                  </div>
                                  <div className="relative">
                                    <button
                                      onClick={() =>
                                        setReplyMenu((prev) => ({
                                          ...prev,
                                          [`${index}-${replyIndex}`]: !prev[`${index}-${replyIndex}`],
                                        }))
                                      }
                                      className={`p-0.5 transition-colors ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                      <BsThreeDotsVertical className="w-3 h-3" />
                                    </button>
                                    {replyMenu[`${index}-${replyIndex}`] && (
                                      <div
                                        className={`absolute right-0 mt-1 shadow-sm border-0 z-10 w-20 overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-white'}`}
                                        style={{ borderRadius: '2px' }}
                                      >
                                        <button
                                          className={`w-full text-left px-3 py-1 text-xs transition-colors ${darkMode ? 'hover:bg-gray-600 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}
                                          onClick={() => {
                                            setEditingReply((prev) => ({
                                              ...prev,
                                              [`${index}-${replyIndex}`]: true,
                                            }));
                                            setEditingReplyText((prev) => ({
                                              ...prev,
                                              [`${index}-${replyIndex}`]: reply.text,
                                            }));
                                            setReplyMenu((prev) => ({
                                              ...prev,
                                              [`${index}-${replyIndex}`]: false,
                                            }));
                                          }}
                                        >
                                          Edit
                                        </button>
                                        <button
                                          className={`w-full text-left px-3 py-1 text-xs transition-colors ${darkMode ? 'hover:bg-gray-600 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}
                                          onClick={() => handleDeleteReply(index, replyIndex)}
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {editingReply[`${index}-${replyIndex}`] ? (
                                  <div className="flex gap-2 mt-1">
                                    <input
                                      className={`flex-1 px-2 py-1 text-sm border-0 ${darkMode ? 'bg-gray-600 text-white' : 'bg-white text-gray-900'} focus:ring-1 focus:ring-emerald-500`}
                                      style={{ borderRadius: '2px' }}
                                      value={editingReplyText[`${index}-${replyIndex}`] || reply.text}
                                      onChange={(e) =>
                                        setEditingReplyText((prev) => ({
                                          ...prev,
                                          [`${index}-${replyIndex}`]: e.target.value,
                                        }))
                                      }
                                    />
                                    <button
                                      onClick={() =>
                                        handleEditReply(
                                          index,
                                          replyIndex,
                                          editingReplyText[`${index}-${replyIndex}`] || reply.text
                                        )
                                      }
                                      className="px-2 py-1 text-xs font-medium bg-emerald-500 text-white"
                                      style={{ borderRadius: '2px' }}
                                    >
                                      Save
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                      {reply.text}
                                    </p>
                                    <button
                                      onClick={() => handleReplyLike(index, replyIndex, true)}
                                      className={`flex items-center gap-1 mt-2 text-xs transition-colors ${
                                        darkMode ? 'text-gray-400 hover:text-emerald-400' : 'text-gray-500 hover:text-emerald-600'
                                      }`}
                                    >
                                      <Heart className="w-3 h-3" />
                                      {reply.likes || 0}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Load More Replies */}
                    {c.replyCount && c.replyCount > 0 && c.replies.length === 0 && (
                      <button
                        onClick={() => loadReplies(index)}
                        className={`mt-2 text-xs font-medium transition-colors ${
                          darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                        }`}
                      >
                        Show {c.replyCount} {c.replyCount === 1 ? 'reply' : 'replies'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <input
            type="text"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            placeholder="Write a comment..."
            className={`flex-1 px-3 py-2 text-sm border-0 ${darkMode ? 'bg-gray-800 text-white placeholder-gray-400' : 'bg-white text-gray-900 placeholder-gray-500'} shadow-sm focus:ring-1 focus:ring-emerald-500`}
            style={{ borderRadius: '2px' }}
          />
          <button
            onClick={handleSend}
            className={`px-4 py-2 text-sm font-medium transition-colors ${darkMode ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-emerald-500 text-white hover:bg-emerald-600'} shadow-sm`}
            style={{ borderRadius: '2px' }}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}