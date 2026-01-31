-- 1. Create trigger to handle new user signup (connects existing function to auth.users)
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Create profiles for existing orphaned users
INSERT INTO public.profiles (id, username, full_name, email)
SELECT 
  id,
  split_part(email, '@', 1) as username,
  NULL as full_name,
  email
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 3. Create user_roles for existing orphaned users
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'learner'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT DO NOTHING;

-- 4. Create referrals for existing orphaned users  
INSERT INTO public.referrals (referrer_id, referral_code)
SELECT id, UPPER(ENCODE(GEN_RANDOM_BYTES(6), 'hex'))
FROM auth.users
WHERE id NOT IN (SELECT referrer_id FROM public.referrals)
ON CONFLICT DO NOTHING;