
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  mobile TEXT,
  village TEXT,
  district TEXT,
  land_size NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, mobile, village, district, land_size)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'mobile',
    NEW.raw_user_meta_data->>'village',
    NEW.raw_user_meta_data->>'district',
    NULLIF(NEW.raw_user_meta_data->>'land_size','')::numeric
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Crops table
CREATE TABLE public.crops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  crop_name TEXT NOT NULL,
  sowing_month TEXT,
  harvest_month TEXT,
  land_area NUMERIC NOT NULL DEFAULT 0,
  inv_seeds NUMERIC NOT NULL DEFAULT 0,
  inv_fertilizer NUMERIC NOT NULL DEFAULT 0,
  inv_labor NUMERIC NOT NULL DEFAULT 0,
  inv_irrigation NUMERIC NOT NULL DEFAULT 0,
  inv_pesticide NUMERIC NOT NULL DEFAULT 0,
  inv_equipment NUMERIC NOT NULL DEFAULT 0,
  inv_other NUMERIC NOT NULL DEFAULT 0,
  quantity_harvested NUMERIC NOT NULL DEFAULT 0,
  market_rate NUMERIC NOT NULL DEFAULT 0,
  total_selling NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own crops" ON public.crops FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own crops" ON public.crops FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own crops" ON public.crops FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own crops" ON public.crops FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX crops_user_quarter_idx ON public.crops(user_id, year, quarter);
