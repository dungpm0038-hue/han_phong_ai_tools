-- Apply once using Supabase migrations. Never expose the service-role key.
begin;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '' check(char_length(display_name)<=80),
 created_at timestamptz not null default now(),
 upload_date date, upload_count integer not null default 0 check(upload_count>=0),
 upload_window timestamptz, upload_window_count integer not null default 0
);
create table public.subscriptions (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 plan text not null default 'free' check(plan in ('free','pro')),
 status text not null default 'active' check(status in ('active','inactive')),
 -- No paid entitlement is enabled. Add billing verification in a separate release.
 created_at timestamptz not null default now()
);
create table public.conversations (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 title text not null default 'Cuộc trò chuyện mới' check(char_length(title) between 1 and 100),
 created_at timestamptz not null default now(),
 unique(id,user_id)
);
create index conversations_user_created on public.conversations(user_id,created_at desc);
create table public.messages (
 id uuid primary key default gen_random_uuid(),
 conversation_id uuid not null,
 user_id uuid not null references public.profiles(id) on delete cascade,
 role text not null check(role in ('user','assistant')),
 content text not null check(char_length(content) between 1 and 20000),
 created_at timestamptz not null default now(),
 foreign key(conversation_id,user_id) references public.conversations(id,user_id) on delete cascade
);
create index messages_conversation_created on public.messages(conversation_id,created_at);
create table public.documents (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 name text not null check(char_length(name) between 1 and 160),
 extracted_text text not null check(char_length(extracted_text) between 1 and 24000),
 total_pages integer not null check(total_pages between 1 and 80),
 processed_pages integer not null check(processed_pages between 1 and 20 and processed_pages<=total_pages),
 truncated boolean not null,
 created_at timestamptz not null default now()
);
create index documents_user_created on public.documents(user_id,created_at desc);
create table public.usage_records (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references public.profiles(id) on delete cascade,
 request_id uuid not null,
 tool text not null check(tool in ('chat','writer','pdf')),
 input_hash text not null check(char_length(input_hash)=64),
 usage_date date not null default (now() at time zone 'UTC')::date,
 status text not null default 'pending' check(status in ('pending','completed','failed')),
 result jsonb,
 created_at timestamptz not null default now(),
 finished_at timestamptz,
 unique(user_id,request_id)
);
create index usage_daily on public.usage_records(user_id,usage_date,status);
create index usage_rate on public.usage_records(user_id,created_at desc);

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.documents enable row level security;
alter table public.usage_records enable row level security;

revoke all on public.profiles,public.subscriptions,public.conversations,public.messages,public.documents,public.usage_records from anon,authenticated;
grant select on public.profiles,public.subscriptions,public.conversations,public.messages,public.documents,public.usage_records to authenticated;
grant update(display_name) on public.profiles to authenticated;
grant insert(user_id,title),update(title),delete on public.conversations to authenticated;
grant delete on public.documents to authenticated;
grant all on public.profiles,public.subscriptions,public.conversations,public.messages,public.documents,public.usage_records to service_role;
create policy own_profile_read on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy own_profile_update on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy own_subscription on public.subscriptions for select to authenticated using(user_id=(select auth.uid()));
create policy own_conversation_read on public.conversations for select to authenticated using(user_id=(select auth.uid()));
create policy own_conversation_insert on public.conversations for insert to authenticated with check(user_id=(select auth.uid()));
create policy own_conversation_update on public.conversations for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy own_conversation_delete on public.conversations for delete to authenticated using(user_id=(select auth.uid()));
create policy own_messages on public.messages for select to authenticated using(user_id=(select auth.uid()));
create policy own_documents on public.documents for select to authenticated using(user_id=(select auth.uid()));
create policy own_documents_delete on public.documents for delete to authenticated using(user_id=(select auth.uid()));
create policy own_usage on public.usage_records for select to authenticated using(user_id=(select auth.uid()));

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,display_name) values(new.id,left(coalesce(new.raw_user_meta_data->>'display_name',''),80));
 insert into public.subscriptions(user_id) values(new.id);
 return new;
end;$$;
revoke all on function public.handle_new_user() from public,anon,authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
-- Backfill accounts created before migration.
insert into public.profiles(id,display_name) select id,left(coalesce(raw_user_meta_data->>'display_name',''),80) from auth.users on conflict do nothing;
insert into public.subscriptions(user_id) select id from public.profiles on conflict do nothing;

-- All reservations for a user serialize on their profile row, across all app instances.
create function public.reserve_ai_request(p_user uuid,p_request uuid,p_tool text,p_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare previous public.usage_records; used integer; recent integer;
begin
 perform 1 from public.profiles where id=p_user for update;
 if not found then raise exception 'Unknown account';end if;
 update public.usage_records set status='failed',finished_at=now() where user_id=p_user and status='pending' and created_at<now()-interval '5 minutes';
 select * into previous from public.usage_records where user_id=p_user and request_id=p_request;
 if found then
  if previous.input_hash<>p_hash or previous.tool<>p_tool then return jsonb_build_object('state','conflict');end if;
  return jsonb_build_object('state',previous.status,'result',previous.result);
 end if;
 select count(*) into recent from public.usage_records where user_id=p_user and created_at>now()-interval '1 minute';
 if recent>=5 then return jsonb_build_object('state','rate');end if;
 select count(*) into used from public.usage_records where user_id=p_user and usage_date=(now() at time zone 'UTC')::date and status in ('pending','completed');
 -- Pro schema is reserved; no caller can bypass quotas by changing a client flag.
 if used>=15 then return jsonb_build_object('state','quota');end if;
 insert into public.usage_records(user_id,request_id,tool,input_hash) values(p_user,p_request,p_tool,p_hash);
 return jsonb_build_object('state','reserved');
end;$$;
create function public.complete_ai_request(p_user uuid,p_request uuid,p_result jsonb,p_conversation uuid,p_prompt text) returns void
language plpgsql security definer set search_path='' as $$
declare entry public.usage_records;
begin
 perform 1 from public.profiles where id=p_user for update;
 select * into entry from public.usage_records where user_id=p_user and request_id=p_request for update;
 if entry.status is distinct from 'pending' then raise exception 'Invalid reservation';end if;
 if entry.tool='chat' then
  if p_conversation is null then raise exception 'Conversation required';end if;
  insert into public.messages(conversation_id,user_id,role,content) values(p_conversation,p_user,'user',p_prompt);
  insert into public.messages(conversation_id,user_id,role,content,created_at) values(p_conversation,p_user,'assistant',p_result->>'text',now()+interval '1 microsecond');
 end if;
 update public.usage_records set status='completed',result=p_result,finished_at=now() where id=entry.id;
end;$$;
create function public.fail_ai_request(p_user uuid,p_request uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.profiles where id=p_user for update;
 update public.usage_records set status='failed',finished_at=now() where user_id=p_user and request_id=p_request and status='pending';
end;$$;
create function public.reserve_pdf_upload(p_user uuid) returns boolean
language plpgsql security definer set search_path='' as $$
declare profile public.profiles; docs integer;
begin
 select * into profile from public.profiles where id=p_user for update;
 if not found then return false;end if;
 if profile.upload_date is distinct from (now() at time zone 'UTC')::date then profile.upload_count:=0;end if;
 if profile.upload_window is null or profile.upload_window<now()-interval '1 minute' then profile.upload_window_count:=0;profile.upload_window:=now();end if;
 select count(*) into docs from public.documents where user_id=p_user;
 if profile.upload_count>=20 or profile.upload_window_count>=3 or docs>=20 then return false;end if;
 update public.profiles set upload_date=(now() at time zone 'UTC')::date,upload_count=profile.upload_count+1,upload_window=profile.upload_window,upload_window_count=profile.upload_window_count+1 where id=p_user;
 return true;
end;$$;
-- Recheck retained capacity after parsing under the same per-user lock.
create function public.save_pdf_document(p_user uuid,p_name text,p_text text,p_total integer,p_processed integer,p_truncated boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
declare doc public.documents;
begin
 perform 1 from public.profiles where id=p_user for update;
 if not found then raise exception 'Unknown account';end if;
 if (select count(*) from public.documents where user_id=p_user)>=20 then return null;end if;
 insert into public.documents(user_id,name,extracted_text,total_pages,processed_pages,truncated)
 values(p_user,p_name,p_text,p_total,p_processed,p_truncated) returning * into doc;
 return jsonb_build_object('id',doc.id,'name',doc.name,'total_pages',doc.total_pages,'processed_pages',doc.processed_pages,'truncated',doc.truncated);
end;$$;
revoke all on function public.save_pdf_document(uuid,text,text,integer,integer,boolean) from public,anon,authenticated;
grant execute on function public.save_pdf_document(uuid,text,text,integer,integer,boolean) to service_role;
revoke all on function public.reserve_ai_request(uuid,uuid,text,text),public.complete_ai_request(uuid,uuid,jsonb,uuid,text),public.fail_ai_request(uuid,uuid),public.reserve_pdf_upload(uuid) from public,anon,authenticated;
grant execute on function public.reserve_ai_request(uuid,uuid,text,text),public.complete_ai_request(uuid,uuid,jsonb,uuid,text),public.fail_ai_request(uuid,uuid),public.reserve_pdf_upload(uuid) to service_role;
commit;
