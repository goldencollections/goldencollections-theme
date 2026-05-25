grant usage on schema public to service_role;

grant select, insert, update, delete on public.checkout_automations to service_role;
grant select, insert, update, delete on public.whatsapp_events to service_role;
grant select, insert, update, delete on public.whatsapp_opt_outs to service_role;

grant usage, select on all sequences in schema public to service_role;
