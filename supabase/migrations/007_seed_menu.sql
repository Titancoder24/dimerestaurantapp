-- Seed: menu categories and menu items for all six restaurants.

-- THE GOLDEN SPICE ---------------------------------------------------
insert into public.menu_categories (id, restaurant_id, name, icon, sort_order) values
  ('b1000000-0000-0000-0000-000000000001','a1111111-0000-0000-0000-000000000001','Starters','flame.fill',1),
  ('b1000000-0000-0000-0000-000000000002','a1111111-0000-0000-0000-000000000001','Tandoor','flame.fill',2),
  ('b1000000-0000-0000-0000-000000000003','a1111111-0000-0000-0000-000000000001','Mains','fork.knife',3),
  ('b1000000-0000-0000-0000-000000000004','a1111111-0000-0000-0000-000000000001','Breads','fork.knife',4),
  ('b1000000-0000-0000-0000-000000000005','a1111111-0000-0000-0000-000000000001','Desserts','birthday.cake.fill',5),
  ('b1000000-0000-0000-0000-000000000006','a1111111-0000-0000-0000-000000000001','Beverages','cup.and.saucer.fill',6)
on conflict (id) do nothing;

insert into public.menu_items (restaurant_id, category_id, name, description, price, images, is_veg, is_bestseller, spice_level, prep_time_minutes, calories)
values
  ('a1111111-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000001','Paneer Tikka','Cottage cheese cubes marinated in yogurt and spices, grilled in the tandoor.',320, array['https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800'], true, true, 2, 15, 380),
  ('a1111111-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000001','Chicken Malai Tikka','Creamy marinated boneless chicken thigh skewers.',420, array['https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=800'], false, true, 1, 18, 520),
  ('a1111111-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000002','Tandoori Prawns','Jumbo prawns in ajwain & mustard marinade.',680, array['https://images.unsplash.com/photo-1625944228741-6e7ee8ecc4c4?w=800'], false, false, 2, 20, 450),
  ('a1111111-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000003','Butter Chicken','Our signature — tandoor-smoked chicken in a silky tomato-butter gravy.',480, array['https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800'], false, true, 2, 22, 620),
  ('a1111111-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000003','Dal Makhani','Slow-cooked black lentils simmered overnight with butter and cream.',320, array['https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800'], true, true, 1, 15, 410),
  ('a1111111-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000003','Rogan Josh','Kashmiri lamb curry with aromatic whole spices.',560, array['https://images.unsplash.com/photo-1574484184081-afea8a62f9a1?w=800'], false, false, 3, 25, 580),
  ('a1111111-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000004','Garlic Naan','Leavened bread brushed with garlic & butter.',80, array['https://images.unsplash.com/photo-1626074353765-517a681e40be?w=800'], true, false, 0, 8, 210),
  ('a1111111-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000004','Peshawari Naan','Stuffed with coconut, raisins and almonds.',140, array['https://images.unsplash.com/photo-1626132647523-66c0a85316f5?w=800'], true, false, 0, 10, 320),
  ('a1111111-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000005','Gulab Jamun','Cardamom-syrup soaked dumplings, served warm.',180, array['https://images.unsplash.com/photo-1600343443104-db6ff6a64f6d?w=800'], true, false, 0, 5, 280),
  ('a1111111-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000006','Mango Lassi','Sweet mango yogurt smoothie.',140, array['https://images.unsplash.com/photo-1568909344668-6f14a07b56a0?w=800'], true, true, 0, 3, 220),
  ('a1111111-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000006','Masala Chai','Spiced cardamom & ginger tea.',90, array['https://images.unsplash.com/photo-1597318301265-f91055c3c8e1?w=800'], true, false, 0, 4, 120);

-- BELLA ITALIA -------------------------------------------------------
insert into public.menu_categories (id, restaurant_id, name, icon, sort_order) values
  ('b2000000-0000-0000-0000-000000000001','a1111111-0000-0000-0000-000000000002','Antipasti','leaf.fill',1),
  ('b2000000-0000-0000-0000-000000000002','a1111111-0000-0000-0000-000000000002','Wood-Fired Pizza','flame.fill',2),
  ('b2000000-0000-0000-0000-000000000003','a1111111-0000-0000-0000-000000000002','Pasta','fork.knife',3),
  ('b2000000-0000-0000-0000-000000000004','a1111111-0000-0000-0000-000000000002','Dolci','birthday.cake.fill',4)
on conflict (id) do nothing;

insert into public.menu_items (restaurant_id, category_id, name, description, price, images, is_veg, is_bestseller, prep_time_minutes, calories) values
  ('a1111111-0000-0000-0000-000000000002','b2000000-0000-0000-0000-000000000001','Bruschetta al Pomodoro','Toasted sourdough, heirloom tomato, basil, olive oil.',340, array['https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=800'], true, false, 10, 280),
  ('a1111111-0000-0000-0000-000000000002','b2000000-0000-0000-0000-000000000001','Burrata con Rucola','Burrata DOP on rocket, heirloom tomato.',520, array['https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=800'], true, true, 8, 450),
  ('a1111111-0000-0000-0000-000000000002','b2000000-0000-0000-0000-000000000002','Margherita','San Marzano, fior di latte, basil, olive oil.',420, array['https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800'], true, true, 14, 680),
  ('a1111111-0000-0000-0000-000000000002','b2000000-0000-0000-0000-000000000002','Diavola','Spicy salami, mozzarella, chilli flakes.',520, array['https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=800'], false, true, 16, 780),
  ('a1111111-0000-0000-0000-000000000002','b2000000-0000-0000-0000-000000000002','Quattro Formaggi','Mozzarella, gorgonzola, parmesan, ricotta.',580, array['https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800'], true, false, 16, 820),
  ('a1111111-0000-0000-0000-000000000002','b2000000-0000-0000-0000-000000000003','Spaghetti Carbonara','Guanciale, pecorino, egg yolk, black pepper.',480, array['https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800'], false, true, 14, 720),
  ('a1111111-0000-0000-0000-000000000002','b2000000-0000-0000-0000-000000000003','Penne Arrabbiata','Tomato, garlic, red chilli, parsley.',380, array['https://images.unsplash.com/photo-1611270629569-8b357cb88da9?w=800'], true, false, 12, 560),
  ('a1111111-0000-0000-0000-000000000002','b2000000-0000-0000-0000-000000000004','Tiramisu','Espresso-soaked ladyfingers, mascarpone.',280, array['https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800'], true, true, 5, 420);

-- SUSHI MASTER -------------------------------------------------------
insert into public.menu_categories (id, restaurant_id, name, icon, sort_order) values
  ('b3000000-0000-0000-0000-000000000001','a1111111-0000-0000-0000-000000000003','Nigiri','fish.fill',1),
  ('b3000000-0000-0000-0000-000000000002','a1111111-0000-0000-0000-000000000003','Rolls','circle.grid.cross.fill',2),
  ('b3000000-0000-0000-0000-000000000003','a1111111-0000-0000-0000-000000000003','Robata','flame.fill',3)
on conflict (id) do nothing;

insert into public.menu_items (restaurant_id, category_id, name, description, price, images, is_veg, is_bestseller, prep_time_minutes) values
  ('a1111111-0000-0000-0000-000000000003','b3000000-0000-0000-0000-000000000001','Salmon Nigiri','Two pieces, fresh Norwegian salmon.',380, array['https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=800'], false, true, 10),
  ('a1111111-0000-0000-0000-000000000003','b3000000-0000-0000-0000-000000000001','Tuna Nigiri','Two pieces, bluefin tuna akami.',420, array['https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800'], false, false, 10),
  ('a1111111-0000-0000-0000-000000000003','b3000000-0000-0000-0000-000000000002','Spicy Tuna Roll','8 pieces, tuna, sriracha mayo, tobiko.',680, array['https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=800'], false, true, 14),
  ('a1111111-0000-0000-0000-000000000003','b3000000-0000-0000-0000-000000000002','Vegetable Rainbow Roll','Avocado, cucumber, asparagus, topped with tempura flakes.',520, array['https://images.unsplash.com/photo-1553621042-f6e147245754?w=800'], true, true, 12),
  ('a1111111-0000-0000-0000-000000000003','b3000000-0000-0000-0000-000000000003','Miso Black Cod','48-hour miso marinated cod, grilled on the robata.',1480, array['https://images.unsplash.com/photo-1534256958597-7fe685cbd745?w=800'], false, true, 20);

-- GREEN BOWL CAFE ----------------------------------------------------
insert into public.menu_categories (id, restaurant_id, name, icon, sort_order) values
  ('b4000000-0000-0000-0000-000000000001','a1111111-0000-0000-0000-000000000004','Smoothie Bowls','leaf.fill',1),
  ('b4000000-0000-0000-0000-000000000002','a1111111-0000-0000-0000-000000000004','Salads','leaf.fill',2),
  ('b4000000-0000-0000-0000-000000000003','a1111111-0000-0000-0000-000000000004','Mains','fork.knife',3),
  ('b4000000-0000-0000-0000-000000000004','a1111111-0000-0000-0000-000000000004','Cold Press','cup.and.saucer.fill',4)
on conflict (id) do nothing;

insert into public.menu_items (restaurant_id, category_id, name, description, price, images, is_veg, is_bestseller, prep_time_minutes) values
  ('a1111111-0000-0000-0000-000000000004','b4000000-0000-0000-0000-000000000001','Acai Berry Bowl','Acai, banana, granola, blueberries, coconut.',380, array['https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=800'], true, true, 8),
  ('a1111111-0000-0000-0000-000000000004','b4000000-0000-0000-0000-000000000002','Buddha Bowl','Quinoa, roasted sweet potato, chickpeas, tahini.',340, array['https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=800'], true, true, 10),
  ('a1111111-0000-0000-0000-000000000004','b4000000-0000-0000-0000-000000000002','Caesar Kale','Kale, cashew parmesan, sourdough croutons.',320, array['https://images.unsplash.com/photo-1551248429-40975aa4de74?w=800'], true, false, 8),
  ('a1111111-0000-0000-0000-000000000004','b4000000-0000-0000-0000-000000000003','Avocado Sourdough','House sourdough, smashed avo, chilli flakes, poached egg.',360, array['https://images.unsplash.com/photo-1603046891744-76e6300f82ef?w=800'], true, true, 10),
  ('a1111111-0000-0000-0000-000000000004','b4000000-0000-0000-0000-000000000004','Green Glow','Kale, cucumber, apple, ginger, lemon.',260, array['https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=800'], true, false, 5);

-- TANDOOR & GRILL ----------------------------------------------------
insert into public.menu_categories (id, restaurant_id, name, icon, sort_order) values
  ('b5000000-0000-0000-0000-000000000001','a1111111-0000-0000-0000-000000000005','Kebabs','flame.fill',1),
  ('b5000000-0000-0000-0000-000000000002','a1111111-0000-0000-0000-000000000005','Biryani','fork.knife',2),
  ('b5000000-0000-0000-0000-000000000003','a1111111-0000-0000-0000-000000000005','Curries','fork.knife',3)
on conflict (id) do nothing;

insert into public.menu_items (restaurant_id, category_id, name, description, price, images, is_veg, is_bestseller, spice_level, prep_time_minutes) values
  ('a1111111-0000-0000-0000-000000000005','b5000000-0000-0000-0000-000000000001','Galouti Kebab','Lucknowi lamb kebabs melting with saffron.',460, array['https://images.unsplash.com/photo-1574484184081-afea8a62f9a1?w=800'], false, true, 2, 18),
  ('a1111111-0000-0000-0000-000000000005','b5000000-0000-0000-0000-000000000001','Hariyali Paneer Tikka','Paneer in mint-coriander marinade.',340, array['https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800'], true, false, 2, 15),
  ('a1111111-0000-0000-0000-000000000005','b5000000-0000-0000-0000-000000000002','Hyderabadi Dum Biryani','Long-grain basmati, dum cooked with mutton.',520, array['https://images.unsplash.com/photo-1563379091339-03246963d96c?w=800'], false, true, 3, 30),
  ('a1111111-0000-0000-0000-000000000005','b5000000-0000-0000-0000-000000000002','Vegetable Biryani','Saffron rice with seasonal vegetables, raita.',360, array['https://images.unsplash.com/photo-1631292784640-2b24be6ce4f1?w=800'], true, false, 2, 25),
  ('a1111111-0000-0000-0000-000000000005','b5000000-0000-0000-0000-000000000003','Nihari','Slow-cooked lamb shank in aromatic gravy.',620, array['https://images.unsplash.com/photo-1574484184081-afea8a62f9a1?w=800'], false, true, 3, 25);

-- MOCHA CAFE ---------------------------------------------------------
insert into public.menu_categories (id, restaurant_id, name, icon, sort_order) values
  ('b6000000-0000-0000-0000-000000000001','a1111111-0000-0000-0000-000000000006','Breakfast','sunrise.fill',1),
  ('b6000000-0000-0000-0000-000000000002','a1111111-0000-0000-0000-000000000006','Sandwiches','fork.knife',2),
  ('b6000000-0000-0000-0000-000000000003','a1111111-0000-0000-0000-000000000006','Coffee','cup.and.saucer.fill',3),
  ('b6000000-0000-0000-0000-000000000004','a1111111-0000-0000-0000-000000000006','Bakery','birthday.cake.fill',4)
on conflict (id) do nothing;

insert into public.menu_items (restaurant_id, category_id, name, description, price, images, is_veg, is_bestseller, prep_time_minutes) values
  ('a1111111-0000-0000-0000-000000000006','b6000000-0000-0000-0000-000000000001','Eggs Benedict','Poached eggs, ham, hollandaise on toasted muffin.',380, array['https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=800'], false, true, 12),
  ('a1111111-0000-0000-0000-000000000006','b6000000-0000-0000-0000-000000000001','French Toast','Brioche, maple syrup, berries.',320, array['https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800'], true, false, 10),
  ('a1111111-0000-0000-0000-000000000006','b6000000-0000-0000-0000-000000000002','Chicken Club','Grilled chicken, bacon, lettuce, tomato, fries.',420, array['https://images.unsplash.com/photo-1540713434306-58505cf1b6fc?w=800'], false, true, 12),
  ('a1111111-0000-0000-0000-000000000006','b6000000-0000-0000-0000-000000000003','Flat White','Double shot, steamed milk.',180, array['https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800'], true, true, 4),
  ('a1111111-0000-0000-0000-000000000006','b6000000-0000-0000-0000-000000000004','Chocolate Croissant','Butter croissant with dark chocolate.',160, array['https://images.unsplash.com/photo-1623334044303-241021148842?w=800'], true, false, 3);
