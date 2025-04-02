```mermaid
erDiagram
    USERS {
        int id PK
        string name
        string email
        string password
        datetime created_at
        datetime updated_at
    }
    EVENTS {
        int id PK
        string title
        text description
        datetime event_date
        int user_id FK
    }
    FRIENDS {
        int id PK
        int user_id FK
        int friend_id FK
        datetime created_at
    }
    PARTICIPANTS {
        int id PK
        int event_id FK
        int user_id FK
    }
    CHATS {
        int id PK
        int sender_id FK
        int receiver_id FK
        text message
        datetime sent_at
    }
    ARTICLES {
        int id PK
        int user_id FK
        string title
        text content
        datetime created_at
    }
    USERS ||--o{ EVENTS : "creates"
    USERS ||--o{ FRIENDS : "has"
    USERS ||--o{ PARTICIPANTS : "joins"
    USERS ||--o{ CHATS : "sends"
    USERS ||--o{ ARTICLES : "writes"
    EVENTS ||--o{ PARTICIPANTS : "has"
    USERS ||--o{ FRIENDS : "friends with"
    CHATS ||--o{ USERS : "between"