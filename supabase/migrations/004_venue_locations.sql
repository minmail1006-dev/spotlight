-- Venue locations for the map. The venues are fictional, so these are
-- plausible spots in each venue's neighbourhood, not real businesses.
alter table public.venues add column if not exists lat double precision;
alter table public.venues add column if not exists lng double precision;

update public.venues v set lat = c.lat, lng = c.lng
from (values
  ('the-corner-pint',   55.66960, 12.55520),  -- Vesterbro
  ('dice-and-dram',     55.67880, 12.53380),  -- Frederiksberg
  ('clay-and-coffee',   55.69260, 12.54480),  -- Nørrebro
  ('nordlys-art-house', 55.68010, 12.57990),  -- Indre By
  ('kaelderen-quiz',    55.68730, 12.55700),  -- Nørrebro
  ('boulder-loft',      55.70420, 12.53520),  -- Nordvest
  ('jazz-cellar',       55.67840, 12.57260),  -- Indre By
  ('paper-lantern',     55.66870, 12.54680),  -- Vesterbro
  ('havn-sauna',        55.66470, 12.57480),  -- Islands Brygge
  ('kanal-kajak',       55.67330, 12.59330)   -- Christianshavn
) as c(slug, lat, lng)
where v.slug = c.slug;
