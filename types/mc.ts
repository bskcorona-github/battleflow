import { Like, Comment } from "@prisma/client";

export type MCFrontend = {
  id: number;
  name: string;
  image: string | null;
  description: string | null;
  hood: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MCWithLikesAndComments = {
  id: number;
  name: string;
  affiliation: string | null;
  description: string | null;
  hood: string | null;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  isLikedByUser: boolean;
  likes: {
    id: number;
    userId: string;
    mcId: number;
    createdAt: string;
  }[];
  comments: CommentWithUser[];
} & {
  -readonly [K in keyof MCWithLikesAndComments]: MCWithLikesAndComments[K];
};

export type CommentWithUser = {
  id: number;
  content: string;
  userId: string;
  mcId: number;
  createdAt: string;
  updatedAt: string;
  parentId: number | null;
  replies: CommentWithUser[];
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
};
