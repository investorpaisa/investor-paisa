-- Create promotions table for promoted profiles/services
CREATE TABLE IF NOT EXISTS public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  entity_id uuid NOT NULL,
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true,
  starts_at timestamptz DEFAULT now(),
  ends_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create validation trigger for type instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_promotion_type()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type NOT IN ('profile', 'service') THEN
    RAISE EXCEPTION 'Invalid promotion type: %. Must be profile or service.', NEW.type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_promotion_type_trigger
BEFORE INSERT OR UPDATE ON public.promotions
FOR EACH ROW EXECUTE FUNCTION public.validate_promotion_type();

-- Create services table for paid services listings
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  price numeric,
  category text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create mobile_otp_requests table for OTP verification flow
CREATE TABLE IF NOT EXISTS public.mobile_otp_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  phone_number text NOT NULL,
  otp_code text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_otp_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for promotions
CREATE POLICY "Promotions viewable by all" ON public.promotions FOR SELECT USING (is_active = true);

-- RLS policies for services
CREATE POLICY "Services viewable by all" ON public.services FOR SELECT USING (is_active = true);
CREATE POLICY "Users can create own services" ON public.services FOR INSERT WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "Users can update own services" ON public.services FOR UPDATE USING (auth.uid() = provider_id);
CREATE POLICY "Users can delete own services" ON public.services FOR DELETE USING (auth.uid() = provider_id);

-- RLS policies for mobile_otp_requests
CREATE POLICY "Users can view own OTP requests" ON public.mobile_otp_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own OTP requests" ON public.mobile_otp_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own OTP requests" ON public.mobile_otp_requests FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_promotions_type_active ON public.promotions(type, is_active);
CREATE INDEX IF NOT EXISTS idx_services_provider ON public.services(provider_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);
CREATE INDEX IF NOT EXISTS idx_mobile_otp_user ON public.mobile_otp_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_mobile_otp_phone ON public.mobile_otp_requests(phone_number);