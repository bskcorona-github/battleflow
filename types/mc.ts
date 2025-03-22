import { MC, MCComment, Like } from "@prisma/client";

export type MCFrontend = {
  id: number;
  name: string;
  image: string | null;
  description: string | null;
  hood: string | null;
  createdAt: string;
  updatedAt: string;
};

export interface CommentWithUser extends MCComment {
  user: {
    id: string;
    name: string | null;
    image: string | null;
    email: string | null;
  };
  replies?: CommentWithUser[];
  mcRankId?: number;
}

export interface MCWithLikesAndComments extends MC {
  likes: Like[];
  comments: CommentWithUser[];
  isLikedByUser: boolean;
}
