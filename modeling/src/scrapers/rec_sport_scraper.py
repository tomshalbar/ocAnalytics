import requests
from bs4 import BeautifulSoup
import json

url = "https://recsports.ufl.edu/cameras-counts/"
url2 = "https://www.connect2mycloud.com/Widgets/Data/SubLocationCount?type=bar&key=8E2C21D2-6F5D-45C1-AF9E-C23AEBFDA68B"
url3 = "https://goboardapi.azurewebsites.net/api/FacilityCount/GetCountsByAccount?AccountAPIKey=8E2C21D2-6F5D-45C1-AF9E-C23AEBFDA68B&ShowSubLocationCount=true"
# 1. Download the webpage content
response = requests.get(url3)

if response.status_code == 200:
    pass

else:
    print(f"Failed to retrieve data. Status code: {response.status_code}")
