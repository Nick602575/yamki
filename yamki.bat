@echo off
cd /d "C:\Users\Koshtorisnik\Documents\yamki"
start python app.py 
timeout /t 5 
start http://127.0.0.1:5000
