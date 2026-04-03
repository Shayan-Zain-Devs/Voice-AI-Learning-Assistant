import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
# CHANGE THIS LINE: Use the Service Role Key instead of the Anon Key
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") 

if not url or not key:
    raise ValueError("Supabase SERVICE_ROLE_KEY not found in .env file")

# This client now has "Admin" powers to bypass RLS
supabase_client: Client = create_client(url, key)