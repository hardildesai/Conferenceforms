// types/database.ts
// TypeScript types matching the Supabase `registrations` table schema.

export interface Registration {
  id: string;
  created_at: string;
  company_name: string;
  visitor_name: string;
  designation: string;
  email: string;
  phone: string;
  code: string;
  email_sent: boolean;
  whatsapp_sent: boolean;
  attended: boolean;
  attended_at: string | null;
}

// Supabase Database type used with createClient<Database>
export interface Database {
  public: {
    Tables: {
      registrations: {
        Row: Registration;
        Insert: Omit<Registration, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Registration, 'id' | 'created_at'>>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
