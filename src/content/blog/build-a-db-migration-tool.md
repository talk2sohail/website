---
title: "Writing a db migration tool in Go"
description: "A DB migration tool in Go for consistent and seamless migration"
author: "Md Sohail"
publishDate: 2026-01-18T00:00:00Z
tags: ["astro", "til", "go", "db", "postgres", "migration"]
---


# Back story

Until a year ago, I didn't know what DB migration was. As usual, it was a dreadful task when asked to perform it in production. I was working in a Golang microservice environment with a Postgres setup. Whenever I had to make some changes to the schema, I had to talk to our 'DB guy' for help. 

He always sort of looked at me like I was clueless about DB migration (I was!). I am currently working on my side projects, and I finally had to deal with it myself, so I dug deeper into the world of DB migration. Enough story; let's understand what database migration is.

There are various definitions of database migration. You can always Google to know more about it. I like to think of it as the process of moving your database from one version to another. Of course, there are other aspects to database migration, such as moving it to another environment, schema changes (restructuring your table definitions), moving to a different database, database replication, etc.

Today, we will learn how to write a simple tool that helps us streamline DB migration for schema changes, query optimization, and data replication. The tool aims to deliver the following functionality. 

> [NOTE] : This is not going to be a full-fledged migration system.


# Why I needed a migration tool

As mentioned earlier, I am working on a golang backend with postgres for which i need to make schema changes and I wanted to do it in way so that it is reversible, seamless, and consistent.

Here is how I implemented a simple CLI tool in Go to handle this.

## 1. The Setup: `main`

The entry point is straightforward. We start by silencing default logs for cleaner output, loading our configuration (to get the database URL), and establishing a connection.

The tool decides what to do based on command-line arguments. It defaults to `up` if no command is provided, but also supports `down` and `status`.

```go
func main() {
    // ... setup logging and config ...
    database := db.Connect(cfg.DatabaseURL)
    defer database.Close()

    // Parse command (default to "up")
    cmd := "up"
    if len(os.Args) > 1 {
        cmd = os.Args[1]
    }

    // Initialize the tracking table
    if err := ensureSchemaMigrationsTable(database.DB); err != nil {
        log.Fatalf("Failed to initialize migration system: %v", err)
    }

    // Switch on command
    switch cmd {
    case "status":
        // ... check status ...
    case "up":
        // ... run migrations ...
    case "down":
        // ... rollback ...
    }
}
```


##  2. The Tracker: ensureSchemaMigrationsTable
To keep track of which migrations have been applied, we need a special table in our database. I called it schema_migrations.

This function checks if the table exists. If it doesn't (or if the schema is mismatched/outdated), it creates it. This table records the migration name, a checksum (to ensure file integrity), timing details, and logs.

```go

func ensureSchemaMigrationsTable(db *sql.DB) error {
    // Check if table exists, if not create it
    query := `
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id SERIAL PRIMARY KEY,
            migration_name TEXT UNIQUE NOT NULL,
            checksum TEXT NOT NULL,
            started_at TIMESTAMP NOT NULL,
            finished_at TIMESTAMP,
            logs TEXT,
            rolled_back_at TIMESTAMP,
            applied_steps_count INTEGER DEFAULT 0
        );
    `
    // ... execution logic ...
}
```


## 3. Applying Migrations: up

This is the core of the tool. The runMigrations function looks for all files in the `migrations` folder ending in .up.sql.

It sorts them alphabetically to ensure they run in order (e.g., 001_init.up.sql before 002_add_users.up.sql). For each file, it checks the schema_migrations table. If the migration hasn't been applied (or was rolled back), it triggers applyMigration.

The applyMigration function is where the magic happens:

Reads the file and calculates a SHA256 checksum.
Inserts a record into schema_migrations marking it as "started".
Executes the SQL inside a database transaction.
Updates the record on success (finished_at) or failure (recording the error in logs).
Using a transaction is crucial here—if the SQL fails, the database rolls back to its previous state, preventing partial migrations.

```go

func runMigrations(db *sql.DB) error {
    // Glob *.up.sql files and sort them
    // Loop through files and check against DB
    // Call applyMigration for pending ones
}

func applyMigration(db *sql.DB, file, name string) error {
    // Read file, calculate checksum
    // Insert "started" record
    // Begin Transaction
    // Execute SQL
    // Commit Transaction & Update record to "finished"
}

```

## 4. Rolling Back: down


Mistakes happen. The rollbackMigration function handles the down command.

It queries the database for the last migration that was successfully finished and not yet rolled back. Once identified, it looks for the corresponding .down.sql file.

Just like applying a migration, the rollback is executed inside a transaction. If successful, it updates the migration record, setting rolled_back_at to the current time.

```go
func rollbackMigration(db *sql.DB) error {
    // Find last applied migration
    // Read corresponding .down.sql file
    // Begin Transaction
    // Execute SQL
    // Commit & Mark as rolled back
}
```


## 5. Checking Status: status


Finally, it's helpful to know where we stand. The checkStatus function queries the last 5 entries in schema_migrations and prints their status—whether they were applied, rolled back, or are in a failed state.

```go

func checkStatus(db *sql.DB) error {
    // Query last 5 rows
    // Print formatted status (Applied / Rolled back)
}

```

## Conclusion

It is best practise to have both `up` and `down` sql files for your current and upcoming migration to keep the database consistent and error free. This tool gives me a simple, code-first way to manage database changes. It ensures that my schema changes are versioned alongside my code and that I can easily move forward or backward in my database history without needing manual intervention. 

## References

1. Access the full implementation [here](https://github.com/talk2sohail/invito/backend/cmd/migrate)
2. Also a nice open-source implementation for a db migration cli and library can be found [here](https://github.com/golang-migrate/migrate)

