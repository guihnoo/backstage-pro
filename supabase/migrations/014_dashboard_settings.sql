alter table user_settings
  add column if not exists widget_order jsonb default '["financial-summary","ai-assistant","monthly-chart","forecast-summary","upcoming-events","payment-alerts"]'::jsonb,
  add column if not exists hidden_widgets jsonb default '[]'::jsonb,
  add column if not exists notification_preferences jsonb default '{"payment_reminders":true,"event_reminders":true,"work_hour_reminders":true}'::jsonb;
