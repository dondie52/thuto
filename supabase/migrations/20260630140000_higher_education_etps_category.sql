-- Add higher-education-etps institution category and register new ETP IDs.

alter table public.feed_posts
  drop constraint if exists feed_posts_author_institution_category_check;

alter table public.feed_posts
  add constraint feed_posts_author_institution_category_check
  check (
    author_institution_category is null
    or author_institution_category in (
      'universities',
      'higher-education-etps',
      'technical-colleges-brigades',
      'specialised-academics',
      'biblical-theological-studies',
      'short-courses'
    )
  );

create or replace function public.infer_institution_category(p_institution_id text)
returns text
language plpgsql
immutable
as $$
declare
  id text := lower(trim(coalesce(p_institution_id, '')));
begin
  if id = '' then
    return null;
  end if;

  if id in (
    'ub', 'biust', 'bac', 'botho', 'ba-isago', 'abm', 'limkokwing', 'bou', 'boitekanelo',
    'new-era', 'gips', 'bocodol', 'kgale', 'isbs', 'idm', 'guc', 'buan', 'logan-business-college',
    'mega-size-college', 'homeland-college', 'gaborone-commercial-college', 'byte-size-college',
    'awil-college'
  ) then
    return 'universities';
  end if;

  if id in (
    'phronesis-international-college', 'dtt-college-of-medicine', 'kitso-international-college',
    'arthur-portland-college', 'kings-college', 'institute-of-labour-and-employment-studies'
  ) then
    return 'higher-education-etps';
  end if;

  if id in (
    'botswana-accountancy-training', 'bosa-bosele', 'roads-training-centre', 'dawn-training',
    'cep-training', 'learneasy', 'stargems', 'insurance-training-institute', 'crackit', 'aafm',
    'africa-insurance-training-institute', 'delta-training-academy', 'ed-tech-africa',
    'kalahari-training-institute', 'rutegang-training-college'
  ) then
    return 'short-courses';
  end if;

  if id in (
    'assembly-bible-college', 'inchrist-bible-institute-university', 'real-bible-school',
    'kago-international-serminary-college', 'azusa-academy-of-excellence'
  ) then
    return 'biblical-theological-studies';
  end if;

  if id in (
    'gtc', 'fctve', 'oodi', 'realic', 'palapye-technical-college', 'jwaneng-technical-college',
    'maun-technical-college', 'selebi-phikwe-technical-college', 'chobe-brigade', 'krda'
  ) or id like '%brigade%' or id like '%technical%' then
    return 'technical-colleges-brigades';
  end if;

  if position('university' in id) > 0 then
    return 'universities';
  end if;

  return 'specialised-academics';
end;
$$;
