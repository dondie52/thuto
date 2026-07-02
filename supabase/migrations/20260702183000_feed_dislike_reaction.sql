-- Allow circle/cross feed reactions: add explicit dislike alongside existing reaction types.
alter table public.feed_reactions drop constraint if exists feed_reactions_reaction_check;

alter table public.feed_reactions
  add constraint feed_reactions_reaction_check
  check (reaction in ('like', 'celebrate', 'support', 'insightful', 'curious', 'dislike'));
