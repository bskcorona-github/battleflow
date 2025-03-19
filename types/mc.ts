import { Like, Comment } from "@prisma/client";

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export interface Comment {
  id: number;
  content: string;
  userId: string;
  mcId: number;
  createdAt: string;
  updatedAt: string;
  parentId: number | null;
  user: User;
}

export interface CommentWithUser extends Comment {
  replies: CommentWithUser[];
}

export interface MC {
  id: number;
  name: string;
  image: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  isLikedByUser: boolean;
  comments: CommentWithUser[];
}

export interface MCWithLikesAndComments extends MC {
  likes: {
    userId: string;
  }[];
}

export interface APIResponse<T> {
  data?: T;
  error?: string;
  statusCode: number;
}
