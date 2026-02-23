# Supabase Setup Instructions

## 1. Get Your Supabase URL

1.  Log in to your Supabase Dashboard.
2.  Select your project.
3.  Go to **Settings** (cog icon) -> **API**.
4.  Copy the **Project URL**.
5.  Open the `.env` file in `green-bastards-brewery` and replace `https://YOUR_PROJECT_ID.supabase.co` with your actual URL.

## 2. Create Tables (Option A: Manual SQL)

1.  Go to the **SQL Editor** in your Supabase Dashboard.
2.  Click **New Query**.
3.  Copy the entire contents of the `db_setup.sql` file (located in the root of your project).
4.  Paste it into the SQL Editor.
5.  Click **Run**.

This will create:
-   `accounts` table with users `ILatteralus` and `BALLs321`.
-   `categories` table with the default revenue/expense categories.
-   `transactions` table (empty).
-   `inventory` table (empty).

## 3. Create Tables (Option B: CLI Migrations - Recommended)

We have initialized Supabase in your project and created a migration file from your schema.

To apply these migrations to your remote Supabase project:

1.  **Login to Supabase CLI:**
    ```bash
    npx supabase login
    ```

2.  **Link your project:**
    You need your Reference ID. You can find this in your Supabase Dashboard URL (e.g., `https://app.supabase.com/project/your-project-ref`) or in **Settings** -> **General**.
    ```bash
    npx supabase link --project-ref <your-project-ref>
    ```
    (Enter your database password when prompted)

3.  **Push the migrations:**
    ```bash
    npx supabase db push
    ```

This will apply the schema defined in `supabase/migrations/` to your remote database.

## 4. Usage in App

You can now import the Supabase client in your components:

```javascript
import { supabase } from './supabaseClient'

// Example: Fetch accounts
async function getAccounts() {
  const { data, error } = await supabase.from('accounts').select('*')
  console.log(data)
}
```
