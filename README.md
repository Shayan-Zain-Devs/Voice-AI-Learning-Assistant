Run once to create virtual env:

python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt


After this, everytime you want to run backend, just do:

cd server
.\venv\Scripts\activate
uvicorn main:app --reload 

----------------------------------------------------------------------------------------------

for frontend:

cd client
npm run dev