-- Round out the order-status notifications so the diner is told about
-- every meaningful transition, not just `ready` and `paid`.

create or replace function public.tg_order_status_effects()
returns trigger language plpgsql as $$
declare
  earn int;
begin
  -- Chef started cooking
  if new.status = 'preparing' and old.status <> 'preparing' and new.user_id is not null then
    insert into public.notifications(user_id, type, title, message, data)
    values (new.user_id, 'order_update',
            'Your order is being prepared',
            'The kitchen has started on order ' || new.order_number || '.',
            jsonb_build_object('order_id', new.id));
  end if;

  -- Food is ready
  if new.status = 'ready' and old.status <> 'ready' and new.user_id is not null then
    insert into public.notifications(user_id, type, title, message, data)
    values (new.user_id, 'order_update',
            'Your order is ready',
            'Order ' || new.order_number || ' is ready to be served.',
            jsonb_build_object('order_id', new.id));
  end if;

  -- Server has delivered the food
  if new.status = 'served' and old.status <> 'served' and new.user_id is not null then
    insert into public.notifications(user_id, type, title, message, data)
    values (new.user_id, 'order_update',
            'Bon appétit',
            'Your order has been served. Enjoy!',
            jsonb_build_object('order_id', new.id));
  end if;

  -- Bill closed: release table, award loyalty, fire notification
  if new.status = 'paid' and (old.status is null or old.status <> 'paid') then
    new.payment_status := 'paid';
    if new.table_id is not null then
      update public.tables set status = 'available', assigned_server_id = null
        where id = new.table_id;
    end if;
    if new.user_id is not null then
      earn := floor(new.total_amount / 10)::int;
      if earn > 0 then
        insert into public.loyalty_transactions(user_id, type, points, reference_id, description, expires_at)
        values (new.user_id, 'earned_order', earn, new.id,
                'Earned from order ' || new.order_number,
                now() + interval '365 days');
      end if;
      insert into public.notifications(user_id, type, title, message, data)
      values (new.user_id, 'order_update',
              'Order complete',
              'Order ' || new.order_number || ' is complete. You earned ' || earn || ' loyalty points.',
              jsonb_build_object('order_id', new.id));
    end if;
  end if;

  return new;
end $$;
