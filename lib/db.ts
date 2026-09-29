import type { SQLiteDatabase } from "expo-sqlite";

// Bump this and add a new `if (currentVersion === N)` block whenever the schema changes.
const DATABASE_VERSION = 2;

// Runs once when SQLiteProvider opens the database (passed as `onInit`).
// PRAGMA user_version is a number SQLite stores inside the file, so we know which
// migrations this phone has already applied.
export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const result = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  let currentVersion = result?.user_version ?? 0;
  if (currentVersion >= DATABASE_VERSION) return;

  if (currentVersion === 0) {
    // Prices are stored in cents (integers) to avoid floating-point rounding errors.
    // Dates are ISO strings, which sort correctly as text.
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE subscriptions (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        price_cents INTEGER NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        frequency TEXT NOT NULL,
        status TEXT NOT NULL,
        category TEXT,
        plan TEXT,
        payment_method TEXT,
        color TEXT,
        start_date TEXT NOT NULL,
        trial_ends_at TEXT,
        notes TEXT,
        created_at TEXT NOT NULL
      );
    `);
    currentVersion = 1;
  }
  if (currentVersion === 1) {
    // Key/value app preferences (reminder settings, and later home currency, budget...).
    await db.execAsync(`
      CREATE TABLE settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
    currentVersion = 2;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

// Exactly what SQLite gives back: snake_case columns, and NULL instead of undefined.
type SubscriptionRow = {
  id: string;
  name: string;
  price_cents: number;
  currency: string;
  frequency: string;
  status: string;
  category: string | null;
  plan: string | null;
  payment_method: string | null;
  color: string | null;
  start_date: string;
  trial_ends_at: string | null;
  notes: string | null;
  created_at: string;
};

// The only place that knows how a database row maps to the app's Subscription type.
const rowToSubscription = (row: SubscriptionRow): Subscription => ({
  id: row.id,
  name: row.name,
  price: row.price_cents / 100,
  currency: row.currency,
  frequency: row.frequency as SubscriptionFrequency,
  status: row.status as SubscriptionStatus,
  category: row.category ?? undefined,
  plan: row.plan ?? undefined,
  paymentMethod: row.payment_method ?? undefined,
  color: row.color ?? undefined,
  startDate: row.start_date,
  trialEndsAt: row.trial_ends_at ?? undefined,
  notes: row.notes ?? undefined,
});

// Named parameters ($name) are bound by SQLite, never pasted into the SQL string,
// so names like "Disney's Plus" can't break the query (or inject SQL).
// SQLite can't bind `undefined`, hence the `?? null`.
const toParams = (subscription: Subscription) => ({
  $id: subscription.id,
  $name: subscription.name,
  $price_cents: Math.round(subscription.price * 100),
  $currency: subscription.currency ?? "USD",
  $frequency: subscription.frequency,
  $status: subscription.status,
  $category: subscription.category ?? null,
  $plan: subscription.plan ?? null,
  $payment_method: subscription.paymentMethod ?? null,
  $color: subscription.color ?? null,
  $start_date: subscription.startDate,
  $trial_ends_at: subscription.trialEndsAt ?? null,
  $notes: subscription.notes ?? null,
});

export async function getAllSubscriptions(db: SQLiteDatabase): Promise<Subscription[]> {
  const rows = await db.getAllAsync<SubscriptionRow>(
    "SELECT * FROM subscriptions ORDER BY created_at DESC",
  );
  return rows.map(rowToSubscription);
}

export async function insertSubscription(db: SQLiteDatabase, subscription: Subscription) {
  await db.runAsync(
    `INSERT INTO subscriptions (
      id, name, price_cents, currency, frequency, status, category, plan,
      payment_method, color, start_date, trial_ends_at, notes, created_at
    ) VALUES (
      $id, $name, $price_cents, $currency, $frequency, $status, $category, $plan,
      $payment_method, $color, $start_date, $trial_ends_at, $notes, $created_at
    )`,
    { ...toParams(subscription), $created_at: new Date().toISOString() },
  );
}

// created_at is left alone so edited subscriptions keep their place in the list.
export async function updateSubscription(db: SQLiteDatabase, subscription: Subscription) {
  await db.runAsync(
    `UPDATE subscriptions SET
      name = $name, price_cents = $price_cents, currency = $currency,
      frequency = $frequency, status = $status, category = $category, plan = $plan,
      payment_method = $payment_method, color = $color, start_date = $start_date,
      trial_ends_at = $trial_ends_at, notes = $notes
    WHERE id = $id`,
    toParams(subscription),
  );
}

export async function deleteSubscription(db: SQLiteDatabase, id: string) {
  await db.runAsync("DELETE FROM subscriptions WHERE id = ?", id);
}

// Settings are stored as text; callers convert (e.g. JSON.parse / Number) as needed.
export async function getSetting(db: SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>("SELECT value FROM settings WHERE key = ?", key);
  return row?.value ?? null;
}

// Insert, or overwrite if the key already exists.
export async function setSetting(db: SQLiteDatabase, key: string, value: string) {
  await db.runAsync(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    key,
    value,
  );
}
