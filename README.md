# 🚀 Multi-Tier User Data Storage Application

A multi-tier web application built with **Docker** which allows users to submit personal data, which is stored in a **MySQL database** and cached in **Redis** for fast retrieval.

---

## 🧱 Architecture Overview

This application follows a layered architecture with the following components:

- **Nginx**: Serves as a reverse proxy and static file server.
- **Node.js**: Backend API that handles business logic and interacts with the database and cache.
- **MySQL**: Relational database for persistent user data storage.
- **Redis**: In-memory cache for quick data retrieval.

---

## 🛠️ Prerequisites

Before getting started, ensure you have the following installed:

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)

---

## 📂 Project Structure

workdir
* .env
* package.json
* server.js
* schema.sql
* nginx.conf
* Dockerfile.nginx
* Dockerfile.nodejs
* docker-compose.yml
* public
-- index.html

---

## ▶️ Getting Started

Follow these steps to get the application up and running:

### 1. Clone the Repository

git clone https://github.com/kowsalya-24/docker-multitier-nnmr-application.git<br>
cd docker-multitier-application

---

### 2. Configure Environment Variables
Create a .env file in the root directory of your project with the following content. These variables are used by the docker-compose.yml file to configure your services.

MYSQL_HOST=mysql<br>
MYSQL_USER=username <br>
MYSQL_PASSWORD=password <br>
MYSQL_DATABASE=mydatabase<br>
REDIS_HOST=redis<br>
REDIS_PORT=6379<br>
PORT=3000

### 3. Run the Application
With Docker and Docker Compose installed, you can start the entire application stack with a single command. The --build flag is used to build the images for Nginx and Node.js from their respective Dockerfiles.

docker-compose up --build -d

### 4. Access the Application
Once the containers are up and running, open your web browser and navigate to:

http://localhost

You should see the user information form. Fill it out and click "Submit" to test the full data flow, from frontend to database and cache.

### 5. Shut Down the Application
To stop and remove all the containers, volumes, and networks created by Docker Compose, run the following command:

docker-compose down -v

## ⚙️ API Endpoints
The Node.js backend provides the following REST API endpoints:

POST /api/user: Creates a new user with the submitted form data.

GET /api/user/:id: Retrieves user data. It will first try to fetch from the Redis cache, falling back to the MySQL database if the data is not found in the cache.
