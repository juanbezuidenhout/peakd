import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://dowdouiybyxrwtoysbne.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvd2RvdWl5Ynl4cnd0b3lzYm5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MjEyOTcsImV4cCI6MjA5MDE5NzI5N30.2Tb0FsUOPGq9JHo0Uze7oI6E78mCeUEkNpuBttkqFMI'
);