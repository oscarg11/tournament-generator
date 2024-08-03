# FIFA Tournament Generator

This is a MERN stack project that facilitates the creation and organization of small to large FIFA
tournaments, allowing users to easily create and customize their own tournaments.

## Prerequisites
Before you begin, ensure you have met the following requirements:
- Node.js (version 14.17.0 or later)
- npm (version 6.14.13 or later)
- MongoDB (version 4.4 or later) running locally or a MongoDB Atlas account

## Installation
To install and set up the project, follow these steps:

1. **Clone the Repository:**
   Clone the project repository to your local machine:
    ```bash
    git clone https://github.com/oscarg11/tournament-generator.git
    ```
   
2. **Navigate to the Project Directory:**
   Change into the project's root directory:
    ```bash
    cd tournament-generator
    ```

3. **Install Server Dependencies:**
   Navigate to the `server` directory and install the necessary dependencies:
    ```bash
    cd server
    npm install
    ```
    This command installs all the backend dependencies listed in the `package.json` file.

4. **Install Client Dependencies:**
   Navigate to the `client` directory and install the necessary dependencies:
    ```bash
    cd ../client
    npm install
    ```
    This command installs all the frontend dependencies listed in the `package.json` file in the `client` directory.

5. **Setup MongoDB:**
   Ensure you have MongoDB installed and running on your local machine. If you haven’t installed MongoDB, follow the [official installation guide](https://docs.mongodb.com/manual/installation/).
   
   Alternatively, you can use a cloud-based MongoDB service like [MongoDB Atlas](https://www.mongodb.com/cloud/atlas). If using Atlas, create a cluster and get your connection string.

6. **Create Environment Variables:**
   Configure environment variables for both the server and client.

   - **Server:**
     In the `server` directory, create a `.env` file and add the following variables:
     ```env
     MONGO_URI=your_mongodb_uri
     PORT=5000
     SECRET_KEY=your_secret_key
     ```
     Replace `your_mongodb_uri` with your actual MongoDB connection string, `5000` with your desired port number, and `your_secret_key` with a secret key for your application.

   - **Client:**
     If needed, create a `.env` file in the `client` directory and add any necessary environment variables:
     ```env
     REACT_APP_API_URL=http://localhost:5000
     ```
     Replace `http://localhost:5000` with the URL where your backend server is running.

## Running the Project
To run the project, follow these steps:

### Server
1. **Navigate to the Server Directory:**
   Make sure you are in the `server` directory:
    ```bash
    cd server
    ```

2. **Start the Server:**
   Start the backend server using npm. This will typically use a script defined in your `package.json` file to run the server with tools like `nodemon` for development:
    ```bash
    npm run dev
    ```
    This command will start your Express server on the port you specified in the `.env` file (default is 5000). If everything is set up correctly, you should see a message indicating the server is running and connected to the database.

### Client
1. **Navigate to the Client Directory:**
   Open a new terminal window or tab, and navigate to the `client` directory:
    ```bash
    cd client
    ```

2. **Start the Client:**
   Start the React application using npm. This command will launch the React development server:
    ```bash
    npm start
    ```
    The React app will automatically open in your default web browser, typically at `http://localhost:3000`.

### Accessing the Project
- **Client:** Open your web browser and go to `http://localhost:3000` to view and interact with the React frontend.
- **Server:** The backend API should be running on `http://localhost:5000`. You can use tools like Postman to test API endpoints or view logs in your terminal.