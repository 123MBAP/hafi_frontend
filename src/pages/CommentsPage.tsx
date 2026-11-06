import { useAuth } from "@/context/AuthContext";
import { useDarkMode } from "@/context/DarkMode";
import LoadingSpinner from "@/components/LoadingSpinner";
import PageHeader from "@/components/ui/PageHeader";
import { useEffect, useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaReply,  FaThumbsUp } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { MessageCircle, Heart, Send } from "lucide-react";
import defaultProfile from "./images/profile_image.png";
import { API_BASE } from '../api/apiClient';


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

        map[mockUser.sender] = defaultProfile;
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

      const structured = await Promise.all(
        data.map(async (comment: Comment) => {
          let repliesList: Reply[] = [];
          if (comment.replyCount && comment.replyCount > 0) {
            try {
              const repliesRes = await fetch(`${API_BASE}/api/comments/${comment.id}/replies`);
              if (repliesRes.ok) {
                repliesList = await repliesRes.json();
              }
            } catch (e) {
              console.error(`Failed to fetch replies for comment ${comment.id}`, e);
            }
          }
          return {
            ...comment,
            sender: comment.sender_name,
            showReplyInput: false,
            replies: repliesList,
            replyCount: comment.replyCount || 0
          };
        })
      );

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

  const getAvatarUrl = (name: string) => {
    const rawUrl = profileImagesMap[name];
    if (!rawUrl) return defaultProfile;
    const cleanUrl = rawUrl.replace(/\\/g, "/");
    if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
      return cleanUrl;
    }
    return `${API_BASE}${cleanUrl.startsWith("/") ? "" : "/"}${cleanUrl}`;
  };

  return (
    <div className={`min-h-screen py-6 px-4 transition-colors duration-200 ${darkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Editorial Header */}
        <PageHeader
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Feedback' },
          ]}
          title="Customer Feedback"
          subtitle="Share your experiences, browse community reviews, and ask questions directly to providers and sellers."
          badge={`${chatComments.length} reviews`}
        />

        {/* Comments List */}
        <div className="space-y-3.5 mb-6">
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="md" variant="dots" message="Loading comments..." />
            </div>
          ) : chatComments.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-dashed border-gray-300 dark:border-zinc-800 bg-[#F5F5F5] dark:bg-zinc-900/40 p-6">
              <MessageCircle className="w-8 h-8 text-[#E5252A] mx-auto mb-2 opacity-60" />
              <p className="text-xs font-bold uppercase tracking-wider text-[#666666] dark:text-zinc-400">
                No comments yet. Be the first to share your feedback!
              </p>
            </div>
          ) : (
            chatComments.map((c, index) => (
              <div
                key={index}
                className="p-4 sm:p-5 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all duration-200"
              >
                <div className="flex gap-3.5">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <img
                      src={getAvatarUrl(c.sender_name)}
                      className="w-10 h-10 object-cover rounded-full border border-gray-200 dark:border-zinc-700"
                      alt={c.sender_name}
                      onError={(e) => {
                        e.currentTarget.src = defaultProfile;
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs sm:text-sm font-bold uppercase tracking-wide text-[#151515] dark:text-white">
                          @{c.sender_name}
                        </span>
                        <span className="text-[11px] font-medium text-[#666666] dark:text-zinc-500">
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
                          className="p-1 rounded-md transition-colors text-gray-400 hover:text-black dark:hover:text-white"
                        >
                          <BsThreeDotsVertical className="w-4 h-4" />
                        </button>
                        {c.menuOpen && (
                          <div className="absolute right-0 mt-1 shadow-lg border rounded-lg z-10 w-24 overflow-hidden bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700">
                            <button
                              className="w-full text-left px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800 text-[#151515] dark:text-white"
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
                              className="w-full text-left px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#E5252A] transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800"
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
                          className="flex-1 px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-[#E5252A]"
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
                          className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-[#E5252A] text-white transition-colors hover:bg-black shadow-sm"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm leading-relaxed text-[#151515] dark:text-zinc-200">
                        {c.text}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-4 mt-3">
                      <button
                        onClick={() => toggleLike(index, true)}
                        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors text-gray-500 hover:text-[#E5252A]"
                      >
                        <FaThumbsUp className="w-3.5 h-3.5 text-[#E5252A]" />
                        <span>{c.likes}</span>
                      </button>
                      <button
                        onClick={() => toggleReplyInput(index)}
                        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors text-gray-500 hover:text-[#E5252A]"
                      >
                        <FaReply className="w-3.5 h-3.5" />
                        <span>Reply</span>
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
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-black dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#E5252A]"
                          onKeyPress={(e) => e.key === 'Enter' && handleReplySend(index)}
                        />
                        <button
                          onClick={() => handleReplySend(index)}
                          className="px-3 py-1.5 rounded-lg bg-[#E5252A] text-white transition-colors hover:bg-black shadow-sm"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Replies Section */}
                    {c.replies.length > 0 && (
                      <div className="mt-3 pl-4 space-y-2 border-l-2 border-red-500/30">
                        {c.replies.map((reply, replyIndex) => (
                          <div
                            key={replyIndex}
                            className="p-3 rounded-lg border border-gray-100 dark:border-zinc-800 bg-[#F5F5F5] dark:bg-zinc-950/40"
                          >
                            <div className="flex gap-2.5">
                              <img
                                src={getAvatarUrl(reply.sender_name)}
                                className="w-6 h-6 object-cover rounded-full border border-gray-200 dark:border-zinc-700"
                                alt=""
                                onError={(e) => {
                                  e.currentTarget.src = defaultProfile;
                                }}
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold uppercase tracking-wide text-[#151515] dark:text-white">
                                      @{reply.sender_name}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
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
                                      className="p-0.5 text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                                    >
                                      <BsThreeDotsVertical className="w-3 h-3" />
                                    </button>
                                    {replyMenu[`${index}-${replyIndex}`] && (
                                      <div className="absolute right-0 mt-1 shadow-lg border rounded-lg z-10 w-20 overflow-hidden bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700">
                                        <button
                                          className="w-full text-left px-3 py-1 text-xs font-bold uppercase transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800 text-[#151515] dark:text-white"
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
                                          className="w-full text-left px-3 py-1 text-xs font-bold uppercase text-[#E5252A] transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800"
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
                                      className="flex-1 px-2.5 py-1 text-xs rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-[#E5252A]"
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
                                      className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md bg-[#E5252A] text-white hover:bg-black transition-colors"
                                    >
                                      Save
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-xs leading-relaxed text-[#151515] dark:text-zinc-300">
                                      {reply.text}
                                    </p>
                                    <button
                                      onClick={() => handleReplyLike(index, replyIndex, true)}
                                      className="flex items-center gap-1 mt-2 text-xs font-bold transition-colors text-gray-500 hover:text-[#E5252A]"
                                    >
                                      <Heart className="w-3.5 h-3.5 text-[#E5252A] fill-[#E5252A]" />
                                      <span>{reply.likes || 0}</span>
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
                        className="mt-2 text-xs font-bold uppercase tracking-wider text-[#E5252A] hover:underline transition-colors"
                      >
                        Show {c.replyCount} {c.replyCount === 1 ? 'reply' : 'replies'} →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-5 border-t border-gray-200 dark:border-zinc-800 items-stretch sm:items-end">
          <textarea
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                handleSend();
              }
            }}
            placeholder="Share your feedback or question... (Ctrl + Enter to post)"
            rows={3}
            className="flex-1 px-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-black dark:text-white placeholder-gray-400 shadow-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#E5252A]"
          />
          <button
            onClick={handleSend}
            className="px-6 py-3 text-xs font-bold uppercase tracking-wider rounded-xl bg-[#E5252A] hover:bg-black text-white transition-all shadow-md active:scale-98 self-end sm:self-auto h-[46px]"
          >
            Post Comment
          </button>
        </div>
      </div>
    </div>
  );
}