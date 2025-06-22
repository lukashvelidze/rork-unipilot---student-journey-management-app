import { create } from "zustand";
import { Post, Topic } from "@/types/community";

interface CommunityState {
  posts: Post[];
  filteredPosts: Post[];
  selectedTopic: Topic | null;
  isLoading: boolean;
  error: string | null;
  setPosts: (posts: Post[]) => void;
  addPost: (post: Post) => void;
  updatePost: (postId: string, postData: Partial<Post>) => void;
  deletePost: (postId: string) => void;
  likePost: (postId: string) => void;
  unlikePost: (postId: string) => void;
  addComment: (postId: string, comment: any) => void;
  likeComment: (postId: string, commentId: string) => void;
  unlikeComment: (postId: string, commentId: string) => void;
  filterByTopic: (topic: Topic | null) => void;
  searchPosts: (query: string) => void;
}

export const useCommunityStore = create<CommunityState>()((set, get) => ({
  posts: [],
  filteredPosts: [],
  selectedTopic: null,
  isLoading: false,
  error: null,
  setPosts: (posts) => set({ posts, filteredPosts: posts }),
  addPost: (post) => 
    set((state) => {
      const newPosts = [post, ...state.posts];
      return { 
        posts: newPosts,
        filteredPosts: state.selectedTopic 
          ? newPosts.filter(p => p.topic === state.selectedTopic)
          : newPosts
      };
    }),
  updatePost: (postId, postData) => 
    set((state) => {
      const updatedPosts = state.posts.map((post) => 
        post.id === postId ? { ...post, ...postData } : post
      );
      return { 
        posts: updatedPosts,
        filteredPosts: state.selectedTopic 
          ? updatedPosts.filter(p => p.topic === state.selectedTopic)
          : updatedPosts
      };
    }),
  deletePost: (postId) => 
    set((state) => {
      const updatedPosts = state.posts.filter((post) => post.id !== postId);
      return { 
        posts: updatedPosts,
        filteredPosts: state.selectedTopic 
          ? updatedPosts.filter(p => p.topic === state.selectedTopic)
          : updatedPosts
      };
    }),
  likePost: (postId) => 
    set((state) => ({
      posts: state.posts.map((post) => 
        post.id === postId ? { ...post, likes: post.likes + 1, isLiked: true } : post
      ),
      filteredPosts: state.filteredPosts.map((post) => 
        post.id === postId ? { ...post, likes: post.likes + 1, isLiked: true } : post
      ),
    })),
  unlikePost: (postId) => 
    set((state) => ({
      posts: state.posts.map((post) => 
        post.id === postId ? { ...post, likes: post.likes - 1, isLiked: false } : post
      ),
      filteredPosts: state.filteredPosts.map((post) => 
        post.id === postId ? { ...post, likes: post.likes - 1, isLiked: false } : post
      ),
    })),
  addComment: (postId, comment) => 
    set((state) => ({
      posts: state.posts.map((post) => 
        post.id === postId 
          ? { ...post, comments: [...post.comments, comment] } 
          : post
      ),
      filteredPosts: state.filteredPosts.map((post) => 
        post.id === postId 
          ? { ...post, comments: [...post.comments, comment] } 
          : post
      ),
    })),
  likeComment: (postId, commentId) => 
    set((state) => ({
      posts: state.posts.map((post) => 
        post.id === postId 
          ? {
              ...post,
              comments: post.comments.map((comment) => 
                comment.id === commentId 
                  ? { ...comment, likes: comment.likes + 1, isLiked: true } 
                  : comment
              ),
            } 
          : post
      ),
      filteredPosts: state.filteredPosts.map((post) => 
        post.id === postId 
          ? {
              ...post,
              comments: post.comments.map((comment) => 
                comment.id === commentId 
                  ? { ...comment, likes: comment.likes + 1, isLiked: true } 
                  : comment
              ),
            } 
          : post
      ),
    })),
  unlikeComment: (postId, commentId) => 
    set((state) => ({
      posts: state.posts.map((post) => 
        post.id === postId 
          ? {
              ...post,
              comments: post.comments.map((comment) => 
                comment.id === commentId 
                  ? { ...comment, likes: comment.likes - 1, isLiked: false } 
                  : comment
              ),
            } 
          : post
      ),
      filteredPosts: state.filteredPosts.map((post) => 
        post.id === postId 
          ? {
              ...post,
              comments: post.comments.map((comment) => 
                comment.id === commentId 
                  ? { ...comment, likes: comment.likes - 1, isLiked: false } 
                  : comment
              ),
            } 
          : post
      ),
    })),
  filterByTopic: (topic) => 
    set((state) => ({
      selectedTopic: topic,
      filteredPosts: topic ? state.posts.filter((post) => post.topic === topic) : state.posts,
    })),
  searchPosts: (query) => 
    set((state) => {
      const lowercaseQuery = query.toLowerCase();
      const filtered = state.posts.filter((post) => 
        post.title.toLowerCase().includes(lowercaseQuery) || 
        post.content.toLowerCase().includes(lowercaseQuery)
      );
      return {
        filteredPosts: state.selectedTopic 
          ? filtered.filter(p => p.topic === state.selectedTopic)
          : filtered,
      };
    }),
}));