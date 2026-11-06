-- =====================================================================
-- Seed data: 10 FICTIONAL Copenhagen venues (names, addresses and offers
-- are invented for the MVP; no real business has agreed to anything).
-- =====================================================================

insert into public.venues (slug, name, category, neighborhood, address, description, offer, discount_pct, quiet_hours, emoji, color, sort_order) values
('the-corner-pint',   'The Corner Pint',        'Sports',        'Vesterbro',        'Fictional address, Vesterbro',        'Sports bar with three big screens. Premier League, Champions League and the Superliga.', '20% off drinks when 2+ Spotlight users check in together', 20, 'Mon–Thu before 21:00', '⚽', '#3D7A5A', 1),
('dice-and-dram',     'Dice & Dram',            'Games',         'Frederiksberg',    'Fictional address, Frederiksberg',    'Board game café with 400+ games and staff who teach the rules.',                       '20% off the table fee and drinks',                          20, 'Sun–Thu all day',      '🎲', '#7A4FB5', 2),
('clay-and-coffee',   'Clay & Coffee Studio',   'Creative',      'Nørrebro',         'Fictional address, Nørrebro',         'Drop-in pottery wheel sessions for complete beginners. Coffee included.',              '15% off a drop-in wheel session',                           15, 'Weekdays 15:00–18:00', '🏺', '#C0673E', 3),
('nordlys-art-house', 'Nordlys Art House',      'Culture',       'Indre By',         'Fictional address, Indre By',         'Small museum for Nordic photography with late openings on Thursdays.',                 '15% off entry and 10% off in the café',                     15, 'Tue–Thu after 17:00',  '🖼️', '#2F6690', 4),
('kaelderen-quiz',    'Kælderen Quiz Bar',      'Games',         'Nørrebro',         'Fictional address, Nørrebro',         'Basement bar with a weekly pub quiz. Teams of up to six.',                             '20% off the first round',                                   20, 'Quiz nights Wed',      '🧠', '#B5852B', 5),
('boulder-loft',      'Boulder Loft',           'Active',        'Nordvest',         'Fictional address, Nordvest',         'Bouldering gym for all levels with shoe rental at the desk.',                          '15% off day passes',                                        15, 'Weekdays before 16:00','🧗', '#D1495B', 6),
('jazz-cellar',       'Cellar Jazz Club',       'Music',         'Indre By',         'Fictional address, Indre By',         'Cosy cellar with live jazz and open jam sessions.',                                    '20% off entry on jam nights',                               20, 'Sun–Thu',              '🎷', '#1F3A5F', 7),
('paper-lantern',     'Paper Lantern Ramen',    'Food & drinks', 'Vesterbro',        'Fictional address, Vesterbro',        'Small ramen bar with long shared tables.',                                             '15% off bowls',                                             15, 'Mon–Wed after 20:00',  '🍜', '#A23E48', 8),
('havn-sauna',        'Havn Sauna Club',        'Active',        'Islands Brygge',   'Fictional address, Islands Brygge',   'Floating wood-fired sauna with a ladder straight into the harbour.',                   '15% off a sauna session',                                   15, 'Weekday mornings',     '🧖', '#4A7C8C', 9),
('kanal-kajak',       'Kanal Kajak',            'Active',        'Christianshavn',   'Fictional address, Christianshavn',   'Kayak rental for paddling the canals. Double kayaks available.',                       '20% off two-person kayaks',                                 20, 'Weekdays 12:00–16:00', '🛶', '#2E8B57', 10);

-- Secret check-in codes (in real life: on a card at the bar / shown by staff)
insert into public.venue_codes (venue_id, code)
select v.id, c.code from public.venues v
join (values
  ('the-corner-pint', 'K7P2'),
  ('dice-and-dram',   'D4X9'),
  ('clay-and-coffee', 'C3M8'),
  ('nordlys-art-house','N6R4'),
  ('kaelderen-quiz',  'Q2L7'),
  ('boulder-loft',    'B9T3'),
  ('jazz-cellar',     'J5W6'),
  ('paper-lantern',   'R8H2'),
  ('havn-sauna',      'S4V7'),
  ('kanal-kajak',     'K3Y5')
) as c(slug, code) on c.slug = v.slug;
