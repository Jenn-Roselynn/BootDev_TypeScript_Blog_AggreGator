# 🐊 Gator: The Terminal-Based Blog Aggregator

Gator is a sleek, efficient CLI tool designed to help you stay updated with your favorite blogs and tech sites directly from your terminal. Built with TypeScript and backed by PostgreSQL, Gator makes keeping track of RSS feeds feel like a breeze.

## 🚀 Features

* **RSS Aggregation:** Automatically fetch and parse RSS feeds at custom intervals.
* **Database-Backed:** Persistent storage for users, feeds, and posts using PostgreSQL and Drizzle ORM.
* **User-Centric:** Simple login/registration system to manage your personal feed collection.
* **CLI Interface:** Clean, intuitive commands to add, follow, and browse your favorite content.

## 🛠️ Prerequisites

To get Gator up and running, make sure you have the following installed on your machine:

* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [PostgreSQL](https://www.postgresql.org/) (for database storage)
* [TypeScript](https://www.typescriptlang.org/)

## ⚙️ Setup & Configuration

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/Jenn-Roselynn/BootDev_TypeScript_Blog_AggreGator.git](https://github.com/Jenn-Roselynn/BootDev_TypeScript_Blog_AggreGator.git)
   cd gator

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Database Configuration:**
    Ensure your PostgreSQL database is running and update your connection strings in your configuration file. (Make sure you run your migrations to set up the schema!)
    ```bash
    npm run migrate
    ```

## 📜 How to Use Gator

Here are a few commands to get you started:

* **Register a new user:**
    `npm run start register <username>`
* **Add a new feed:**
    `npm run start addfeed <name> <url>`
* **Follow a feed:**
    `npm run start follow <url>`
* **Browse latest posts:**
    `npm run start browse <limit>`
* **Start the aggregator:**
    `npm run start agg <duration>` (e.g., `1m`, `1h`)

## 🛠️ Built With

* **TypeScript:** For a robust and type-safe development experience.
* **Drizzle ORM:** For clean, efficient database interactions.
* **PostgreSQL:** For reliable data persistence.

---