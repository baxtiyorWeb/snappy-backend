// src/profile/dto/profile-response.dto.ts
export class ProfileResponseDto {
  id: number;
  username: string;
  slug: string;
  avatar?: string;
  coverImage?: string;
  bio?: string;
  bioSummary?: string;
  isVerified: boolean;
  isPremium: boolean;
  stats: any;
  customLinks: { title: string; url: string }[];
  theme: any;
  pinnedNote?: any;
}