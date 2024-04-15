# Travel Diary API

This is a RESTful API for managing user registration, authentication, and diary entries for a travel diary platform.

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/your/repository.git
   cd repository-folder

2. Install Dependencies:
   ```bash
   npm install
3. Initialize the database and start the server:
   ```bash
   npm run start

## Usage
### User Registration

- Endpoint: POST /register
- Request Body:
   ```bash
   {
  "name": "UserB",
  "username": "userb@example.com",
  "password": "secretpassword"
   }

- Response:
  ```bash
  {
    "message": "User registered successfully"
  }

### User Login
- Endpoint: POST /login
- Request Body:
   ```bash
   {
  "username": "userb@example.com",
  "password": "secretpassword"
   }

- Response:
  ```bash
  {
  "accessToken": "your_access_token_here"
  }


## Diary Entries CRUD operations
### Create Diary Entry

- Endpoint: POST /diary-entries
- Authorization Header: Bearer {accessToken}
- You can replace placeholders like `{accessToken}` and `{id}`
- Request Body:
   ```bash
   {
  "title": "Sunrise at Hyderabad",
  "description": "Visited Hyderabad for the first time",
  "location": "Hyderabad"
  }

- Response:
  ```bash
  {
  "message": "Diary entry created successfully",
  "id": 1
  }

### Get All Diary Entries

- Endpoint: GET /diary-entries
- Authorization Header: Bearer {accessToken}
- Response:
  ```bash
  [
  {
    "id": 1,
    "title": "Sunrise at Hyderabad",
    "description": "Visited Hyderabad for the first time",
    "location": "Hyderabad",
    "date": "2024-04-22T12:00:00.000Z"
  }
  ]


### Get Diary Entry by ID

- Endpoint: GET /diary-entries/{id}
- Authorization Header: Bearer {accessToken}
- Response:
  ```bash
  {
    "id": 1,
    "title": "Sunrise at Hyderabad",
    "description": "Visited Hyderabad for the first time",
    "location": "Hyderabad",
    "date": "2024-04-22T12:00:00.000Z"
  }


### Update Diary Entry

- Endpoint: PUT /diary-entries/{id}
- Authorization Header: Bearer {accessToken}
- Request Body:
   ```bash
   {
  {
  "title": "Sunset at Goa",
  "description": "Visited Goa for the first time",
  "location": "Goa"
  }  
  }

- Response:
  ```bash
  {
  "message": "Diary entry updated successfully"
  }


### Delete Diary Entry

- Endpoint: DELETE /diary-entries/{id}
- Authorization Header: Bearer {accessToken}
- Response:
  ```bash
  {
  "message": "Diary entry deleted successfully"
  }
