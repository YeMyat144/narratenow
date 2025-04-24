export type User = {
    id: string
    email?: string
    app_metadata: {
      provider?: string
      providers?: string[]
    }
    user_metadata: {
      avatar_url?: string
      email?: string
      email_verified?: boolean
      full_name?: string
      iss?: string
      name?: string
      preferred_username?: string
      provider_id?: string
      sub?: string
      user_name?: string
    }
    aud: string
    confirmation_sent_at?: string
    recovery_sent_at?: string
    email_confirmed_at?: string
    confirmed_at?: string
    last_sign_in_at?: string
    role?: string
    created_at: string
    updated_at?: string
  }
  
  export type Profile = {
    id: string
    username: string
    avatar_url?: string
    bio?: string
    website?: string
    created_at?: string
    updated_at?: string
    email?: string
  }
  
  export type Choice = {
    text: string
    targetSceneId: string
  }
  
  export type Scene = {
    id: string
    text: string
    choices: Choice[]
  }
  
  export type Story = {
    id: string
    title: string
    description?: string
    cover_image?: string
    scenes: Scene[]
    author_id: string
    created_at?: string
    updated_at?: string
    view_count?: number
    profiles?: Profile
    story_likes?: any[]
  }
  
  export type StoryLike = {
    id: string
    story_id: string
    user_id: string
    created_at: string
  }
  
  export interface Database {
    public: {
      Tables: {
        profiles: {
          Row: Profile
          Insert: Omit<Profile, "created_at">
          Update: Partial<Omit<Profile, "id" | "created_at">>
        }
        stories: {
          Row: Story
          Insert: Omit<Story, "id" | "created_at" | "updated_at" | "view_count">
          Update: Partial<Omit<Story, "id" | "created_at">>
        }
        story_likes: {
          Row: StoryLike
          Insert: Omit<StoryLike, "id" | "created_at">
          Update: Partial<Omit<StoryLike, "id" | "created_at">>
        }
      }
    }
  }
  