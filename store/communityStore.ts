import { create } from "zustand";
import { Post, Topic, Comment } from "@/types/community";

interface CommunityState {
  posts: Post[];
  filteredPosts: Post[];
  selectedTopic: Topic | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setPosts: (posts: Post[]) => void;
  addPost: (post: Post) => void;
  updatePost: (postId: string, postData: Partial<Post>) => void;
  deletePost: (postId: string) => void;
  likePost: (postId: string) => void;
  unlikePost: (postId: string) => void;
  addComment: (postId: string, comment: Comment) => void;
  likeComment: (postId: string, commentId: string) => void;
  unlikeComment: (postId: string, commentId: string) => void;
  filterByTopic: (topic: Topic | null) => void;
  searchPosts: (query: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useCommunityStore = create<CommunityState>()((set, get) => ({
  posts: [],
  filteredPosts: [],
  selectedTopic: null,
  isLoading: false,
  error: null,
  searchQuery: "",
  
  setPosts: (posts) => {
    const state = get();
    let filtered = posts;
    
    // Apply topic filter
    if (state.selectedTopic) {
      filtered = filtered.filter(p => p.topic === state.selectedTopic);
    }
    
    // Apply search filter
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(query) || 
        p.content.toLowerCase().includes(query)
      );
    }
    
    set({ posts, filteredPosts: filtered });
  },
  
  addPost: (post) => {
    const state = get();
    const newPosts = [post, ...state.posts];
    state.setPosts(newPosts);
  },
  
  updatePost: (postId, postData) => {
    const state = get();
    const updatedPosts = state.posts.map((post) => 
      post.id === postId ? { ...post, ...postData } : post
    );
    state.setPosts(updatedPosts);
  },
  
  deletePost: (postId) => {
    const state = get();
    const updatedPosts = state.posts.filter((post) => post.id !== postId);
    state.setPosts(updatedPosts);
  },
  
  likePost: (postId) => {
    const state = get();
    const updatedPosts = state.posts.map((post) => 
      post.id === postId ? { ...post, likes: post.likes + 1, isLiked: true } : post
    );
    state.setPosts(updatedPosts);
  },
  
  unlikePost: (postId) => {
    const state = get();
    const updatedPosts = state.posts.map((post) => 
      post.id === postId ? { ...post, likes: Math.max(0, post.likes - 1), isLiked: false } : post
    );
    state.setPosts(updatedPosts);
  },
  
  addComment: (postId: string, comment: Comment) => {
    const { posts, setPosts } = get();
    const updatedPosts = posts.map((post) =>
      post.id === postId
        ? { ...post, comments: [...(Array.isArray(post.comments) ? post.comments : []), comment] }
        : post
    );
    setPosts(updatedPosts);
  },
  
  likeComment: (postId: string, commentId: string) => {
    const { posts, setPosts } = get();
    const updatedPosts = posts.map((post) =>
      post.id === postId
        ? {
            ...post,
            comments: Array.isArray(post.comments) ? post.comments.map((comment) =>
              comment.id === commentId
                ? { ...comment, isLiked: !comment.isLiked, likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1 }
                : comment
            ) : [],
          }
        : post
    );
    setPosts(updatedPosts);
  },
  
  unlikeComment: (postId: string, commentId: string) => {
    const { posts, setPosts } = get();
    const updatedPosts = posts.map((post) =>
      post.id === postId
        ? {
            ...post,
            comments: Array.isArray(post.comments) ? post.comments.map((comment) =>
              comment.id === commentId
                ? { ...comment, isLiked: false, likes: Math.max(0, comment.likes - 1) }
                : comment
            ) : [],
          }
        : post
    );
    setPosts(updatedPosts);
  },
  
  filterByTopic: (topic) => {
    const state = get();
    set({ selectedTopic: topic });
    
    let filtered = state.posts;
    if (topic) {
      filtered = filtered.filter((post) => post.topic === topic);
    }
    
    // Apply search filter if exists
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(query) || 
        p.content.toLowerCase().includes(query)
      );
    }
    
    set({ filteredPosts: filtered });
  },
  
  searchPosts: (query) => {
    const state = get();
    set({ searchQuery: query });
    
    let filtered = state.posts;
    
    // Apply topic filter if exists
    if (state.selectedTopic) {
      filtered = filtered.filter(p => p.topic === state.selectedTopic);
    }
    
    // Apply search filter
    if (query) {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter((post) => 
        post.title.toLowerCase().includes(lowercaseQuery) || 
        post.content.toLowerCase().includes(lowercaseQuery)
      );
    }
    
    set({ filteredPosts: filtered });
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));